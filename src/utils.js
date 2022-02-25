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

/**
 * Return the list of comments on a specific pull request. The last
 * commit is the latest commit. Each returned comment is an object
 * with "body", and other properties.
 * assume we do need to authenticate to fetch the pull request body
 */
async function getPullRequestComments(options, envOptions) {
  if (options.token) {
    console.error('you have accidentally included the token in the options')
    console.error('please use the second environment options object instead')
    delete options.token
  }

  debug('getting pull request comments: %o', options)

  validateCommonOptions(options, envOptions)

  if (!options.pull) {
    throw new Error('options.pull number is required')
  }

  // https://docs.github.com/en/rest/reference/pulls#get-a-pull-request
  // https://api.github.com/repos/bahmutov/todomvc-no-tests-vercel/issues/10/comments
  const url = `https://api.github.com/repos/${options.owner}/${options.repo}/issues/${options.pull}/comments`
  debug('url: %s', url)

  // @ts-ignore
  const res = await got.get(url, {
    headers: {
      authorization: `Bearer ${envOptions.token}`,
      accept: 'application/vnd.github.v3+json',
    },
  })

  const comments = JSON.parse(res.body)
  // each comment in the array is an object with a body property
  return comments
}

function isLineChecked(line) {
  return line.includes('[x]')
}

/**
 * @param {string[]} tagsToLookFor String tags to find in the pull request body
 * @param {string} pullRequestBody The pull request text with checkboxes
 */
function getTestsToRun(tagsToLookFor, pullRequestBody) {
  const testsToRun = {
    all: false,
    tags: [],
    baseUrl: null,
  }

  if (!tagsToLookFor || !tagsToLookFor.length) {
    debug('no tags to look for, running all tests')
    testsToRun.all = true
    return testsToRun
  }
  debug('looking for checkboxes with tags: %o', tagsToLookFor)

  const lines = pullRequestBody.split('\n')
  lines.forEach((line) => {
    if (line.includes('all tests') && isLineChecked(line)) {
      testsToRun.all = true
    }

    if (line.includes('baseUrl')) {
      testsToRun.baseUrl = line.split('baseUrl')[1].trim()
    }

    tagsToLookFor.forEach((tag) => {
      if (line.includes(tag) && isLineChecked(line)) {
        testsToRun.tags.push(tag)
      }
    })
  })
  return testsToRun
}

async function getPullRequestNumber(
  owner,
  repo,
  testPullRequest,
  commit,
  envOptions,
) {
  if (testPullRequest) {
    debug('known pull request, returning %s', testPullRequest)
    return Number(testPullRequest)
  }

  if (!commit) {
    throw new Error('Cannot find the pull request number without commit SHA')
  }

  const number = await getPullRequestForHeadCommit(
    { owner, repo, commit },
    envOptions,
  )
  return number
}

async function getPullRequestForHeadCommit(options, envOptions) {
  if (options.token) {
    console.error('you have accidentally included the token in the options')
    console.error('please use the second environment options object instead')
    delete options.token
  }

  debug('getting pull from head commit: %o', options)

  validateCommonOptions(options, envOptions)

  if (!options.commit) {
    throw new Error('options.commit SHA is required')
  }

  // https://docs.github.com/en/rest/reference/pulls#list-pull-requests
  const url = `https://api.github.com/repos/${options.owner}/${options.repo}/pulls`
  debug('url: %s', url)

  // @ts-ignore
  const res = await got.get(url, {
    headers: {
      authorization: `Bearer ${envOptions.token}`,
      accept: 'application/vnd.github.v3+json',
    },
  })

  const json = JSON.parse(res.body)
  const pullRequests = json.filter((pr) => pr.head.sha === options.commit)
  if (!pullRequests.length) {
    throw new Error(
      `Could not find pull request with head SHA ${options.commit}`,
    )
  }
  if (pullRequests.length > 1) {
    throw new Error(
      `Found ${pullRequests.length} pull requests with head SHA ${options.commit}`,
    )
  }

  debug(
    'for head commit %s found pull request %d',
    options.commit,
    pullRequests[0].number,
  )
  return pullRequests[0].number
}

module.exports = {
  getPullRequestBody,
  getPullRequestComments,
  getTestsToRun,
  getPullRequestForHeadCommit,
  getPullRequestNumber,
}
