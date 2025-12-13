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
const Stoobly = require('stoobly');
```

Or using ES modules:

```js
import Stoobly from 'stoobly';
```

## Examples

### Setting a scenario

Configures requests with origin https://docs.stoobly.com to specify a scenario. `sessionId` defaults to current time.

```js
import Stoobly from 'stoobly';

const stoobly = new Stoobly();
const interceptor = stoobly.interceptor({
    scenarioKey: '<SCENARIO-KEY>',
    scenarioName: '<SCENARIO-NAME>', // If scenario name is used instead of key, it should be unique
    urls: [new RegExp('https://docs.stoobly.com/.*')]
});

interceptor.apply();
```

Configures requests with origin https://docs.stoobly.com to specify a scenario. Resume a session by specifying a `sessionId`.

```js
import Stoobly from 'stoobly';

const stoobly = new Stoobly();
const interceptor = stoobly.interceptor({
    scenarioKey: '<SCENARIO-KEY>',
    sessionId: '<SESSION-ID>',
    urls: [new RegExp('https://docs.stoobly.com/.*')]
});

interceptor.apply();
```

Configures requests https://docs.stoobly.com/use-cases and https://docs.stoobly.com/getting-started to specify a scenario.

```js
import Stoobly from 'stoobly';

const stoobly = new Stoobly();
const interceptor = stoobly.interceptor({
    scenarioKey: '<SCENARIO-KEY>',
    urls: [
        'https://docs.stoobly.com/use-cases',
        'https://docs.stoobly.com/getting-started'
    ]
});

interceptor.apply();
```

### Recording requests

Record requests with specific policy, order, and strategy options:

```js
import Stoobly from 'stoobly';
import { RecordPolicy, RecordOrder, RecordStrategy } from 'stoobly/constants';

const stoobly = new Stoobly();
const interceptor = stoobly.interceptor({
    urls: ['https://docs.stoobly.com/use-cases'],
    record: {
        policy: RecordPolicy.All,
        order: RecordOrder.Overwrite, // Defaults to RecordOrder.Append
        strategy: RecordStrategy.Full,
    }
});

interceptor.startRecord();
```

Stop recording requests:

```js
interceptor.stopRecord();
```

### Integrating with Cypress

```js
import Stoobly from 'stoobly';
import { RecordPolicy, RecordOrder, RecordStrategy } from 'stoobly/constants';

const stoobly = new Stoobly();
const stooblyInterceptor = stoobly.cypressInterceptor({
    record: {
        policy: RecordPolicy.All,
        order: RecordOrder.Overwrite, // Defaults to RecordOrder.Append
        strategy: RecordStrategy.Full,
    },
    scenarioKey: '<SCENARIO-KEY>',
    urls: ['<URLS>'],
});

describe('Scenario', () => {
    beforeAll(() => {
        // WARNING: if a synchronous request is used, this will cause Cypress to hang. See: https://github.com/cypress-io/cypress/issues/29566
        // Example of a synchronous request: https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest_API/Synchronous_and_Asynchronous_Requests#synchronous_request
        stooblyInterceptor.apply();

        // Use the following instead to record requests
        // stooblyInterceptor.startRecord();
    });
});
```

**Key Points:**
- The Stoobly instance and interceptor are created once outside the `describe` block
- Test titles are automatically detected at request interception time for each test
- `interceptor.apply()` must be called in `beforeEach` because it uses `cy.intercept`. `cy.intercept` gets reset before every test. See: https://docs.cypress.io/api/commands/intercept#:~:text=All%20intercepts%20are%20automatically%20cleared%20before%20every%20test.


### Integrating with Playwright

```js
import { test } from '@playwright/test';
import Stoobly from 'stoobly';
import { RecordPolicy, RecordOrder, RecordStrategy } from 'stoobly/constants';

const stoobly = new Stoobly();
const stooblyInterceptor = stoobly.playwrightInterceptor({
    record: {
        policy: RecordPolicy.All,
        order: RecordOrder.Overwrite, // Defaults to RecordOrder.Append
        strategy: RecordStrategy.Full,
    },
    scenarioKey: '<SCENARIO-KEY>',
    urls: ['<URLS>'],
});

test.describe('Scenario', () => {
    test.beforeAll(() => {
        stooblyInterceptor.apply();

        // Use the following instead to record requests
        // stooblyInterceptor.startRecord();
    });

    test.beforeEach(async ({ page }, testInfo) => {
        stooblyInterceptor.withPage(page).withTestTitle(testInfo.title);
    });
});
```

**Key Points:**
- The Stoobly instance and interceptor are created once outside the `describe` block
- `withPage()` and `withTestTitle()` must be called in `beforeEach()` to update the page and test titles for each test because Playwright does not provide a global API to auto-detect test titles
- Test titles are applied at request interception time

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
