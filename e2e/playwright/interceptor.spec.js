import { test, expect } from '@playwright/test';

import { PROXY_MODE, RECORD_ORDER, RECORD_POLICY, RECORD_STRATEGY, SCENARIO_KEY, SCENARIO_NAME, SESSION_ID, TEST_TITLE, RecordOrder, RecordPolicy, RecordStrategy } from "../../dist/esm/constants.js";
import Stoobly from '../../dist/esm/stoobly.js';
import { SERVER_URL } from '../server-config';

const stoobly = new Stoobly();
const targetUrl = `${SERVER_URL}/headers`;
const interceptor = stoobly.playwrightInterceptor({ 
  urls: [targetUrl],
});

test.describe('applyScenario', () => {
  const scenarioKey = 'test';
  const sessionId = 'id';

  test.beforeEach(async ({ page }, testInfo) => {
    interceptor.withPage(page).withTestTitle(testInfo.title);
    interceptor.withScenarioKey(scenarioKey);
    interceptor.withSessionId(sessionId);
    await interceptor.apply();
  });

  test('should send request with Stoobly headers', async ({ page }, testInfo) => {
    page.goto(targetUrl);

    // Wait for the specific response by URL or predicate
    const response = await page.waitForResponse(response => {
      return response.url().startsWith(targetUrl) && response.status() === 200;
    });

    const body = await response.json();

    expect(body[SCENARIO_KEY.toLowerCase()]).toEqual(scenarioKey);
    expect(body[SESSION_ID.toLowerCase()]).toEqual(sessionId);
    expect(body[TEST_TITLE.toLowerCase()]).toEqual(testInfo.title);
    expect(body[TEST_TITLE.toLowerCase()]).toEqual('should send request with Stoobly headers');
  });

  test('another test should have a different test title in the headers', async ({ page }) => {
    page.goto(targetUrl);

    // Wait for the specific response by URL or predicate
    const response = await page.waitForResponse(response => {
      return response.url().startsWith(targetUrl) && response.status() === 200;
    });

    const body = await response.json();

    expect(body[TEST_TITLE.toLowerCase()]).toEqual('another test should have a different test title in the headers');
  });

  test.describe('when test title is not set', () => {
    test.beforeEach(async ({ page }, testInfo) => {
      interceptor.withPage(page).withTestTitle(undefined);
      interceptor.withScenarioKey(scenarioKey);
      interceptor.withSessionId(sessionId);
      await interceptor.apply();
    });

    test('should set Stoobly headers when test title is not set', async ({ page }, testInfo) => {

    page.goto(targetUrl);

    // Wait for the specific response by URL or predicate
    const response = await page.waitForResponse(response => {
      return response.url().startsWith(targetUrl) && response.status() === 200;
    });

    const body = await response.json();

    expect(body[SCENARIO_KEY.toLowerCase()]).toEqual(scenarioKey);
    expect(body[SESSION_ID.toLowerCase()]).toEqual(sessionId);
    // Should not have test title header when not set
    expect(body[TEST_TITLE.toLowerCase()]).toBeUndefined();
    });
  });
});

test.describe('applyScenario with scenarioName', () => {
  const scenarioName = 'test-scenario-name';
  const sessionId = 'id';

  test.beforeEach(async ({ page }, testInfo) => {
    interceptor.withPage(page).withTestTitle(testInfo.title);
    interceptor.withScenarioKey(undefined); // Clear scenario key when using scenario name
    interceptor.withScenarioName(scenarioName);
    interceptor.withSessionId(sessionId);
    await interceptor.apply();
  });

  test('should send request with scenario name header', async ({ page }, testInfo) => {
    page.goto(targetUrl);

    // Wait for the specific response by URL or predicate
    const response = await page.waitForResponse(response => {
      return response.url().startsWith(targetUrl) && response.status() === 200;
    });

    const body = await response.json();

    expect(body[SCENARIO_NAME.toLowerCase()]).toEqual(scenarioName);
    expect(body[SESSION_ID.toLowerCase()]).toEqual(sessionId);
    expect(body[TEST_TITLE.toLowerCase()]).toEqual(testInfo.title);
    // Should not have scenario key when using scenario name
    expect(body[SCENARIO_KEY.toLowerCase()]).toBeUndefined();
  });
});

test.describe('startRecord', () => {
  const sessionId = 'record-session';

  test.beforeEach(async ({ page }, testInfo) => {
    interceptor.stopRecord();
    interceptor.withPage(page).withTestTitle(testInfo.title);
    interceptor.withSessionId(sessionId);
    interceptor.startRecord();
    await interceptor.apply();
  });

  test('should send request with intercept and record headers', async ({ page }) => {

    page.goto(targetUrl);

    const response = await page.waitForResponse(response => {
      return response.url().startsWith(targetUrl) && response.status() === 200;
    });

    const body = await response.json();

    expect(body[PROXY_MODE.toLowerCase()]).toEqual('record');
    expect(body[SESSION_ID.toLowerCase()]).toEqual(sessionId);
    expect(body[TEST_TITLE.toLowerCase()]).toEqual('should send request with intercept and record headers');
  });

  test.describe('without session id', () => {
    test.beforeEach(async ({ page }, testInfo) => {
      interceptor.stopRecord();
      interceptor.withPage(page).withTestTitle(testInfo.title);
      interceptor.withSessionId(undefined);
      interceptor.startRecord();
      await interceptor.apply();
    });

    test('should send record headers without session id when not provided', async ({ page }, testInfo) => {

    page.goto(targetUrl);

    const response = await page.waitForResponse(response => {
      return response.url().startsWith(targetUrl) && response.status() === 200;
    });

    const body = await response.json();

    expect(body[PROXY_MODE.toLowerCase()]).toEqual('record');
    expect(body[SESSION_ID.toLowerCase()]).toBeDefined();
    expect(body[SESSION_ID.toLowerCase()]).not.toEqual(sessionId);
    });
  });

  test.describe('stopRecord', () => {
    test.beforeEach(async ({ page }, testInfo) => {
      interceptor.stopRecord();
      interceptor.withPage(page).withTestTitle(testInfo.title);
      interceptor.withSessionId(sessionId);
      interceptor.startRecord();
      await interceptor.apply();
    });

    test('should remove intercept headers', async ({ page }, testInfo) => {

    // First request with recording enabled
    page.goto(targetUrl);
    let response = await page.waitForResponse(response => {
      return response.url().startsWith(targetUrl) && response.status() === 200;
    });
    let body = await response.json();
    expect(body[PROXY_MODE.toLowerCase()]).toEqual('record');

    // Stop recording
    interceptor.stopRecord();

    // Second request should not have intercept headers
    page.goto(targetUrl);
    response = await page.waitForResponse(response => {
      return response.url().startsWith(targetUrl) && response.status() === 200;
    });
    body = await response.json();
    expect(body[PROXY_MODE.toLowerCase()]).toBeUndefined();
    });
  });

  test.describe('record options', () => {
    test.beforeEach(async ({ page }, testInfo) => {
      interceptor.stopRecord();
      interceptor.withPage(page).withTestTitle(testInfo.title);
      // Reset all record options
      interceptor.withRecordPolicy(undefined);
      interceptor.withRecordOrder(undefined);
      interceptor.withRecordStrategy(undefined);
    });

    test('should send record policy header when policy is "all"', async ({ page }, testInfo) => {
      interceptor.withRecordPolicy(RecordPolicy.All);
      interceptor.startRecord();
      await interceptor.apply();

      page.goto(targetUrl);

      const response = await page.waitForResponse(response => {
        return response.url().startsWith(targetUrl) && response.status() === 200;
      });

      const body = await response.json();
      expect(body[RECORD_POLICY.toLowerCase()]).toEqual(RecordPolicy.All);
      expect(body[PROXY_MODE.toLowerCase()]).toEqual('record');
    });

    test('should send record policy header when policy is "found"', async ({ page }, testInfo) => {
      interceptor.withRecordPolicy(RecordPolicy.Found);
      interceptor.withRecordOrder(undefined);
      interceptor.withRecordStrategy(undefined);
      interceptor.startRecord();
      await interceptor.apply();

      page.goto(targetUrl);

      const response = await page.waitForResponse(response => {
        return response.url().startsWith(targetUrl) && response.status() === 200;
      });

      const body = await response.json();
      expect(body[RECORD_POLICY.toLowerCase()]).toEqual(RecordPolicy.Found);
    });

    test('should send record policy header when policy is "not_found"', async ({ page }, testInfo) => {
      interceptor.withRecordPolicy(RecordPolicy.NotFound);
      interceptor.withRecordOrder(undefined);
      interceptor.withRecordStrategy(undefined);
      interceptor.startRecord();
      await interceptor.apply();

      page.goto(targetUrl);

      const response = await page.waitForResponse(response => {
        return response.url().startsWith(targetUrl) && response.status() === 200;
      });

      const body = await response.json();
      expect(body[RECORD_POLICY.toLowerCase()]).toEqual(RecordPolicy.NotFound);
    });

    test('should send record order header when order is "overwrite"', async ({ page }, testInfo) => {
      interceptor.withRecordPolicy(undefined);
      interceptor.withRecordOrder(RecordOrder.Overwrite);
      interceptor.withRecordStrategy(undefined);
      interceptor.startRecord();
      await interceptor.apply();

      page.goto(targetUrl);

      const response = await page.waitForResponse(response => {
        return response.url().startsWith(targetUrl) && response.status() === 200;
      });

      const body = await response.json();
      expect(body[RECORD_ORDER.toLowerCase()]).toEqual(RecordOrder.Overwrite);
    });

    test('should not send record policy header when policy is not provided', async ({ page }, testInfo) => {
      interceptor.withRecordPolicy(undefined);
      interceptor.withRecordOrder(undefined);
      interceptor.withRecordStrategy(undefined);
      interceptor.startRecord();
      await interceptor.apply();

      page.goto(targetUrl);

      const response = await page.waitForResponse(response => {
        return response.url().startsWith(targetUrl) && response.status() === 200;
      });

      const body = await response.json();
      expect(body[RECORD_POLICY.toLowerCase()]).toBeUndefined();
      expect(body[PROXY_MODE.toLowerCase()]).toEqual('record');
    });

    test('should send record strategy header when strategy is "full"', async ({ page }) => {
      interceptor.withRecordPolicy(undefined);
      interceptor.withRecordOrder(undefined);
      interceptor.withRecordStrategy(RecordStrategy.Full);
      interceptor.startRecord();
      await interceptor.apply();

      page.goto(targetUrl);

      const response = await page.waitForResponse(response => {
        return response.url().startsWith(targetUrl) && response.status() === 200;
      });

      const body = await response.json();
      expect(body[RECORD_STRATEGY.toLowerCase()]).toEqual(RecordStrategy.Full);
      expect(body[PROXY_MODE.toLowerCase()]).toEqual('record');
    });

    test('should send record strategy header when strategy is "minimal"', async ({ page }) => {
      interceptor.withRecordPolicy(undefined);
      interceptor.withRecordOrder(undefined);
      interceptor.withRecordStrategy(RecordStrategy.Minimal);
      interceptor.startRecord();
      await interceptor.apply();

      page.goto(targetUrl);

      const response = await page.waitForResponse(response => {
        return response.url().startsWith(targetUrl) && response.status() === 200;
      });

      const body = await response.json();
      expect(body[RECORD_STRATEGY.toLowerCase()]).toEqual(RecordStrategy.Minimal);
      expect(body[PROXY_MODE.toLowerCase()]).toEqual('record');
    });

    test('should not send record strategy header when strategy is not provided', async ({ page }) => {
      interceptor.withRecordPolicy(undefined);
      interceptor.withRecordOrder(undefined);
      interceptor.withRecordStrategy(undefined);
      interceptor.startRecord();
      await interceptor.apply();

      page.goto(targetUrl);

      const response = await page.waitForResponse(response => {
        return response.url().startsWith(targetUrl) && response.status() === 200;
      });

      const body = await response.json();
      expect(body[RECORD_STRATEGY.toLowerCase()]).toBeUndefined();
      expect(body[PROXY_MODE.toLowerCase()]).toEqual('record');
    });
  });
});

test.describe('clear', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    interceptor.withPage(page).withTestTitle(testInfo.title);
  });

  test('should remove handlers when explicitly called on active page', async ({ page }) => {
    const scenarioKey = 'test-clear';
    const sessionId = 'clear-session';

    interceptor.withScenarioKey(scenarioKey);
    interceptor.withSessionId(sessionId);
    await interceptor.apply();

    // First request should have headers
    let responsePromise = page.waitForResponse(response => {
      return response.url().startsWith(targetUrl) && response.status() === 200;
    });
    await page.goto(targetUrl);
    let response = await responsePromise;
    let body = await response.json();
    expect(body[SCENARIO_KEY.toLowerCase()]).toEqual(scenarioKey);
    expect(body[SESSION_ID.toLowerCase()]).toEqual(sessionId);

    // Clear handlers
    await interceptor.clear();

    // Second request should not have headers
    responsePromise = page.waitForResponse(response => {
      return response.url().startsWith(targetUrl) && response.status() === 200;
    });
    await page.goto(targetUrl);
    response = await responsePromise;
    body = await response.json();
    expect(body[SCENARIO_KEY.toLowerCase()]).toBeUndefined();
    expect(body[SESSION_ID.toLowerCase()]).toBeUndefined();
  });

  test('should handle multiple clears without error', async ({ page }) => {
    interceptor.withScenarioKey('test-multi-clear');
    await interceptor.apply();

    // First clear
    await interceptor.clear();

    // Second clear should be safe (no-op)
    await interceptor.clear();

    // Third clear
    await interceptor.clear();

    // All clears completed without throwing errors
    expect(true).toBe(true);
  });

  test('should not error when setting urls after page from previous test closes', async ({ page }) => {
    // Simulate the pattern from the test suite: modify interceptor
    // This should not error even if there was a previous page that's now closed
    interceptor.withScenarioKey('test-urls-set');
    await interceptor.apply();

    // Verify it still works
    const responsePromise = page.waitForResponse(response => {
      return response.url().startsWith(targetUrl) && response.status() === 200;
    });
    await page.goto(targetUrl);
    const response = await responsePromise;
    const body = await response.json();
    expect(body[SCENARIO_KEY.toLowerCase()]).toEqual('test-urls-set');
  });

  test('should not error when changing urls multiple times', async ({ page }) => {
    const url1 = `${SERVER_URL}/headers`;
    const url2 = `${SERVER_URL}/*`;

    interceptor.stopRecord();
    interceptor.urls = [url1];
    interceptor.withScenarioKey('test-url-change');
    await interceptor.apply();

    // Make a request
    let responsePromise = page.waitForResponse(response => {
      return response.url().startsWith(targetUrl) && response.status() === 200;
    });
    await page.goto(targetUrl);
    await responsePromise;

    // Change urls
    await interceptor.clear();
    interceptor.urls = [url2];
    interceptor.withScenarioKey('test-url-change-2');
    await interceptor.apply();

    // Change again
    await interceptor.clear();
    interceptor.urls = [url1];
    interceptor.withScenarioKey('test-url-change-2');
    await interceptor.apply();
    responsePromise = page.waitForResponse(response => {
      return response.url().startsWith(targetUrl) && response.status() === 200;
    });
    await page.goto(targetUrl);
    const response = await responsePromise;
    const body = await response.json();
    expect(body[SCENARIO_KEY.toLowerCase()]).toEqual('test-url-change-2');
  });
});


