import {jest} from '@jest/globals';
import {SpiedFunction} from 'jest-mock';

import {OVERWRITE_ID, PROXY_MODE, RECORD_ORDER, RECORD_POLICY, RECORD_STRATEGY, SCENARIO_KEY, SCENARIO_NAME, SESSION_ID, TEST_TITLE} from '@constants/custom_headers';
import {InterceptMode, RecordOrder, RecordPolicy, RecordStrategy} from '@constants/intercept';
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
        urls: [allowedUrl],
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
          urls: [new RegExp(`${allowedOrigin}/.*`)],
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

    describe('when not allowed', () => {
      const notAllowedUrl = `${notAllowedOrigin}/test`;

      beforeAll(async () => {
        interceptor = new Interceptor({
          scenarioKey,
          sessionId,
          urls: [allowedUrl], // Only allow the original URL, not the notAllowedUrl
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
        urls: [allowedUrl],
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
        urls: [allowedUrl],
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
          urls: [new RegExp(`${allowedOrigin}/.*`)],
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
          urls: [allowedUrl], // Only allow the original URL, not the notAllowedUrl
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
        urls: [allowedUrl],
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
        urls: [allowedUrl],
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
        urls: [allowedUrl],
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
        urls: [urlPattern],
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
        urls: [allowedUrl1, allowedUrl2],
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
        urls: [allowedUrl],
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
          urls: [allowedUrl],
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
});
