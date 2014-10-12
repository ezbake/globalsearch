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
import ezbake.globalsearch.service.ServiceClient;
import ezbake.util.AuditEvent;
import ezbake.util.AuditEventType;
import ezbake.warehaus.ViewId;
import ezbake.warehaus.WarehausService;
import ezbake.warehaus.WarehausServiceConstants;
import org.apache.thrift.TException;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;

import javax.ws.rs.*;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.ext.ContextResolver;

@Path("download")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class DownloadResource extends GlobalSearchResourceBase {

    @POST
    public String downloadDocument(String uri, @Context ContextResolver<ServiceClient> resource) throws JSONException {
        ServiceClient serviceClient = getFromContext(resource);
        JSONObject result = null;
        try {
            WarehausService.Client warehausClient = getWarehausClient(serviceClient);
            ViewId id = new ViewId(uri, "SSR", "JSON");
            EzSecurityToken token = getSecurityToken(
                    serviceClient.getClientPool().getSecurityId(WarehausServiceConstants.SERVICE_NAME),
                    serviceClient);
            AuditEvent auditEvent = AuditEvent.event(AuditEventType.AuditAndLogDataAccess.name(), token)
                    .arg("uri", uri);
            try {
                String warehausJson = new String(warehausClient.getLatestView(id, token).getPacket());
                result = new JSONObject(warehausJson);
            } catch (Exception e) {
                auditEvent.failed();
                generateError("Unable to retrieve document from the data warehaus.", e);
            } finally {
                auditLogger.logEvent(auditEvent);
                freeServiceClient(warehausClient, serviceClient);
            }
        } catch (TException e) {
            generateError("Unable to retrieve document from the data warehaus.", e);
        }
        return result.toString();
    }

    private ServiceClient getFromContext(ContextResolver<ServiceClient> context) {
        return context.getContext(ServiceClient.class);
    }
}
