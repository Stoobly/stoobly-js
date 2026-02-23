
# Stoobly Node.js library

![Node.js Version](https://img.shields.io/badge/node-%3E%3D18-brightgreen)
![npm version](https://img.shields.io/npm/v/stoobly)
![CI](https://github.com/Stoobly/stoobly-js/workflows/Integration%20tests/badge.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)
![Cypress](https://img.shields.io/badge/Cypress-17202C?logo=cypress&logoColor=white)
![Playwright](https://img.shields.io/badge/Playwright-45ba4b?logo=playwright&logoColor=white)
![License](https://img.shields.io/github/license/Stoobly/stoobly-js)
[![Docs](https://img.shields.io/badge/docs-stoobly--js-blue?logo=readthedocs)](https://stoobly.github.io/stoobly-js/)

The Stoobly Javascript library provides convenient access to [stoobly-agent](https://github.com/Stoobly/stoobly-agent) API.

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE: `npx doctoc README.md --notitle`
 -->

- [Requirements](#requirements)
- [Installation](#installation)
- [Usage](#usage)
- [Examples](#examples)
  - [Setting a scenario](#setting-a-scenario)
  - [Recording requests](#recording-requests)
  - [Test Framework Integration](#test-framework-integration)
  - [Integrating with Cypress](#integrating-with-cypress)
  - [Integrating with Playwright](#integrating-with-playwright)
- [Testing](#testing)
  - [Test Cypress Integration](#test-cypress-integration)
  - [Test Playwright Integration](#test-playwright-integration)
- [Documentation](#documentation)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->


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
    urls: [{ pattern: new RegExp('https://docs.stoobly.com/.*') }]
});

const sessionId = interceptor.apply();
```

Configures requests with origin https://docs.stoobly.com to specify a scenario. After a session has started, change sessions with `withSessionId()`.

```js
import Stoobly from 'stoobly';

const stoobly = new Stoobly();
const interceptor = stoobly.interceptor({
    scenarioKey: '<SCENARIO-KEY>',
    sessionId: '<SESSION-ID>',
    urls: [{ pattern: new RegExp('https://docs.stoobly.com/.*') }]
});

const sessionId = interceptor.apply();
interceptor.withSessionId('<NEW-SESSION-ID>');
```

Configures requests https://docs.stoobly.com/use-cases and https://docs.stoobly.com/getting-started to specify a scenario.

```js
import Stoobly from 'stoobly';

const stoobly = new Stoobly();
const interceptor = stoobly.interceptor({
    scenarioKey: '<SCENARIO-KEY>',
    urls: [
        { pattern: 'https://docs.stoobly.com/use-cases' },
        { pattern: 'https://docs.stoobly.com/getting-started' }
    ]
});

interceptor.apply();
```

### Recording requests

Record requests with specific policy, order, and strategy options:

```js
import Stoobly from 'stoobly';
import {
  RecordPolicy,
  RecordOrder,
  RecordStrategy,

  // Additional constants available:
  //
  // InterceptMode,   // mock, record, replay, test
  // MockPolicy,      // All, Found
  // ReplayPolicy,    // All
  // TestPolicy,      // All, Found
  // TestStrategy,    // Diff, Fuzzy, Custom
  // FirewallAction,  // Exclude, Include
  // RequestParameter // Header, BodyParam, QueryParam
} from 'stoobly/constants';

const stoobly = new Stoobly();
const interceptor = stoobly.interceptor({
    urls: [{ pattern: 'https://docs.stoobly.com/use-cases' }],
    record: {
        policy: RecordPolicy.All,
        order: RecordOrder.Overwrite, // Defaults to RecordOrder.Append
        strategy: RecordStrategy.Full,
    }
});

interceptor.applyRecord();
```

Stop recording requests:

```js
interceptor.clearRecord();
```

Stop all interception (recording, mocking, etc.):

```js
interceptor.clear();
```

### Test Framework Integration

- **Using Cypress?** See [Integrating with Cypress](#integrating-with-cypress) and use `cypressInterceptor()`
- **Using Playwright?** See [Integrating with Playwright](#integrating-with-playwright) and use `playwrightInterceptor()`
- **Not using a test framework?** The examples above use `interceptor()`, which patches `fetch` and `XMLHttpRequest` directly


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
    urls: [{ pattern: '<URLS>' }],
});

describe('Scenario', () => {
    beforeEach(() => {
        // WARNING: if a synchronous request is used, this will cause Cypress to hang. See: https://github.com/cypress-io/cypress/issues/29566
        // Example of a synchronous request: https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest_API/Synchronous_and_Asynchronous_Requests#synchronous_request
        stooblyInterceptor.apply();

        // Use the following instead to record requests
        // stooblyInterceptor.applyRecord();
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
    urls: [{ pattern: '<URLS>' }],
});

test.describe('Scenario', () => {
    test.beforeEach(async ({ page }, testInfo) => {
        await stooblyInterceptor.withPage(page).apply();

        // Use the following instead to record requests
        // await stooblyInterceptor.withPage(page).applyRecord();

        stooblyInterceptor.withTestTitle(testInfo.title);
    });
});
```

**Key Points:**
- The Stoobly instance and interceptor are created once outside the `describe` block
- `withPage()` and `withTestTitle()` must be called in `beforeEach()` to update the page and test titles for each test because Playwright does not provide a global API to auto-detect test titles
- Test titles are applied at request interception time

#### Intercepting Browser Extension Requests with Playwright

By default, Playwright intercepts requests at the page level using `withPage()`. To intercept requests from browser extensions, service workers, or all pages in a browser context, use `withContext()`:

```js
test.beforeEach(async ({ context, page }, testInfo) => {
    await stooblyInterceptor
        .withContext(context)  // Intercept all requests in the browser context
        .apply();
    stooblyInterceptor.withTestTitle(testInfo.title);
});
```

**Using `withContext()` enables:**
- Intercepting requests from browser extensions
- Intercepting requests from service workers
- Intercepting requests across all pages in the same browser context

**Note:** You can use `withContext()` alone, `withPage()` alone, or both together. When both are used, routes are applied to both the page and context, ensuring comprehensive request interception.

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

## Documentation

Full API documentation is available at: https://stoobly.github.io/stoobly-js/

To regenerate TypeDoc docs locally:
```sh
npx typedoc
```
