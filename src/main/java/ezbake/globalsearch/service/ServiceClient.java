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

package ezbake.globalsearch.service;

import ezbake.configuration.EzConfiguration;
import ezbake.ins.thrift.gen.WebApplicationLink;
import ezbake.security.client.EzbakeSecurityClient;
import ezbake.thrift.ThriftClientPool;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.HashMap;
import java.util.Map;
import java.util.Properties;
import java.util.Set;

public class ServiceClient {

    private static Logger logger = LoggerFactory.getLogger(ServiceClient.class);
    private static ThriftClientPool pool;
    private static EzbakeSecurityClient securityClient;
    private static Properties configuration;
    private static Map<String, Set<WebApplicationLink>> cache;

    public ServiceClient() {
        try {
            configuration = new EzConfiguration().getProperties();
            securityClient = new EzbakeSecurityClient(configuration);
            pool = new ThriftClientPool(configuration);
            cache = new HashMap<>();
        } catch (Exception e) {
            logger.error("Error creating thrift client pool - ", e.getMessage());
        }
    }

    public ServiceClient(ThriftClientPool pool, Properties configuration, EzbakeSecurityClient securityClient) {
        this.pool = pool;
        this.configuration = configuration;
        this.securityClient = securityClient;
    }

    public Properties getConfiguration() {
        return configuration;
    }

    public EzbakeSecurityClient getSecurityClient() {
        return securityClient;
    }

    public ThriftClientPool getClientPool() {
        return pool;
    }

    public Map<String, Set<WebApplicationLink>> getCache() {
        return cache;
    }
}
