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

var controllerModule = angular.module('globalsearch.controllers', ['ui.bootstrap']);

controllerModule.controller('WebSearchCtrl', ['$scope', '$rootScope', '$window', '$location', '$route', '$timeout', 'Search', 'Chloe', 'ErrorService', 'Map',
        function($scope, $rootScope, $window, $location, $route, $timeout, Search, Chloe, ErrorService, Map) {

    var isFacetedQuery = false;

    $scope.initializeController = function() {
        $scope.resultObject = {};

        if ($route.current.params.query) {
            $scope.searchText = decodeURIComponent($route.current.params.query);
            $scope.search($route.current.params.page);
        } else {
            $scope.searchText = '';
        }

        $scope.$on('search', function() {
            isFacetedQuery = true;
            $scope.search();
        });

        $scope.$on('dropHandled', function(event, ui) {
            $scope.clearSelections();
        });

        $rootScope.$on('infiniteScroll', function(event, obj) {
            $scope.$apply(function(){
                if(obj.id == 'imageResults') {
                    $scope.search();
                }
            });
        });
    };

    // Translates the value returned from the async search request into an object that the web app understands
    var processData = function(data, page) {
        var processedData = {};

        processedData.searchDetails = {};
        processedData.searchDetails.total_results = data.totalHits;
        processedData.searchDetails.page_results = data.pageSize;
        processedData.searchDetails.web_page = page;
        processedData.searchDetails.web_pages = Math.ceil(data.totalHits / data.pageSize);
        if (data.matchingRecords) {
            processedData.searchDetails.web_results = data.matchingRecords.length;
        }
        processedData.searchDetails.time = 1;

        processedData.webResults = [];
        processedData.mapResults = [];
        processedData.imageResults = [];
        processedData.videoResults = [];

        if (data.matchingRecords) {
            for (var i = 0; i < data.matchingRecords.length; i++) {
                var record = data.matchingRecords[i];
                if (!record.id) {
                    record.id = record.uri;
                }
                var processedRecord = {};
                // Use !== to compare with undefined rather than !=
                processedRecord.title = (record.title !== undefined) ? record.title : record.uri;
                processedRecord.description = record.snippet;
                processedRecord.links = [];
                processedRecord.links.push(record.uri);
                processedRecord.relevance = 0;
                processedRecord.prefix = record.prefix;
                // webApplicationLinks is an array of key/value pairs 
                // containing "appName" and "webUrl".
                processedRecord.webApplicationLinks = record.webApplicationLinks;
                processedRecord.selected = false;
                processedRecord.viewerUrl = "viewer.html?uri=" + encodeURIComponent(record.uri);

                var updatedDate = new Date(1900,0,1,0,0);
                if (record.resultDate) {
                    updatedDate = new Date(record.resultDate.date.year,
                        record.resultDate.date.month - 1,
                        record.resultDate.date.day,
                        record.resultDate.time ? record.resultDate.time.hour : 0,
                        record.resultDate.time ? record.resultDate.time.minute : 0);
                }

                processedRecord.updated = updatedDate.toDateString();
                processedRecord.id = record.id;

                processedData.webResults.push(processedRecord);

                if (record.coordinate) {
                    //"point": ["18.28125","-2.109375"]
                    processedRecord.latitude = record.coordinate.latitude;
                    processedRecord.longitude = record.coordinate.longitude;
                    processedData.mapResults.push(processedRecord);
                }
            }
        }

        if (processedData.mapResults.length > 0) {
            Map.updateMap(processedData.mapResults);
        }

        // facets
        if (data.facets && !isFacetedQuery) {
            var facets = {};
            for (var key in data.facets) {
                var field = data.facets[key].field;
                if (data.facets[key].facetValues.length > 0) {
                    facets[key] = [];
                    for (var i = 0; i < data.facets[key].facetValues.length; i++) {
                        facets[key].push({
                            'label': data.facets[key].facetValues[i].label,
                            'count': data.facets[key].facetValues[i].count,
                            'rawValue': data.facets[key].facetValues[i].value,
                            'field': field,
                            'selected': false
                        });
                    }
                }
            }
            processedData.facets = facets;
        } else {
            // If this search was the result of clicking on a facet, keep the previous facet information so that we
            // can display which facets are active
            processedData.facets = $scope.resultObject.facets;
            isFacetedQuery = false;
        }

        Chloe.setData(data.matchingRecords);
        Chloe.clearSelectedIDs();
        
        return processedData;
    };

    // This is the function that is set as the handler for some of the the "ng-click" bindings in web-result.html
    $scope.openWithViewer = function(ssr) {
       $window.open(ssr.viewerUrl);
    };
    
    $scope.openWithApp = function(url, statAction, statActionParams){
       var stat = Stats.createStatFromTemplate();
       stat.action = statAction;
       stat.actionParams = JSON.stringify(statActionParams);     
       Stats.pushStat(stat);
     
       $window.open(url);
    };

    $scope.searchRedirect = function() {
        if (!$scope.searchText) {
            $scope.searchText = '';
        }
        $location.path('search/' + encodeURIComponent($scope.searchText));
    };

    $scope.search = function(page) {
        var query = $route.current.params.query;
        page = page ? page : 1;

        // apply facets
        var filters = [];
        query += ' ';
        for (var category in $scope.resultObject.facets) {
            for (var key in $scope.resultObject.facets[category]) {
                if ($scope.resultObject.facets[category][key].selected) {
                    var field = $scope.resultObject.facets[category][key].field;
                    var rawValue = $scope.resultObject.facets[category][key].rawValue;
                    if (typeof $scope.resultObject.facets[category][key].rawValue.stringValue === 'string') {
                        query += "+" + field + ':"' + rawValue.stringValue + '" ';
                    } else if (typeof $scope.resultObject.facets[category][key].rawValue.doubleValue != 'undefined') {
                        var filter = {};
                        filter["range"] = {};
                        filter["range"][field] = { "gte" : rawValue.doubleValue };
                        filters.push(filter);
                    }
                }
            }
        }

        query = {
            "query_string": {
                "query": query.trim()
            }
        };

        if (filters.length > 0) {
            query = {
                "filtered": {
                    "query": query
                }
            };

            query["filtered"]["filter"] = {
                "bool": {
                    "must": filters
                }
            };
        }

         Search.performSearch(query, page).
            success(function(data, status, headers, config) {
               // this callback will be called asynchronously
               // when the response is available
               $scope.resultObject = processData(data, page);
            }).
            error(function(data, status, headers, config) {
               // called asynchronously if an error occurs
               // or server returns response with an error status.
               var displayErrMsg = data;
               // TODO: Ensure this case is handled everywhere.  The server-side
               // should return JSON error objects, however it does not in all cases.
               if (headers()["content-type"].indexOf("text/html") > -1){
                  displayErrMsg = "An unexpected error occurred performing search!";
               }
               ErrorService.showError(displayErrMsg, data);
            });
    };

    // Highlight and unhighlight selected results
    $scope.select = function(ssr) {
        ssr.selected = !ssr.selected;
        if (ssr.selected) {
            Chloe.addSelectedID(ssr.id.toString());
        } else {
            Chloe.removeSelectedID(ssr.id.toString());
        }
    };

    $scope.clearSelections = function() {
        for (var i = 0; i < $scope.resultObject.webResults.length; i++) {
            $scope.resultObject.webResults[i].selected = false;
        }
        Chloe.clearSelectedIDs();
    };

    // Faceting
    $scope.toggleFacet = function (category, index) {
        var currentValue = $scope.resultObject.facets[category][index].selected;
        for(var key in $scope.resultObject.facets[category]) {
            $scope.resultObject.facets[category][key].selected = false;
        }
        $scope.resultObject.facets[category][index].selected = !currentValue;
        $scope.$emit('search');
    };

    $scope.showMap = function() {
        $timeout(function() {
            var evt = document.createEvent('UIEvents');
            evt.initUIEvent('resize', true, false, window, 0);
            window.dispatchEvent(evt);
        }, 250);
    };
}]);

// Select App Modal

var ModalCtrl = function($scope, $modal, $window) {
    $scope.open = function() {
        var show = true;

        if ($.cookie('preferences')) {
            var preferences = JSON.parse($.cookie('preferences'));
            if (preferences.urls[$scope.currentResult.value.prefix]) {
                $window.open(preferences.urls[$scope.currentResult.value.prefix]);
                show = false;
            }
        }

        if (show) {
            var modalInstance = $modal.open({
                templateUrl: "partials/modal-select-app.html",
                controller: ModalInstanceCtrl,
                resolve: {
                    item: function() {
                        return $scope.currentResult.value;
                    }
                }
            });
        }
    };
};

/**
 * 
 * This controller establishes some business logic for the modal-select-app.html partial.
 * 
 */
var ModalInstanceCtrl = function($scope, $modalInstance, $window, item) {
    $scope.openWith = {};
    $scope.rememberSelection = {};

    if ($.cookie('preferences')) {
        $scope.preferences = JSON.parse($.cookie('preferences'));
    } else {
        $scope.preferences = {};
        $scope.preferences.urls = {};
    }

    $scope.selectedResult = {
        value: item
    };
    
    // The event handler for when the user selects an app of the available apps to open
    // some SSR.  
    $scope.ok = function() {
        $modalInstance.close();
        if (!$scope.openWith.url) {
            $scope.openWith.url = $scope.selectedResult.value.viewerUrl;
        }
        $scope.preferences.urls[$scope.selectedResult.value.prefix] = $scope.openWith.url;

        if ($scope.rememberSelection.value) {
            $.cookie('preferences', JSON.stringify($scope.preferences), { expires: 20*365 });
        }

        $window.open($scope.openWith.url);
    };

    $scope.cancel = function() {
        $modalInstance.dismiss('cancel');
    };
};
