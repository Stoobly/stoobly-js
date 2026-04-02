import { test as base } from '@playwright/test';

import Stoobly from '../../../dist/esm/stoobly.js';
import {
  InterceptMode,
  RecordOrder,
  RecordPolicy,
  RecordStrategy,
} from '../../../dist/esm/constants.js';

import { SERVER_URL } from '../../server-config';

const targetUrl = `${SERVER_URL}/headers`;

const matchRules = [{ modes: [InterceptMode.replay], components: 'Header' }];
const rewriteRules = [{ urlRules: [{ path: '/new-path' }] }];

function resolveEnvMode() {
  const envMode = process.env.STOOBLY_INTERCEPT_MODE;
  if (!envMode) return InterceptMode.replay;

  const allowed = Object.values(InterceptMode);
  if (!allowed.includes(envMode)) {
    throw new Error(
      `Invalid STOOBLY_INTERCEPT_MODE="${envMode}". Expected one of: ${allowed.join(', ')}`
    );
  }

  return envMode;
}

export const test = base.extend({
  stooblyInterceptor: async ({}, use) => {
    const stoobly = new Stoobly();
    const interceptor = stoobly.playwrightInterceptor({
      mode: resolveEnvMode(),
      urls: [{ pattern: targetUrl, matchRules, rewriteRules }],
      record: {
        order: RecordOrder.Overwrite,
        policy: RecordPolicy.All,
        strategy: RecordStrategy.Full,
      },
    });

    await use(interceptor);
    await interceptor.clear();
  },

  stooblyRecordInterceptor: async ({}, use) => {
    const stoobly = new Stoobly();
    const interceptor = stoobly.playwrightInterceptor({
      mode: InterceptMode.record,
      urls: [{ pattern: targetUrl, matchRules, rewriteRules }],
      record: {
        order: RecordOrder.Overwrite,
        policy: RecordPolicy.All,
        strategy: RecordStrategy.Full,
      },
    });

    await use(interceptor);
    await interceptor.clear();
  },
});

export const expect = test.expect;

