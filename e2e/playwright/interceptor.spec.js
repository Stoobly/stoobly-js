import { test, expect } from '@playwright/test';

import { SERVER_URL } from '../server-config';
import { SCENARIO_KEY, SESSION_ID } from "../../src/constants/custom_headers";
import Stoobly from '../../src/stoobly';

test.describe('applyScenario', () => {
  const scenarioKey = 'test';
  const sessionId = 'id';
  const targetUrl = `${SERVER_URL}/headers`;

  test.beforeEach(async ({ page }) => {
    const stoobly = new Stoobly();
    stoobly.playwright.applyScenario(page, scenarioKey, { sessionId, urls: [targetUrl] });
  });

  test('should send request with X-Stoobly-Scenario-Key header', async ({ page }) => {
    page.goto(targetUrl);

    // Wait for the specific response by URL or predicate
    const response = await page.waitForResponse(response => {
      return response.url().startsWith(targetUrl) && response.status() === 200;
    });

    const body = await response.json();

    expect(body[SCENARIO_KEY.toLowerCase()]).toEqual(scenarioKey);
    expect(body[SESSION_ID.toLowerCase()]).toEqual(sessionId);
  });
});