import {jest} from '@jest/globals';
import {SpiedFunction} from 'jest-mock';

import {MATCH_RULES, OVERWRITE_ID, PROXY_MODE, PUBLIC_DIRECTORY_PATH, RECORD_ORDER, RECORD_POLICY, RECORD_STRATEGY, RESPONSE_FIXTURES_PATH, REWRITE_RULES, SCENARIO_KEY, SCENARIO_NAME, SESSION_ID, TEST_TITLE} from '@constants/custom_headers';
import {InterceptMode, RecordOrder, RecordPolicy, RecordStrategy, RequestParameter} from '@constants/intercept';
import {Interceptor} from '@core/interceptor';

describe('Interceptor', () => {
  const scenarioKey = 'test-key';
  const scenarioName = 'test-scenario-name';
  const sessionId = 'test-session';
  const testTitle = 'sample-test';
  const allowedOrigin = 'https://docs.stoobly.com';
  const notAllowedOrigin = 'https://example.com';

  let interceptor: Interceptor;

  describe('fetch', () => {
    const allowedUrl = `${allowedOrigin}/test`;

    const fetchMock = jest.fn(async (): Promise<Response> => {
      return Promise.resolve(new Response(null, {status: 200}));
    });
    const originalFetch: typeof window.fetch = window.fetch;

    beforeAll(async () => {
      Interceptor.originalFetch = fetchMock;

      interceptor = new Interceptor({
        scenarioKey,
        sessionId,
        urls: [{ pattern: allowedUrl }],
      });
      interceptor.withTestTitle(testTitle);
      await interceptor.apply();
    });

    afterAll(() => {
      Interceptor.originalFetch = originalFetch;
    });

    describe('when strict matching', () => {
      beforeAll(async () => {
        await fetch(allowedUrl);
      });

      test(`adds '${SCENARIO_KEY}' header to fetch requests`, async () => {
        expect(fetchMock).toHaveBeenCalledWith(allowedUrl, {
          headers: expect.objectContaining({
            [SCENARIO_KEY]: scenarioKey,
          }),
        });
      });

      test(`adds '${SESSION_ID}' header to fetch requests`, async () => {
        expect(fetchMock).toHaveBeenCalledWith(allowedUrl, {
          headers: expect.objectContaining({
            [SESSION_ID]: expect.any(String),
          }),
        });
      });

      test(`adds '${TEST_TITLE}' header to fetch requests`, async () => {
        expect(fetchMock).toHaveBeenCalledWith(allowedUrl, {
          headers: expect.objectContaining({
            [TEST_TITLE]: testTitle,
          }),
        });
      });
    });

    describe('when RegExp matching', () => {
      beforeAll(async () => {
        interceptor = new Interceptor({
          scenarioKey,
          sessionId,
          urls: [{ pattern: new RegExp(`${allowedOrigin}/.*`) }],
        });
        interceptor.withTestTitle(testTitle);
        await interceptor.apply();

        await fetch(allowedUrl);
      });

      test(`adds '${SCENARIO_KEY}' header to fetch requests`, async () => {
        expect(fetchMock).toHaveBeenCalledWith(allowedUrl, {
          headers: expect.objectContaining({
            [SCENARIO_KEY]: scenarioKey,
          }),
        });
      });

      test(`adds '${SESSION_ID}' header to fetch requests`, async () => {
        expect(fetchMock).toHaveBeenCalledWith(allowedUrl, {
          headers: expect.objectContaining({
            [SESSION_ID]: expect.any(String),
          }),
        });
      });

      test(`adds '${TEST_TITLE}' header to fetch requests`, async () => {
        expect(fetchMock).toHaveBeenCalledWith(allowedUrl, {
          headers: expect.objectContaining({
            [TEST_TITLE]: testTitle,
          }),
        });
      });
    });

    describe('when urls is (string | RegExp)[] for backward compatibility', () => {
      beforeAll(async () => {
        interceptor = new Interceptor({
          scenarioKey,
          sessionId,
          urls: [allowedUrl, new RegExp(`${allowedOrigin}/other`)],
        });
        interceptor.withTestTitle(testTitle);
        await interceptor.apply();

        await fetch(allowedUrl);
      });

      test(`adds headers when url matches string pattern`, async () => {
        expect(fetchMock).toHaveBeenCalledWith(allowedUrl, {
          headers: expect.objectContaining({
            [SCENARIO_KEY]: scenarioKey,
          }),
        });
      });
    });

    describe('when not allowed', () => {
      const notAllowedUrl = `${notAllowedOrigin}/test`;

      beforeAll(async () => {
        interceptor = new Interceptor({
          scenarioKey,
          sessionId,
          urls: [{ pattern: allowedUrl }], // Only allow the original URL, not the notAllowedUrl
        });
        interceptor.withTestTitle(testTitle);
        await interceptor.apply();

        await fetch(notAllowedUrl);
      });

      test(`headers not added`, async () => {
        expect(fetchMock).toHaveBeenCalledWith(notAllowedUrl, undefined);
      });
    });

    describe('deactivate', () => {
      beforeAll(async () => {
        fetchMock.mockClear();
        interceptor.clear();

        await fetch(allowedUrl);
      });

      test(`does not add '${SCENARIO_KEY}' header to fetch requests`, async () => {
        expect(fetchMock).not.toHaveBeenCalledWith(SCENARIO_KEY, scenarioKey);
      });

      test(`does not add '${SESSION_ID}' header to fetch requests`, async () => {
        expect(fetchMock).not.toHaveBeenCalledWith(
          SESSION_ID,
          expect.any(String)
        );
      });
    });
  });

  describe('fetch with scenarioName', () => {
    const allowedUrl = `${allowedOrigin}/test`;

    const fetchMock = jest.fn(async (): Promise<Response> => {
      return Promise.resolve(new Response(null, {status: 200}));
    });
    const originalFetch: typeof window.fetch = window.fetch;

    beforeAll(async () => {
      Interceptor.originalFetch = fetchMock;

      interceptor = new Interceptor({
        scenarioName,
        sessionId,
        urls: [{ pattern: allowedUrl }],
      });
      interceptor.withTestTitle(testTitle);
      await interceptor.apply();
    });

    afterAll(() => {
      Interceptor.originalFetch = originalFetch;
    });

    describe('when strict matching', () => {
      beforeAll(async () => {
        await fetch(allowedUrl);
      });

      test(`adds '${SCENARIO_NAME}' header to fetch requests`, async () => {
        expect(fetchMock).toHaveBeenCalledWith(allowedUrl, {
          headers: expect.objectContaining({
            [SCENARIO_NAME]: scenarioName,
          }),
        });
      });

      test(`does not add '${SCENARIO_KEY}' header when using scenarioName`, async () => {
        expect(fetchMock).toHaveBeenCalledWith(allowedUrl, {
          headers: expect.not.objectContaining({
            [SCENARIO_KEY]: expect.anything(),
          }),
        });
      });

      test(`adds '${SESSION_ID}' header to fetch requests`, async () => {
        expect(fetchMock).toHaveBeenCalledWith(allowedUrl, {
          headers: expect.objectContaining({
            [SESSION_ID]: expect.any(String),
          }),
        });
      });

      test(`adds '${TEST_TITLE}' header to fetch requests`, async () => {
        expect(fetchMock).toHaveBeenCalledWith(allowedUrl, {
          headers: expect.objectContaining({
            [TEST_TITLE]: testTitle,
          }),
        });
      });
    });
  });

  describe('fetch with matchRules and InterceptorUrl options', () => {
    const allowedUrl = `${allowedOrigin}/test`;
    const matchRules = [
      {modes: [InterceptMode.replay], components: RequestParameter.Header},
    ];

    const fetchMock = jest.fn(async (): Promise<Response> => {
      return Promise.resolve(new Response(null, {status: 200}));
    });
    const originalFetch: typeof window.fetch = window.fetch;

    beforeAll(async () => {
      Interceptor.originalFetch = fetchMock;

      interceptor = new Interceptor({
        scenarioKey,
        sessionId,
        urls: [{pattern: allowedUrl, matchRules}],
      });
      interceptor.withTestTitle(testTitle);
      await interceptor.apply();
    });

    afterAll(() => {
      Interceptor.originalFetch = originalFetch;
    });

    describe('when strict matching', () => {
      beforeAll(async () => {
        await fetch(allowedUrl);
      });

      test(`adds '${MATCH_RULES}' header with base64-encoded JSON to fetch requests`, () => {
        expect(fetchMock).toHaveBeenCalledWith(
          allowedUrl,
          expect.objectContaining({
            headers: expect.objectContaining({
              [MATCH_RULES]: expect.any(String),
            }),
          })
        );
        const call = fetchMock.mock.calls.find(
          (c: unknown) => (c as unknown as [string, RequestInit?])[0] === allowedUrl
        );
        const headers = (call as unknown as [string, RequestInit?])[1] as {headers?: Record<string, string>};
        const encoded = headers?.headers?.[MATCH_RULES];
        const decoded = JSON.parse(
          Buffer.from(encoded!, 'base64').toString('utf-8')
        );
        expect(decoded).toEqual(matchRules);
      });
    });

    describe('when multiple URLs with different InterceptorUrl options', () => {
      const usersUrl = `${allowedOrigin}/api/users`;
      const postsUrl = `${allowedOrigin}/api/posts`;
      const usersMatchRules = [
        {modes: [InterceptMode.replay], components: RequestParameter.Header},
      ];
      const postsRewriteRules = [{urlRules: [{path: '/posts-rewritten'}]}];

      beforeAll(async () => {
        await interceptor.apply({
          urls: [
            {
              pattern: new RegExp(`${allowedOrigin}/api/users`),
              matchRules: usersMatchRules,
              publicDirectoryPath: '/users-public',
              responseFixturesPath: '/users-fixtures',
            },
            {
              pattern: new RegExp(`${allowedOrigin}/api/posts`),
              rewriteRules: postsRewriteRules,
              publicDirectoryPath: '/posts-public',
            },
          ],
        });
      });

      test('request to /api/users receives headers from matching InterceptorUrl only', async () => {
        await fetch(usersUrl);

        const call = fetchMock.mock.calls.find(
          (c: unknown) => (c as unknown as [string, RequestInit?])[0] === usersUrl
        );
        expect(call).toBeDefined();
        const headers = (call as unknown as [string, RequestInit?])[1] as {
          headers?: Record<string, string>;
        };
        const reqHeaders = headers?.headers ?? {};

        expect(reqHeaders[MATCH_RULES]).toBeDefined();
        expect(JSON.parse(Buffer.from(reqHeaders[MATCH_RULES], 'base64').toString('utf-8'))).toEqual(
          usersMatchRules
        );
        expect(reqHeaders[PUBLIC_DIRECTORY_PATH]).toBe('/users-public');
        expect(reqHeaders[RESPONSE_FIXTURES_PATH]).toBe('/users-fixtures');
        expect(reqHeaders[REWRITE_RULES]).toBeUndefined();
      });

      test('request to /api/posts receives headers from matching InterceptorUrl only', async () => {
        await fetch(postsUrl);

        const call = fetchMock.mock.calls.find(
          (c: unknown) => (c as unknown as [string, RequestInit?])[0] === postsUrl
        );
        expect(call).toBeDefined();
        const headers = (call as unknown as [string, RequestInit?])[1] as {
          headers?: Record<string, string>;
        };
        const reqHeaders = headers?.headers ?? {};

        expect(reqHeaders[REWRITE_RULES]).toBeDefined();
        expect(JSON.parse(Buffer.from(reqHeaders[REWRITE_RULES], 'base64').toString('utf-8'))).toEqual([
          {url_rules: [{path: '/posts-rewritten'}]},
        ]);
        expect(reqHeaders[PUBLIC_DIRECTORY_PATH]).toBe('/posts-public');
        expect(reqHeaders[MATCH_RULES]).toBeUndefined();
        expect(reqHeaders[RESPONSE_FIXTURES_PATH]).toBeUndefined();
      });
    });
  });

  describe('fetch with rewriteRules', () => {
    const allowedUrl = `${allowedOrigin}/test`;
    const rewriteRules = [{urlRules: [{path: '/new-path'}]}];

    const fetchMock = jest.fn(async (): Promise<Response> => {
      return Promise.resolve(new Response(null, {status: 200}));
    });
    const originalFetch: typeof window.fetch = window.fetch;

    beforeAll(async () => {
      Interceptor.originalFetch = fetchMock;

      interceptor = new Interceptor({
        scenarioKey,
        sessionId,
        urls: [{pattern: allowedUrl, rewriteRules}],
      });
      interceptor.withTestTitle(testTitle);
      await interceptor.apply();
    });

    afterAll(() => {
      Interceptor.originalFetch = originalFetch;
    });

    describe('when strict matching', () => {
      beforeAll(async () => {
        await fetch(allowedUrl);
      });

      test(`adds '${REWRITE_RULES}' header with base64-encoded JSON to fetch requests`, () => {
        expect(fetchMock).toHaveBeenCalledWith(
          allowedUrl,
          expect.objectContaining({
            headers: expect.objectContaining({
              [REWRITE_RULES]: expect.any(String),
            }),
          })
        );
        const call = fetchMock.mock.calls.find(
          (c: unknown) => (c as unknown as [string, RequestInit?])[0] === allowedUrl
        );
        const headers = (call as unknown as [string, RequestInit?])[1] as {headers?: Record<string, string>};
        const encoded = headers?.headers?.[REWRITE_RULES];
        const decoded = JSON.parse(
          Buffer.from(encoded!, 'base64').toString('utf-8')
        );
        expect(decoded).toEqual([{url_rules: [{path: '/new-path'}]}]);
      });
    });
  });

  describe('fetch without matchRules', () => {
    const allowedUrl = `${allowedOrigin}/test`;

    const fetchMock = jest.fn(async (): Promise<Response> => {
      return Promise.resolve(new Response(null, {status: 200}));
    });
    const originalFetch: typeof window.fetch = window.fetch;

    beforeAll(async () => {
      Interceptor.originalFetch = fetchMock;

      interceptor = new Interceptor({
        scenarioKey,
        sessionId,
        urls: [{pattern: allowedUrl}],
      });
      interceptor.withTestTitle(testTitle);
      await interceptor.apply();
    });

    afterAll(() => {
      Interceptor.originalFetch = originalFetch;
    });

    describe('when strict matching', () => {
      beforeAll(async () => {
        await fetch(allowedUrl);
      });

      test(`does not add '${MATCH_RULES}' header when urls have no matchRules`, () => {
        const call = fetchMock.mock.calls.find(
          (c: unknown) => (c as unknown as [string, RequestInit?])[0] === allowedUrl
        );
        expect(call).toBeDefined();
        const headers = (call as unknown as [string, RequestInit?])[1] as {headers?: Record<string, string>};
        expect(headers?.headers?.[MATCH_RULES]).toBeUndefined();
      });
    });
  });

  describe('fetch without rewriteRules', () => {
    const allowedUrl = `${allowedOrigin}/test`;

    const fetchMock = jest.fn(async (): Promise<Response> => {
      return Promise.resolve(new Response(null, {status: 200}));
    });
    const originalFetch: typeof window.fetch = window.fetch;

    beforeAll(async () => {
      Interceptor.originalFetch = fetchMock;

      interceptor = new Interceptor({
        scenarioKey,
        sessionId,
        urls: [{pattern: allowedUrl}],
      });
      interceptor.withTestTitle(testTitle);
      await interceptor.apply();
    });

    afterAll(() => {
      Interceptor.originalFetch = originalFetch;
    });

    describe('when strict matching', () => {
      beforeAll(async () => {
        await fetch(allowedUrl);
      });

      test(`does not add '${REWRITE_RULES}' header when urls have no rewriteRules`, () => {
        const call = fetchMock.mock.calls.find(
          (c: unknown) => (c as unknown as [string, RequestInit?])[0] === allowedUrl
        );
        expect(call).toBeDefined();
        const headers = (call as unknown as [string, RequestInit?])[1] as {headers?: Record<string, string>};
        expect(headers?.headers?.[REWRITE_RULES]).toBeUndefined();
      });
    });
  });

  describe('XMLHttpRequest.prototype.open', () => {
    const allowedUrl = `${allowedOrigin}/test`;

    const originalXMLHttpRequestOpen: typeof XMLHttpRequest.prototype.open =
      XMLHttpRequest.prototype.open;
    let setRequestHeaderMock: SpiedFunction<
      (name: string, value: string) => void
    >;
    let xhrInterceptor: Interceptor;

    beforeAll(() => {
      xhrInterceptor = new Interceptor({
        scenarioKey,
        sessionId,
        urls: [{ pattern: allowedUrl }],
      });
      xhrInterceptor.withTestTitle(testTitle);
    });

    afterAll(() => {
      XMLHttpRequest.prototype.open = originalXMLHttpRequestOpen;
    });

    describe('when strict matching', () => {
      beforeAll(async () => {
        await xhrInterceptor.apply();

        const xhr = new XMLHttpRequest();
        setRequestHeaderMock = jest.spyOn(xhr, 'setRequestHeader');
        xhr.open('GET', allowedUrl);
        // Manually trigger readyState change to OPENED (1)
        Object.defineProperty(xhr, 'readyState', { value: 1, writable: true });
        xhr.dispatchEvent(new Event('readystatechange'));
      });

      test(`adds '${SCENARIO_KEY}' header to XMLHttpRequest`, async () => {
        expect(setRequestHeaderMock).toHaveBeenCalledWith(
          SCENARIO_KEY,
          scenarioKey
        );
      });

      test(`adds '${SESSION_ID}' header to XMLHttpRequest`, async () => {
        expect(setRequestHeaderMock).toHaveBeenCalledWith(
          SESSION_ID,
          expect.any(String)
        );
      });

      test(`adds '${TEST_TITLE}' header to XMLHttpRequest`, async () => {
        expect(setRequestHeaderMock).toHaveBeenCalledWith(TEST_TITLE, testTitle);
      });
    });

    describe('when RegExp matching', () => {
      beforeAll(async () => {
        xhrInterceptor = new Interceptor({
          scenarioKey,
          sessionId,
          urls: [{ pattern: new RegExp(`${allowedOrigin}/.*`) }],
        });
        xhrInterceptor.withTestTitle(testTitle);
        await xhrInterceptor.apply();

        const xhr = new XMLHttpRequest();
        setRequestHeaderMock = jest.spyOn(xhr, 'setRequestHeader');
        xhr.open('GET', allowedUrl);
        // Manually trigger readyState change to OPENED (1)
        Object.defineProperty(xhr, 'readyState', { value: 1, writable: true });
        xhr.dispatchEvent(new Event('readystatechange'));
      });

      test(`adds '${SCENARIO_KEY}' header to XMLHttpRequest`, async () => {
        expect(setRequestHeaderMock).toHaveBeenCalledWith(
          SCENARIO_KEY,
          scenarioKey
        );
      });

      test(`adds '${SESSION_ID}' header to XMLHttpRequest`, async () => {
        expect(setRequestHeaderMock).toHaveBeenCalledWith(
          SESSION_ID,
          expect.any(String)
        );
      });

      test(`adds '${TEST_TITLE}' header to XMLHttpRequest`, async () => {
        expect(setRequestHeaderMock).toHaveBeenCalledWith(TEST_TITLE, testTitle);
      });
    });

    describe('when not allowed', () => {
      const notAllowedUrl = `${notAllowedOrigin}/test`;

      beforeAll(async () => {
        xhrInterceptor = new Interceptor({
          scenarioKey,
          sessionId,
          urls: [{ pattern: allowedUrl }], // Only allow the original URL, not the notAllowedUrl
        });
        xhrInterceptor.withTestTitle(testTitle);
        await xhrInterceptor.apply();

        const xhr = new XMLHttpRequest();
        setRequestHeaderMock = jest.spyOn(xhr, 'setRequestHeader');
        xhr.open('GET', notAllowedUrl);
        xhr.dispatchEvent(new Event('readystatechange'));
      });

      test(`headers not added`, async () => {
        expect(setRequestHeaderMock).not.toHaveBeenCalled();
      });
    });

    describe('deactivate', () => {
      beforeAll(async () => {
        await xhrInterceptor.clear();

        const xhr = new XMLHttpRequest();
        setRequestHeaderMock = jest.spyOn(xhr, 'setRequestHeader');
        xhr.open('GET', allowedUrl);
        xhr.dispatchEvent(new Event('readystatechange'));
      });

      test(`does not add '${SCENARIO_KEY}' header to fetch requests`, async () => {
        expect(setRequestHeaderMock).not.toHaveBeenCalledWith(
          SCENARIO_KEY,
          scenarioKey
        );
      });

      test(`does not add '${SESSION_ID}' header to fetch requests`, async () => {
        expect(setRequestHeaderMock).not.toHaveBeenCalledWith(
          SESSION_ID,
          expect.any(String)
        );
      });
    });
  });

  describe('XMLHttpRequest.prototype.open with matchRules', () => {
    const allowedUrl = `${allowedOrigin}/test`;
    const matchRules = [
      {
        modes: [InterceptMode.replay],
        components: RequestParameter.QueryParam,
      },
    ];

    const originalXMLHttpRequestOpen: typeof XMLHttpRequest.prototype.open =
      XMLHttpRequest.prototype.open;
    let setRequestHeaderMock: SpiedFunction<
      (name: string, value: string) => void
    >;
    let xhrInterceptor: Interceptor;

    beforeAll(async () => {
      xhrInterceptor = new Interceptor({
        scenarioKey,
        sessionId,
        urls: [{pattern: allowedUrl, matchRules}],
      });
      xhrInterceptor.withTestTitle(testTitle);
      await xhrInterceptor.apply();
    });

    afterAll(() => {
      XMLHttpRequest.prototype.open = originalXMLHttpRequestOpen;
    });

    describe('when strict matching', () => {
      beforeAll(async () => {
        const xhr = new XMLHttpRequest();
        setRequestHeaderMock = jest.spyOn(xhr, 'setRequestHeader');
        xhr.open('GET', allowedUrl);
        Object.defineProperty(xhr, 'readyState', {value: 1, writable: true});
        xhr.dispatchEvent(new Event('readystatechange'));
      });

      test(`adds '${MATCH_RULES}' header with base64-encoded JSON to XMLHttpRequest`, () => {
        const matchRulesCall = setRequestHeaderMock.mock.calls.find(
          (c) => c[0] === MATCH_RULES
        );
        expect(matchRulesCall).toBeDefined();
        const encoded = matchRulesCall![1];
        const decoded = JSON.parse(
          Buffer.from(encoded, 'base64').toString('utf-8')
        );
        expect(decoded).toEqual(matchRules);
      });
    });
  });

  describe('XMLHttpRequest.prototype.open with rewriteRules', () => {
    const allowedUrl = `${allowedOrigin}/test`;
    const rewriteRules = [
      {
        parameterRules: [
          {
            type: RequestParameter.Header,
            name: 'foo',
            value: 'bar',
          },
        ],
      },
    ];

    const originalXMLHttpRequestOpen: typeof XMLHttpRequest.prototype.open =
      XMLHttpRequest.prototype.open;
    let setRequestHeaderMock: SpiedFunction<
      (name: string, value: string) => void
    >;
    let xhrInterceptor: Interceptor;

    beforeAll(async () => {
      xhrInterceptor = new Interceptor({
        scenarioKey,
        sessionId,
        urls: [{pattern: allowedUrl, rewriteRules}],
      });
      xhrInterceptor.withTestTitle(testTitle);
      await xhrInterceptor.apply();
    });

    afterAll(() => {
      XMLHttpRequest.prototype.open = originalXMLHttpRequestOpen;
    });

    describe('when strict matching', () => {
      beforeAll(async () => {
        const xhr = new XMLHttpRequest();
        setRequestHeaderMock = jest.spyOn(xhr, 'setRequestHeader');
        xhr.open('GET', allowedUrl);
        Object.defineProperty(xhr, 'readyState', {value: 1, writable: true});
        xhr.dispatchEvent(new Event('readystatechange'));
      });

      test(`adds '${REWRITE_RULES}' header with base64-encoded JSON to XMLHttpRequest`, () => {
        const rewriteRulesCall = setRequestHeaderMock.mock.calls.find(
          (c) => c[0] === REWRITE_RULES
        );
        expect(rewriteRulesCall).toBeDefined();
        const encoded = rewriteRulesCall![1];
        const decoded = JSON.parse(
          Buffer.from(encoded, 'base64').toString('utf-8')
        );
        expect(decoded).toEqual([
          {
            parameter_rules: [
              {type: RequestParameter.Header, name: 'foo', value: 'bar'},
            ],
          },
        ]);
      });
    });
  });

  describe('XMLHttpRequest.prototype.open with scenarioName', () => {
    const allowedUrl = `${allowedOrigin}/test`;

    const originalXMLHttpRequestOpen: typeof XMLHttpRequest.prototype.open =
      XMLHttpRequest.prototype.open;
    let setRequestHeaderMock: SpiedFunction<
      (name: string, value: string) => void
    >;
    let xhrInterceptor: Interceptor;

    beforeAll(async () => {
      xhrInterceptor = new Interceptor({
        scenarioName,
        sessionId,
        urls: [{ pattern: allowedUrl }],
      });
      xhrInterceptor.withTestTitle(testTitle);
      await xhrInterceptor.apply();
    });

    afterAll(() => {
      XMLHttpRequest.prototype.open = originalXMLHttpRequestOpen;
    });

    describe('when strict matching', () => {
      beforeAll(async () => {
        const xhr = new XMLHttpRequest();
        setRequestHeaderMock = jest.spyOn(xhr, 'setRequestHeader');
        xhr.open('GET', allowedUrl);
        // Manually trigger readyState change to OPENED (1)
        Object.defineProperty(xhr, 'readyState', { value: 1, writable: true });
        xhr.dispatchEvent(new Event('readystatechange'));
      });

      test(`adds '${SCENARIO_NAME}' header to XMLHttpRequest`, async () => {
        expect(setRequestHeaderMock).toHaveBeenCalledWith(
          SCENARIO_NAME,
          scenarioName
        );
      });

      test(`does not add '${SCENARIO_KEY}' header when using scenarioName`, async () => {
        expect(setRequestHeaderMock).not.toHaveBeenCalledWith(
          SCENARIO_KEY,
          expect.anything()
        );
      });

      test(`adds '${SESSION_ID}' header to XMLHttpRequest`, async () => {
        expect(setRequestHeaderMock).toHaveBeenCalledWith(
          SESSION_ID,
          expect.any(String)
        );
      });

      test(`adds '${TEST_TITLE}' header to XMLHttpRequest`, async () => {
        expect(setRequestHeaderMock).toHaveBeenCalledWith(TEST_TITLE, testTitle);
      });
    });
  });

  describe('applyRecord', () => {
    const allowedUrl = `${allowedOrigin}/test`;
    const initialHeaderKey = 'X-Custom-Header';
    const initialHeaderValue = 'custom-value';
    const anotherInitialHeaderKey = 'Authorization';
    const anotherInitialHeaderValue = 'Bearer token123';

    const fetchMock = jest.fn(async (): Promise<Response> => {
      return Promise.resolve(new Response(null, {status: 200}));
    });
    const originalFetch: typeof window.fetch = window.fetch;

    beforeAll(async () => {
      Interceptor.originalFetch = fetchMock;

      interceptor = new Interceptor({
        scenarioKey,
        scenarioName,
        sessionId,
        urls: [{ pattern: allowedUrl }],
        record: {
          order: RecordOrder.Overwrite,
          policy: RecordPolicy.All,
          strategy: RecordStrategy.Full,
        },
      });
      interceptor.withTestTitle(testTitle);
      await interceptor.applyRecord();
    });

    afterAll(() => {
      Interceptor.originalFetch = originalFetch;
    });

    test('preserves initial headers aside from intercept mode header when applyRecord is called', async () => {
      await fetch(allowedUrl, {
        headers: {
          [initialHeaderKey]: initialHeaderValue,
          [anotherInitialHeaderKey]: anotherInitialHeaderValue,
        },
      });

      expect(fetchMock).toHaveBeenCalledWith(allowedUrl, {
        headers: expect.objectContaining({
          [initialHeaderKey]: initialHeaderValue,
          [anotherInitialHeaderKey]: anotherInitialHeaderValue,
          [PROXY_MODE]: InterceptMode.record,
          [RECORD_ORDER]: RecordOrder.Overwrite,
          [OVERWRITE_ID]: expect.any(String),
          [RECORD_POLICY]: RecordPolicy.All,
          [RECORD_STRATEGY]: RecordStrategy.Full,
          [SCENARIO_KEY]: scenarioKey,
          [SCENARIO_NAME]: scenarioName,
          [SESSION_ID]: expect.any(String),
          [TEST_TITLE]: testTitle,
        }),
      });
    });
  });

  describe('applyRecord with RecordOrder.Overwrite per URL behavior', () => {
    const allowedUrl = `${allowedOrigin}/test-per-url`;
    const initialHeaderKey = 'X-Custom-Header';
    const initialHeaderValue = 'custom-value';

    const fetchMock = jest.fn(async (): Promise<Response> => {
      return Promise.resolve(new Response(null, {status: 200}));
    });
    const originalFetch: typeof window.fetch = window.fetch;

    beforeAll(async () => {
      Interceptor.originalFetch = fetchMock;

      interceptor = new Interceptor({
        scenarioKey,
        scenarioName,
        sessionId,
        urls: [{ pattern: allowedUrl }],
        record: {
          order: RecordOrder.Overwrite,
          policy: RecordPolicy.All,
          strategy: RecordStrategy.Full,
        },
      });
      interceptor.withTestTitle(testTitle);
      await interceptor.applyRecord();
    });

    afterAll(() => {
      Interceptor.originalFetch = originalFetch;
    });

    test('sends overwrite header only once per URL', async () => {
      fetchMock.mockClear();

      // First request to allowedUrl should include RECORD_ORDER
      await fetch(allowedUrl, {
        headers: {
          [initialHeaderKey]: initialHeaderValue,
        },
      });

      expect(fetchMock).toHaveBeenCalledWith(allowedUrl, {
        headers: expect.objectContaining({
          [RECORD_ORDER]: RecordOrder.Overwrite,
          [OVERWRITE_ID]: expect.any(String),
        }),
      });

      fetchMock.mockClear();

      // Second request to same URL should NOT include RECORD_ORDER or OVERWRITE_ID
      await fetch(allowedUrl, {
        headers: {
          [initialHeaderKey]: initialHeaderValue,
        },
      });

      expect(fetchMock).toHaveBeenCalledWith(allowedUrl, {
        headers: expect.not.objectContaining({
          [RECORD_ORDER]: expect.anything(),
        }),
      });

      expect(fetchMock).toHaveBeenCalledWith(allowedUrl, {
        headers: expect.not.objectContaining({
          [OVERWRITE_ID]: expect.anything(),
        }),
      });
    });
  });

  describe('applyRecord with RecordOrder.Overwrite per URL pattern (RegExp)', () => {
    const urlPattern = new RegExp(`${allowedOrigin}/api/.*`);
    const url1 = `${allowedOrigin}/api/users`;
    const url2 = `${allowedOrigin}/api/posts`;
    const initialHeaderKey = 'X-Custom-Header';
    const initialHeaderValue = 'custom-value';

    const fetchMock = jest.fn(async (): Promise<Response> => {
      return Promise.resolve(new Response(null, {status: 200}));
    });
    const originalFetch: typeof window.fetch = window.fetch;

    beforeAll(async () => {
      Interceptor.originalFetch = fetchMock;

      interceptor = new Interceptor({
        scenarioKey,
        scenarioName,
        sessionId,
        urls: [{ pattern: urlPattern }],
        record: {
          order: RecordOrder.Overwrite,
          policy: RecordPolicy.All,
          strategy: RecordStrategy.Full,
        },
      });
      interceptor.withTestTitle(testTitle);
      await interceptor.applyRecord();
    });

    afterAll(() => {
      Interceptor.originalFetch = originalFetch;
    });

    test('sends overwrite header only once per URL pattern, not per actual URL', async () => {
      fetchMock.mockClear();

      // First request to url1 should include RECORD_ORDER
      await fetch(url1, {
        headers: {
          [initialHeaderKey]: initialHeaderValue,
        },
      });

      expect(fetchMock).toHaveBeenLastCalledWith(url1, {
        headers: expect.objectContaining({
          [RECORD_ORDER]: RecordOrder.Overwrite,
          [OVERWRITE_ID]: expect.any(String),
        }),
      });

      fetchMock.mockClear();

      // Request to url2 (different URL, same pattern) should NOT include RECORD_ORDER or OVERWRITE_ID
      await fetch(url2, {
        headers: {
          [initialHeaderKey]: initialHeaderValue,
        },
      });

      expect(fetchMock).toHaveBeenLastCalledWith(url2, {
        headers: expect.not.objectContaining({
          [RECORD_ORDER]: expect.anything(),
        }),
      });

      expect(fetchMock).toHaveBeenLastCalledWith(url2, {
        headers: expect.not.objectContaining({
          [OVERWRITE_ID]: expect.anything(),
        }),
      });
    });
  });

  describe('with RecordOrder.Overwrite and multiple URLs', () => {
    const allowedUrl1 = `${allowedOrigin}/test1`;
    const allowedUrl2 = `${allowedOrigin}/test2`;
    const initialHeaderKey = 'X-Custom-Header';
    const initialHeaderValue = 'custom-value';

    const fetchMock = jest.fn(async (): Promise<Response> => {
      return Promise.resolve(new Response(null, {status: 200}));
    });
    const originalFetch: typeof window.fetch = window.fetch;

    beforeAll(async () => {
      Interceptor.originalFetch = fetchMock;

      interceptor = new Interceptor({
        scenarioKey,
        scenarioName,
        sessionId,
        urls: [{ pattern: allowedUrl1 }, { pattern: allowedUrl2 }],
        record: {
          order: RecordOrder.Overwrite,
          policy: RecordPolicy.All,
          strategy: RecordStrategy.Full,
        },
      });
      interceptor.withTestTitle(testTitle);
      await interceptor.applyRecord();
    });

    afterAll(() => {
      Interceptor.originalFetch = originalFetch;
    });

    test('sends overwrite header once per unique URL', async () => {
      fetchMock.mockClear();

      // First request to allowedUrl1 should include RECORD_ORDER
      await fetch(allowedUrl1, {
        headers: {
          [initialHeaderKey]: initialHeaderValue,
        },
      });

      expect(fetchMock).toHaveBeenLastCalledWith(allowedUrl1, {
        headers: expect.objectContaining({
          [RECORD_ORDER]: RecordOrder.Overwrite,
          [OVERWRITE_ID]: expect.any(String),
        }),
      });

      fetchMock.mockClear();

      // First request to allowedUrl2 should also include RECORD_ORDER
      await fetch(allowedUrl2, {
        headers: {
          [initialHeaderKey]: initialHeaderValue,
        },
      });

      expect(fetchMock).toHaveBeenLastCalledWith(allowedUrl2, {
        headers: expect.objectContaining({
          [RECORD_ORDER]: RecordOrder.Overwrite,
          [OVERWRITE_ID]: expect.any(String),
        }),
      });

      fetchMock.mockClear();

      // Second request to allowedUrl1 should NOT include RECORD_ORDER
      await fetch(allowedUrl1, {
        headers: {
          [initialHeaderKey]: initialHeaderValue,
        },
      });

      expect(fetchMock).toHaveBeenLastCalledWith(allowedUrl1, {
        headers: expect.not.objectContaining({
          [RECORD_ORDER]: expect.anything(),
        }),
      });

      fetchMock.mockClear();

      // Second request to allowedUrl2 should NOT include RECORD_ORDER
      await fetch(allowedUrl2, {
        headers: {
          [initialHeaderKey]: initialHeaderValue,
        },
      });

      expect(fetchMock).toHaveBeenLastCalledWith(allowedUrl2, {
        headers: expect.not.objectContaining({
          [RECORD_ORDER]: expect.anything(),
        }),
      });
    });
  });

  describe('applyRecord with RecordOrder.Overwrite - multiple apply() calls', () => {
    const allowedUrl = `${allowedOrigin}/test-reapply`;
    const initialHeaderKey = 'X-Custom-Header';
    const initialHeaderValue = 'custom-value';

    const fetchMock = jest.fn(async (): Promise<Response> => {
      return Promise.resolve(new Response(null, {status: 200}));
    });
    const originalFetch: typeof window.fetch = window.fetch;

    beforeAll(async () => {
      Interceptor.originalFetch = fetchMock;

      interceptor = new Interceptor({
        scenarioKey,
        scenarioName,
        sessionId,
        urls: [{ pattern: allowedUrl }],
        record: {
          order: RecordOrder.Overwrite,
          policy: RecordPolicy.All,
          strategy: RecordStrategy.Full,
        },
      });
      interceptor.withTestTitle(testTitle);
    });

    afterAll(() => {
      Interceptor.originalFetch = originalFetch;
    });

    test('resets URL tracking when apply() is called again', async () => {
      // First apply()
      await interceptor.applyRecord();
      fetchMock.mockClear();

      // First request should include RECORD_ORDER
      await fetch(allowedUrl, {
        headers: {
          [initialHeaderKey]: initialHeaderValue,
        },
      });

      expect(fetchMock).toHaveBeenCalledWith(allowedUrl, {
        headers: expect.objectContaining({
          [RECORD_ORDER]: RecordOrder.Overwrite,
          [OVERWRITE_ID]: expect.any(String),
        }),
      });

      fetchMock.mockClear();

      // Second request should NOT include RECORD_ORDER or OVERWRITE_ID
      await fetch(allowedUrl, {
        headers: {
          [initialHeaderKey]: initialHeaderValue,
        },
      });

      expect(fetchMock).toHaveBeenCalledWith(allowedUrl, {
        headers: expect.not.objectContaining({
          [RECORD_ORDER]: expect.anything(),
        }),
      });

      expect(fetchMock).toHaveBeenCalledWith(allowedUrl, {
        headers: expect.not.objectContaining({
          [OVERWRITE_ID]: expect.anything(),
        }),
      });

      // Call apply() again - this should reset urlsToVisit
      await interceptor.applyRecord();
      fetchMock.mockClear();

      // First request after reapply should include RECORD_ORDER again
      await fetch(allowedUrl, {
        headers: {
          [initialHeaderKey]: initialHeaderValue,
        },
      });

      expect(fetchMock).toHaveBeenCalledWith(allowedUrl, {
        headers: expect.objectContaining({
          [RECORD_ORDER]: RecordOrder.Overwrite,
          [OVERWRITE_ID]: expect.any(String),
        }),
      });

      fetchMock.mockClear();

      // Second request after reapply should NOT include RECORD_ORDER or OVERWRITE_ID
      await fetch(allowedUrl, {
        headers: {
          [initialHeaderKey]: initialHeaderValue,
        },
      });

      expect(fetchMock).toHaveBeenCalledWith(allowedUrl, {
        headers: expect.not.objectContaining({
          [RECORD_ORDER]: expect.anything(),
        }),
      });

      expect(fetchMock).toHaveBeenCalledWith(allowedUrl, {
        headers: expect.not.objectContaining({
          [OVERWRITE_ID]: expect.anything(),
        }),
      });
    });

    describe('with RecordOrder.Append', () => {
      const allowedUrl = `${allowedOrigin}/test`;
      const initialHeaderKey = 'X-Custom-Header';
      const initialHeaderValue = 'custom-value';

      const fetchMock = jest.fn(async (): Promise<Response> => {
        return Promise.resolve(new Response(null, {status: 200}));
      });
      const originalFetch: typeof window.fetch = window.fetch;

      beforeAll(async () => {
        Interceptor.originalFetch = fetchMock;

        interceptor = new Interceptor({
          scenarioKey,
          scenarioName,
          sessionId,
          urls: [{ pattern: allowedUrl }],
          record: {
            order: RecordOrder.Append,
            policy: RecordPolicy.All,
            strategy: RecordStrategy.Full,
          },
        });
        interceptor.withTestTitle(testTitle);
        await interceptor.applyRecord();
      });

      afterAll(() => {
        Interceptor.originalFetch = originalFetch;
      });

      test('does not include OVERWRITE_ID header when RecordOrder is not Overwrite', async () => {
        fetchMock.mockClear();

        await fetch(allowedUrl, {
          headers: {
            [initialHeaderKey]: initialHeaderValue,
          },
        });

        expect(fetchMock).toHaveBeenCalledWith(allowedUrl, {
          headers: expect.objectContaining({
            [initialHeaderKey]: initialHeaderValue,
            [PROXY_MODE]: InterceptMode.record,
            [RECORD_ORDER]: RecordOrder.Append,
            [RECORD_POLICY]: RecordPolicy.All,
            [RECORD_STRATEGY]: RecordStrategy.Full,
            [SCENARIO_KEY]: scenarioKey,
            [SCENARIO_NAME]: scenarioName,
            [SESSION_ID]: expect.any(String),
            [TEST_TITLE]: testTitle,
          }),
        });

        expect(fetchMock).toHaveBeenCalledWith(allowedUrl, {
          headers: expect.not.objectContaining({
            [OVERWRITE_ID]: expect.anything(),
          }),
        });
      });
    });
  });

  describe('filterOverwriteHeader', () => {
    let testInterceptor: Interceptor;
    let headers: Record<string, string>;
    let urlsToVisit: (RegExp | string)[];

    beforeAll(() => {
      testInterceptor = new Interceptor({
        urls: [],
      });
    });

    beforeEach(() => {
      headers = {
        [RECORD_ORDER]: RecordOrder.Overwrite,
        [OVERWRITE_ID]: 'test-id',
      };
    });

    describe('with string patterns', () => {
      beforeEach(() => {
        urlsToVisit = ['https://example.com/exact', 'https://example.com/other'];
      });

      test('removes pattern on exact string match', () => {
        const url = 'https://example.com/exact';
        (testInterceptor as any).filterOverwriteHeader(headers, url, urlsToVisit);

        expect(urlsToVisit).toEqual(['https://example.com/other']);
        expect(headers[RECORD_ORDER]).toBe(RecordOrder.Overwrite);
        expect(headers[OVERWRITE_ID]).toBe('test-id');
      });

      test('removes overwrite headers when no match found', () => {
        const url = 'https://example.com/notfound';
        (testInterceptor as any).filterOverwriteHeader(headers, url, urlsToVisit);

        expect(urlsToVisit).toEqual(['https://example.com/exact', 'https://example.com/other']);
        expect(headers[RECORD_ORDER]).toBeUndefined();
        expect(headers[OVERWRITE_ID]).toBeUndefined();
      });
    });

    describe('with RegExp patterns', () => {
      beforeEach(() => {
        urlsToVisit = [/\/api\/.*/, /\/admin\/.*/];
      });

      test('removes pattern when actual URL matches RegExp', () => {
        const url = 'https://example.com/api/users';
        (testInterceptor as any).filterOverwriteHeader(headers, url, urlsToVisit);

        expect(urlsToVisit).toHaveLength(1);
        expect(urlsToVisit[0]).toEqual(/\/admin\/.*/);
        expect(headers[RECORD_ORDER]).toBe(RecordOrder.Overwrite);
        expect(headers[OVERWRITE_ID]).toBe('test-id');
      });

      test('removes pattern when RegExp pattern matches another RegExp pattern', () => {
        const url = /\/api\/.*/;
        (testInterceptor as any).filterOverwriteHeader(headers, url, urlsToVisit);

        expect(urlsToVisit).toHaveLength(1);
        expect(urlsToVisit[0]).toEqual(/\/admin\/.*/);
        expect(headers[RECORD_ORDER]).toBe(RecordOrder.Overwrite);
        expect(headers[OVERWRITE_ID]).toBe('test-id');
      });

      test('removes overwrite headers when URL does not match any pattern', () => {
        const url = 'https://example.com/other/path';
        (testInterceptor as any).filterOverwriteHeader(headers, url, urlsToVisit);

        expect(urlsToVisit).toHaveLength(2);
        expect(headers[RECORD_ORDER]).toBeUndefined();
        expect(headers[OVERWRITE_ID]).toBeUndefined();
      });
    });

    describe('with RegExp global flag', () => {
      test('handles RegExp with global flag correctly', () => {
        const pattern = /\/api\/.*/g;
        urlsToVisit = [pattern];

        // First test
        const url1 = 'https://example.com/api/users';
        (testInterceptor as any).filterOverwriteHeader(headers, url1, urlsToVisit);

        expect(urlsToVisit).toHaveLength(0);
        expect(headers[RECORD_ORDER]).toBe(RecordOrder.Overwrite);

        // Verify lastIndex was reset (pattern should have lastIndex = 0)
        expect(pattern.lastIndex).toBe(0);
      });

      test('handles failed match with global flag correctly', () => {
        const pattern = /\/api\/.*/g;
        urlsToVisit = [pattern];

        // Test URL that doesn't match
        const url = 'https://example.com/other/path';
        (testInterceptor as any).filterOverwriteHeader(headers, url, urlsToVisit);

        expect(urlsToVisit).toHaveLength(1);
        expect(headers[RECORD_ORDER]).toBeUndefined();
        expect(headers[OVERWRITE_ID]).toBeUndefined();

        // Verify lastIndex was reset
        expect(pattern.lastIndex).toBe(0);
      });

      test('handles multiple tests with global flag correctly', () => {
        const pattern = /\/api\/.*/g;
        urlsToVisit = [pattern, /\/admin\/.*/];

        // First, test a non-matching URL
        headers = {
          [RECORD_ORDER]: RecordOrder.Overwrite,
          [OVERWRITE_ID]: 'test-id',
        };
        const url1 = 'https://example.com/other/path';
        (testInterceptor as any).filterOverwriteHeader(headers, url1, urlsToVisit);

        expect(pattern.lastIndex).toBe(0);
        expect(urlsToVisit).toHaveLength(2);

        // Then test a matching URL - should work despite previous test
        headers = {
          [RECORD_ORDER]: RecordOrder.Overwrite,
          [OVERWRITE_ID]: 'test-id',
        };
        const url2 = 'https://example.com/api/users';
        (testInterceptor as any).filterOverwriteHeader(headers, url2, urlsToVisit);

        expect(urlsToVisit).toHaveLength(1);
        expect(urlsToVisit[0]).toEqual(/\/admin\/.*/);
        expect(headers[RECORD_ORDER]).toBe(RecordOrder.Overwrite);
      });
    });

    describe('with RegExp sticky flag', () => {
      test('handles RegExp with sticky flag correctly', () => {
        const pattern = /\/api\/.*/y;
        urlsToVisit = [pattern];

        const url = 'https://example.com/api/users';
        (testInterceptor as any).filterOverwriteHeader(headers, url, urlsToVisit);

        // Verify lastIndex was reset
        expect(pattern.lastIndex).toBe(0);
      });
    });

    describe('with mixed patterns', () => {
      beforeEach(() => {
        urlsToVisit = [
          'https://example.com/exact',
          /\/api\/.*/,
          'https://example.com/other',
        ];
      });

      test('removes first matching pattern only', () => {
        const url = 'https://example.com/exact';
        (testInterceptor as any).filterOverwriteHeader(headers, url, urlsToVisit);

        expect(urlsToVisit).toHaveLength(2);
        expect(urlsToVisit[0]).toEqual(/\/api\/.*/);
        expect(urlsToVisit[1]).toBe('https://example.com/other');
        expect(headers[RECORD_ORDER]).toBe(RecordOrder.Overwrite);
      });

      test('matches RegExp pattern when string pattern does not match', () => {
        const url = 'https://example.com/api/users';
        (testInterceptor as any).filterOverwriteHeader(headers, url, urlsToVisit);

        expect(urlsToVisit).toHaveLength(2);
        expect(urlsToVisit[0]).toBe('https://example.com/exact');
        expect(urlsToVisit[1]).toBe('https://example.com/other');
        expect(headers[RECORD_ORDER]).toBe(RecordOrder.Overwrite);
      });
    });

    describe('when RECORD_ORDER is not Overwrite', () => {
      test('does not modify headers or urlsToVisit', () => {
        headers = {
          [RECORD_ORDER]: RecordOrder.Append,
          [OVERWRITE_ID]: 'test-id',
        };
        urlsToVisit = ['https://example.com/exact'];

        const url = 'https://example.com/exact';
        (testInterceptor as any).filterOverwriteHeader(headers, url, urlsToVisit);

        expect(urlsToVisit).toEqual(['https://example.com/exact']);
        expect(headers[RECORD_ORDER]).toBe(RecordOrder.Append);
        expect(headers[OVERWRITE_ID]).toBe('test-id');
      });
    });

    describe('edge cases', () => {
      test('handles empty urlsToVisit array', () => {
        urlsToVisit = [];
        const url = 'https://example.com/any';
        (testInterceptor as any).filterOverwriteHeader(headers, url, urlsToVisit);

        expect(urlsToVisit).toEqual([]);
        expect(headers[RECORD_ORDER]).toBeUndefined();
        expect(headers[OVERWRITE_ID]).toBeUndefined();
      });

      test('handles complex RegExp patterns', () => {
        urlsToVisit = [/^https:\/\/api\.example\.com\/v[0-9]+\/users$/];
        const url = 'https://api.example.com/v2/users';
        (testInterceptor as any).filterOverwriteHeader(headers, url, urlsToVisit);

        expect(urlsToVisit).toHaveLength(0);
        expect(headers[RECORD_ORDER]).toBe(RecordOrder.Overwrite);
      });
    });
  });
});
