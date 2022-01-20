# grep-tests-from-pull-requests

> Grabs the test tags to run from the pull request text

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
module.exports = async (on, config) => {
  // include this plugin before cypress-grep
  // so if we find the test tags in the pull request body
  // we can grep for them by setting the grep config
  await require('grep-tests-from-pull-requests')(on, config, {
    // try to find checkbox lines in the pull request body with these tags
    tags: ['@log', '@sanity', '@user'],
    // repo with the pull request text to read
    owner: 'bahmutov',
    repo: 'todomvc-no-tests-vercel',
    // to get a private repo above, you might need a personal token
    token: process.env.PERSONAL_GH_TOKEN || process.env.GITHUB_TOKEN,
  })

  // cypress-grep plugin registration

  // IMPORTANT: the config.env object might be modified
  // by the above plugins, thus return the config object from this function
  return config
}
```

**Important:** notice the plugin registration is an async function, thus you must await the registration. This makes your plugin file function `async`. Make sure to return the `config` object, as it might be changed by this plugin.

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
