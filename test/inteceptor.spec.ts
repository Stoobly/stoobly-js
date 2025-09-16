import {jest} from '@jest/globals';
import {SpiedFunction} from 'jest-mock';

import {SCENARIO_KEY, SESSION_ID, TEST_NAME} from '@constants/custom_headers';
import {Interceptor} from '@core/interceptor';

describe('Interceptor', () => {
  const scenarioKey = 'test-key';
  const sessionId = 'test-session';
  const testName = 'sample-test';
  const allowedOrigin = 'https://docs.stoobly.com';
  const notAllowedOrigin = 'https://example.com';

  let interceptor: Interceptor;

  describe('fetch', () => {
    const allowedUrl = `${allowedOrigin}/test`;

    const fetchMock = jest.fn(async (): Promise<Response> => {
      return Promise.resolve(new Response(null, {status: 200}));
    });
    const originalFetch: typeof window.fetch = window.fetch;

    beforeAll(() => {
      Interceptor.originalFetch = fetchMock;

      interceptor = new Interceptor();
      interceptor.withScenario(scenarioKey);
      interceptor.withTestName(testName);
    });

    afterAll(() => {
      Interceptor.originalFetch = originalFetch;
    });

    describe('when strict matching', () => {
      beforeAll(async () => {
        interceptor.withUrls([allowedUrl]);
        interceptor.apply(sessionId);

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

      test(`adds '${TEST_NAME}' header to fetch requests`, async () => {
        expect(fetchMock).toHaveBeenCalledWith(allowedUrl, {
          headers: expect.objectContaining({
            [TEST_NAME]: testName,
          }),
        });
      });
    });

    describe('when RegExp matching', () => {
      beforeAll(async () => {
        interceptor.withUrls([new RegExp(`${allowedOrigin}/.*`)]);
        interceptor.apply(sessionId);

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

      test(`adds '${TEST_NAME}' header to fetch requests`, async () => {
        expect(fetchMock).toHaveBeenCalledWith(allowedUrl, {
          headers: expect.objectContaining({
            [TEST_NAME]: testName,
          }),
        });
      });
    });

    describe('when not allowed', () => {
      const notAllowedUrl = `${notAllowedOrigin}/test`;

      beforeAll(async () => {
        interceptor.apply(sessionId);

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

  describe('XMLHttpRequest.prototype.open', () => {
    const allowedUrl = `${allowedOrigin}/test`;

    const originalXMLHttpRequestOpen: typeof XMLHttpRequest.prototype.open =
      XMLHttpRequest.prototype.open;
    let setRequestHeaderMock: SpiedFunction<
      (name: string, value: string) => void
    >;

    beforeAll(() => {
      interceptor.withScenario(scenarioKey);
      interceptor.withTestName(testName);
    });

    afterAll(() => {
      XMLHttpRequest.prototype.open = originalXMLHttpRequestOpen;
    });

    describe('when strict matching', () => {
      beforeAll(() => {
        interceptor.withUrls([allowedUrl]);
        interceptor.apply(sessionId);

        const xhr = new XMLHttpRequest();
        xhr.open('GET', allowedUrl);
        setRequestHeaderMock = jest.spyOn(xhr, 'setRequestHeader');
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

      test(`adds '${TEST_NAME}' header to XMLHttpRequest`, async () => {
        expect(setRequestHeaderMock).toHaveBeenCalledWith(TEST_NAME, testName);
      });
    });

    describe('when RegExp matching', () => {
      beforeAll(() => {
        interceptor.withUrls([new RegExp(`${allowedOrigin}/.*`)]);
        interceptor.apply(sessionId);

        const xhr = new XMLHttpRequest();
        xhr.open('GET', allowedUrl);
        setRequestHeaderMock = jest.spyOn(xhr, 'setRequestHeader');
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

      test(`adds '${TEST_NAME}' header to XMLHttpRequest`, async () => {
        expect(setRequestHeaderMock).toHaveBeenCalledWith(TEST_NAME, testName);
      });
    });

    describe('when not allowed', () => {
      const notAllowedUrl = `${notAllowedOrigin}/test`;

      beforeAll(async () => {
        interceptor.apply(sessionId);

        const xhr = new XMLHttpRequest();
        xhr.open('GET', allowedUrl);
        setRequestHeaderMock = jest.spyOn(xhr, 'setRequestHeader');
        xhr.dispatchEvent(new Event('readystatechange'));

        setRequestHeaderMock.mockClear();
        await fetch(notAllowedUrl);
      });

      test(`headers not added`, async () => {
        expect(setRequestHeaderMock).not.toHaveBeenCalled();
      });
    });

    describe('deactivate', () => {
      beforeAll(() => {
        interceptor.clear();

        const xhr = new XMLHttpRequest();
        xhr.open('GET', allowedUrl);
        setRequestHeaderMock = jest.spyOn(xhr, 'setRequestHeader');
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
});
