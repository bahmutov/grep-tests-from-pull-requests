/// <reference types="cypress" />

chai.config.truncateThreshold = 500

import {
  getBaseUrlFromTextLine,
  getCypressEnvVariable,
  shouldRunCypressTests,
  cast,
  findTestsToRun,
  parsePullRequestUrl,
  findAdditionalSpecsToRun
} from '../../src/universal'

describe('getBaseUrlFromTextLine', () => {
  it('finds baseUrl', () => {
    expect(getBaseUrlFromTextLine('baseUrl http://example.com')).to.eq(
      'http://example.com',
    )
  })

  it('finds baseUrl with white space', () => {
    expect(
      getBaseUrlFromTextLine('    baseUrl    http://example.com   '),
    ).to.eq('http://example.com')
  })

  it('finds test URL', () => {
    expect(getBaseUrlFromTextLine('Test URL: http://example.com')).to.eq(
      'http://example.com',
    )
  })
})

describe('cast', () => {
  it('converts numbers', () => {
    expect(cast('1')).to.eq(1)
    expect(cast('1.12')).to.eq(1.12)
  })

  it('converts booleans', () => {
    expect(cast('true')).to.be.true
    expect(cast('false')).to.be.false
  })

  it('leaves strings unchanged', () => {
    expect(cast('hello there')).to.equal('hello there')
  })

  it('converts an empty string to undefined', () => {
    expect(cast('')).to.be.undefined
  })
})

describe('getCypressEnvVariable', () => {
  it('finds Cypress string variable', () => {
    const s = 'CYPRESS_FRIENDLY_GREETING=Hello'
    expect(getCypressEnvVariable(s)).to.deep.eq({
      key: 'FRIENDLY_GREETING',
      value: 'Hello',
    })
  })

  it('finds Cypress number variable', () => {
    const s = 'CYPRESS_num=1'
    expect(getCypressEnvVariable(s)).to.deep.eq({
      key: 'num',
      value: 1,
    })
  })

  it('finds Cypress boolean variable', () => {
    const s = 'CYPRESS_correct=true'
    expect(getCypressEnvVariable(s)).to.deep.eq({
      key: 'correct',
      value: true,
    })
  })

  it('returns undefined value', () => {
    const s = 'CYPRESS_flag='
    expect(getCypressEnvVariable(s)).to.deep.equal({
      key: 'flag',
      value: undefined,
    })
  })

  it('returns undefined otherwise', () => {
    const s = 'hello world'
    expect(getCypressEnvVariable(s)).to.be.undefined
  })
})

describe('shouldRunCypressTests', () => {
  it('finds if need to run Cypress tests', () => {
    expect(shouldRunCypressTests('[x] run Cypress tests')).to.be.true
    expect(shouldRunCypressTests('- [x] run Cypress tests')).to.be.true
  })

  it('finds if need to skip Cypress tests', () => {
    expect(shouldRunCypressTests('[ ] run Cypress tests')).to.be.false
    expect(shouldRunCypressTests('- [ ] run E2E tests')).to.be.false
  })

  it('finds no information', () => {
    expect(shouldRunCypressTests('run Cypress tests')).to.be.undefined
    expect(shouldRunCypressTests('- [ ] run tests')).to.be.undefined
  })
})

describe('findAdditionalSpecsToRun', () => {
  it('finds a few lines', () => {
    const body = `
      # PR

      Run these Cypress specs too:

      - cypress/e2e/spec-b.cy.js
    `
    const specs = findAdditionalSpecsToRun(body)
    expect(specs).to.deep.equal(['cypress/e2e/spec-b.cy.js'])
  })

  it('stops after the list', () => {
    const body = `
      # PR

      Run these Cypress specs too:

      - cypress/e2e/spec-b.cy.js
      - cypress/e2e/spec-c.cy.js

      more text here
    `
    const specs = findAdditionalSpecsToRun(body)
    expect(specs).to.deep.equal(['cypress/e2e/spec-b.cy.js', 'cypress/e2e/spec-c.cy.js'])
  })

  it('allows wildcards', () => {
    const body = `
      # PR

      Run these Cypress specs too:

      - cypress/e2e/spec-b.cy.js
      - cypress/e2e/**.cy.js

      more text here
    `
    const specs = findAdditionalSpecsToRun(body)
    expect(specs).to.deep.equal(['cypress/e2e/spec-b.cy.js', 'cypress/e2e/**.cy.js'])
  })

  it('removes back ticks', () => {
    const body = `
      # PR

      Run these Cypress specs too:

      - \`cypress/e2e/spec-b.cy.js\`
      - \`cypress/e2e/**.cy.js\`

      more text here
    `
    const specs = findAdditionalSpecsToRun(body)
    expect(specs).to.deep.equal(['cypress/e2e/spec-b.cy.js', 'cypress/e2e/**.cy.js'])
  })
})

describe('findTestsToRun', () => {
  it('finds all the information without tags', () => {
    cy.readFile('.github/PULL_REQUEST_TEMPLATE.md').then((body) => {
      const found = findTestsToRun(body)
      expect(found).to.deep.equal({
        all: true,
        baseUrl: null,
        env: {
          num: 1,
          correct: true,
          FRIENDLY_GREETING: 'Hello',
        },
        runCypressTests: true,
        tags: [],
        additionalSpecs: [ 'cypress/e2e/spec-b.cy.js', 'cypress/e2e/**/*.cy.js']
      })
    })
  })

  it('finds all the information with tags', () => {
    cy.fixture('pr-with-tags.md').then((body) => {
      const tags = ['@sanity', '@quick']
      const found = findTestsToRun(body, tags)
      expect(found).to.deep.equal({
        all: false,
        baseUrl: 'http://localhost:7777',
        env: {},
        runCypressTests: true,
        tags,
        additionalSpecs: ['cypress/e2e/spec-b.cy.js']
      })
    })
  })
})

describe('parsePullRequestUrl', () => {
  it('parses pull request url', () => {
    const parsed = parsePullRequestUrl(
      'https://github.com/bahmutov/todomvc-tests-circleci/pull/15',
    )
    expect(parsed).to.deep.equal({
      owner: 'bahmutov',
      repo: 'todomvc-tests-circleci',
      pull: 15,
    })
  })

  it('throws for invalid URL', () => {
    expect(() => {
      parsePullRequestUrl('github.com/foo/bar')
    }).to.throw
  })
})

describe('Object.assign', () => {
  it('overwrites empty strings', () => {
    const a = {
      name: '',
    }
    const b = {
      name: 'Joe',
    }
    Object.assign(a, b)
    expect(a).to.deep.equal({
      name: 'Joe',
    })
  })
})
