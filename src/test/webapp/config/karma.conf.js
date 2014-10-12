basePath = '../';

files = [
  JASMINE,
  JASMINE_ADAPTER,
  'app/lib/jquery/jquery-1.9.1.min.js',
  'app/lib/jquery/jquery-ui-1.10.2.min.js',
  'app/lib/jquery/jquery.*.js',
  'app/lib/angular/angular.js',
  'app/lib/angular/angular-*.js',
  'app/js/services/FakeREST.js',
  'app/js/social-ui.min.js',
  'app/lib/external/*.js',
  'test/unit/**/*.js'
];

// We need to exclude the keylines javascript files
// since they are in app/lib/external but have been
// packaged with the social-ui.min.js file
exclude = ['app/lib/external/keylines*.js'];

browsers = ['PhantomJS'];
autoWatch = false;
singleRun = true;

reporters = ['dots', 'junit'];
junitReporter = {
  outputFile: 'build-test-results.xml',
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

  suite: 'unit'
};
