/// <reference types="cypress" />

/**
 * @type {Cypress.PluginConfig}
 */
// eslint-disable-next-line no-unused-vars
module.exports = async (on, config) => {
  // `on` is used to hook into various events Cypress emits
  // `config` is the resolved Cypress config

  // include this plugin before cypress-grep
  // so if we find the test tags in the pull request body
  // we can grep for them by setting the grep config
  await require('../../src')(on, config, {
    // let's take this repo
    owner: 'bahmutov',
    repo: 'grep-tests-from-pull-requests',
    token: process.env.GITHUB_TOKEN || process.env.PERSONAL_GH_TOKEN,
  })

  console.log('Cypress env object %o', config.env)

  // https://github.com/bahmutov/cypress-grep
  require('cypress-grep/src/plugin')(config)

  // cypress-grep could modify the config (the list of spec files)
  // thus it is important to return the modified config to Cypress
  return config
}
