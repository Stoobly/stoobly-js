import Stoobly from '../../../dist/esm/stoobly.js';
import {
  InterceptMode,
  RecordOrder,
  RecordPolicy,
  RecordStrategy,
  RequestParameter,
} from '../../../dist/esm/constants.js';

import { SERVER_URL } from '../../server-config.js';

export const targetUrl = `${SERVER_URL}/headers`;

export const matchRules = [
  { modes: [InterceptMode.replay], components: RequestParameter.Header },
];

export const rewriteRules = [{ urlRules: [{ path: '/new-path' }] }];

// Shared interceptor instance for this Cypress suite (scenario-specific headers
// are controlled via fluent APIs + interceptor.apply()).
export const stoobly = new Stoobly();
export const buildStooblyInterceptor = () => stoobly.cypressInterceptor({
  mode: Cypress.env('STOOBLY_INTERCEPT_MODE'),
  urls: [{ pattern: targetUrl, matchRules, rewriteRules }],
  record: {
    order: RecordOrder.Overwrite,
    policy: RecordPolicy.All,
    strategy: RecordStrategy.Full,
  },
});

