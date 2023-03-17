# grep-tests-from-pull-requests

> Grabs the test tags to run from the pull request text

Read the blog post [Pick Tests To Run Using The Pull Request Text](https://glebbahmutov.com/blog/pick-tests-using-pull-request/).

## Install

```shell
# add this plugin as a dev dependency using NPM
$ npm i -D grep-tests-from-pull-requests
# or using Yarn
$ yarn add -D grep-tests-from-pull-requests
```

Register the plugin in your plugins file _before_ [cypress-grep](https://github.com/cypress-io/cypress-grep) registration.

```js
// cypress/plugins/index.js
const pickTestsFromPullRequest = require('grep-tests-from-pull-requests')
module.exports = async (on, config) => {
  // include this plugin before cypress-grep
  // so if we find the test tags in the pull request body
  // we can grep for them by setting the grep config
  const pullOptions = {
    // try to find checkbox lines in the pull request body with these tags
    tags: ['@log', '@sanity', '@user'],
    // repo with the pull request text to read
    owner: 'bahmutov',
    repo: 'todomvc-no-tests-vercel',
    // to get a private repo above, you might need a personal token
    token: process.env.PERSONAL_GH_TOKEN || process.env.GITHUB_TOKEN,
  }
  await pickTestsFromPullRequest(on, config, pullOptions)

  // cypress-grep plugin registration

  // IMPORTANT: the config.env object might be modified
  // by the above plugins, thus return the config object from this function
  return config
}
```

**Important:** notice the plugin registration is an async function, thus you must await the registration. This makes your plugin file function `async`. Make sure to return the `config` object, as it might be changed by this plugin.

**Tip:** you can find the test tags, but skip using them using an option

```js
const pickTestsFromPullRequest = require('grep-tests-from-pull-requests')
const pullOptions = {
  ...,
  setTests: true // default, use false to disable setting the test tags
}
await pickTestsFromPullRequest(on, config, pullOptions)
```

## baseUrl

If the pull request text OR its comments have a line with just `baseUrl <URL>` the it will be extracted too. This makes it convenient to specify a custom deploy to be tested for this specific pull request.

```text
// pull request text
some test tags

These tests should be run against this URL
baseUrl https://preview-1.acme.co
```

The base URL is found if it is a single line of text in the pull request body or its comment in one of these formats:

```text
baseUrl https://preview-1.acme.co
TestURL: https://preview-1.acme.co
```

If the URL is present in the body and in several comments, the URL found in the latest comment wins.

**Tip:** you can control if you want to set the baseUrl based on the pull request text using an option

```js
const pickTestsFromPullRequest = require('grep-tests-from-pull-requests')
const pullOptions = {
  ...,
  setBaseUrl: true // default, use false to disable setting the baseUrl
}
await pickTestsFromPullRequest(on, config, pullOptions)
```

## Resolved value

The function might resolve with an object if the pull request was found. You can check if the user wants to run all the tests, or a list of tags

```js
const pickTestsFromPullRequest = require('grep-tests-from-pull-requests')
const testsToRun = await pickTestsFromPullRequest(...)
if (testsToRun) {
  if (testsToRun.baseUrl) {
    console.log('testing deploy at %s', testsToRun.baseUrl)
  }
  if (testsToRun.all) {
    console.log('running all tests')
  } else if (testsToRun.tags.length) {
    console.log('the user picked %s tags to run', testsToRun.tags.join(', '))
  } else {
    console.log('the user did not pick any tests to run')
  }
}
```

## Additional environment variables

If the pull request has lines that start with `CYPRESS_...=value` then they are automatically are parsed and cast and added to the `Cypress.env` object. For example

```
CYPRESS_num=1
CYPRESS_correct=true
CYPRESS_FRIENDLY_GREETING=Hello
```

Will add the values `{num: 1, correct: true, FRIENDLY_GREETING: "Hello"}` to the `Cypress.env`. Note: an empty value is converted to `undefined`.

```
CYPRESS_age=
# will produce
{ age: undefined }
```

If you really want to skip a value, prefix it somehow, like `xCYPRESS_...=value`

## Skip / enable Cypress tests

You can find a checkbox in the pull request text to skip / run Cypress tests. This makes it simple to skip the E2E testing steps temporarily. Include the following checkbox line in the pull request body.

```
- [x] run Cypress tests
```

## Aliases

This package includes several scripts that let you find the pull request body and the test tags and the base URL of a given pull request.

### get-pr-body

Prints the test tags found in the pull request text

```
$ npx get-pr-body --owner bahmutov --repo todomvc-no-tests-vercel --pull 12
```

### get-pr-comments

Prints all pull request comments

```
$ npx get-pr-comments --owner bahmutov --repo todomvc-no-tests-vercel --pull 12
```

### get-pr-tests

Prints all test tags found in the pull request

```
$ npx get-pr-tests --owner bahmutov --repo todomvc-no-tests-vercel --pull 12
```

You can pass the list of allowed tags

```
$ npx get-pr-tests --owner bahmutov --repo todomvc-no-tests-vercel --pull 12 \
  --tags one,two,three
```

### should-pr-run-cypress-tests

Tells if the pull request body has a checkbox to run or skip the Cypress tests. If the tests should run, this script exits with code 0. If the PR disables the Cypress tests, it exits with code 1.

```
$ npx should-pr-run-cypress-tests --owner bahmutov --repo todomvc-no-tests-vercel --pull 12
$ echo $?
# 0 - we need to run the Cypress tests
```

**Tip:** you can pass the full GitHub pull request URL instead of passing the individual command line arguments

```
$ npx should-pr-run-cypress-tests --owner bahmutov --repo todomvc-no-tests-vercel --pull 15
# is the same as
$ npx should-pr-run-cypress-tests --pr-url https://github.com/bahmutov/todomvc-tests-circleci/pull/15
```

## Debugging

This plugin uses [debug](https://github.com/debug-js/debug#readme) module to output verbose log messages. Run with environment variable `DEBUG=grep-tests-from-pull-requests` to see those logs.

## Small print

Author: Gleb Bahmutov &copy; 2022

- [@bahmutov](https://twitter.com/bahmutov)
- [glebbahmutov.com](https://glebbahmutov.com)
- [blog](https://glebbahmutov.com/blog/)
- [videos](https://www.youtube.com/glebbahmutov)
- [presentations](https://slides.com/bahmutov)
- [cypress.tips](https://cypress.tips)

License: MIT - do anything with the code, but don't blame me if it does not work.

Support: if you find any problems with this module, email / tweet /
[open issue](https://github.com/bahmutov/grep-tests-from-pull-requests/issues) on Github

## MIT License

Copyright (c) 2022 Gleb Bahmutov &lt;gleb.bahmutov@gmail.com&gt;

Permission is hereby granted, free of charge, to any person
obtaining a copy of this software and associated documentation
files (the "Software"), to deal in the Software without
restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.
