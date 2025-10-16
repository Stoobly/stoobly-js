# Stoobly Node.js library

![Node.js Version](https://img.shields.io/badge/node-%3E%3D18-brightgreen)
![npm version](https://img.shields.io/npm/v/stoobly)
![CI](https://github.com/Stoobly/stoobly-js/workflows/Integration%20tests/badge.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)
![Cypress](https://img.shields.io/badge/Cypress-17202C?logo=cypress&logoColor=white)
![Playwright](https://img.shields.io/badge/Playwright-45ba4b?logo=playwright&logoColor=white)
![License](https://img.shields.io/github/license/Stoobly/stoobly-js)

The Stoobly Javascript library provides convenient access to [stoobly-agent](https://github.com/Stoobly/stoobly-agent) API.

## Requirements

Node 18 or higher.

## Installation

Install the package with:

```sh
npm install stoobly --save-dev
```

## Usage

```js
const { default: Stoobly } = require('stoobly');
```

Or using ES modules:

```js
import Stoobly from 'stoobly';
```

## Examples

### Setting a scenario

Configures requests with origin https://docs.stoobly.com to specify a scenario. `sessionId` defaults to current time.

```js
const stoobly = new Stoobly();

const sessionId = stoobly.applyScenario('<SCENARIO-KEY>', { urls: [new RegExp('https://docs.stoobly.com/.*')] });
```

Configures requests with origin https://docs.stoobly.com to specify a scenario. Resume a session by specifying a `sessionId`.

```js
const stoobly = new Stoobly();

stoobly.applyScenario('<SCENARIO-KEY>', { urls: [new RegExp('https://docs.stoobly.com/.*')], sessionId: '<SESSION-ID>' });
```

Configures requests https://docs.stoobly.com/use-cases and https://docs.stoobly.com/getting-started to specify a scenario.

```js
const stoobly = new Stoobly();

stoobly.applyScenario('<SCENARIO-KEY>', { 
    urls: [
        'https://docs.stoobly.com/use-cases',
        'https://docs.stoobly.com/getting-started'
    ]
});
```

### Integrating with Cypress

```js

describe('Scenario', () => {
    const stoobly = new Stoobly();

    beforeEach(() => {
        
        const urls = ['<URLS>'];

        // WARNING: if a synchronous request is used, this will cause Cypress to hang. See: https://github.com/cypress-io/cypress/issues/29566
        // Example of a synchronous request: https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest_API/Synchronous_and_Asynchronous_Requests#synchronous_request
        stoobly.cypress.applyScenario('<SCENARIO-KEY>', { urls });
    });
});
```

**Key Points:**
- The Stoobly instance is created once inside the `describe` block
- Test names are automatically detected at request interception time for each test
- `stoobly.cypress.applyScenario` cannot be applied in `beforeAll` because it uses `cy.intercept`. `cy.intercept` gets reset before every test. See: https://docs.cypress.io/api/commands/intercept#:~:text=All%20intercepts%20are%20automatically%20cleared%20before%20every%20test.


### Integrating with Playwright

```js
describe('Scenario', () => {
    const stoobly = new Stoobly();

    beforeEach(async ({ }, testInfo) => {
        const urls = ['<URLS>'];

        stoobly.playwright.setTestTitle(testInfo.title);
        stoobly.playwright.applyScenario('<SCENARIO-KEY>', { urls });
    });
});
```

**Key Points:**
- The Stoobly instance is created once inside the `describe` block
- `setTestTitle()` must be called in `beforeEach()` to update the test name for each test because Playwright doesn't provide a global API to auto-detect test names
- Test names are applied at request interception time

## Testing

Run unit tests:

```sh
npm test
```

### Test Cypress Integration
Run Cypress end-to-end tests:

```sh
npm run test:cypress
```

### Test Playwright Integration
Run Playwright end-to-end tests:

```sh
npm run test:playwright
```
