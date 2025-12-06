import { test, expect } from '@playwright/test';

import { SERVER_URL } from '../server-config';
import { INTERCEPT_ACTIVE, PROXY_MODE, RECORD_POLICY, SCENARIO_KEY, SESSION_ID, TEST_TITLE } from "../../src/constants/custom_headers";
import { RecordPolicy } from "../../src/constants/policy";
import Stoobly from '../../src/stoobly';

test.describe('applyScenario', () => {
  const stoobly = new Stoobly();
  const scenarioKey = 'test';
  const sessionId = 'id';
  const targetUrl = `${SERVER_URL}/headers`;

  test.beforeEach(async ({ page }, testInfo) => {
    stoobly.playwright.withPage(page);
    stoobly.playwright.setTestTitle(testInfo.title);
    stoobly.playwright.applyScenario(scenarioKey, { sessionId, urls: [targetUrl] });
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
    // Not using the instance from beforeEach which does have setTestTitle called
    const stoobly = new Stoobly();
    // Don't call setTestTitle - simulate forgetting to set it
    stoobly.playwright.withPage(page);
    stoobly.playwright.applyScenario(scenarioKey, { sessionId, urls: [targetUrl] });

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

  test.beforeEach(async ({ page }, testInfo) => {
    stoobly.playwright.withPage(page);
    stoobly.playwright.setTestTitle(testInfo.title);
  });

  test('should send request with intercept and record headers', async ({ page }) => {
    await stoobly.playwright.startRecord({ urls: [targetUrl], sessionId });

    page.goto(targetUrl);

    const response = await page.waitForResponse(response => {
      return response.url().startsWith(targetUrl) && response.status() === 200;
    });

    const body = await response.json();

    expect(body[INTERCEPT_ACTIVE.toLowerCase()]).toEqual('1');
    expect(body[PROXY_MODE.toLowerCase()]).toEqual('record');
    expect(body[SESSION_ID.toLowerCase()]).toEqual(sessionId);
    expect(body[TEST_TITLE.toLowerCase()]).toEqual('should send request with intercept and record headers');
  });

  test('should send record headers without session id when not provided', async ({ page }) => {
    await stoobly.playwright.startRecord({ urls: [targetUrl] });

    page.goto(targetUrl);

    const response = await page.waitForResponse(response => {
      return response.url().startsWith(targetUrl) && response.status() === 200;
    });

    const body = await response.json();

    expect(body[INTERCEPT_ACTIVE.toLowerCase()]).toEqual('1');
    expect(body[PROXY_MODE.toLowerCase()]).toEqual('record');
    expect(body[SESSION_ID.toLowerCase()]).toBeDefined();
    expect(body[SESSION_ID.toLowerCase()]).not.toEqual(sessionId);
  });

  test('stopRecord should remove intercept headers', async ({ page }) => {
    await stoobly.playwright.startRecord({ urls: [targetUrl], sessionId });

    // First request with recording enabled
    page.goto(targetUrl);
    let response = await page.waitForResponse(response => {
      return response.url().startsWith(targetUrl) && response.status() === 200;
    });
    let body = await response.json();
    expect(body[INTERCEPT_ACTIVE.toLowerCase()]).toEqual('1');
    expect(body[PROXY_MODE.toLowerCase()]).toEqual('record');

    // Stop recording
    stoobly.playwright.stopRecord();

    // Second request should not have intercept headers
    page.goto(targetUrl);
    response = await page.waitForResponse(response => {
      return response.url().startsWith(targetUrl) && response.status() === 200;
    });
    body = await response.json();
    expect(body[INTERCEPT_ACTIVE.toLowerCase()]).toBeUndefined();
    expect(body[PROXY_MODE.toLowerCase()]).toBeUndefined();
  });

  test.describe('record options', () => {
    const targetUrl = `${SERVER_URL}/headers`;

    test('should send record policy header when policy is "all"', async ({ page }, testInfo) => {
      const stoobly = new Stoobly();
      stoobly.playwright.withPage(page);
      stoobly.playwright.setTestTitle(testInfo.title);
      await stoobly.playwright.startRecord({ urls: [targetUrl], policy: RecordPolicy.All });

      page.goto(targetUrl);

      const response = await page.waitForResponse(response => {
        return response.url().startsWith(targetUrl) && response.status() === 200;
      });

      const body = await response.json();
      expect(body[RECORD_POLICY.toLowerCase()]).toEqual(RecordPolicy.All);
      expect(body[INTERCEPT_ACTIVE.toLowerCase()]).toEqual('1');
      expect(body[PROXY_MODE.toLowerCase()]).toEqual('record');
    });

    test('should send record policy header when policy is "found"', async ({ page }, testInfo) => {
      const stoobly = new Stoobly();
      stoobly.playwright.withPage(page);
      stoobly.playwright.setTestTitle(testInfo.title);
      await stoobly.playwright.startRecord({ urls: [targetUrl], policy: RecordPolicy.Found });

      page.goto(targetUrl);

      const response = await page.waitForResponse(response => {
        return response.url().startsWith(targetUrl) && response.status() === 200;
      });

      const body = await response.json();
      expect(body[RECORD_POLICY.toLowerCase()]).toEqual(RecordPolicy.Found);
    });

    test('should send record policy header when policy is "not_found"', async ({ page }, testInfo) => {
      const stoobly = new Stoobly();
      stoobly.playwright.withPage(page);
      stoobly.playwright.setTestTitle(testInfo.title);
      await stoobly.playwright.startRecord({ urls: [targetUrl], policy: RecordPolicy.NotFound });

      page.goto(targetUrl);

      const response = await page.waitForResponse(response => {
        return response.url().startsWith(targetUrl) && response.status() === 200;
      });

      const body = await response.json();
      expect(body[RECORD_POLICY.toLowerCase()]).toEqual(RecordPolicy.NotFound);
    });

    test('should send record policy header when policy is "overwrite"', async ({ page }, testInfo) => {
      const stoobly = new Stoobly();
      stoobly.playwright.withPage(page);
      stoobly.playwright.setTestTitle(testInfo.title);
      await stoobly.playwright.startRecord({ urls: [targetUrl], policy: RecordPolicy.Overwrite });

      page.goto(targetUrl);

      const response = await page.waitForResponse(response => {
        return response.url().startsWith(targetUrl) && response.status() === 200;
      });

      const body = await response.json();
      expect(body[RECORD_POLICY.toLowerCase()]).toEqual(RecordPolicy.Overwrite);
    });

    test('should not send record policy header when policy is not provided', async ({ page }, testInfo) => {
      const stoobly = new Stoobly();
      stoobly.playwright.withPage(page);
      stoobly.playwright.setTestTitle(testInfo.title);
      await stoobly.playwright.startRecord({ urls: [targetUrl] });

      page.goto(targetUrl);

      const response = await page.waitForResponse(response => {
        return response.url().startsWith(targetUrl) && response.status() === 200;
      });

      const body = await response.json();
      expect(body[RECORD_POLICY.toLowerCase()]).toBeUndefined();
      expect(body[INTERCEPT_ACTIVE.toLowerCase()]).toEqual('1');
      expect(body[PROXY_MODE.toLowerCase()]).toEqual('record');
    });
  });
});
