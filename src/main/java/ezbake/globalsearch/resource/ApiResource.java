/*   Copyright (C) 2013-2014 Computer Sciences Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License. */

package ezbake.globalsearch.resource;

import ezbake.base.thrift.EzSecurityToken;
import ezbake.data.elastic.thrift.Page;
import ezbake.data.elastic.thrift.Query;
import ezbake.globalsearch.service.ServiceClient;
import ezbake.groups.thrift.EzGroupsConstants;
import ezbake.ins.thrift.gen.InternalNameService;
import ezbake.ins.thrift.gen.WebApplicationLink;
import ezbake.ins.thrift.util.INSUtility;
import ezbake.services.search.SSRSearchResult;
import ezbake.services.search.ssrService;
import ezbake.services.search.ssrServiceConstants;
import ezbake.util.AuditEvent;
import ezbake.util.AuditEventType;
import org.apache.thrift.TException;
import org.apache.thrift.TSerializer;
import org.apache.thrift.protocol.TSimpleJSONProtocol;
import org.codehaus.jettison.json.JSONArray;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;

import javax.ws.rs.*;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.ext.ContextResolver;
import java.io.UnsupportedEncodingException;
import java.net.URLDecoder;
import java.net.URLEncoder;
import java.nio.charset.Charset;
import java.util.Set;

@Path("ssr")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class ApiResource extends GlobalSearchResourceBase {

    @POST
    public String search(String originalRequest, @Context ContextResolver<ServiceClient> resource) throws JSONException {
        ServiceClient serviceClient = getFromContext(resource);
        String queryJson;
        JSONObject jsonRequest = new JSONObject(originalRequest);

        try {
            queryJson = jsonRequest.getJSONObject("query").toString();
        } catch (JSONException e) {
            queryJson = jsonRequest.getString("query");
        }

        int pageOffset = jsonRequest.getInt("pageOffset");
        short pageSize = (short)jsonRequest.getInt("pageSize");

        JSONObject result = null;

        try {
            ssrService.Client ssrClient = getSsrClient(serviceClient);
            Query query = new Query().setSearchString(queryJson).setPage(new Page().setPageSize(pageSize).setOffset(pageOffset));
            EzSecurityToken token = getSecurityToken(
                    serviceClient.getClientPool().getSecurityId(ssrServiceConstants.SERVICE_NAME),
                    serviceClient);
            AuditEvent auditEvent = AuditEvent.event(AuditEventType.AuditAndLogDataAccess.name(), token)
                    .arg("queryJson", queryJson)
                    .arg("pageOffset", pageOffset)
                    .arg("pageSize", pageSize);
            SSRSearchResult searchResult = null;
            try {
                searchResult = ssrClient.searchSSR(query, token);
            } catch (Exception e) {
                auditEvent.failed();
                generateError("Error querying the SSR service.", e);
            } finally {
                freeServiceClient(ssrClient, serviceClient);
            }
            result = convertToJson(searchResult, serviceClient);
        } catch (TException e) {
            generateError("There was an error executing the search.", e);
        }

        return result.toString();
    }

    private JSONObject convertToJson(SSRSearchResult searchResult, ServiceClient serviceClient) throws JSONException {
        TSerializer serializer = new TSerializer(new TSimpleJSONProtocol.Factory());
        try {
            InternalNameService.Client insClient = getInsClient(serviceClient);
            JSONObject results = new JSONObject(serializer.toString(searchResult));
            EzSecurityToken token = getSecurityToken(
                    serviceClient.getClientPool().getSecurityId(EzGroupsConstants.SERVICE_NAME),
                    serviceClient);
            try {
                // Enrich the search results with information about what apps can open each URI
                JSONArray matchingRecords = results.getJSONArray("matchingRecords");
                for (int i = 0; i < matchingRecords.length(); i++) {
                    JSONObject record = matchingRecords.getJSONObject(i);
                    String uri = record.getString("uri");
                    String prefix = INSUtility.getUriPrefix(uri);
                    record.put("prefix", prefix);

                    Set<WebApplicationLink> webApplicationLinks;
                    if (!serviceClient.getCache().containsKey(prefix)) {
                        webApplicationLinks = insClient.getWebAppsForUri(prefix);
                        serviceClient.getCache().put(prefix, webApplicationLinks);
                    } else {
                        webApplicationLinks = serviceClient.getCache().get(prefix);
                    }

                    JSONArray jsonWebApplicationLinks = new JSONArray();
                    for (WebApplicationLink link : webApplicationLinks) {
                        try {
                            if (!hasPermission(link, token, serviceClient)) {
                                continue;
                            }
                        } catch (TException e) {
                            final String msg = "An error occurred checking permissions.";
                            generateError(msg, e);
                        }
                        String webUrl = uri;
                        if (!link.isIncludePrefix()) {
                            webUrl = webUrl.replace(prefix, "");
                        }
                        try {
                            Charset utf8 = Charset.forName("UTF-8");
                            webUrl = URLEncoder.encode(URLDecoder.decode(webUrl, utf8.name()), utf8.name());
                        } catch (UnsupportedEncodingException e) {
                            generateError(e.getMessage(), e);
                        }
                        link.setWebUrl(link.getWebUrl().replace("{uri}", webUrl));

                        JSONObject jsonWebApplicationLink = new JSONObject();
                        jsonWebApplicationLink.put("appName", link.getAppName());
                        jsonWebApplicationLink.put("webUrl", link.getWebUrl());
                        jsonWebApplicationLinks.put(jsonWebApplicationLink);
                    }
                    record.put("webApplicationLinks", jsonWebApplicationLinks);
                }
            } catch (IllegalArgumentException e) {
                generateError(e.getMessage(), e);
            } finally {
                freeServiceClient(insClient, serviceClient);
            }

            return results;
        } catch (TException e) {
            // FIXME: Narrow the scope of this try/catch block so we can log
            // a more appropriate message
            final String msg = "An error occurred handling the SSR SearchResult.";
            generateError(msg, e);
        }
        return null;
    }

    private ServiceClient getFromContext(ContextResolver<ServiceClient> context) {
        return context.getContext(ServiceClient.class);
    }
}
