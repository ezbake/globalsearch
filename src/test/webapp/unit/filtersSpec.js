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

/* jasmine specs for filters go here */

describe('filter', function() {
  beforeEach(module('social.filters'));
  beforeEach(module('social.services'));
  it('should format Just Now time', inject(function(howOldFilter) {
    var currentDate = new Date();
    currentDate.setSeconds(currentDate.getSeconds() - 1);
    expect(howOldFilter(currentDate.toGMTString())).toEqual("Just Now");
  }));

  it('should format time using Minutes', inject(function(howOldFilter) {
    var currentDate = new Date();
    currentDate.setMinutes(currentDate.getMinutes() - 10);
    expect(howOldFilter(currentDate.toGMTString())).toEqual("10m");
  }));

  it('should format time using Hours', inject(function(howOldFilter) {
    var currentDate = new Date();
    currentDate.setHours(currentDate.getHours() - 10);
    expect(howOldFilter(currentDate.toGMTString())).toEqual("10h");
  }));

  it('should format time using day and month', inject(function(howOldFilter) {
    //This is the format currently returned by the eChirp service
    expect(howOldFilter("Sun Apr 28 20:17:14 +0000 2013")).toEqual("28 Apr 13");
  }));

  it('should format time using day and month -Non GMT', inject(function(howOldFilter) {
    //This is the format currently returned by the eChirp service
    expect(howOldFilter("Sun Apr 28 20:17:14 -4000 2013")).toEqual("28 Apr 13");
  }))

  it('should format time using day and month +Non GMT', inject(function(howOldFilter) {
    //This is the format currently returned by the eChirp service
    expect(howOldFilter("Sun Apr 28 20:17:14 +4000 2013")).toEqual("28 Apr 13");
  }))
});

