import { test, expect } from './fixtures/stoobly';

import { 
  MATCH_RULES,
  PROXY_MODE,
  RECORD_ORDER,
  RECORD_POLICY,
  RECORD_STRATEGY,
  REWRITE_RULES,
  SCENARIO_KEY,
  SCENARIO_NAME,
  SESSION_ID,
  TEST_TITLE,
  InterceptMode,
  RecordOrder,
  RecordPolicy,
  RecordStrategy,
} from "../../dist/esm/constants.js";
import { SERVER_URL } from '../server-config';

const scenarioKey = 'test';
const targetUrl = `${SERVER_URL}/headers`;
const matchRules = [{ modes: [InterceptMode.replay], components: 'Header' }];

test.describe('Options', () => {

  test.beforeEach(async ({ page, stooblyInterceptor }, testInfo) => {
    await stooblyInterceptor.enableForPage(page);
    stooblyInterceptor.withTestTitle(testInfo.title);
  });

  test('should send headers', async ({ page }) => {
    page.goto(targetUrl);

    // Wait for the specific response by URL or predicate
    const response = await page.waitForResponse(response => {
      return response.url().startsWith(targetUrl) && response.status() === 200;
    });

    const responseBody = await response.json();

    expect(responseBody[SESSION_ID.toLowerCase()]).toBeDefined();
    expect(responseBody[PROXY_MODE.toLowerCase()]).toBeUndefined();
    expect(responseBody[RECORD_ORDER]).toBeUndefined();
    expect(responseBody[RECORD_POLICY]).toBeUndefined();
    expect(responseBody[RECORD_STRATEGY]).toBeUndefined();
    expect(responseBody[SCENARIO_KEY]).toBeUndefined();
    expect(responseBody[SCENARIO_NAME]).toBeUndefined();

    // matchRules: base64-encoded JSON
    const matchRulesEncoded = responseBody[MATCH_RULES.toLowerCase()];
    expect(matchRulesEncoded).toBeDefined();
    expect(JSON.parse(Buffer.from(matchRulesEncoded, 'base64').toString('utf-8'))).toEqual(matchRules);

    // rewriteRules: base64-encoded JSON (serialized with url_rules, parameter_rules in snake_case)
    const rewriteRulesEncoded = responseBody[REWRITE_RULES.toLowerCase()];
    expect(rewriteRulesEncoded).toBeDefined();
    expect(JSON.parse(Buffer.from(rewriteRulesEncoded, 'base64').toString('utf-8'))).toEqual([{ url_rules: [{ path: '/new-path' }] }]);
  });

  test('does not require enable after changing settings', async ({ page, stooblyInterceptor }) => {
    stooblyInterceptor.withScenarioName('test');

    page.goto(targetUrl);

    const response = await page.waitForResponse(response => {
      return response.url().startsWith(targetUrl) && response.status() === 200;
    });

    const responseBody = await response.json();
    expect(responseBody[SCENARIO_NAME.toLowerCase()]).toEqual('test');
  });

  test('does not preserve setting changes from previous tests', async ({ page }) => {
    page.goto(targetUrl);

    const response = await page.waitForResponse(response => {
      return response.url().startsWith(targetUrl) && response.status() === 200;
    });

    const responseBody = await response.json();
    expect(responseBody[SCENARIO_NAME.toLowerCase()]).toBeUndefined();
  });

  test.describe('withDefaultSettings', () => {
    test('resets settings changes', async ({ page, stooblyInterceptor }) => {
      stooblyInterceptor.withScenarioName('test');
      stooblyInterceptor.withDefaultSettings();

      page.goto(targetUrl);

      const response = await page.waitForResponse(response => {
        return response.url().startsWith(targetUrl) && response.status() === 200;
      });

      const responseBody = await response.json();
      expect(responseBody[SCENARIO_NAME.toLowerCase()]).toBeUndefined();
    });
  });
});

test.describe('Test title', () => {
  test.beforeEach(async ({ page, stooblyInterceptor }, testInfo) => {
    await stooblyInterceptor.withTestTitle(testInfo.title).enableForPage(page);
  });

  test('should send headers', async ({ page }) => {
    page.goto(targetUrl);

    const response = await page.waitForResponse(response => {
      return response.url().startsWith(targetUrl) && response.status() === 200;
    });

    const responseBody = await response.json();
    expect(responseBody[TEST_TITLE.toLowerCase()]).toEqual('should send headers');
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

  test('should not send test title header when not set', async ({ page, stooblyInterceptor }, testInfo) => {
    stooblyInterceptor.withTestTitle();

    page.goto(targetUrl);

    // Wait for the specific response by URL or predicate
    const response = await page.waitForResponse(response => {
      return response.url().startsWith(targetUrl) && response.status() === 200;
    });

    const body = await response.json();

    // Should not have test title header when not set
    expect(body[TEST_TITLE.toLowerCase()]).toBeUndefined();
  });
});

test.describe('Scenario', () => {
  test.describe('withScenarioNameFromTest', () => {
    test.beforeEach(async ({ page, stooblyInterceptor }, testInfo) => {
      await stooblyInterceptor.enableForPage(page);
      stooblyInterceptor.withScenarioNameFromTest(testInfo);
    });

    test('should send request with scenario name header', async ({ page }, testInfo) => {
      page.goto(targetUrl);

      // Wait for the specific response by URL or predicate
      const response = await page.waitForResponse(response => {
        return response.url().startsWith(targetUrl) && response.status() === 200;
      });

      const body = await response.json();

      const scenarioName = testInfo.titlePath.join(' > ');
      expect(body[SCENARIO_NAME.toLowerCase()]).toEqual(scenarioName);
    });
  });

  test.describe('withScenarioKey', () => {
    test.beforeEach(async ({ page, stooblyInterceptor }) => {
      await stooblyInterceptor.enableForPage(page, { scenarioKey });
    });

    test('should send request with scenario key header', async ({ page }) => {
      page.goto(targetUrl);

      const response = await page.waitForResponse(response => {
        return response.url().startsWith(targetUrl) && response.status() === 200;
      });

      const body = await response.json();
      expect(body[SCENARIO_KEY.toLowerCase()]).toEqual(scenarioKey);
    });
  });
});

test.describe('wihInterceptModeRecord', () => {
  test.beforeEach(async ({ page, stooblyInterceptor }) => {
    await stooblyInterceptor.enableForPage(page, { 
      mode: InterceptMode.record
    });
  });

  test('should send record headers', async ({ page }) => {
    page.goto(targetUrl);

    const response = await page.waitForResponse(response => {
      return response.url().startsWith(targetUrl) && response.status() === 200;
    });

    const body = await response.json();
    expect(body[PROXY_MODE.toLowerCase()]).toEqual(InterceptMode.record);
    expect(body[RECORD_ORDER.toLowerCase()]).toEqual(RecordOrder.Overwrite);
    expect(body[RECORD_POLICY.toLowerCase()]).toEqual(RecordPolicy.All);
    expect(body[RECORD_STRATEGY.toLowerCase()]).toEqual(RecordStrategy.Full);
  });

  test.describe('Without', () => {
    test('should remove intercept headers', async ({ page, stooblyInterceptor }) => {
      stooblyInterceptor.withInterceptMode();

      page.goto(targetUrl);

      const response = await page.waitForResponse(response => {
        return response.url().startsWith(targetUrl) && response.status() === 200;
      });
      const body = await response.json();

      expect(body[PROXY_MODE.toLowerCase()]).toBeUndefined();
    });
  });
});

test.describe('Record settings', () => {
  test.beforeEach(async ({ page, stooblyInterceptor }) => {
    await stooblyInterceptor.enableForPage(page, { 
      mode: InterceptMode.record
    });
  });

  test('should send record policy header when policy is "all"', async ({ page, stooblyInterceptor }) => {
    stooblyInterceptor.withRecordPolicy(RecordPolicy.All);
    page.goto(targetUrl);

    const response = await page.waitForResponse(response => {
      return response.url().startsWith(targetUrl) && response.status() === 200;
    });

    const body = await response.json();
    expect(body[RECORD_POLICY.toLowerCase()]).toEqual(RecordPolicy.All);
  });

  test('should send record policy header when policy is "found"', async ({ page, stooblyInterceptor }) => {
    stooblyInterceptor.withRecordPolicy(RecordPolicy.Found);

    page.goto(targetUrl);

    const response = await page.waitForResponse(response => {
      return response.url().startsWith(targetUrl) && response.status() === 200;
    });

    const body = await response.json();
    expect(body[RECORD_POLICY.toLowerCase()]).toEqual(RecordPolicy.Found);
  });

  test('should send record policy header when policy is "not_found"', async ({ page, stooblyInterceptor }) => {
    stooblyInterceptor.withRecordPolicy(RecordPolicy.NotFound);

    page.goto(targetUrl);

    const response = await page.waitForResponse(response => {
      return response.url().startsWith(targetUrl) && response.status() === 200;
    });

    const body = await response.json();
    expect(body[RECORD_POLICY.toLowerCase()]).toEqual(RecordPolicy.NotFound);
  });

  test('should send record order header when order is "overwrite"', async ({ page, stooblyInterceptor }) => {
    stooblyInterceptor.withRecordOrder(RecordOrder.Overwrite);

    page.goto(targetUrl);

    const response = await page.waitForResponse(response => {
      return response.url().startsWith(targetUrl) && response.status() === 200;
    });

    const body = await response.json();
    expect(body[RECORD_ORDER.toLowerCase()]).toEqual(RecordOrder.Overwrite);
  });

  test('should only send record order "overwrite" header once', async ({ page, stooblyInterceptor }) => {
    stooblyInterceptor.withRecordOrder(RecordOrder.Overwrite);

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

  test('should not send record policy header when policy is not provided', async ({ page, stooblyInterceptor }) => {
    stooblyInterceptor.withRecordPolicy(undefined);

    page.goto(targetUrl);

    const response = await page.waitForResponse(response => {
      return response.url().startsWith(targetUrl) && response.status() === 200;
    });

    const body = await response.json();
    expect(body[RECORD_POLICY.toLowerCase()]).toBeUndefined();
  });

  test('should send record strategy header when strategy is "full"', async ({ page, stooblyInterceptor }) => {
    stooblyInterceptor.withRecordStrategy(RecordStrategy.Full);

    page.goto(targetUrl);

    const response = await page.waitForResponse(response => {
      return response.url().startsWith(targetUrl) && response.status() === 200;
    });

    const body = await response.json();
    expect(body[RECORD_STRATEGY.toLowerCase()]).toEqual(RecordStrategy.Full);
  });

  test('should send record strategy header when strategy is "minimal"', async ({ page, stooblyInterceptor }) => {
    stooblyInterceptor.withRecordStrategy(RecordStrategy.Minimal);

    page.goto(targetUrl);

    const response = await page.waitForResponse(response => {
      return response.url().startsWith(targetUrl) && response.status() === 200;
    });

    const body = await response.json();
    expect(body[RECORD_STRATEGY.toLowerCase()]).toEqual(RecordStrategy.Minimal);
  });

  test('should not send record strategy header when strategy is not provided', async ({ page, stooblyInterceptor }) => {
    stooblyInterceptor.withRecordStrategy(undefined);

    page.goto(targetUrl);

    const response = await page.waitForResponse(response => {
      return response.url().startsWith(targetUrl) && response.status() === 200;
    });

    const body = await response.json();
    expect(body[RECORD_STRATEGY.toLowerCase()]).toBeUndefined();
  });

  test.describe('Record order overwrite', () => {
    const url1 = `${SERVER_URL}/headers`;
    const url2 = `${SERVER_URL}/api/data`;

    test.beforeEach(async ({ page, stooblyInterceptor }) => {
      await stooblyInterceptor.enableForPage(page, {
        mode: InterceptMode.record,
        urls: [{ pattern: url1 }, { pattern: url2 }],
        record: {
          order: RecordOrder.Overwrite,
          policy: RecordPolicy.All,
          strategy: RecordStrategy.Full,
        },
      });
    });

    test('should send overwrite headers only once per URL pattern', async ({ page }) => {
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
    });

    test('should reset URL tracking when enableForPage() is called again', async ({ page, stooblyInterceptor }) => {
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
      await stooblyInterceptor.enableForPage(page, {
        mode: InterceptMode.record,
        urls: [{ pattern: url1 }, { pattern: url2 }],
        record: {
          order: RecordOrder.Overwrite,
          policy: RecordPolicy.All,
          strategy: RecordStrategy.Full,
        },
      });

      // First request after reapply should have overwrite headers again
      const response3Promise = page.waitForResponse(response => {
        return response.url().startsWith(url1) && response.status() === 200;
      });
      await page.goto(url1);
      const response3 = await response3Promise;
      const body3 = await response3.json();
      
      expect(body3[RECORD_ORDER.toLowerCase()]).toEqual(RecordOrder.Overwrite);
      expect(body3['x-stoobly-overwrite-id']).toBeDefined();
    });
  });
});

test.describe('clear', () => {
  test.beforeEach(async ({ page, stooblyInterceptor }) => {
    await stooblyInterceptor.enableForPage(page, { scenarioKey });
  });

  test('should remove handlers', async ({ page, stooblyInterceptor }) => {
    const scenarioKey = 'test-clear';
    const sessionId = 'clear-session';

    stooblyInterceptor.withScenarioKey(scenarioKey);
    stooblyInterceptor.withSessionId(sessionId);

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
    await stooblyInterceptor.clear();

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

  test('should handle multiple clears without error', async ({ page, stooblyInterceptor }) => {
    await stooblyInterceptor.clear();
    stooblyInterceptor.withScenarioKey('test-multi-clear');
    await stooblyInterceptor.enableForPage(page, { scenarioKey });

    // First stop
    await stooblyInterceptor.clear();

    // Second stop should be safe (no-op)
    await stooblyInterceptor.clear();

    // Third stop
    await stooblyInterceptor.clear();

    // All clears completed without throwing errors
    expect(true).toBe(true);
  });
});

test.describe('Urls', () => {
  test.beforeEach(async ({ page, stooblyInterceptor }) => {
    stooblyInterceptor.withPage(page);
    await stooblyInterceptor.enableForPage(page);
  });
  
  test('should apply new urls when changing urls', async ({ page, stooblyInterceptor }) => {
    const scenarioKey = 'test-url-change';
    stooblyInterceptor.withScenarioKey(scenarioKey);

    page.goto(targetUrl);

    // Wait for the specific response by URL or predicate
    const response = await page.waitForResponse(response => {
      return response.url().startsWith(targetUrl) && response.status() === 200;
    });

    const body = await response.json();
    expect(body[SCENARIO_KEY.toLowerCase()]).toEqual(scenarioKey);

    await stooblyInterceptor.enableForPage(page, { urls: [{ pattern: `${SERVER_URL}/different` }] });

    page.goto(targetUrl);

    const response2 = await page.waitForResponse(response => {
      return response.url().startsWith(targetUrl) && response.status() === 200;
    });
    const body2 = await response2.json();
    expect(body2[SCENARIO_KEY.toLowerCase()]).toBeUndefined();
  });
})

test.describe('Context routing', () => {
  test.beforeEach(async ({ stooblyInterceptor }, testInfo) => {
    stooblyInterceptor
      .withInterceptMode(InterceptMode.replay) // Ensure stable assertions regardless of env
      .withScenarioKey(scenarioKey)
      .withTestTitle(testInfo.title);
  });

  test('should intercept with context-only routing', async ({ context, stooblyInterceptor }, testInfo) => {
    await stooblyInterceptor.enableForContext(context);
    
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

  test('should intercept with page-only routing', async ({ page, stooblyInterceptor }, testInfo) => {
    await stooblyInterceptor.enableForPage(page);
    
    page.goto(targetUrl);

    const response = await page.waitForResponse(response => {
      return response.url().startsWith(targetUrl) && response.status() === 200;
    });

    const body = await response.json();
    expect(body[SCENARIO_KEY.toLowerCase()]).toEqual(scenarioKey);
    expect(body[TEST_TITLE.toLowerCase()]).toEqual(testInfo.title);
    expect(body[SESSION_ID.toLowerCase()]).toBeDefined();
  });

  test('should NOT intercept new pages with page-only routing', async ({ context, page, stooblyInterceptor }, testInfo) => {
    await stooblyInterceptor.enableForPage(page);
    
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

  test('should intercept new pages with context routing', async ({ context, stooblyInterceptor }, testInfo) => {
    await stooblyInterceptor.enableForContext(context);
    
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

  test('should intercept both original and new pages with dual routing', async ({ context, page, stooblyInterceptor }) => {
    await stooblyInterceptor.enableForContext(context);
    await stooblyInterceptor.enableForPage(page);
    
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

  test('should clear both page and context routes', async ({ context, page, stooblyInterceptor }, testInfo) => {
    await stooblyInterceptor.enableForContext(context);
    await stooblyInterceptor.enableForPage(page);
    
    // Verify routes are active
    page.goto(targetUrl);
    const response1 = await page.waitForResponse(response => {
      return response.url().startsWith(targetUrl) && response.status() === 200;
    });
    const body1 = await response1.json();
    expect(body1[SCENARIO_KEY.toLowerCase()]).toEqual(scenarioKey);

    // Clear routes
    await stooblyInterceptor.clear();

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
