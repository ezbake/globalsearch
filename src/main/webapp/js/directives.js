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

/* Directives */

angular.module('globalsearch.directives', []).
directive('globalSearchEnter', function () {
    return function (scope, element, attrs) {
        element.bind("keydown keypress", function (event) {
            // If the key pressed was the "Enter" key
            if(event.which === 13) {
                scope.$apply(function (){
                    scope.$eval(attrs.globalSearchEnter);
                });
                event.preventDefault();
            }
        });
    };
}).        
directive('resizeNavBar', function() {
	return function(scope, element, attrs) {
		$(window).resize(function() {
			element.css('width', element.parent().css('width'));
		});
		element.css('width', element.parent().css('width'));
	};
}).
directive('mapResize', ["ErrorService", "Map", function(ErrorService, Map) {
   return function(scope, element, attrs) {
      $(window).resize(function() {
         $('#map').css('height', window.innerHeight - 104);
      });
      $('#map').css('height', window.innerHeight - 104);
      Map.initMap();
   };
}]).
directive('contentHeightResize', function() {
	return function(scope, element, attrs) {
		$(window).resize(function() {
			element.css('height', window.innerHeight - 104);
		});
		element.css('height', window.innerHeight - 104);
	};
}).
directive('tabify', function() {
	return function($scope, element, attrs) {
		$(element).tabs({
			activate: function(event, ui) {
				ui.oldTab.children('a.nav-link').removeClass('active');
				ui.newTab.children('a.nav-link').addClass('active');
				if (ui.newTab && ui.newTab.is($("#map-tab-link"))) {
                                   // refresh map
                                   var stat = Stats.createStatFromTemplate();
                                   stat.action = "Map viewed";
                                   Stats.pushStat(stat);
				}
			}
		});
	};
}).
directive('ibox', function() {
	return function($scope, element, attrs){
		// set zoom ratio //
        var resize = 25;
        ////////////////////
        var img = element;
        img.parent().append('<div id="ibox" />');
        var ibox = $('#ibox');
        var elX = 0;
        var elY = 0;

        img.each(function() {
            var el = $(this);

            el.mouseenter(function() {
                ibox.html('');
                var elH = el.height();
                elX = el.position().left - 10; // 6 = CSS#ibox padding+border
                elY = el.position().top - 10;
                var h = el.height();
                var w = el.width();
                var wh;
                var checkwh = (h < w) ? (wh = (w / h * resize) / 2) : (wh = (w * resize / h) / 2);

                $(this).clone().prependTo(ibox);
                ibox.css({
                    top: elY + 'px',
                    left: elX + 'px'
                });

                ibox.stop().fadeTo(200, 1, function() {
                    $(this).animate({top: '-='+(resize/2), left:'-='+wh},200).children().children().children('img').animate({height:'+='+resize, width:'+='+resize},200);
                    $('.information',this).fadeIn('200');
                });
            });

            ibox.mouseleave(function() {
                ibox.html('').hide();
            });
        });
	};
}).	
directive('infiniteScroll', ['$rootScope', function($rootScope) {
	return {
		restrict: 'A',
		link: function (scope, element, attrs) {
			function scrolled(e) {
			  if (e.target.offsetHeight + e.target.scrollTop >= e.target.scrollHeight) {
			    $rootScope.$broadcast('infiniteScroll', e.target);
			  }
			}
			element.scroll(function(event){
				scrolled(event);				
			});
		}
	};
}]).
directive('context', function() {
    return {
      restrict    : 'A',
      scope       : '@&', 
      compile: function compile(tElement, tAttrs, transclude) {
        return {
          post: function postLink(scope, iElement, iAttrs, controller) {
            var menuDiv = $('#' + iAttrs.context),
                last = null;
            
            menuDiv.css({ 'display' : 'none'});
  
            $(iElement).bind('contextmenu', function(event) {
              menuDiv.css({
                  'display' : 'none'
                });
              menuDiv.css({
                position: "fixed",
                display: "block",
                left: event.clientX + 'px',
                top:  event.clientY + 'px'
              });
              last = event.timeStamp;
              event.preventDefault();
            });
            
            $(document).click(function(event) {
              var target = $(event.target);
              if(!target.is(".popover") && !target.parents().is(".popover")) {
                if(last === event.timeStamp)
                  return;  
                menuDiv.css({
                  'display' : 'none'
                });
              }
            });
          }
        };
      }
    };
  }).
directive('viewable', ['Search', function(Search) {

    var generateHtml = function(obj) {
        var html = '<div class="widget pane">';
        for (var property in obj) {
            html += '<div class="clearfix">';
            html += '<div class="widgett">' +
                '<h3><span>' + property + '</span></h3>' +
            '</div>';

            if (typeof(obj[property]) !== "object") {
                html += '<div class="widgettext" context="tagContext">' +
                    obj[property] +
                '</div>';
            } else {
                html += generateHtml(obj[property]);
            }
            html += '</div>';
        }
        html += '</div>';
        return html;
    };

    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            var params = {};
            var keyValuePairs = window.location.search.slice(1).split('&');

            keyValuePairs.forEach(function(keyValuePair) {
                keyValuePair = keyValuePair.split('=');
                params[keyValuePair[0]] = keyValuePair[1] || '';
            });

            Search.performOpen(params["uri"], scope).then(function(data) {
                scope.doc = data;
                var title = scope.doc.title || "Document Viewer";
                element.append("<h1>" + title + "</h1>");
                element.append(generateHtml(scope.doc));
            }, function(error) {
                element.append("<h1>Error</h1>");
                scope.doc = {'Error' : 'There was an error retrieving the specified document.'};
                element.append(generateHtml(scope.doc));
            });
        }
    };
}]);
