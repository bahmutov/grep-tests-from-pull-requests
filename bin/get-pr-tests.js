#!/usr/bin/env node

const debug = require('debug')('grep-tests-from-pull-requests')
const arg = require('arg')
const {
  getPullRequestNumber,
  getPullRequestBody,
  getPullRequestComments,
  getTestsToRun,
  cleanUpTags,
} = require('../src/utils')

const args = arg({
  '--owner': String,
  '--repo': String,
  '--pull': Number,
  '--commit': String,
  '--tags': String,

  // aliases
  '-o': '--owner',
  '-r': '--repo',
  '-p': '--pull',
  '-c': '--commit',
  '-t': '--tags',
})
debug('args: %o', args)

function checkEnvVariables(env) {
  if (!env.GITHUB_TOKEN && !env.PERSONAL_GH_TOKEN) {
    console.error(
      'Cannot find environment variable GITHUB_TOKEN or PERSONAL_GH_TOKEN',
    )
    process.exit(1)
  }
}

checkEnvVariables(process.env)

const options = {
  owner: args['--owner'],
  repo: args['--repo'],
  pull: args['--pull'],
  commit: args['--commit'],
  tags: args['--tags'],
}
const envOptions = {
  token: process.env.GITHUB_TOKEN || process.env.PERSONAL_GH_TOKEN,
}

getPullRequestNumber(
  options.owner,
  options.repo,
  options.pull,
  options.commit,
  envOptions,
)
  .then(async (testPullRequestNumber) => {
    if (isNaN(testPullRequestNumber)) {
      throw new Error('Could not find the pull request number')
    }

    options.pull = testPullRequestNumber

    const body = await getPullRequestBody(options, envOptions)
    const prComments = await getPullRequestComments(options, envOptions)
    const tags = cleanUpTags(options.tags) || []
    debug('cleaned up tags %o', tags)
    const testsToRun = getTestsToRun(body, tags, prComments)
    console.log('tests to run')
    console.log(testsToRun)
  })

  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
