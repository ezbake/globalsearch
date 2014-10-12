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

/*jshint -W083 */
/* The directive above disables JSHint from failing when functions are made within a loop.
 * TODO: Remove function declarations in loops at lines 63 - 77 */
angular.module('globalsearch.mapservices', [])
    .factory('Map', ['$timeout', '$location', 'GEEServerUrl', function($timeout, $location, GEEServerUrl) {
        var markersLayer = new OpenLayers.Layer.Markers("Markers");
        var map;

        return {
            initMap : function() {
                // Create open layer map
                map = new OpenLayers.Map({
                    div: "map",
                    allOverlays: true
                });

                // Add Blue Marble Layer
                var gmap = new OpenLayers.Layer.Google("BlueMarble", {type: "flatMap"});

                // Add layer to map, has to be added first because this will create the mapObject we are going to modify
                map.addLayers([gmap]);

                // Add how to handle your special map type
                gmap.mapObject.mapTypes.set("flatMap", new google.maps.ImageMapType({
                    getTileUrl: function(coord, zoom) {
                        if (zoom === 0) {
                            zoom = 1;
                        }
                        return GEEServerUrl + "/query?request=ImageryMaps&channel=1000&version=4&x=" + coord.x + "&y=" + coord.y + "&z=" + zoom;
                    },
                    tileSize: new google.maps.Size(256, 256),
                    name: "BlueMarble",
                    maxZoom: 18
                }));

                map.zoomToMaxExtent();
                map.addLayer(markersLayer);
                if (markersLayer.markers.length > 0) {
                    var bounds = markersLayer.getDataExtent();
                    map.zoomToExtent(bounds);
                    map.updateSize();
                }
            },

            updateMap : function(records) {
                if(markersLayer) {
                    var P4326   = new OpenLayers.Projection("EPSG:4326");
                    var P900913 = new OpenLayers.Projection("EPSG:900913");
                    var size = new OpenLayers.Size(21,25);
                    var offset = new OpenLayers.Pixel(-(size.w/2), -size.h);
                    var icon = new OpenLayers.Icon('img/marker.png',size,offset);
                    
                    markersLayer.clearMarkers();
                    for(var i = 0; i < records.length; i++) {
                        var markerLocation = new OpenLayers.LonLat(records[i].longitude, records[i].latitude).transform(P4326, P900913);
                        var marker = new OpenLayers.Marker(markerLocation,icon.clone());
                        marker.data = {};
                        marker.data.title = records[i].title;
                        marker.data.link = records[i].webApplicationLinks[0] ? records[i].webApplicationLinks[0].webUrl : records[i].viewerUrl;
                        marker.data.description = records[i].description;
                        markersLayer.addMarker(marker);
                    
                        marker.events.register('mouseover', marker, function(evt) {
                        popup = new OpenLayers.Popup.FramedCloud("Popup",
                            this.lonlat,
                            null,
                            this.data.title + "<br/>" + this.data.description,
                            null,
                            false);
                        popup.contentDisplayClass = "mapPopupCloud";
                        popup.panMapIfOutOfView = false;
                        map.addPopup(popup);
                        });
                        marker.events.register('click', marker, function(evt) {
                            window.open(this.data.link);
                        });
                        marker.events.register('mouseout', marker, function(evt) {
                            popup.hide();
                        });
                    
                    }
                    var bounds = markersLayer.getDataExtent();
                    if (map) {
                        map.zoomToExtent(bounds);
                    }
                }
            },

            getMap : function() {
                return map;
            }

        };
    }]);