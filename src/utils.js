// @ts-check
const got = require('got')
const debug = require('debug')('cypress-set-github-status')

function validateCommonOptions(options, envOptions) {
  if (!options.owner) {
    throw new Error('options.owner is required')
  }
  if (!options.repo) {
    throw new Error('options.repo is required')
  }
  if (!envOptions.token) {
    throw new Error('envOptions.token is required')
  }
}

// assume we do need to authenticate to fetch the pull request body
async function getPullRequestBody(options, envOptions) {
  if (options.token) {
    console.error('you have accidentally included the token in the options')
    console.error('please use the second environment options object instead')
    delete options.token
  }

  debug('getting pull request body: %o', options)

  validateCommonOptions(options, envOptions)

  if (!options.pull) {
    throw new Error('options.pull number is required')
  }

  // https://docs.github.com/en/rest/reference/pulls#get-a-pull-request
  // https://api.github.com/repos/bahmutov/todomvc-no-tests-vercel/pulls/10
  const url = `https://api.github.com/repos/${options.owner}/${options.repo}/pulls/${options.pull}`
  debug('url: %s', url)

  // @ts-ignore
  const res = await got.get(url, {
    headers: {
      authorization: `Bearer ${envOptions.token}`,
      accept: 'application/vnd.github.v3+json',
    },
  })

  const json = JSON.parse(res.body)
  return json.body
}

function isLineChecked(line) {
  return line.includes('[x]')
}

/**
 * @param {string} pullRequestBody The pull request text with checkboxes
 */
function getTestsToRun(pullRequestBody) {
  const testsToRun = {
    all: false,
    tags: [],
  }
  const lines = pullRequestBody.split('\n')
  lines.forEach((line) => {
    if (line.includes('all tests') && isLineChecked(line)) {
      testsToRun.all = true
    }
    if (line.includes('@sanity') && isLineChecked(line)) {
      testsToRun.tags.push('@sanity')
    }
    if (line.includes('@user') && isLineChecked(line)) {
      testsToRun.tags.push('@user')
    }
  })
  return testsToRun
}

module.exports = { getPullRequestBody, getTestsToRun }