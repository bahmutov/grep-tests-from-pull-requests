/// <reference types="cypress" />
// @ts-check
const debug = require('debug')('grep-tests-from-pull-requests')
const { getPullRequestBody, getTestsToRun } = require('./utils')

function getContext() {
  let context = 'Cypress tests'
  if (process.env.CIRCLE_NODE_INDEX && process.env.CIRCLE_NODE_TOTAL) {
    // index starts with 0
    const machineIndex = Number(process.env.CIRCLE_NODE_INDEX) + 1
    const totalMachines = Number(process.env.CIRCLE_NODE_TOTAL)
    context += ` (machine ${machineIndex}/${totalMachines})`
  }
  return context
}

/**
 * @param {Cypress.PluginEvents} on Function for registering event handlers
 */
async function registerPlugin(on, config, options = {}) {
  debug('options %o', options)

  const testPullRequest =
    options.pull ||
    config.env.pull ||
    config.env.pullRequest ||
    config.env.pullRequestNumber ||
    process.env.TEST_PULL_REQUEST_NUMBER

  if (testPullRequest) {
    const testPullRequestNumber = Number(testPullRequest)
    console.log(
      'picking the tests to run based on PR number %d',
      testPullRequestNumber,
    )
    // TODO: get the pull request body, then find the test tags to run
    // and set into the config object "env" for cypress-grep to pick up

    const prOptions = {
      owner: options.owner,
      repo: options.repo,
      pull: testPullRequestNumber,
    }
    const envOptions = {
      token: options.token,
    }

    const prBody = await getPullRequestBody(prOptions, envOptions)
    const testsToRun = getTestsToRun(options.tags, prBody)
    console.log('tests to run', testsToRun)
    if (testsToRun.all) {
      console.log('running all tests, removing possible grep options')
      delete config.env.grep
      delete config.env.grepTags
    } else if (testsToRun.tags.length) {
      const grepTags = testsToRun.tags.join(',')
      console.log('grepping by tags "%s"', grepTags)
      delete config.env.grep
      config.env.grepTags = grepTags
    }
  }
}

module.exports = registerPlugin
