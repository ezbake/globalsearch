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

/*

BEGIN Stats API

*/

var Stats = (function($) {
	// Local reference to jQuery that can be updated via the API
	var $j = $;

	// Default Stat Template
	var statTemplate = {
		action:       null,
		actionParams: null,
		actionPath:   null,
		duration:     null,
		isGoal:       null,
		goalGroup:    null,
		goalStep:     null,
		ipAddress:    null,
		name:         null,
		propName:     null,
		propValue:    null,
		resolution:   null,
		sessionId:    '' + Math.floor((Math.random()*10000000)+1),
		siteId:       'stats',
		status:       null,
		statusDetail: null,
		type:         'app',
		user:         null,
		version:      null
	};

	// Utility functions used by Default Template Function Map
	var defaultFn = function(val) { 
		return val; 
	};

	var stringLimitFn = function (val, length) {
		length = length || 50;
		if (!val) {
			return defaultFn(val);
		} else {
			return val.length > length ? val.substring(0, length) : val;	
		}
	};

	// Default Template Function Map
	var fnMap = {
		actionParams: function (val) {
			return stringLimitFn(val, 100);
		},
		isGoal: function (val) {
			if (val === true) {
				return 1;
			} else if (val === false) {
				return null;
			} else {
				return defaultFn(val);
			}
		},
		statusDetail: function (val) {
			return stringLimitFn(val, 100);
		},
		action:     stringLimitFn,
		actionPath: stringLimitFn,
		duration:   defaultFn,
		goalGroup:  defaultFn,
		goalStep:   defaultFn,
		ipAddress:  defaultFn,
		name:       stringLimitFn,
		propName:   stringLimitFn,
		propValue:  stringLimitFn,
		resolution: defaultFn,
		sessionId:  defaultFn,
		siteId:     defaultFn,
		status:     defaultFn,
		type:       stringLimitFn,
		user:       defaultFn,
		version:    stringLimitFn
	};
	
	// Default Template Query String Map
	var qsMap = {
		action:       'a',
		actionParams: 'p',
		actionPath:   'ap',
		duration:     'dt',
		isGoal:       'g',
		goalGroup:    'gg',
		goalStep:     'gs',
		ipAddress:    'ip',
		name:         'n',
		propName:     'pn',
		propValue:    'pv',
		resolution:   'res',
		sessionId:    'sid',
		status:       'st',
		statusDetail: 'std',
		type:         't',
		user:         'u',
		version:      'v'
	};

	// Private API variables
	var _private = {
		defaultTemplate: statTemplate,
		endpoint:        "/swivl/api/stats",
		pushMode:        "img",
		templates:       {},
		deferred:        null
	};

	// Private API Functions
	var _pFn = {
		getQueryString: function(stat) {
			var result = "?";
			var propCt = 0;
			for(var key in stat) {
				if (key === 'siteId') {
					continue;
				}
				try {
					stat[key] = fnMap[key](stat[key]);
					if (stat[key]) {
						result += (propCt++ > 0 ? "&" : "") 
								+ qsMap[key] + "=" 
								+ encodeURIComponent(stat[key]);
					}
				} catch (err) {} 
			}
			return result;
		},
		init: function () {
			_private.deferred = $j.Deferred().resolve();
		}
	};

	// Public API Functions
	var _public = {
		setJQuery: function(jQueryInstance) {
			$j = jQueryInstance;
		},
		getTemplate: function(templateName, clone) {
			if (clone !== true && clone !== false) {
				clone = false;
			}
			if (!templateName) {
				return clone ? $j.extend(true, {}, _private.defaultTemplate) : _private.defaultTemplate;
			}
			var template = _private.templates[templateName];
			if (!template) {
				return null;
			}
			return template;
		},
		createStatFromTemplate: function(templateName) {
			var template = this.getTemplate(templateName);
			return !template ? null : $j.extend(true, {}, template);
		},
		addTemplate: function(templateName, template) {
			if (!templateName || !template) {
				return;
			}
			_private.templates[templateName] = template;
		},
		removeTemplate: function(templateName) {
			if (!templateName) {
				return;
			}
			var template = this.getTemplate(templateName);
			if (!template) {
				return;
			}
			delete _private.templates[templateName];
		},
		setResolution: function(stat) {
			if (!stat) {
				return;
			}
			stat.resolution = window.screen.width + "x" + window.screen.height;
		},
		getEndPoint: function() {
			return _private.endpoint;
		},
		setEndPoint: function(endpoint) {
			_private.endpoint = endpoint;
		},
		getPushMode: function() {
			return _private.pushMode;
		},
		setPushMode: function(pushMode) {
			if (pushMode !== "ajax" && pushMode !== "img") {
				throw("pushMode must be 'ajax' or 'img'");
			}
			_private.pushMode = pushMode;
		},
		measureDuration: function (stat) {
			stat.durationStartTime = new Date();
		},
		pushStat: function(stat, callback) {
			if (stat === null) {
				return;
			}
			if (!stat.siteId) {
				throw("stat.siteId must be specified");
			}
			if (stat.durationStartTime) {
				stat.duration = (new Date()).getTime() - stat.durationStartTime.getTime();
				delete stat.durationStartTime;
			}
			$.when(_private.deferred).then(function () {
				var queryString = _pFn.getQueryString(stat);
				var url = _private.endpoint + "/" 
						+ encodeURIComponent(stat.siteId) 
						+ queryString + "&rnd=" 
						+ Math.floor((Math.random()*10000000)+1);
				if (_private.pushMode === "ajax") {
					$j.ajax({'url': url, 'success': function(data) { if (callback !== undefined) { callback(data); } }});
				} else if (_private.pushMode === "img") {
					var $img = $j('<img/>').attr('src', url).css('display','none').appendTo('body');
					setTimeout(function () {
						$img.remove();
					}, 	5000);
				} else {
					throw("Unknown push mode.");
				}
			});
		},
		pause: function () {
			_private.deferred = $.Deferred();
		},
		play: function () {
			_private.deferred.resolve();
		}
	};

	// On load, call init
	_pFn.init();

	// Expose the public API
	return _public;
})( jQuery );

/*

END Stats API

*/