import {describe, expect, it, beforeEach, afterEach} from '@jest/globals';

// Import the functions we want to test
import * as testDetection from '../test-detection';

describe('test-detection', () => {
  const originalProcess = globalThis.process;

  const clearCypress = () => {
    delete (window as any).Cypress;
    delete (globalThis as any).Cypress;
  };

  beforeEach(() => {
    clearCypress();
    (globalThis as any).process = originalProcess;
  });

  afterEach(() => {
    clearCypress();
    (globalThis as any).process = originalProcess;
  });

  describe('getCypressTestTitle', () => {
    it('returns null when Cypress is not available', () => {
      expect(testDetection.getCypressTestTitle()).toBeNull();
    });

    it('returns currentTest.title when available', () => {
      (window as any).Cypress = {
        currentTest: {title: 'test-title'},
      };

      expect(testDetection.getCypressTestTitle()).toBe('test-title');
    });

    it('falls back to spec.name when currentTest unavailable', () => {
      (window as any).Cypress = {
        spec: {name: 'spec-name.cy.js'},
      };

      expect(testDetection.getCypressTestTitle()).toBe('spec-name.cy.js');
    });

    it('falls back to mocha runner when other methods fail', () => {
      (window as any).Cypress = {
        mocha: {
          getRunner: () => ({
            suite: {
              ctx: {
                currentTest: {title: 'mocha-test'},
              },
            },
          }),
        },
      };

      expect(testDetection.getCypressTestTitle()).toBe('mocha-test');
    });

    it('handles errors gracefully and returns null', () => {
      (window as any).Cypress = {
        mocha: {
          getRunner: () => {
            throw new Error('Test error');
          },
        },
      };

      expect(testDetection.getCypressTestTitle()).toBeNull();
    });
  });

  describe('getPlaywrightTestTitle', () => {
    it('returns null (not implemented)', () => {
      expect(testDetection.getPlaywrightTestTitle()).toBeNull();
    });
  });

  describe('getTestFramework', () => {
    it('detects cypress in window', () => {
      (window as any).Cypress = {};
      expect(testDetection.getTestFramework()).toBe('cypress');
    });

    it('detects cypress in globalThis', () => {
      // In jsdom, globalThis === window, so this hits the window branch of
      // getTestFramework() rather than the globalThis fallback. Both paths
      // return 'cypress', so the observable behaviour is correct.
      (globalThis as any).Cypress = {};

      expect(testDetection.getTestFramework()).toBe('cypress');
    });

    it('detects playwright via PWTEST_UNDER_TEST environment variable', () => {
      (globalThis as any).process = {
        env: {PWTEST_UNDER_TEST: 'true'},
      };

      expect(testDetection.getTestFramework()).toBe('playwright');
    });

    it('detects playwright via PLAYWRIGHT_TEST_BASE_URL environment variable', () => {
      (globalThis as any).process = {
        env: {PLAYWRIGHT_TEST_BASE_URL: 'http://localhost:3000'},
      };

      expect(testDetection.getTestFramework()).toBe('playwright');
    });

    it('detects playwright via PLAYWRIGHT_BROWSERS_PATH environment variable', () => {
      (globalThis as any).process = {
        env: {PLAYWRIGHT_BROWSERS_PATH: '/path/to/browsers'},
      };

      expect(testDetection.getTestFramework()).toBe('playwright');
    });

    it('detects playwright via PWTEST_SKIP_TEST_OUTPUT environment variable', () => {
      (globalThis as any).process = {
        env: {PWTEST_SKIP_TEST_OUTPUT: 'true'},
      };

      expect(testDetection.getTestFramework()).toBe('playwright');
    });

    it('detects playwright via argv containing playwright', () => {
      (globalThis as any).process = {
        env: {},
        argv: ['node', 'playwright', 'test'],
      };

      expect(testDetection.getTestFramework()).toBe('playwright');
    });

    it('detects playwright via argv containing partial playwright match', () => {
      (globalThis as any).process = {
        env: {},
        argv: ['node', '/path/to/playwright-test'],
      };

      expect(testDetection.getTestFramework()).toBe('playwright');
    });

    it('returns null when no framework detected', () => {
      delete (globalThis as any).process;

      expect(testDetection.getTestFramework()).toBeNull();
    });

    it('returns null when process is not available', () => {
      (globalThis as any).process = undefined;

      expect(testDetection.getTestFramework()).toBeNull();
    });

    it('handles missing argv gracefully', () => {
      (globalThis as any).process = {
        env: {},
        // no argv property
      };

      expect(testDetection.getTestFramework()).toBeNull();
    });
  });

  describe('getTestTitle', () => {
    it('returns cypress test title when cypress detected', () => {
      (window as any).Cypress = {
        currentTest: {title: 'cypress-test'},
      };

      expect(testDetection.getTestTitle()).toBe('cypress-test');
    });

    it('returns null for playwright (not implemented)', () => {
      (globalThis as any).process = {
        env: {PWTEST_UNDER_TEST: 'true'},
      };

      expect(testDetection.getTestTitle()).toBeNull();
    });

    it('returns null when no framework detected', () => {
      delete (globalThis as any).process;

      expect(testDetection.getTestTitle()).toBeNull();
    });
  });
});
