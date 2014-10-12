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

angular.module('globalsearch.webservices', []);

angular.module('globalsearch.webservices').factory('Search', ['$http', '$q', function($http, $q) {

  var open = function(uri, scope) {
    var deferred = $q.defer();

    $http.post("api/download", decodeURIComponent(uri)).success(function(data) {
      deferred.resolve(data);
    }).error(function(data) {
      deferred.reject({'Error Message' : 'Unable to open the selected document'});
    });

    return deferred.promise;
  };

  var search = function(query, pageIndex) {
     // Send stats to Swivl to track the # of searches
    var promise = $http.post("api/ssr/", {query: query, pageSize: 20, pageOffset: pageIndex*20});
     // Per Redmine # 5220
     var stat = Stats.createStatFromTemplate();
     stat.action = "SSR Search";
     stat.actionParams = JSON.stringify({query: query});     
     Stats.pushStat(stat);
     return promise;
  };

  return {
    performOpen: function(uri, scope) {
      return open(uri, scope);
    },
    performSearch: function(query, page) {
      return search(query, page - 1);
    }
  };
}]);
