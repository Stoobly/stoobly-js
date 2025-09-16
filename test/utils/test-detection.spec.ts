import {describe, expect, it, beforeEach, afterEach, jest} from '@jest/globals';

// Import the functions we want to test
import * as testDetection from '../../src/utils/test-detection';

describe('test-detection', () => {
  // Store original implementations
  const originalWindow = (global as any).window;
  const originalGlobalThis = globalThis;

  beforeEach(() => {
    // Clean up any previous mocks
    delete (global as any).window;
    delete (globalThis as any).Cypress;
    delete (globalThis as any).process;
  });

  afterEach(() => {
    // Clean up
    delete (global as any).window;
    delete (globalThis as any).Cypress;
    delete (globalThis as any).process;
  });

  describe('getCypressTestName', () => {
    it('returns null when Cypress is not available', () => {
      expect(testDetection.getCypressTestName()).toBeNull();
    });

    it('returns currentTest.title when available', () => {
      // Create window with Cypress mock
      (global as any).window = {
        Cypress: {
          currentTest: {title: 'test-title'},
        },
      };

      expect(testDetection.getCypressTestName()).toBe('test-title');
    });

    it('falls back to spec.name when currentTest unavailable', () => {
      (global as any).window = {
        Cypress: {
          spec: {name: 'spec-name.cy.js'},
        },
      };

      expect(testDetection.getCypressTestName()).toBe('spec-name.cy.js');
    });

    it('falls back to mocha runner when other methods fail', () => {
      (global as any).window = {
        Cypress: {
          mocha: {
            getRunner: () => ({
              suite: {
                ctx: {
                  currentTest: {title: 'mocha-test'},
                },
              },
            }),
          },
        },
      };

      expect(testDetection.getCypressTestName()).toBe('mocha-test');
    });

    it('handles errors gracefully and returns null', () => {
      (global as any).window = {
        Cypress: {
          mocha: {
            getRunner: () => {
              throw new Error('Test error');
            },
          },
        },
      };

      expect(testDetection.getCypressTestName()).toBeNull();
    });
  });

  describe('getPlaywrightTestName', () => {
    it('returns null (not implemented)', () => {
      expect(testDetection.getPlaywrightTestName()).toBeNull();
    });
  });

  describe('getTestFramework', () => {
    it('detects cypress in window', () => {
      (global as any).window = {Cypress: {}};
      expect(testDetection.getTestFramework()).toBe('cypress');
    });

    it('detects cypress in globalThis', () => {
      // Ensure window is not defined
      delete (global as any).window;
      (globalThis as any).Cypress = {};

      expect(testDetection.getTestFramework()).toBe('cypress');
    });

    it('detects playwright via PWTEST_UNDER_TEST environment variable', () => {
      delete (global as any).window;
      (globalThis as any).process = {
        env: {PWTEST_UNDER_TEST: 'true'},
      };

      expect(testDetection.getTestFramework()).toBe('playwright');
    });

    it('detects playwright via PLAYWRIGHT_TEST_BASE_URL environment variable', () => {
      delete (global as any).window;
      (globalThis as any).process = {
        env: {PLAYWRIGHT_TEST_BASE_URL: 'http://localhost:3000'},
      };

      expect(testDetection.getTestFramework()).toBe('playwright');
    });

    it('detects playwright via PLAYWRIGHT_BROWSERS_PATH environment variable', () => {
      delete (global as any).window;
      (globalThis as any).process = {
        env: {PLAYWRIGHT_BROWSERS_PATH: '/path/to/browsers'},
      };

      expect(testDetection.getTestFramework()).toBe('playwright');
    });

    it('detects playwright via PWTEST_SKIP_TEST_OUTPUT environment variable', () => {
      delete (global as any).window;
      (globalThis as any).process = {
        env: {PWTEST_SKIP_TEST_OUTPUT: 'true'},
      };

      expect(testDetection.getTestFramework()).toBe('playwright');
    });

    it('detects playwright via argv containing playwright', () => {
      delete (global as any).window;
      (globalThis as any).process = {
        env: {},
        argv: ['node', 'playwright', 'test'],
      };

      expect(testDetection.getTestFramework()).toBe('playwright');
    });

    it('detects playwright via argv containing partial playwright match', () => {
      delete (global as any).window;
      (globalThis as any).process = {
        env: {},
        argv: ['node', '/path/to/playwright-test'],
      };

      expect(testDetection.getTestFramework()).toBe('playwright');
    });

    it('returns null when no framework detected', () => {
      delete (global as any).window;
      delete (globalThis as any).Cypress;
      delete (globalThis as any).process;

      expect(testDetection.getTestFramework()).toBeNull();
    });

    it('returns null when process is not available', () => {
      delete (global as any).window;
      (globalThis as any).process = undefined;

      expect(testDetection.getTestFramework()).toBeNull();
    });

    it('handles missing argv gracefully', () => {
      delete (global as any).window;
      (globalThis as any).process = {
        env: {},
        // no argv property
      };

      expect(testDetection.getTestFramework()).toBeNull();
    });
  });

  describe('getTestName', () => {
    it('returns cypress test name when cypress detected', () => {
      (global as any).window = {
        Cypress: {
          currentTest: {title: 'cypress-test'},
        },
      };

      expect(testDetection.getTestName()).toBe('cypress-test');
    });

    it('returns null for playwright (not implemented)', () => {
      delete (global as any).window;
      (globalThis as any).process = {
        env: {PWTEST_UNDER_TEST: 'true'},
      };

      expect(testDetection.getTestName()).toBeNull();
    });

    it('returns null when no framework detected', () => {
      delete (global as any).window;
      delete (globalThis as any).Cypress;
      delete (globalThis as any).process;

      expect(testDetection.getTestName()).toBeNull();
    });
  });
});
