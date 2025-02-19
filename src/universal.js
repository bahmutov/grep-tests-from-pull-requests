// @ts-check

const debug = require('debug')('grep-tests-from-pull-requests')

/**
 * Finds and returns the test (base URL) in the given text line, if present.
 * @param {string} line a single line of text
 */
function getBaseUrlFromTextLine(line) {
  // if the line is in the form of
  // baseUrl <url>
  if (line.match(/^\s*baseUrl\s+/)) {
    return line.split('baseUrl')[1].trim()
  }
  // if the line is in the frm of
  // Test URL: <url>
  if (line.match(/^\s*Test URL:/)) {
    return line.split('Test URL:')[1].trim()
  }

  // did not find the base url
}

function cast(str) {
  if (typeof str === 'undefined' || str === '') {
    return undefined
  }

  if (str === 'true') {
    return true
  }
  if (str === 'false') {
    return false
  }
  const n = Number(str)
  if (!isNaN(n)) {
    return n
  }

  try {
    const parsed = JSON.parse(str)
    return parsed
  } catch (e) {
    // do nothing if JSON parsing fails
  }

  // return the original string
  return str
}

function getCypressEnvVariable(line) {
  if (line.match(/^CYPRESS_/)) {
    const values = line.split('CYPRESS_')[1].trim()
    const [key, valueString] = values.split('=')
    const value = cast(valueString)
    return {
      key,
      value,
    }
  }
  // did not find Cypress variable
}

function shouldRunCypressTests(line) {
  line = line.toLowerCase()

  if (line.includes('[x] run cypress tests')) {
    return true
  }

  if (line.includes('[ ] run cypress tests')) {
    return false
  }

  if (line.includes('[x] run e2e tests')) {
    return true
  }

  if (line.includes('[ ] run e2e tests')) {
    return false
  }

  // otherwise return undefined - we do not know
  // if the user wants to run Cypress tests
}

/**
 * @typedef {Object} TestsToRun
 * @property {boolean} all - if true, run all tests
 * @property {string[]} tags - list of test tags to run
 * @property {string|null} baseUrl - base URL to use
 * @property {Object<string, string|number|boolean>} env - additional environment variables to set
 * @property {boolean} runCypressTests - if true, run Cypress tests. True by default
 * @property {string[]} additionalSpecs - additional Cypress specs to run
 * @property {string[]} pagesToTest - additional URLs to test
 */

function findTestsToRun(pullRequestBody, tagsToLookFor = [], comments = []) {
  /** @type TestsToRun */
  const testsToRun = {
    all: false,
    tags: [],
    baseUrl: null,
    // additional environment variables to set found in the text
    env: {},
    runCypressTests: true,
    additionalSpecs: [],
    pagesToTest: [],
  }

  const lines = pullRequestBody.split('\n')
  lines.forEach((line) => {
    const runCypressTests = shouldRunCypressTests(line)
    if (typeof runCypressTests === 'boolean') {
      testsToRun.runCypressTests = runCypressTests
    }

    const foundUrl = getBaseUrlFromTextLine(line)
    if (foundUrl) {
      debug('found base url: %s', foundUrl)
      testsToRun.baseUrl = foundUrl
    } else {
      const envVariable = getCypressEnvVariable(line)
      if (envVariable && 'key' in envVariable && 'value' in envVariable) {
        debug('found env variable: %s', envVariable)
        testsToRun.env[envVariable.key] = envVariable.value
      }
    }
  })

  const additionalSpecs = findAdditionalSpecsToRun(lines)
  testsToRun.additionalSpecs = additionalSpecs

  const pagesToTest = findPagesToTest(lines)
  testsToRun.pagesToTest = pagesToTest

  // pull requests can overwrite the base url
  comments.forEach((comment) => {
    const commentLines = comment.split('\n')
    commentLines.forEach((line) => {
      const foundUrl = getBaseUrlFromTextLine(line)
      if (foundUrl) {
        debug('found base url in the comment: %s', foundUrl)
        testsToRun.baseUrl = foundUrl
      }
    })
  })

  // find the test tags to run
  if (!tagsToLookFor || !tagsToLookFor.length) {
    debug('no tags to look for, running all tests')
    testsToRun.all = true
    return testsToRun
  }
  debug('looking for checkboxes with tags: %o', tagsToLookFor)

  lines.forEach((line) => {
    if (line.includes('all tests') && isLineChecked(line)) {
      testsToRun.all = true
    }

    tagsToLookFor.forEach((tag) => {
      if (line.includes(tag) && isLineChecked(line)) {
        testsToRun.tags.push(tag)
      }
    })
  })

  return testsToRun
}

function isLineChecked(line) {
  return line.includes('[x]')
}

function parsePullRequestUrl(url) {
  if (!url.startsWith('https://github.com')) {
    throw new Error(`invalid url ${url}`)
  }

  if (!url.includes('/pull/')) {
    throw new Error(`invalid url without pull ${url}`)
  }

  const split = url.split('/')
  return {
    owner: split[3],
    repo: split[4],
    pull: cast(split[6]),
  }
}

/**
 * @param {string|string[]} lines PR text lines separately
 */
function findAdditionalSpecsToRun(lines) {
  const additionalSpecs = findList(lines, 'Run these Cypress specs too:')
  return additionalSpecs
}

/**
 * @param {string|string[]} lines PR text lines separately
 */
function findPagesToTest(lines) {
  const pages = findList(lines, 'Find specs that visit these pages:')
  return pages
}

function findList(lines, startMarker) {
  if (typeof lines === 'string') {
    lines = lines.split('\n')
  }

  let done = false
  let foundList = false
  const list = []

  lines.forEach((line, k) => {
    if (done) {
      return
    }

    if (line.includes(startMarker)) {
      done = true
      for (let i = k + 1; i < lines.length; i++) {
        const maybeSpecLine = lines[i].trim()

        if (maybeSpecLine === '-') {
          foundList = true
          continue
        }

        if (foundList && !maybeSpecLine) {
          // an empty line after the list of specs
          // means we are done searching
          break
        }

        if (maybeSpecLine.startsWith('- ')) {
          foundList = true
          const cleanedUp = maybeSpecLine.slice(2).replaceAll('`', '')
          if (cleanedUp) {
            list.push(cleanedUp)
          }
        } else if (list.length) {
          // finished with the list of specs
          break
        }
      }
    }
  })
  return list
}

function combineEnvOptions(configEnv, parsedEnv) {
  Object.keys(parsedEnv).forEach((key) => {
    const value = parsedEnv[key]
    if (typeof value !== 'undefined') {
      configEnv[key] = value
    }
  })
}

module.exports = {
  getBaseUrlFromTextLine,
  getCypressEnvVariable,
  cast,
  shouldRunCypressTests,
  findTestsToRun,
  parsePullRequestUrl,
  findAdditionalSpecsToRun,
  combineEnvOptions,
}
