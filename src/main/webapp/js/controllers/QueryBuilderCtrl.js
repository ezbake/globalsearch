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

var controllerModule = angular.module('globalsearch.controllers');

controllerModule.controller('QueryBuilderCtrl', ['$scope', '$location', function($scope, $location) {
    var keyValuePairId = 1;

    $scope.query = {
        allWords: '',
        exactPhrase: '',
        anyWords: '',
        noneWords: '',
        keyValuePairs: [{ id: keyValuePairId, key: '', value: '' }]
    };

    var buildQuery = function(query) {
        var queryString = '';
        if (query.allWords.length > 0) {
            var allWords = query.allWords.split(' ');
            for (var i = 0; i < allWords.length; i++) {
                queryString += '+' + allWords[i] + ' ';
            }
        }
        if (query.exactPhrase.length > 0) {
            queryString += '+("' + query.exactPhrase + '") ';
        }
        if (query.anyWords.length > 0) {
            queryString += query.anyWords + ' ';
        }
        if (query.noneWords.length > 0) {
            var noneWords = query.noneWords.split(' ');
            for (var i = 0; i < noneWords.length; i++) {
                queryString += '-' + noneWords[i] + ' ';
            }
        }
        for (var i = 0; i < query.keyValuePairs.length; i++) {
            if (query.keyValuePairs[i].key.length > 0 && query.keyValuePairs[i].value.length > 0) {
                queryString += '+' + query.keyValuePairs[i].key + ':(' + query.keyValuePairs[i].value + ') ';
            }
        }

        return queryString.trim();
    };

    $scope.removeKeyValuePair = function($event, id) {
        for (var i = 0; i < $scope.query.keyValuePairs.length; i++) {
            if ($scope.query.keyValuePairs[i].id === id) {
                $scope.query.keyValuePairs.splice(i, 1);
                break;
            }
        }
        $event.preventDefault();
    };

    $scope.addKeyValuePair = function($event) {
        keyValuePairId++;
        $scope.query.keyValuePairs.push({ id: keyValuePairId, key: '', value: '' });
        $event.preventDefault();
    };

    $scope.searchRedirect = function() {
        $location.path("search/" + encodeURIComponent(buildQuery($scope.query)));
    };
}]);
