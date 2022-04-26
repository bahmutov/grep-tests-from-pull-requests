/// <reference types="cypress" />

chai.config.truncateThreshold = 200

import {
  getBaseUrlFromTextLine,
  getCypressEnvVariable,
  cast,
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
