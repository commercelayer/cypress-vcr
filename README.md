# cypress-vcr

Record your test suite's HTTP interactions and replay them during future test runs for fast.

## Getting Started

To get started with `cypress-vcr` you need to install it.

- [Installation](#installation)
- [Usage](#usage)
- [Stubbing](#stubbing)
- [Typescript](#typescript)

## Installation

```text
  // NPM
  npm install -D @commercelayer/cypress-vcr

  // YARN
  yarn add -D @commercelayer/cypress-vcr
```

## Usage

- The first step is to import the plugin in your `cypress/support/command.js` as follows:

```text
import '@commercelayer/cypress-vcr'
```

- The second step is to add the command to register your routes as follows:

> [!TIP]
>
> [Environment Variables](https://docs.cypress.io/guides/guides/environment-variables.html#Setting) can be useful!

```text
before(() => {
  // or beforeEach method

  cy.server()
  cy.setRoutes({
    endpoint: 'your-endpoint',
    routes: [
      {
        method: "POST",
        url: "/beetles",
        alias: "getBeetles"
      }
    ],
    record: Cypress.env('RECORD'), // @default false
    filename: 'requests' // @default: 'requests' for reading the data from your cassette
  })
  cy.visit('/')

})
```

- The third step is to add the command to save all data from your requests as follows:

```text
after(() => {
  if (Cypress.env('RECORD')) {
    cy.saveRequests('your-filename') // @default: 'requests'
  }
})
```

That's it. Now you can launch your tests. You can find your data requests in your `cypress/fixtures` folder.

## Stubbing

[Stubbing](https://docs.cypress.io/api/commands/route.html#With-Stubbing) made automatically, but there may be multiple requests to the same route.
For each request, the plugin set an id (your-alias + n) that you can require to update the response as follows:

```text
cy.get('#search').type('Weevil')

// wait for the first response to finish
cy.wait('@getBeetles')

// the results should be empty because we
// responded with an empty array first
cy.get('#beetle-results').should('be.empty')

// now re-define the /beetles response with the second response
if (!Cypress.env('RECORD')) {
  cy.newStubData('@getBeetles1', 'your-filename') // @default: 'requests'
  // or cy.newStubData(['@getBeetles1', '@other-request'], 'other-filename')
}

cy.get('#search').type('Geotrupidae')

// now when we wait for 'getBeetles' again, Cypress will
// automatically know to wait for the 2nd response
cy.wait('@getBeetles')

// we responded with 1 beetle item so now we should
// have one result
cy.get('#beetle-results').should('have.length', 1)

```

## Typescript

`cypress-vcr` is written in Typescript. You can add its types to your project as follows:

```text
// in cypress/support/index.d.ts
// load type definitions that come with Cypress module
/// <reference types="cypress" />

import {
  SetRoutes,
  NewStubData,
  SaveRequests,
} from '@commercelayer/cypress-vcr'

declare namespace Cypress {
  interface Chainable {
    setRoutes: SetRoutes
    newStubData: NewStubData
    saveRequests: SaveRequests
  }
}
```

That's it. More details on [Cypress](https://docs.cypress.io/guides/tooling/typescript-support.html#Types-for-custom-commands)

## License

This repository is published under the MIT license.
