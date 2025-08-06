# Stoobly Node.js library

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
    beforeEach(() => {
        const stoobly = new Stoobly();
        const urls = ['<URLS>'];
    
        // WARNING: if a synchronous request is used, this will cause Cypress to hang. See: https://github.com/cypress-io/cypress/issues/29566
        // Example of a synchronous request: https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest_API/Synchronous_and_Asynchronous_Requests#synchronous_request
        stoobly.cypress.applyScenario('<SCENARIO-KEY>', { urls });
    });
});
```

`stoobly.applyScenario` cannot be applied in `beforeAll` because it uses `cy.intercept`. `cy.intercept` gets reset before every test. See: https://docs.cypress.io/api/commands/intercept#:~:text=All%20intercepts%20are%20automatically%20cleared%20before%20every%20test.

### Integrating with Playwright

```js

describe('Scenario', () => { 
    beforeEach(() => {
        const stoobly = new Stoobly();
        const urls = ['<URLS>'];
    
        stoobly.playwright.applyScenario('<SCENARIO-KEY>', { urls });
    });
});
```
