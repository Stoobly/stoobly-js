import {jest} from '@jest/globals';
import {SpiedFunction} from 'jest-mock';

import {SCENARIO_KEY, SCENARIO_NAME, SESSION_ID, TEST_TITLE} from '@constants/custom_headers';
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
      await interceptor.start();
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
        await interceptor.start();

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
        await interceptor.start();

        await fetch(notAllowedUrl);
      });

      test(`headers not added`, async () => {
        expect(fetchMock).toHaveBeenCalledWith(notAllowedUrl, undefined);
      });
    });

    describe('deactivate', () => {
      beforeAll(async () => {
        fetchMock.mockClear();
        interceptor.stop();

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
      await interceptor.start();
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
        await xhrInterceptor.start();

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
        await xhrInterceptor.start();

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
        await xhrInterceptor.start();

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
        await xhrInterceptor.stop();

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
      await xhrInterceptor.start();
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
});
