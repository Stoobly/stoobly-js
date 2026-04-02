import Stoobly from '../../../dist/esm/stoobly.js';
import { InterceptMode, RequestParameter } from '../../../dist/esm/constants.js';

import { SERVER_URL } from '../../server-config.js';

export const targetUrl = `${SERVER_URL}/headers`;

export const matchRules = [
  { modes: [InterceptMode.replay], components: RequestParameter.Header },
];

export const rewriteRules = [{ urlRules: [{ path: '/new-path' }] }];

// Shared interceptor instance for this Cypress suite (scenario-specific headers
// are controlled via fluent APIs + interceptor.apply()).
export const stoobly = new Stoobly();
export const stooblyInterceptor = () => stoobly.cypressInterceptor({
  urls: [{ pattern: targetUrl, matchRules, rewriteRules }],
});

