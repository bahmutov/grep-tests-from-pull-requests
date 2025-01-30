/// <reference types="cypress" />
// @ts-check
const debug = require('debug')('grep-tests-from-pull-requests')
const {
  getPullRequestBody,
  getPullRequestComments,
  getTestsToRun,
  getPullRequestNumber,
} = require('./utils')
const { combineEnvOptions } = require('./universal')

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

  // commit SHA is a backup if the pull request is unknown
  const testCommit =
    options.commit ||
    options.testCommit ||
    config.env.commit ||
    config.env.testCommit

  if ((testPullRequest || testCommit) && options.tags) {
    if (typeof options.tags === 'string') {
      options.tags = [options.tags]
    }

    const envOptions = {
      token: options.token,
    }

    const testPullRequestNumber = await getPullRequestNumber(
      options.owner,
      options.repo,
      testPullRequest,
      testCommit,
      envOptions,
      options.all,
    )
    if (isNaN(testPullRequestNumber)) {
      throw new Error('Could not find the pull request number')
    }

    console.log(
      'picking the tests to run based on PR number %d with tags %s',
      testPullRequestNumber,
      options.tags.join(', '),
    )

    const prOptions = {
      owner: options.owner,
      repo: options.repo,
      pull: testPullRequestNumber,
    }

    const prBody = await getPullRequestBody(prOptions, envOptions)
    const prComments = await getPullRequestComments(prOptions, envOptions)
    const testsToRun = getTestsToRun(prBody, options.tags, prComments)
    console.log('tests to run', testsToRun)

    if (testsToRun) {
      if (testsToRun.baseUrl) {
        if (options.setBaseUrl === false) {
          debug(
            'skipping setting the baseUrl to %s because setBaseUrl is false',
            testsToRun.baseUrl,
          )
        } else {
          console.log('setting the baseUrl to %s', testsToRun.baseUrl)
          config.baseUrl = testsToRun.baseUrl
        }
      }

      if (options.setTests === false) {
        debug('skipping setting the tests to run because setTests is false')
      } else {
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

      if (Object.keys(testsToRun.env).length) {
        console.log('found the following env values in the PR text')
        console.log('%o', testsToRun.env)
        combineEnvOptions(config.env, testsToRun.env)
      }
    }

    return testsToRun
  }
}

module.exports = registerPlugin
