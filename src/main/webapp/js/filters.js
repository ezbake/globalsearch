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

/* Filters */

angular.module('globalsearch.filters', []).
filter('filter', function() {
	return function() {};
}).
filter('startAt', function() {
	return function(input, start) {
		if (input) {
			start = +start;
			return input.slice(start);
		}
	};
}).
filter('characters', function() {
	return function(input, max) {
		if (isNaN(max)) return input;
		if (max <= 0) return '';
		if (input && input.length > max) {
			input = input.substring(0, max);

            var lastSpace = input.lastIndexOf(' ');
            if (lastSpace !== -1) {
                input = input.substr(0, lastSpace);
            }

			input = input + '...';
		}
		return input;
	};
})
.filter('words', function() {
	return function(input, words) {
		if (isNaN(words)) return input;
		if (words <= 0) return '';
		if (input) {
			var inputWords = input.split(/\s+/);
			if (inputWords.length > words) {
				input = inputWords.slice(0, words).join(' ') + '...';
			}
		}
		return input;
	};
});