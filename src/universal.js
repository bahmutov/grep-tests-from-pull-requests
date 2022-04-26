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

module.exports = { getBaseUrlFromTextLine, getCypressEnvVariable, cast }
