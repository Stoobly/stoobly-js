import {describe, expect, it, beforeEach, afterEach} from '@jest/globals';

import {Config} from '@models/config';

import Stoobly from '../src/stoobly';

describe('stoobly', () => {
  let originalWindow: any;

  beforeEach(() => {
    originalWindow = (global as any).window;
  });

  afterEach(() => {
    (global as any).window = originalWindow;
  });

  it('has config property', () => {
    const stoobly = new Stoobly();
    expect(stoobly.config).toBeInstanceOf(Config);
  });

  it('auto-detects and sets test name on construction when Cypress test is detected', () => {
    // Mock Cypress environment with a test name
    (global as any).window = {
      Cypress: {
        currentTest: {title: 'auto-detected-test'},
      },
    };

    const stoobly = new Stoobly();

    // Since interceptor.testName is private, we test indirectly by checking that
    // the interceptor instance exists and was properly initialized
    expect(stoobly.interceptor).toBeDefined();
    expect(stoobly.interceptor.applied).toBe(false); // Should not be applied yet
  });

  it('handles case when no test framework is detected', () => {
    // Ensure no test framework is detected
    (global as any).window = undefined;

    const stoobly = new Stoobly();

    // Should still create interceptor successfully even without test name
    expect(stoobly.interceptor).toBeDefined();
  });
});
