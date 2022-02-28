/// <reference types="cypress" />

import { getBaseUrlFromTextLine } from '../../src/universal'

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
