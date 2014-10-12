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

/* jasmine specs for directives go here */

describe('directives', function() {
  beforeEach(module('social.directives'));
  var scope;
  var compile;

  beforeEach(inject(function(_$compile_, _$rootScope_) {
    scope = _$rootScope_;
    compile = _$compile_;
    scope.chirp = { text: "" }
  }));

  describe('chirpText Directive', function() {
    it('should replace web sites with links', function() {
      scope.chirp = {text: "http://www.google.com"};
      var elm = compile('<div class="chirp-content-actual" chirp_text></div>')(scope);
      scope.$apply();
      expect(elm.html()).toEqual("<div class=\"ng-scope\"><a class=\"chirp-content-web-link\" target=\"_blank\" href=\"http://www.google.com\">www.google.com</a></div>");
    });

    it('should replace hash tags with links', function() {
      scope.chirp = {text: "#test"};
      var elm = compile('<div class="chirp-content-actual" chirp_text></div>')(scope);
      scope.$apply();
      expect(elm.html()).toEqual("<div class=\"ng-scope\"><a class=\"chirp-content-tag-link\" href=\"#\" ng-click=\"setSearchFilter('#test')\">#test</a></div>");
    });

    it('should replace hash tags having dashes with links', function() {
      scope.chirp = {text: "#F-35"};
      var elm = compile('<div class="chirp-content-actual" chirp_text></div>')(scope);
      scope.$apply();
      expect(elm.html()).toEqual("<div class=\"ng-scope\"><a class=\"chirp-content-tag-link\" href=\"#\" ng-click=\"setSearchFilter('#F-35')\">#F-35</a></div>");
    });

    it('should replace user tags with links', function() {
      scope.chirp = {text: "@Jason"};
      var elm = compile('<div class="chirp-content-actual" chirp_text></div>')(scope);
      scope.$apply();
      expect(elm.html()).toEqual("<div class=\"ng-scope\"><a class=\"chirp-content-tag-link\" href=\"#\" ng-click=\"setSearchFilter('@Jason')\" open-slide=\"'click'\" slide-selector=\"#userProfile\">@Jason</a></div>");
    });
  });
});
