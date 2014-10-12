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

import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

import com.google.common.collect.Sets;
import com.sun.jersey.core.spi.factory.ResponseBuilderImpl;
import ezbake.configuration.EzConfigurationLoaderException;
import ezbake.globalsearch.service.ServiceClient;
import ezbake.groups.thrift.EzGroups;
import ezbake.groups.thrift.EzGroupsConstants;
import ezbake.ins.thrift.gen.WebApplicationLink;
import ezbake.services.search.ssrService;
import ezbake.services.search.ssrServiceConstants;
import ezbake.util.AuditLogger;
import ezbake.warehaus.WarehausService;
import ezbake.warehaus.WarehausServiceConstants;
import org.apache.thrift.TException;
import org.apache.thrift.TServiceClient;
import org.apache.thrift.transport.TTransportException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import ezbake.base.thrift.EzSecurityToken;
import ezbake.base.thrift.EzSecurityTokenException;
import ezbake.ins.thrift.gen.InternalNameService;
import ezbake.ins.thrift.gen.InternalNameServiceConstants;
import ezbake.security.client.EzbakeSecurityClient;

import java.util.HashSet;
import java.util.Set;

public class GlobalSearchResourceBase {
    protected static Logger logger = LoggerFactory.getLogger(GlobalSearchResourceBase.class);
    protected static AuditLogger auditLogger;

    public GlobalSearchResourceBase() {
        if(auditLogger == null) {
            try {
                auditLogger = AuditLogger.getDefaultAuditLogger(GlobalSearchResourceBase.class);
            } catch (EzConfigurationLoaderException e) {
                throw new WebApplicationException(Response.Status.INTERNAL_SERVER_ERROR);
            }
        }
    }

    protected EzSecurityToken getSecurityToken(String securityId, ServiceClient serviceClient)  {
        EzbakeSecurityClient securityClient = getSecurityClient(serviceClient);

        EzSecurityToken token = null;
        try {
            token = (securityId == null || securityId.isEmpty()) ?
                    securityClient.fetchTokenForProxiedUser() : securityClient.fetchTokenForProxiedUser(securityId);
        } catch (EzSecurityTokenException e) {
            generateError("Error retrieving security token", e);
        }

        return token;

    }

    protected ssrService.Client getSsrClient(ServiceClient serviceClient) throws TException {
        return serviceClient.getClientPool().getClient(ssrServiceConstants.SERVICE_NAME, ssrService.Client.class);
    }

    protected InternalNameService.Client getInsClient(ServiceClient serviceClient) throws TException {
        return serviceClient.getClientPool().getClient(InternalNameServiceConstants.SERVICE_NAME, InternalNameService.Client.class);
    }

    protected WarehausService.Client getWarehausClient(ServiceClient serviceClient) throws TException {
        return serviceClient.getClientPool().getClient(WarehausServiceConstants.SERVICE_NAME, WarehausService.Client.class);
    }

    private EzGroups.Client getEzGroupsClient(ServiceClient serviceClient) throws TException {
        return serviceClient.getClientPool().getClient(EzGroupsConstants.SERVICE_NAME, EzGroups.Client.class);
    }

    protected void freeServiceClient(TServiceClient client, ServiceClient serviceClient) {
        serviceClient.getClientPool().returnToPool(client);
    }

    protected <T extends TServiceClient> T invalidateServiceClient(T client, ServiceClient serviceClient, Exception ex) {
        if (ex.getClass().getName().equals(TTransportException.class.getName())) {
            return invalidateServiceClient(client, serviceClient);
        } else {
            return client;
        }
    }

    protected <T extends TServiceClient> T invalidateServiceClient(T client, ServiceClient serviceClient)  {
        serviceClient.getClientPool().returnBrokenToPool(client);
        return null;
    }

    protected EzbakeSecurityClient getSecurityClient(ServiceClient resource) {
        return resource.getSecurityClient();
    }

    protected boolean hasPermission(WebApplicationLink link, EzSecurityToken token, ServiceClient serviceClient) throws TException {
        boolean retVal;
        
        String groupName = link.getRequiredGroupName();
        if (groupName == null || groupName.isEmpty()) {
           retVal = true;
        }
        else {
            // Make sure the user is in the required group
            EzGroups.Client ezGroupsClient = getEzGroupsClient(serviceClient);
            try {
               Set<String> groupNames = new HashSet<>();
               groupNames.add(groupName);
               Set<Long> groupMask = ezGroupsClient.getGroupsMask(token, groupNames);
               Set<Long> userGroups = token.getAuthorizations().getPlatformObjectAuthorizations();
               retVal = Sets.intersection(groupMask, userGroups).size() > 0;
            }
            finally {
               freeServiceClient(ezGroupsClient, serviceClient);
            }
        }
        
        return retVal;
    }

    protected void generateError(String message, Exception e) throws WebApplicationException {
        logger.error(message, e);
        throw new WebApplicationException(new ResponseBuilderImpl()
                .status(Response.Status.INTERNAL_SERVER_ERROR)
                .entity(message)
                .type(MediaType.APPLICATION_JSON)
                .build());
    }

}
