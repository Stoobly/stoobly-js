import {describe, expect, it, beforeEach, afterEach} from '@jest/globals';

import {Config} from '@models/config';

import Stoobly from '../stoobly';

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

  it('handles case when no test framework is detected', () => {
    // Ensure no test framework is detected
    (global as any).window = undefined;

    const stoobly = new Stoobly();

    // Should still create interceptor successfully even without test title
    expect(stoobly.interceptor).toBeDefined();
  });
});
