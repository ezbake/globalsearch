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

'use strict';

// To avoid the error: "Uncaught Error: No module: globalsearch.webservices"
angular.module('globalsearch', []);

// Declare app level module which depends on filters, and services
angular.module('globalsearch', [
    'ngRoute',
    'globalsearch.filters',
    'globalsearch.directives',
    'globalsearch.webservices',
    'globalsearch.errorservices',
    'globalsearch.mapservices',
    'globalsearch.controllers',
    'ui.bootstrap'
  //, 'globalsearch.fakeREST'
  , 'chloe.directives',
    'chloe.webservices',
    'chloe.controllers'
  ]).
  config(['$routeProvider', function($routeProvider) {
      var appResolver = {
        app: function(EzBakeWebServices){
            // By returning a promise object as the resolver, we'll delay the 
            // configuration of the routeProvider until this promise is resolved.
            return EzBakeWebServices.getConfiguration();
        }
      };
    $routeProvider.when('/advanced-search', {templateUrl: 'partials/query-builder.html', controller: 'QueryBuilderCtrl',
       resolve: appResolver});
    $routeProvider.when('/search/:query/page/:page', {templateUrl: 'partials/search.html', controller: 'WebSearchCtrl',
       resolve: appResolver});
    $routeProvider.when('/search/:query', {templateUrl: 'partials/search.html', controller: 'WebSearchCtrl',
       resolve: appResolver});
    $routeProvider.when('/search/', {templateUrl: 'partials/search.html', controller: 'WebSearchCtrl',
        resolve: appResolver});
    $routeProvider.when('/', {
       templateUrl: 'partials/landing.html',
       controller: 'WebSearchCtrl',
       resolve: appResolver
    });
    $routeProvider.otherwise({redirectTo: '',
       resolve: appResolver});
  }])
    .value("GEEServerUrl", GEE_SERVER_URL);

