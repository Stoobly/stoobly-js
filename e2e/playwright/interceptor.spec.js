import { test, expect } from '@playwright/test';

import { PROXY_MODE, RECORD_POLICY, SCENARIO_KEY, SESSION_ID, TEST_TITLE } from "../../src/constants/custom_headers";
import { RecordPolicy } from "../../src/constants/proxy";
import Stoobly from '../../src/stoobly';
import { SERVER_URL } from '../server-config';

test.describe('applyScenario', () => {
  const stoobly = new Stoobly();
  const scenarioKey = 'test';
  const sessionId = 'id';
  const targetUrl = `${SERVER_URL}/headers`;

  test.beforeAll(async () => {
    stoobly.playwright.urls = [targetUrl];
  });

  test.beforeEach(async ({ page }, testInfo) => {
    stoobly.playwright.withPage(page);
    stoobly.playwright.withTestTitle(testInfo.title);
    await stoobly.playwright.applyScenario(scenarioKey, { sessionId });
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

  test('should set Stoobly headers when test title is not set', async ({ page }) => {
    // Create a new Stoobly instance without setting test title
    // Not using the instance from beforeEach which does have withTestTitle called
    const stoobly = new Stoobly();
    stoobly.playwright.urls = [targetUrl];
    // Don't call withTestTitle - simulate forgetting to set it
    await stoobly.playwright.withPage(page).applyScenario(scenarioKey, { sessionId });

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

test.describe('startRecord', () => {
  const stoobly = new Stoobly();
  const sessionId = 'record-session';
  const targetUrl = `${SERVER_URL}/headers`;

  test.beforeAll(async () => {
    stoobly.playwright.urls = [targetUrl];
  });

  test.beforeEach(async ({ page }, testInfo) => {
    stoobly.playwright.withPage(page);
    stoobly.playwright.withTestTitle(testInfo.title);
  });

  test('should send request with intercept and record headers', async ({ page }) => {
    await stoobly.playwright.startRecord({ sessionId });

    page.goto(targetUrl);

    const response = await page.waitForResponse(response => {
      return response.url().startsWith(targetUrl) && response.status() === 200;
    });

    const body = await response.json();

    expect(body[PROXY_MODE.toLowerCase()]).toEqual('record');
    expect(body[SESSION_ID.toLowerCase()]).toEqual(sessionId);
    expect(body[TEST_TITLE.toLowerCase()]).toEqual('should send request with intercept and record headers');
  });

  test('should send record headers without session id when not provided', async ({ page }) => {
    await stoobly.playwright.startRecord();

    page.goto(targetUrl);

    const response = await page.waitForResponse(response => {
      return response.url().startsWith(targetUrl) && response.status() === 200;
    });

    const body = await response.json();

    expect(body[PROXY_MODE.toLowerCase()]).toEqual('record');
    expect(body[SESSION_ID.toLowerCase()]).toBeDefined();
    expect(body[SESSION_ID.toLowerCase()]).not.toEqual(sessionId);
  });

  test('stopRecord should remove intercept headers', async ({ page }) => {
    await stoobly.playwright.startRecord({ sessionId });

    // First request with recording enabled
    page.goto(targetUrl);
    let response = await page.waitForResponse(response => {
      return response.url().startsWith(targetUrl) && response.status() === 200;
    });
    let body = await response.json();
    expect(body[PROXY_MODE.toLowerCase()]).toEqual('record');

    // Stop recording
    stoobly.playwright.stopRecord();

    // Second request should not have intercept headers
    page.goto(targetUrl);
    response = await page.waitForResponse(response => {
      return response.url().startsWith(targetUrl) && response.status() === 200;
    });
    body = await response.json();
    expect(body[PROXY_MODE.toLowerCase()]).toBeUndefined();
  });

  test.describe('record options', () => {
    const stoobly = new Stoobly();
    const targetUrl = `${SERVER_URL}/headers`;

    test.beforeAll(async () => {
      stoobly.playwright.urls = [targetUrl];
    });

    test.beforeEach(async ({ page }, testInfo) => {
      stoobly.playwright.withPage(page);
      stoobly.playwright.withTestTitle(testInfo.title);
    });

    test('should send record policy header when policy is "all"', async ({ page }, testInfo) => {
      await stoobly.playwright.startRecord({ policy: RecordPolicy.All });

      page.goto(targetUrl);

      const response = await page.waitForResponse(response => {
        return response.url().startsWith(targetUrl) && response.status() === 200;
      });

      const body = await response.json();
      expect(body[RECORD_POLICY.toLowerCase()]).toEqual(RecordPolicy.All);
      expect(body[PROXY_MODE.toLowerCase()]).toEqual('record');
    });

    test('should send record policy header when policy is "found"', async ({ page }, testInfo) => {
      await stoobly.playwright.startRecord({ policy: RecordPolicy.Found });

      page.goto(targetUrl);

      const response = await page.waitForResponse(response => {
        return response.url().startsWith(targetUrl) && response.status() === 200;
      });

      const body = await response.json();
      expect(body[RECORD_POLICY.toLowerCase()]).toEqual(RecordPolicy.Found);
    });

    test('should send record policy header when policy is "not_found"', async ({ page }, testInfo) => {
      await stoobly.playwright.startRecord({ policy: RecordPolicy.NotFound });

      page.goto(targetUrl);

      const response = await page.waitForResponse(response => {
        return response.url().startsWith(targetUrl) && response.status() === 200;
      });

      const body = await response.json();
      expect(body[RECORD_POLICY.toLowerCase()]).toEqual(RecordPolicy.NotFound);
    });

    test('should send record policy header when policy is "overwrite"', async ({ page }, testInfo) => {
      await stoobly.playwright.startRecord({ policy: RecordPolicy.Overwrite });

      page.goto(targetUrl);

      const response = await page.waitForResponse(response => {
        return response.url().startsWith(targetUrl) && response.status() === 200;
      });

      const body = await response.json();
      expect(body[RECORD_POLICY.toLowerCase()]).toEqual(RecordPolicy.Overwrite);
    });

    test('should not send record policy header when policy is not provided', async ({ page }, testInfo) => {
      await stoobly.playwright.startRecord();

      page.goto(targetUrl);

      const response = await page.waitForResponse(response => {
        return response.url().startsWith(targetUrl) && response.status() === 200;
      });

      const body = await response.json();
      expect(body[RECORD_POLICY.toLowerCase()]).toBeUndefined();
      expect(body[PROXY_MODE.toLowerCase()]).toEqual('record');
    });
  });
});

test.describe('clear', () => {
  const targetUrl = `${SERVER_URL}/headers`;

  test('should remove handlers when explicitly called on active page', async ({ page }) => {
    const stoobly = new Stoobly();
    const scenarioKey = 'test-clear';
    const sessionId = 'clear-session';

    stoobly.playwright.urls = [targetUrl];
    await stoobly.playwright.withPage(page).applyScenario(scenarioKey, { sessionId });

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
    stoobly.playwright.clear();

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
    const stoobly = new Stoobly();

    stoobly.playwright.urls = [targetUrl];
    stoobly.playwright.withPage(page);
    await stoobly.playwright.applyScenario('test-multi-clear');

    // First clear
    await stoobly.playwright.clear();

    // Second clear should be safe (no-op)
    await stoobly.playwright.clear();

    // Third clear
    await stoobly.playwright.clear();

    // All clears completed without throwing errors
    expect(true).toBe(true);
  });

  test('should not error when setting urls after page from previous test closes', async ({ page }) => {
    const stoobly = new Stoobly();

    // Simulate the pattern from the test suite: set urls before withPage
    // This should not error even if there was a previous page that's now closed
    stoobly.playwright.urls = [targetUrl];
    stoobly.playwright.withPage(page);
    await stoobly.playwright.applyScenario('test-urls-set');

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
    const stoobly = new Stoobly();
    const url1 = `${SERVER_URL}/headers`;
    const url2 = `${SERVER_URL}/*`;

    stoobly.playwright.withPage(page);
    await stoobly.playwright.applyScenario('test-url-change', { urls: [url1] });

    // Make a request
    let responsePromise = page.waitForResponse(response => {
      return response.url().startsWith(targetUrl) && response.status() === 200;
    });
    await page.goto(targetUrl);
    await responsePromise;

    // Change urls (this triggers internal clear via setter)
    stoobly.playwright.urls = [url2];

    // Change again
    stoobly.playwright.urls = [url1];

    // Verify it still works
    await stoobly.playwright.applyScenario('test-url-change-2');
    responsePromise = page.waitForResponse(response => {
      return response.url().startsWith(targetUrl) && response.status() === 200;
    });
    await page.goto(targetUrl);
    const response = await responsePromise;
    const body = await response.json();
    expect(body[SCENARIO_KEY.toLowerCase()]).toEqual('test-url-change-2');
  });
});


