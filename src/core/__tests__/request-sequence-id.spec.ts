import { REQUEST_SEQUENCE_ID } from '@constants/custom_headers';
import { RequestSequenceId } from '@core/request-sequence-id';

describe('RequestSequenceId', () => {
  const url = 'https://docs.stoobly.com/api/users';
  const otherPathUrl = 'https://docs.stoobly.com/api/posts';

  let sequenceId: RequestSequenceId;

  beforeEach(() => {
    sequenceId = new RequestSequenceId();
  });

  describe('buildScope', () => {
    test('uses method, scheme, domain, port, and path', () => {
      expect(
        RequestSequenceId.buildScope('get', 'https://docs.stoobly.com:8443/api/users?x=1')
      ).toBe('GET|https|docs.stoobly.com|8443|/api/users');
    });

    test('defaults https port to 443', () => {
      expect(RequestSequenceId.buildScope('POST', url)).toBe(
        'POST|https|docs.stoobly.com|443|/api/users'
      );
    });

    test('defaults http port to 80', () => {
      expect(RequestSequenceId.buildScope('GET', 'http://example.com/api')).toBe(
        'GET|http|example.com|80|/api'
      );
    });

    test('defaults missing method to GET', () => {
      expect(RequestSequenceId.buildScope('', url)).toBe(
        'GET|https|docs.stoobly.com|443|/api/users'
      );
    });

    test('resolves relative urls against window.location', () => {
      expect(RequestSequenceId.buildScope('GET', '/api/users')).toBe(
        `GET|${window.location.protocol.replace(/:$/, '')}|${window.location.hostname}|${
          window.location.port ||
          (window.location.protocol === 'https:' ? '443' : '80')
        }|/api/users`
      );
    });

    test('falls back to raw url when parsing fails', () => {
      // Invalid absolute URL that also cannot be resolved as a relative path.
      expect(RequestSequenceId.buildScope('GET', 'http://[invalid')).toBe('GET|http://[invalid');
    });
  });

  describe('next', () => {
    test('starts at 1 and increments per matching scope', () => {
      expect(sequenceId.next('GET', url)).toBe(1);
      expect(sequenceId.next('GET', url)).toBe(2);
      expect(sequenceId.next('GET', url)).toBe(3);
    });

    test('tracks separate counters for different paths', () => {
      expect(sequenceId.next('GET', url)).toBe(1);
      expect(sequenceId.next('GET', otherPathUrl)).toBe(1);
      expect(sequenceId.next('GET', url)).toBe(2);
    });

    test('tracks separate counters for different methods on the same path', () => {
      expect(sequenceId.next('GET', url)).toBe(1);
      expect(sequenceId.next('POST', url)).toBe(1);
      expect(sequenceId.next('GET', url)).toBe(2);
    });

    test('ignores query string when scoping', () => {
      expect(sequenceId.next('GET', `${url}?page=1`)).toBe(1);
      expect(sequenceId.next('GET', `${url}?page=2`)).toBe(2);
    });
  });

  describe('apply', () => {
    test(`sets '${REQUEST_SEQUENCE_ID}' as a string`, () => {
      const headers: Record<string, string> = {};
      sequenceId.apply(headers, 'GET', url);
      expect(headers[REQUEST_SEQUENCE_ID]).toBe('1');

      sequenceId.apply(headers, 'GET', url);
      expect(headers[REQUEST_SEQUENCE_ID]).toBe('2');
    });
  });

  describe('reset', () => {
    test('clears counters so the next id starts at 1 again', () => {
      expect(sequenceId.next('GET', url)).toBe(1);
      expect(sequenceId.next('GET', url)).toBe(2);

      sequenceId.reset();

      expect(sequenceId.next('GET', url)).toBe(1);
    });
  });
});
