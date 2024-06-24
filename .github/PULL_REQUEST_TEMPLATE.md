# Summary

## Tests to run

Maybe we should not be running any E2E tests?

- [x] run Cypress tests

Please pick all tests you would like to run against this pull request

- [ ] all tests
- [ ] tests tagged `@sanity`
- [ ] tests tagged `@quick`

Additional Cypress environment values to pass from this pull request. Cypress should have these values cast correctly and available in `Cypress.env()` object.

CYPRESS_num=1
CYPRESS_correct=true

And another value

CYPRESS_FRIENDLY_GREETING=Hello

The 3 above values should be available under `num`, `correct`, and `FRIENDLY_GREETING` names.

Here you can specify a list of Cypress specs to run:

Run these Cypress specs too:

- cypress/e2e/spec-b.cy.js
- `cypress/e2e/**/*.cy.js`

Back ticks are removed.
