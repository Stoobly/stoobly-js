import { test, expect } from '@playwright/test';

import { SERVER_URL } from '../server-config';
import { SCENARIO_KEY, SESSION_ID, TEST_TITLE } from "../../src/constants/custom_headers";
import Stoobly from '../../src/stoobly';

test.describe('applyScenario', () => {
  const stoobly = new Stoobly();
  const scenarioKey = 'test';
  const sessionId = 'id';
  const targetUrl = `${SERVER_URL}/headers`;

  test.beforeEach(async ({ page }, testInfo) => {
    stoobly.playwright.setTestTitle(testInfo.title);
    stoobly.playwright.applyScenario(page, scenarioKey, { sessionId, urls: [targetUrl] });
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
    stoobly.playwright.applyScenario(page, scenarioKey, { sessionId, urls: [targetUrl] });

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
