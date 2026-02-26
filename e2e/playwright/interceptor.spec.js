import { test, expect } from '@playwright/test';

import { MATCH_RULES, PROXY_MODE, RECORD_ORDER, RECORD_POLICY, RECORD_STRATEGY, REWRITE_RULES, SCENARIO_KEY, SCENARIO_NAME, SESSION_ID, TEST_TITLE, RecordOrder, RecordPolicy, RecordStrategy } from "../../dist/esm/constants.js";
import Stoobly from '../../dist/esm/stoobly.js';
import { SERVER_URL } from '../server-config';

const scenarioKey = 'test';
const targetUrl = `${SERVER_URL}/headers`;
const matchRules = [{ modes: ['replay'], components: 'Header' }];
const rewriteRules = [{ urlRules: [{ path: '/new-path' }] }];

const stoobly = new Stoobly();
const interceptor = stoobly.playwrightInterceptor({
  urls: [{ pattern: targetUrl, matchRules, rewriteRules }],
  record: {
    order: RecordOrder.Overwrite,
    policy: RecordPolicy.All,
    strategy: RecordStrategy.Full,
  },
  scenarioKey,
});

test.describe('initial interceptor options', () => {

  test.beforeEach(async ({ page }, testInfo) => {
    await interceptor.withPage(page).apply();
    interceptor.withTestTitle(testInfo.title);
  });

  test('should send headers', async ({ page }, testInfo) => {
    page.goto(targetUrl);

    // Wait for the specific response by URL or predicate
    const response = await page.waitForResponse(response => {
      return response.url().startsWith(targetUrl) && response.status() === 200;
    });

    const body = await response.json();

    expect(body[SCENARIO_KEY.toLowerCase()]).toEqual(scenarioKey);
    expect(body[TEST_TITLE.toLowerCase()]).toEqual(testInfo.title);
    expect(body[SESSION_ID.toLowerCase()]).toBeDefined();
    expect(body[RECORD_ORDER.toLowerCase()]).toEqual(RecordOrder.Overwrite);
    expect(body[RECORD_POLICY.toLowerCase()]).toEqual(RecordPolicy.All);
    expect(body[RECORD_STRATEGY.toLowerCase()]).toEqual(RecordStrategy.Full);

    // matchRules: base64-encoded JSON
    const matchRulesEncoded = body[MATCH_RULES.toLowerCase()];
    expect(matchRulesEncoded).toBeDefined();
    expect(JSON.parse(Buffer.from(matchRulesEncoded, 'base64').toString('utf-8'))).toEqual(matchRules);

    // rewriteRules: base64-encoded JSON (serialized with url_rules, parameter_rules in snake_case)
    const rewriteRulesEncoded = body[REWRITE_RULES.toLowerCase()];
    expect(rewriteRulesEncoded).toBeDefined();
    expect(JSON.parse(Buffer.from(rewriteRulesEncoded, 'base64').toString('utf-8'))).toEqual([{ url_rules: [{ path: '/new-path' }] }]);
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
    test('should set Stoobly headers when test title is not set', async ({ page }, testInfo) => {
      interceptor.withTestTitle(undefined);

      page.goto(targetUrl);

      // Wait for the specific response by URL or predicate
      const response = await page.waitForResponse(response => {
        return response.url().startsWith(targetUrl) && response.status() === 200;
      });

      const body = await response.json();

      expect(body[SCENARIO_KEY.toLowerCase()]).toEqual(scenarioKey);
      // Should not have test title header when not set
      expect(body[TEST_TITLE.toLowerCase()]).toBeUndefined();
    });
  });
});

test.describe('Apply scenario with name', () => {
  const scenarioName = 'test-scenario-name';
  const sessionId = 'id';

  test.beforeEach(async ({ page }, testInfo) => {
    await interceptor.withPage(page).apply();
    interceptor.withTestTitle(testInfo.title);
  });

  test('should send request with scenario name header', async ({ page }, testInfo) => {
    interceptor.withScenarioKey(undefined); // Clear scenario key when using scenario name
    interceptor.withScenarioName(scenarioName);
    interceptor.withSessionId(sessionId);

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

test.describe('applyRecord', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    await interceptor.withPage(page).applyRecord();
    interceptor.withTestTitle(testInfo.title);
  });

  test('should send request with intercept and record headers', async ({ page }) => {
    page.goto(targetUrl);

    const response = await page.waitForResponse(response => {
      return response.url().startsWith(targetUrl) && response.status() === 200;
    });

    const body = await response.json();

    expect(body[PROXY_MODE.toLowerCase()]).toEqual('record');
    expect(body[TEST_TITLE.toLowerCase()]).toEqual('should send request with intercept and record headers');
  });

  test.describe('clearRecord', () => {
    test.beforeEach(async ({ page }, testInfo) => {
      await interceptor.withPage(page).applyRecord();
      interceptor.withTestTitle(testInfo.title);
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
      await interceptor.clearRecord();

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
      await interceptor.withPage(page).applyRecord();
      interceptor.withTestTitle(testInfo.title);
    });

    test('should send record policy header when policy is "all"', async ({ page }, testInfo) => {
      interceptor.withRecordPolicy(RecordPolicy.All);
      page.goto(targetUrl);

      const response = await page.waitForResponse(response => {
        return response.url().startsWith(targetUrl) && response.status() === 200;
      });

      const body = await response.json();
      expect(body[RECORD_POLICY.toLowerCase()]).toEqual(RecordPolicy.All);
    });

    test('should send record policy header when policy is "found"', async ({ page }, testInfo) => {
      interceptor.withRecordPolicy(RecordPolicy.Found);

      page.goto(targetUrl);

      const response = await page.waitForResponse(response => {
        return response.url().startsWith(targetUrl) && response.status() === 200;
      });

      const body = await response.json();
      expect(body[RECORD_POLICY.toLowerCase()]).toEqual(RecordPolicy.Found);
    });

    test('should send record policy header when policy is "not_found"', async ({ page }, testInfo) => {
      interceptor.withRecordPolicy(RecordPolicy.NotFound);

      page.goto(targetUrl);

      const response = await page.waitForResponse(response => {
        return response.url().startsWith(targetUrl) && response.status() === 200;
      });

      const body = await response.json();
      expect(body[RECORD_POLICY.toLowerCase()]).toEqual(RecordPolicy.NotFound);
    });

    test('should send record order header when order is "overwrite"', async ({ page }, testInfo) => {
      interceptor.withRecordOrder(RecordOrder.Overwrite);

      page.goto(targetUrl);

      const response = await page.waitForResponse(response => {
        return response.url().startsWith(targetUrl) && response.status() === 200;
      });

      const body = await response.json();
      expect(body[RECORD_ORDER.toLowerCase()]).toEqual(RecordOrder.Overwrite);
    });

    test('should only send record order "overwrite" header once', async ({ page }, testInfo) => {
      interceptor.withRecordOrder(RecordOrder.Overwrite);

      page.goto(targetUrl);
      
      const response = await page.waitForResponse(response => {
        return response.url().startsWith(targetUrl) && response.status() === 200;
      });

      const body = await response.json();
      expect(body[RECORD_ORDER.toLowerCase()]).toEqual(RecordOrder.Overwrite);

      page.goto(targetUrl);

      const response2 = await page.waitForResponse(response => {
        return response.url().startsWith(targetUrl) && response.status() === 200;
      });

      const body2 = await response2.json();
      expect(body2[RECORD_ORDER.toLowerCase()]).toBeUndefined();
    });

    test('should not send record policy header when policy is not provided', async ({ page }, testInfo) => {
      interceptor.withRecordPolicy(undefined);

      page.goto(targetUrl);

      const response = await page.waitForResponse(response => {
        return response.url().startsWith(targetUrl) && response.status() === 200;
      });

      const body = await response.json();
      expect(body[RECORD_POLICY.toLowerCase()]).toBeUndefined();
    });

    test('should send record strategy header when strategy is "full"', async ({ page }) => {
      interceptor.withRecordStrategy(RecordStrategy.Full);

      page.goto(targetUrl);

      const response = await page.waitForResponse(response => {
        return response.url().startsWith(targetUrl) && response.status() === 200;
      });

      const body = await response.json();
      expect(body[RECORD_STRATEGY.toLowerCase()]).toEqual(RecordStrategy.Full);
    });

    test('should send record strategy header when strategy is "minimal"', async ({ page }) => {
      interceptor.withRecordStrategy(RecordStrategy.Minimal);

      page.goto(targetUrl);

      const response = await page.waitForResponse(response => {
        return response.url().startsWith(targetUrl) && response.status() === 200;
      });

      const body = await response.json();
      expect(body[RECORD_STRATEGY.toLowerCase()]).toEqual(RecordStrategy.Minimal);
    });

    test('should not send record strategy header when strategy is not provided', async ({ page }) => {
      interceptor.withRecordStrategy(undefined);

      page.goto(targetUrl);

      const response = await page.waitForResponse(response => {
        return response.url().startsWith(targetUrl) && response.status() === 200;
      });

      const body = await response.json();
      expect(body[RECORD_STRATEGY.toLowerCase()]).toBeUndefined();
    });
  });
});

test.describe('stop', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    await interceptor.withPage(page).apply();
    interceptor.withTestTitle(testInfo.title);
  });

  test('should remove handlers when explicitly called on active page', async ({ page }) => {
    const scenarioKey = 'test-clear';
    const sessionId = 'clear-session';

    interceptor.withScenarioKey(scenarioKey);
    interceptor.withSessionId(sessionId);

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

  test('should handle multiple stops without error', async ({ page }) => {
    await interceptor.clear();
    interceptor.withScenarioKey('test-multi-clear');
    await interceptor.apply();

    // First stop
    await interceptor.clear();

    // Second stop should be safe (no-op)
    await interceptor.clear();

    // Third stop
    await interceptor.clear();

    // All clears completed without throwing errors
    expect(true).toBe(true);
  });
});


test.describe('urls', () => {
  test.beforeEach(async ({ page }) => {
    interceptor.withPage(page);
    await interceptor.apply();
  });
  
  test('should apply new urls when changing urls', async ({ page }) => {
    const scenarioKey = 'test-url-change';
    interceptor.withScenarioKey(scenarioKey);

    page.goto(targetUrl);

    // Wait for the specific response by URL or predicate
    const response = await page.waitForResponse(response => {
      return response.url().startsWith(targetUrl) && response.status() === 200;
    });

    const body = await response.json();
    expect(body[SCENARIO_KEY.toLowerCase()]).toEqual(scenarioKey);

    await interceptor.apply({ urls: [{ pattern: `${SERVER_URL}/different` }] });

    page.goto(targetUrl);

    const response2 = await page.waitForResponse(response => {
      return response.url().startsWith(targetUrl) && response.status() === 200;
    });
    const body2 = await response2.json();
    expect(body2[SCENARIO_KEY.toLowerCase()]).toBeUndefined();
  });
})

test.describe('Context routing', () => {
  const contextInterceptor = stoobly.playwrightInterceptor({ 
    urls: [{ pattern: targetUrl }],
    scenarioKey,
  });

  test.beforeEach(async ({}, testInfo) => {
    await contextInterceptor.clear();
    contextInterceptor.withTestTitle(testInfo.title);
  });

  test('should intercept with context-only routing', async ({ context }, testInfo) => {
    await contextInterceptor.withContext(context).apply();
    
    const page = await context.newPage();
    page.goto(targetUrl);

    const response = await page.waitForResponse(response => {
      return response.url().startsWith(targetUrl) && response.status() === 200;
    });

    const body = await response.json();
    expect(body[SCENARIO_KEY.toLowerCase()]).toEqual(scenarioKey);
    expect(body[TEST_TITLE.toLowerCase()]).toEqual(testInfo.title);
    expect(body[SESSION_ID.toLowerCase()]).toBeDefined();
    
    await page.close();
  });

  test('should intercept with page-only routing', async ({ page }, testInfo) => {
    await contextInterceptor.withPage(page).apply();
    
    page.goto(targetUrl);

    const response = await page.waitForResponse(response => {
      return response.url().startsWith(targetUrl) && response.status() === 200;
    });

    const body = await response.json();
    expect(body[SCENARIO_KEY.toLowerCase()]).toEqual(scenarioKey);
    expect(body[TEST_TITLE.toLowerCase()]).toEqual(testInfo.title);
    expect(body[SESSION_ID.toLowerCase()]).toBeDefined();
  });

  test('should NOT intercept new pages with page-only routing', async ({ context, page }, testInfo) => {
    await contextInterceptor.withPage(page).apply();
    
    // Original page should be intercepted
    page.goto(targetUrl);
    const response1 = await page.waitForResponse(response => {
      return response.url().startsWith(targetUrl) && response.status() === 200;
    });
    const body1 = await response1.json();
    expect(body1[SCENARIO_KEY.toLowerCase()]).toEqual(scenarioKey);
    
    // New page should NOT be intercepted (no context routing)
    const page2 = await context.newPage();
    page2.goto(targetUrl);
    const response2 = await page2.waitForResponse(response => {
      return response.url().startsWith(targetUrl) && response.status() === 200;
    });
    const body2 = await response2.json();
    expect(body2[SCENARIO_KEY.toLowerCase()]).toBeUndefined();
    
    await page2.close();
  });

  test('should intercept new pages with context routing', async ({ context }, testInfo) => {
    await contextInterceptor.withContext(context).apply();
    
    // Create a new page in the same context
    const page2 = await context.newPage();
    page2.goto(targetUrl);

    // Wait for response from the second page
    const response = await page2.waitForResponse(response => {
      return response.url().startsWith(targetUrl) && response.status() === 200;
    });

    const body = await response.json();

    // Should have interceptor headers even though it's a different page
    expect(body[SCENARIO_KEY.toLowerCase()]).toEqual(scenarioKey);
    expect(body[SESSION_ID.toLowerCase()]).toBeDefined();

    await page2.close();
  });

  test('should intercept both original and new pages with dual routing', async ({ context, page }, testInfo) => {
    await contextInterceptor.withContext(context).withPage(page).apply();
    
    // Both page and context routing should be active
    page.goto(targetUrl);

    const response1 = await page.waitForResponse(response => {
      return response.url().startsWith(targetUrl) && response.status() === 200;
    });

    const body1 = await response1.json();
    expect(body1[SCENARIO_KEY.toLowerCase()]).toEqual(scenarioKey);

    // Create a new page - should also be intercepted via context routing
    const page2 = await context.newPage();
    page2.goto(targetUrl);

    const response2 = await page2.waitForResponse(response => {
      return response.url().startsWith(targetUrl) && response.status() === 200;
    });

    const body2 = await response2.json();
    expect(body2[SCENARIO_KEY.toLowerCase()]).toEqual(scenarioKey);

    await page2.close();
  });

  test('should clear both page and context routes', async ({ context, page }, testInfo) => {
    await contextInterceptor.withContext(context).withPage(page).apply();
    
    // Verify routes are active
    page.goto(targetUrl);
    const response1 = await page.waitForResponse(response => {
      return response.url().startsWith(targetUrl) && response.status() === 200;
    });
    const body1 = await response1.json();
    expect(body1[SCENARIO_KEY.toLowerCase()]).toEqual(scenarioKey);

    // Clear routes
    await contextInterceptor.clear();

    // Verify routes are removed from original page
    page.goto(targetUrl);
    const response2 = await page.waitForResponse(response => {
      return response.url().startsWith(targetUrl) && response.status() === 200;
    });
    const body2 = await response2.json();
    expect(body2[SCENARIO_KEY.toLowerCase()]).toBeUndefined();

    // Verify routes are removed from new pages in context
    const page2 = await context.newPage();
    page2.goto(targetUrl);
    const response3 = await page2.waitForResponse(response => {
      return response.url().startsWith(targetUrl) && response.status() === 200;
    });
    const body3 = await response3.json();
    expect(body3[SCENARIO_KEY.toLowerCase()]).toBeUndefined();

    await page2.close();
  });
})

test.describe('Record order overwrite - per URL pattern tracking', () => {
  const url1 = `${SERVER_URL}/headers`;
  const url2 = `${SERVER_URL}/api/data`;
  
  const overwriteInterceptor = stoobly.playwrightInterceptor({ 
    urls: [{ pattern: url1 }, { pattern: url2 }],
    record: {
      order: RecordOrder.Overwrite,
      policy: RecordPolicy.All,
      strategy: RecordStrategy.Full,
    },
    scenarioKey: 'overwrite-test',
  });

  test('should send overwrite headers only once per URL pattern', async ({ page }) => {
    await overwriteInterceptor.withPage(page).applyRecord();

    // First request to url1 - should include RECORD_ORDER and OVERWRITE_ID
    const response1Promise = page.waitForResponse(response => {
      return response.url().startsWith(url1) && response.status() === 200;
    });
    await page.goto(url1);
    const response1 = await response1Promise;
    const body1 = await response1.json();
    
    expect(body1[RECORD_ORDER.toLowerCase()]).toEqual(RecordOrder.Overwrite);
    expect(body1['x-stoobly-overwrite-id']).toBeDefined();
    const overwriteId = body1['x-stoobly-overwrite-id'];

    // Second request to url1 - should NOT include RECORD_ORDER or OVERWRITE_ID
    const response2Promise = page.waitForResponse(response => {
      return response.url().startsWith(url1) && response.status() === 200;
    });
    await page.goto(url1);
    const response2 = await response2Promise;
    const body2 = await response2.json();
    
    expect(body2[RECORD_ORDER.toLowerCase()]).toBeUndefined();
    expect(body2['x-stoobly-overwrite-id']).toBeUndefined();

    // First request to url2 - should include RECORD_ORDER and OVERWRITE_ID (same ID)
    const response3Promise = page.waitForResponse(response => {
      return response.url().startsWith(url2) && response.status() === 200;
    });
    await page.goto(url2);
    const response3 = await response3Promise;
    const body3 = await response3.json();
    
    expect(body3[RECORD_ORDER.toLowerCase()]).toEqual(RecordOrder.Overwrite);
    expect(body3['x-stoobly-overwrite-id']).toEqual(overwriteId); // Same ID across patterns
    
    // Second request to url2 - should NOT include RECORD_ORDER or OVERWRITE_ID
    const response4Promise = page.waitForResponse(response => {
      return response.url().startsWith(url2) && response.status() === 200;
    });
    await page.goto(url2);
    const response4 = await response4Promise;
    const body4 = await response4.json();
    
    expect(body4[RECORD_ORDER.toLowerCase()]).toBeUndefined();
    expect(body4['x-stoobly-overwrite-id']).toBeUndefined();

    await overwriteInterceptor.clear();
  });

  test('should reset URL tracking when apply() is called again', async ({ page }) => {
    // First apply
    await overwriteInterceptor.withPage(page).applyRecord();

    // First request should have overwrite headers
    const response1Promise = page.waitForResponse(response => {
      return response.url().startsWith(url1) && response.status() === 200;
    });
    await page.goto(url1);
    const response1 = await response1Promise;
    const body1 = await response1.json();
    
    expect(body1[RECORD_ORDER.toLowerCase()]).toEqual(RecordOrder.Overwrite);
    expect(body1['x-stoobly-overwrite-id']).toBeDefined();

    // Second request should NOT have overwrite headers
    const response2Promise = page.waitForResponse(response => {
      return response.url().startsWith(url1) && response.status() === 200;
    });
    await page.goto(url1);
    const response2 = await response2Promise;
    const body2 = await response2.json();
    
    expect(body2[RECORD_ORDER.toLowerCase()]).toBeUndefined();
    expect(body2['x-stoobly-overwrite-id']).toBeUndefined();

    // Apply again - should reset tracking
    await overwriteInterceptor.withPage(page).applyRecord();

    // First request after reapply should have overwrite headers again
    const response3Promise = page.waitForResponse(response => {
      return response.url().startsWith(url1) && response.status() === 200;
    });
    await page.goto(url1);
    const response3 = await response3Promise;
    const body3 = await response3.json();
    
    expect(body3[RECORD_ORDER.toLowerCase()]).toEqual(RecordOrder.Overwrite);
    expect(body3['x-stoobly-overwrite-id']).toBeDefined();

    await overwriteInterceptor.clear();
  });
})
