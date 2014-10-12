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

angular.module('chloe.webservices', ['ngResource']).factory('Chloe', ['$rootScope', '$http', '$q', function($rootScope, $http, $q) {
    var data;

    // Array of IDs of the selected SSRs
    var selectedIDs = [];

    var shared = {};
    var getShared = function(scope) {
        var deferred = $q.defer();

        setTimeout(function() {
            scope.$apply(function() {
                deferred.resolve(
//                    shared
                    {}
                );
            });
        }, 10);

        return deferred.promise;
    };

    var getRecent = function(scope) {
        var promise = $http.get("api/chloe/").success(function(data) {
        });

        return promise;
    };

    return {
        getSharedTabs: function(scope) {
            return getShared(scope);
        },
        setSharedTabs: function(data) {
            shared = data;
        },
        getRecentTabs: function(scope) {
            return getRecent(scope);
        },
        setData: function(value) {
            data = value;
        },
        getData: function() {
            return data;
        },
        clearSelectedIDs: function() {
            selectedIDs = [];
        },
        addSelectedID: function(id) {
            selectedIDs.push(id);
        },
        removeSelectedID: function(id) {
            var index;
            for (var i = 0; i < selectedIDs.length; i++) {
                if (id === selectedIDs[i]) {
                    index = i;
                    break;
                }
            }
            if (typeof index !== "undefined") {
                selectedIDs.splice(index, 1);
            }
        },
        getSelected: function() {
            var selected = { SSRs: [] };
            for (var i = 0; i < data.length; i ++) {
                if ($.inArray(data[i].id.toString(), selectedIDs) > -1) {
                    selected.SSRs.push(data[i]);
                }
            }
            return selected;
        },
        isSelected: function(id) {
            return $.inArray(id.toString(), selectedIDs) > -1;
        },
        getSSR: function(id) {
            var ssr;
            for (var i = 0; i < data.length; i++) {
                if (data[i].id == id) {
                    ssr = data[i];
                    break;
                }
            }
            return ssr;
        }
    };
}]);


angular.module('chloe.directives', []).
directive('draggable', ['$rootScope', 'Chloe', function($rootScope, Chloe) {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            element.prepend('<div class="drag-handle"></div>');
            element.draggable({
                cursor: 'crosshair',
                revert: true,
                revertDuration: 0,
                helper: 'clone',
                scroll: false,
                start: function(event, ui) {
                    $rootScope.$broadcast('dragStart');

                    var selected = Chloe.getSelected();
                    var id = element.find('.id').html();
                    var count = 1;
                    if (Chloe.isSelected(id)) {
                        count = selected.SSRs.length;
                    }

                    $('.ui-draggable-dragging')
                        .css("width", "200px")
                        .css("height", "25px")
                        .css("overflow", "hidden")
                        .css("margin-top", event.offsetY)
                        .css("margin-left", event.offsetX);
                        // .css("border", "1px black solid");
                    $('.ui-draggable-dragging .drag-handle')
                        .html("MOVING " + count + " RESULT" + (count > 1 ? "S" : ""))
                        .show();

                },
                stop: function(event, ui) {
                    $rootScope.$broadcast('dragEnd');
                }
            });
        }
    };
}]).
directive('droppable', function() {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            var afterDrop = scope.$eval(attrs['droppable']);
            if (!afterDrop) {
                afterDrop = function() {
                    console.log(element.html() + " has no afterDrop function.");
                };
            }
            element.droppable({
                hoverClass: 'hover',
                drop: function(event,ui) {
                    afterDrop(element, ui.draggable);
                },
                tolerance: 'pointer'
            });
        }
    };
}).
directive('dragVisible', ['$rootScope', function($rootScope) {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            $rootScope.$on('dragStart', function(event) {
                element.width(element.width() + 200);
            });
            $rootScope.$on('dragEnd', function(event) {
                element.width(element.width() - 200);
            });
        }
    };
}]).
directive('chloe', ['$compile', 'Chloe', function($compile, Chloe) {
    return {
        restrict: "A",
        link: function(scope, element, attrs) {
            var appsPanel = angular.element('<div id="appsPanel" ng-controller="ChloeCtrl" ng-mouseleave="hideOnMouseLeave(); hideSubmenu();"></div>');

            var chloeContainer = angular.element('<div drag-visible id="chloe-container" ng-mouseenter="showOnMouseEnter()">' +
                '<div class="chloe-handle"><span class="global-search-icon-publish icon"></span></div>' +
            '</div>');
            appsPanel.append(chloeContainer);

            var appHolder = angular.element('<div drag-visible class="app-holder clearfix"></div>');
            chloeContainer.append(appHolder);

            var chloeSubmenu = angular.element('<div class="chloe-submenu"></div>');
            appsPanel.append(chloeSubmenu);

            appHolder.append('<div class="header">OPENED TABS</div>');
            appHolder.append('<hr />');

            var newApp = '<div class="app-new-header" ng-mouseenter="populateSubmenu(false); showSubmenu();"><span class="icon-arrow-left-2"></span> Open in New App</div>';
            var ele = angular.element(newApp);
            appHolder.append(ele);
            appHolder.append('<hr />');
            appHolder.append('<div class="header">SHARED TABS</div>');

            $compile(appsPanel)(scope);
            element.append(appsPanel);
        }
    };
}]);


angular.module('chloe.controllers', []).controller('ChloeCtrl', 
        ["$scope", "$compile", "$window", "Chloe", "ErrorService", "EzBakeWebServices",
        function($scope, $compile, $window, Chloe, ErrorService, EzBakeWebServices) {

    $scope.showOnMouseEnter = function() {
        $("#chloe-container").css("width", "231px");
        $(".app-holder").css("width", "200px");
        // $(".app-holder").css("border-left", "1px solid #d5d5d5");
    };

    $scope.hideOnMouseLeave = function() {
        $("#chloe-container").css("width", "31px");
        $(".app-holder").css("width", "0px");
        // $(".app-holder").css("border-left", "none");
    };

    $scope.chloeApps = {};

    var INITIAL_APPS_MAX = 5;
    $scope.populateSubmenu = function(showAll) {
        Chloe.getRecentTabs($scope).then(function(promise) {
            if (promise.data.error) {
                throw promise.data.error;
            }
            $scope.chloeApps.apps = promise.data.apps;
            var element = $(".chloe-submenu");
            element.empty();
            element.append('<div class="header">CHLOE APPS</div>');

            var limit = showAll ? "" : " | limitTo: " + INITIAL_APPS_MAX;
            var apps = '<div class="app" droppable="handleDrop" ng-repeat="app in chloeApps.apps' + limit + '">' +
                '<div class="app-id">create new</div>' +
                '<div class="app-thumbnail"><span class="global-search-icon-browser2 icon"></span></div>' +
                '<div class="app-text">' +
                    '<div class="app-title">{{app.appName}}</div>' +
                    '<div class="app-uri">{{app.webUrl}}</div>' +
                '</div>' +
            '</div>';
            var ele = angular.element(apps);
            $compile(ele)($scope);
            element.append(ele);

            if ($scope.chloeApps.apps.length > INITIAL_APPS_MAX) {
                var moreAppsLink = angular.element('<hr /><div class="header more"><a href="" ng-mouseenter="populateSubmenu(true);">MORE</a></div>');
                $compile(moreAppsLink)($scope);
                element.append(moreAppsLink);
            }
            element.css('margin-top', $('#chloe-container > .app-holder > .app').length * 40);
        });
    };

    $scope.populateSubmenuWithUserTabs = function(event, id) {
        Chloe.getSharedTabs($scope).then(function(promise) {
            var element = $(".chloe-submenu");
            element.empty();
            for (var user in promise) {
                if (user === id) {
                    for (var i = 0; i < promise[user].appInfo.length; i++) {
                        var app = '<div class="app" droppable="handleDrop">' +
                            '<div class="app-id">' + promise[user].appInfo[i].channel + '</div>' +
                            '<div class="user-id">' + user + '</div>' +
                            '<div class="app-thumbnail"><span class="global-search-icon-browser2 icon"></span></div>' +
                            '<div class="app-text">' +
                                '<div class="app-title">'+ promise[user].appInfo[i].appName + '</div>' +
                            '</div>' +
                        '</div>';
                        var ele = angular.element(app);
                        $compile(ele)($scope);
                        element.append(ele);
                    }
                }
            }
            element.css('margin-top', event.currentTarget.offsetTop - 32);
        });
    };

    $scope.showSubmenu = function() {
        var element = $(".chloe-submenu");
        element.fadeIn();
    };

    $scope.hideSubmenu = function() {
        var element = $(".chloe-submenu");
        element.fadeOut();
    };
    
    var promisedConfig = EzBakeWebServices.getConfiguration();
    var ws = null;
    var chloeUri;
    var configureWSClient = promisedConfig.then(function(data) {
        if (typeof data["web.application.chloe.wss.url"] === "string") {
            chloeUri = data["web.application.chloe.wss.url"];
            ws = new WebSocket(chloeUri);
        }
        else {
            var errMsg = 'An error occurred retrieving Chloe configuration from the EzBake web service.';
            ErrorService.showError(errMsg, new Error(errMsg));
        }

        // Web socket is closed if no data is sent within 60 seconds, so we're sending the server a ping
        // every 55 seconds to keep the web socket alive
        if (ws) {
            setInterval(function() {
                if (ws.readyState === 1) {
                    ws.send(JSON.stringify({ status: "keep-alive" }));
                } else if (ws.readyState === 2 || ws.readyState === 3) {
                    // If the web socket is closed or closing, reopen it
                    var onopen = ws.onopen;
                    var onmessage = ws.onmessage;
                    var onclose = ws.onclose;
                    var onerror = ws.onerror;
                    ws = new WebSocket(chloeUri);
                    ws.open = onopen;
                    ws.onmessage = onmessage;
                    ws.onclose = onclose;
                    ws.onerror = onerror;
                }
            }, 55000);
        }

        ws.onopen = function() {
            ws.send(JSON.stringify({ app: "globalsearch", channel: "master" }));
        };

        ws.onmessage = function(msg) {
            var data = JSON.parse(msg.data);

            Chloe.setSharedTabs(data.userInfo.users);

            clearApps();
            clearUsers();

            var me = data.userInfo.me;
            for (var user in data.userInfo.users) {
                if (user === me) {
                    for (var i = 0; i < data.userInfo.users[user].appInfo.length; i++) {
                        var appInfo = data.userInfo.users[user].appInfo[i];
                        prependApp(appInfo.channel, appInfo.appName, appInfo.channel);
                    }
                } else {
                    var name = data.userInfo.users[user].name;
                    var apps = data.userInfo.users[user].appInfo;
                    prependUser(user, name, apps);
                }
            }
        };
        ws.onclose = function(e) {
            console.log("Websocket closed: ");
            console.log(e);
        };

        ws.onerror = function(e) {
            console.log("Websocket error: ");
            console.log(e);
        };
    },
    function(error) {
        ErrorService.showError("An error occurred communicating with the EzBake web service.  " +
            'Searching will work, however you will not be able to drag results to the sidebar and "OPEN IN NEW APP".', error);
    });

    var clearApps = function() {
        $('.app').each(function() {
            $(this).remove();
        });
    };

    var clearUsers = function() {
        $('.user').each(function() {
            $(this).remove();
        });
    };

    var prependApp = function(channel, appTitle, subtitle) {
        var app = '<div class="app" droppable="handleDrop">' +
            '<div class="app-id">' + channel + '</div>' +
            '<div class="app-thumbnail")"><span class="global-search-icon-browser2 icon"></span></div>' +
            '<div class="app-text">' +
                '<div class="app-title">'+ appTitle + '</div>' +
                '<div class="app-subtitle">' + subtitle + '</div>' +
            '</div>' +
        '</div>';
        var ele = angular.element(app);
        $compile(ele)($scope);
        $('#chloe-container > .app-holder > .header').first().after(ele);
    };

    var prependUser = function(userId, name, apps) {
        var user = '<div class="user" ng-mouseenter="populateSubmenuWithUserTabs($event, \'' + userId + '\'); showSubmenu($event);">' +
            '<div class="user-thumbnail"><span class="global-search-icon-user icon"></span></div>' +
            '<div class="user-text">' +
                '<div class="user-name">' + name + '</div>' +
                '<div class="user-description">' + apps.length + (apps.length > 1 ? " apps" : " app") + '</div>' +
            '</div>' +
        '</div>';
        var ele = angular.element(user);
        $compile(ele)($scope);
        $('#chloe-container > .app-holder > .header').last().after(ele);
    };

    $scope.handleDrop = function(event, ui) {
        $scope.$apply(function() {
            var from = ui.find('.id').html();
            var channel = event.find('.app-id').html();
            var appTitle = event.find('.app-title').html();

            var ssr = Chloe.getSSR(from);

            // If the dropped item is one of the selected items, assume the user intends for all of the selected
            // items to be sent. Otherwise, only the dropped item should be sent.
            var selected;
            if (Chloe.isSelected(ssr.id)) {
                selected = Chloe.getSelected();
                if (selected.SSRs.length <= 0) {
                    selected.SSRs.push(ssr);
                }
            } else {
                selected = { SSRs: [] };
                selected.SSRs.push(ssr);
            }

            if (channel === "create new") {
                channel = Math.floor(Math.random() * 1000000000 + 1);

                configureWSClient.then(function(data) {
                    // Send stats to Swivl to track the # of times each app is opened
                    // Per Redmine # 5223
                    var stat = Stats.createStatFromTemplate();
                    stat.action = "Open Chloe App.";
                    stat.actionParams = JSON.stringify({ app: appTitle });
                    Stats.pushStat(stat);

                    var appUri = event.find('.app-uri').html();
                    var splitter = appUri.indexOf("?") > -1 ? "&" : "?";
                    $window.open("/" + appUri + splitter + "app=" + encodeURIComponent(appTitle) +
                            "&channel=" + encodeURIComponent(channel) +
                            "&chloeUri=" + encodeURIComponent(chloeUri));
                });
            }
            
            configureWSClient.then(function(data) {
                // Send stats to Swivl to track the # of search results sent to Chloe
                // Per Redmine # 5224
                var stat = Stats.createStatFromTemplate();
                stat.action = "Send SSR to Chloe";
                stat.actionParams = JSON.stringify({countSSRsSentToChloe: selected.SSRs.length});
                Stats.setResolution(stat);
                Stats.pushStat(stat);
               
                var message = { app: appTitle, channel: channel, SSRs: selected.SSRs };
                var user = event.find('.user-id').html();
                if (user) {
                    message["user"] = user;
                }

                ws.send(JSON.stringify(message));

                // Tells the WebSearchCtrl that it's time to deselect any SSRs that were selected
                $scope.$emit('dropHandled');
            });
        });
    };
}]);
