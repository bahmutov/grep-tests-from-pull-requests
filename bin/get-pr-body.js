#!/usr/bin/env node

const debug = require('debug')('grep-tests-from-pull-requests')
const arg = require('arg')
const {
  getPullRequestNumber,
  getPullRequestBody,
  getTestsToRun,
} = require('../src/utils')

const args = arg({
  '--owner': String,
  '--repo': String,
  '--pull': Number,
  '--commit': String,

  // aliases
  '-o': '--owner',
  '-r': '--repo',
  '-p': '--pull',
  '-c': '--commit',
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
  .then((testPullRequestNumber) => {
    if (isNaN(testPullRequestNumber)) {
      throw new Error('Could not find the pull request number')
    }

    options.pull = testPullRequestNumber

    return getPullRequestBody(options, envOptions).then((body) => {
      console.log(body)
      const testsToRun = getTestsToRun(['@log', '@sanity'], body)
      console.log('tests to run')
      console.log(testsToRun)
    })
  })

  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
