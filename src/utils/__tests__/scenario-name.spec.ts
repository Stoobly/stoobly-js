import {pathBasename, scenarioNameFromFileAndTitle} from '../scenario-name';

describe('scenario-name', () => {
  describe('pathBasename', () => {
    it('returns the last path segment', () => {
      expect(pathBasename('e2e/playwright/interceptor.spec.js')).toBe(
        'interceptor.spec.js'
      );
      expect(pathBasename('e2e\\playwright\\interceptor.spec.js')).toBe(
        'interceptor.spec.js'
      );
    });

    it('returns the input when there is no separator', () => {
      expect(pathBasename('interceptor.spec.js')).toBe('interceptor.spec.js');
    });
  });

  describe('scenarioNameFromFileAndTitle', () => {
    it('joins basename and title with >', () => {
      expect(
        scenarioNameFromFileAndTitle(
          'e2e/playwright/interceptor.spec.js',
          'should send request with scenario name header'
        )
      ).toBe(
        'interceptor.spec.js -- should send request with scenario name header'
      );
    });

    it('returns only the available part when one is missing', () => {
      expect(scenarioNameFromFileAndTitle('a/b.spec.js', null)).toBe(
        'b.spec.js'
      );
      expect(scenarioNameFromFileAndTitle(null, 'my test')).toBe('my test');
    });

    it('returns undefined when both are missing', () => {
      expect(scenarioNameFromFileAndTitle(undefined, undefined)).toBeUndefined();
    });
  });
});
