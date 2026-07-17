import { 
  MATCH_RULES,
  OPENAPI_SPECIFICATION_PATH,
  PROXY_MODE,
  PUBLIC_DIRECTORY_PATH,
  RECORD_ORDER,
  RECORD_POLICY,
  RECORD_STRATEGY,
  REQUEST_SEQUENCE_ID,
  RESPONSE_FIXTURES_PATH,
  REWRITE_RULES,
  SCENARIO_KEY,
  SCENARIO_NAME,
  SESSION_ID,
  TEST_POLICY,
  TEST_TITLE,
  InterceptMode,
  RecordOrder,
  RecordPolicy,
  RecordStrategy,
  TestPolicy,
} from "../../dist/esm/constants.js";
import { buildStooblyInterceptor, targetUrl, matchRules, rewriteRules, stoobly } from './fixtures/stoobly';

import { SERVER_URL } from '../server-config';

const sequenceHeader = REQUEST_SEQUENCE_ID.toLowerCase();

describe('Options', () => {
  const stooblyInterceptor = buildStooblyInterceptor();

  beforeEach(() => {
    stooblyInterceptor.enable();
  });

  it('should send headers', () => {
    // Intercept the request to inspect headers or body
    cy.intercept('GET', `${targetUrl}`).as('getHeaders');

    cy.visit(SERVER_URL);

    cy.wait('@getHeaders').then((interception) => {
      const responseBody = interception.response?.body || {};

      expect(responseBody[PROXY_MODE.toLowerCase()]).to.be.undefined;
      expect(responseBody[RECORD_ORDER.toLowerCase()]).to.be.undefined;
      expect(responseBody[RECORD_POLICY.toLowerCase()]).to.be.undefined;
      expect(responseBody[RECORD_STRATEGY.toLowerCase()]).to.be.undefined;
      expect(responseBody[SCENARIO_KEY.toLowerCase()]).to.be.undefined;
      expect(responseBody[SCENARIO_NAME.toLowerCase()]).to.be.undefined;
      expect(responseBody[SESSION_ID.toLowerCase()]).not.to.be.undefined;
      expect(responseBody[sequenceHeader]).to.equal('1');

      // matchRules: base64-encoded JSON
      const matchRulesEncoded = responseBody[MATCH_RULES.toLowerCase()];
      expect(matchRulesEncoded).to.exist;
      expect(JSON.parse(atob(matchRulesEncoded))).to.deep.equal(matchRules);

      // rewriteRules: base64-encoded JSON (serialized with url_rules, parameter_rules in snake_case)
      const rewriteRulesEncoded = responseBody[REWRITE_RULES.toLowerCase()];
      expect(rewriteRulesEncoded).to.exist;
      expect(JSON.parse(atob(rewriteRulesEncoded))).to.deep.equal([{ url_rules: [{ path: '/new-path' }] }]);
    });
  });

  it('does not require enable() after changing settings', () => {
    stooblyInterceptor.withScenarioName('test');

    cy.intercept('GET', `${targetUrl}`).as('getHeaders');

    cy.visit(SERVER_URL);

    cy.wait('@getHeaders').then((interception) => {
      const responseBody = interception.response?.body || {};
      expect(responseBody[SCENARIO_NAME.toLowerCase()]).to.equal('test');
    });
  });

  it('preserves setting changes from previous tests', () => {
    cy.intercept('GET', `${targetUrl}`).as('getHeaders');

    cy.visit(SERVER_URL);

    cy.wait('@getHeaders').then((interception) => {
      const responseBody = interception.response?.body || {};
      expect(responseBody[SCENARIO_NAME.toLowerCase()]).to.equal('test');
    });
  });

  describe('withDefaultSettings', () => {
    it('resets settings changes', () => {
      stooblyInterceptor.withDefaultSettings();

      cy.intercept('GET', `${targetUrl}`).as('getHeaders');
      cy.visit(SERVER_URL);

      cy.wait('@getHeaders').then((interception) => {
        const responseBody = interception.response?.body || {};
        expect(responseBody[SCENARIO_NAME.toLowerCase()]).to.be.undefined;
      });
    });
  });
});

describe('Test title', () => {
  const stooblyInterceptor = buildStooblyInterceptor();

  beforeEach(() => {
    // Test title is automatically detected in the Cypress integration
    stooblyInterceptor.enable();
  });

  it('should send headers', () => {
    // Intercept the request to inspect headers or body
    cy.intercept('GET', `${targetUrl}`).as('getHeaders');

    cy.visit(SERVER_URL);

    cy.wait('@getHeaders').then((interception) => {
      const responseBody = interception.response?.body || {};
      expect(responseBody[TEST_TITLE.toLowerCase()]).to.equal('should send headers');
    });
  });

  it('another test should have a different test title in the headers', () => {
    // Intercept the request to inspect headers or body
    cy.intercept('GET', `${targetUrl}`).as('getHeaders');

    cy.visit(SERVER_URL);

    cy.wait('@getHeaders').then((interception) => {
      const responseBody = interception.response?.body || {};

      expect(responseBody[TEST_TITLE.toLowerCase()]).to.equal('another test should have a different test title in the headers')
    });
  });
});

describe('Scenario', () => {
  describe('withScenarioNameFromTest', () => {
    const stooblyInterceptor = buildStooblyInterceptor();

    beforeEach(() => {
      stooblyInterceptor.withScenarioNameFromTest().enable();
    });

    it('sets X-Stoobly-Scenario-Name from Cypress.currentTest.titlePath.join(" > ")', () => {
  ;
      cy.intercept('GET', `${targetUrl}`).as('getHeaders');
      cy.visit(SERVER_URL);

      cy.wait('@getHeaders').then((interception) => {
        const responseBody = interception.response?.body || {};
        const scenarioName = Cypress.currentTest.titlePath.join(' > ');

        expect(responseBody[SCENARIO_NAME.toLowerCase()]).to.equal(scenarioName);
      });
    });
  });

  describe('withScenarioKey', () => {
    const scenarioKey = 'test-scenario-key';
    const stooblyInterceptor = buildStooblyInterceptor();

    beforeEach(() => {
      // Test title is automatically detected in the Cypress integration
      stooblyInterceptor.enable({ scenarioKey });
    });

    it('should send request with scenario name header', () => {
      // Intercept the request to inspect headers or body
      cy.intercept('GET', `${targetUrl}`).as('getHeaders');

      cy.visit(SERVER_URL);

      cy.wait('@getHeaders').then((interception) => {
        const responseBody = interception.response?.body || {};

        expect(responseBody[SCENARIO_KEY.toLowerCase()]).to.equal(scenarioKey);
      });
    });
  });
});

describe('withInterceptModeRecord', () => {
  const stooblyInterceptor = buildStooblyInterceptor();

  beforeEach(() => {
    stooblyInterceptor.enable({
      mode: InterceptMode.record,
      record: {
        order: RecordOrder.Overwrite,
        policy: RecordPolicy.All,
        strategy: RecordStrategy.Full,
      },
    });
  });

  it('should send record headers', () => {
    cy.intercept('GET', `${targetUrl}`).as('getHeaders');
    cy.visit(SERVER_URL);
    cy.wait('@getHeaders').then((interception) => {
      const responseBody = interception.response?.body || {};

      expect(responseBody[PROXY_MODE.toLowerCase()]).to.equal(InterceptMode.record);
      expect(responseBody[RECORD_ORDER.toLowerCase()]).to.equal(RecordOrder.Overwrite);
      expect(responseBody[RECORD_POLICY.toLowerCase()]).to.equal(RecordPolicy.All);
      expect(responseBody[RECORD_STRATEGY.toLowerCase()]).to.equal(RecordStrategy.Full);
    });
  });

  describe('without', () => {
    it('should remove intercept headers', () => {
      stooblyInterceptor.withInterceptMode();

      cy.intercept('GET', `${targetUrl}`).as('getHeaders');

      cy.visit(SERVER_URL);

      cy.wait('@getHeaders').then((interception) => {
        const responseBody = interception.response?.body || {};
        expect(responseBody[PROXY_MODE.toLowerCase()]).to.be.undefined;
      });
    });
  });
});

describe('Record settings', () => {
  const stooblyInterceptor = buildStooblyInterceptor();

  beforeEach(() => {
    stooblyInterceptor.enable({
      mode: InterceptMode.record,
      record: {
        order: RecordOrder.Overwrite,
        policy: RecordPolicy.All,
        strategy: RecordStrategy.Full,
      },
    });
  });

  it('should send record policy header when policy is "all"', () => {
    stooblyInterceptor.withRecordPolicy(RecordPolicy.All);

    cy.intercept('GET', `${targetUrl}`).as('getHeaders');

    cy.visit(SERVER_URL);

    cy.wait('@getHeaders').then((interception) => {
      const responseBody = interception.response?.body || {};
      expect(responseBody[RECORD_POLICY.toLowerCase()]).to.equal(RecordPolicy.All);
      expect(responseBody[PROXY_MODE.toLowerCase()]).to.equal('record');
    });
  });

  it('should send record policy header when policy is "found"', () => {
    stooblyInterceptor.withRecordPolicy(RecordPolicy.Found);

    cy.intercept('GET', `${targetUrl}`).as('getHeaders');

    cy.visit(SERVER_URL);

    cy.wait('@getHeaders').then((interception) => {
      const responseBody = interception.response?.body || {};
      expect(responseBody[RECORD_POLICY.toLowerCase()]).to.equal(RecordPolicy.Found);
    });
  });

  it('should send record policy header when policy is "not_found"', () => {
    stooblyInterceptor.withRecordPolicy(RecordPolicy.NotFound);

    cy.intercept('GET', `${targetUrl}`).as('getHeaders');

    cy.visit(SERVER_URL);

    cy.wait('@getHeaders').then((interception) => {
      const responseBody = interception.response?.body || {};
      expect(responseBody[RECORD_POLICY.toLowerCase()]).to.equal(RecordPolicy.NotFound);
    });
  });

  it('should send record order header when order is "overwrite"', () => {
    stooblyInterceptor.withRecordOrder(RecordOrder.Overwrite);

    cy.intercept('GET', `${targetUrl}`).as('getHeaders');

    cy.visit(SERVER_URL);

    cy.wait('@getHeaders').then((interception) => {
      const responseBody = interception.response?.body || {};
      expect(responseBody[RECORD_ORDER.toLowerCase()]).to.equal(RecordOrder.Overwrite);
    });
  });

  it('should not send record policy header when policy is not provided', () => {
    stooblyInterceptor.withRecordPolicy(undefined);

    cy.intercept('GET', `${targetUrl}`).as('getHeaders');

    cy.visit(SERVER_URL);

    cy.wait('@getHeaders').then((interception) => {
      const responseBody = interception.response?.body || {};
      expect(responseBody[RECORD_POLICY.toLowerCase()]).to.be.undefined;
      expect(responseBody[PROXY_MODE.toLowerCase()]).to.equal('record');
    });
  });

  it('should send record strategy header when strategy is "full"', () => {
    stooblyInterceptor.withRecordStrategy(RecordStrategy.Full);

    cy.intercept('GET', `${targetUrl}`).as('getHeaders');

    cy.visit(SERVER_URL);

    cy.wait('@getHeaders').then((interception) => {
      const responseBody = interception.response?.body || {};
      expect(responseBody[RECORD_STRATEGY.toLowerCase()]).to.equal(RecordStrategy.Full);
      expect(responseBody[PROXY_MODE.toLowerCase()]).to.equal('record');
    });
  });

  it('should send record strategy header when strategy is "minimal"', () => {
    stooblyInterceptor.withRecordStrategy(RecordStrategy.Minimal);

    cy.intercept('GET', `${targetUrl}`).as('getHeaders');

    cy.visit(SERVER_URL);

    cy.wait('@getHeaders').then((interception) => {
      const responseBody = interception.response?.body || {};
      expect(responseBody[RECORD_STRATEGY.toLowerCase()]).to.equal(RecordStrategy.Minimal);
      expect(responseBody[PROXY_MODE.toLowerCase()]).to.equal('record');
    });
  });

  it('should not send record strategy header when strategy is not provided', () => {
    stooblyInterceptor.withRecordStrategy(undefined);

    cy.intercept('GET', `${targetUrl}`).as('getHeaders');

    cy.visit(SERVER_URL);

    cy.wait('@getHeaders').then((interception) => {
      const responseBody = interception.response?.body || {};
      expect(responseBody[RECORD_STRATEGY.toLowerCase()]).to.be.undefined;
      expect(responseBody[PROXY_MODE.toLowerCase()]).to.equal('record');
    });
  });

  describe('Record order overwrite', () => {
    const url1 = `${SERVER_URL}/headers`;
    const url2 = `${SERVER_URL}/api/data`;
    
    const overwriteInterceptor = stoobly.cypressInterceptor({ 
      urls: [{ pattern: url1 }, { pattern: url2 }],
      record: {
        order: RecordOrder.Overwrite,
        policy: RecordPolicy.All,
        strategy: RecordStrategy.Full,
      },
    });

    beforeEach(() => {
      overwriteInterceptor.withInterceptModeRecord().apply();
    });

    afterEach(() => {
      overwriteInterceptor.clear();
    });

    it('should send overwrite headers only once per URL pattern', () => {
      let overwriteId;

      // First request to url1 - should include RECORD_ORDER and OVERWRITE_ID
      cy.intercept('GET', url1).as('request1');
      cy.visit(SERVER_URL);
      
      cy.wait('@request1').its('response.body').then((body) => {
        expect(body[RECORD_ORDER.toLowerCase()]).to.equal(RecordOrder.Overwrite);
        expect(body['x-stoobly-overwrite-id']).to.exist;
        overwriteId = body['x-stoobly-overwrite-id'];
      });

      // Second request to url1 - should NOT include RECORD_ORDER or OVERWRITE_ID
      cy.intercept('GET', url1).as('request2');
      cy.visit(SERVER_URL);
      
      cy.wait('@request2').its('response.body').then((body) => {
        expect(body[RECORD_ORDER.toLowerCase()]).to.be.undefined;
        expect(body['x-stoobly-overwrite-id']).to.be.undefined;
      });

      // First request to url2 via fetch - should include RECORD_ORDER and OVERWRITE_ID (same ID)
      cy.intercept('GET', url2).as('request3');
      cy.window().then((win) => {
        win.fetch(url2);
      });
      
      cy.wait('@request3').its('response.body').then((body) => {
        expect(body[RECORD_ORDER.toLowerCase()]).to.equal(RecordOrder.Overwrite);
        expect(body['x-stoobly-overwrite-id']).to.equal(overwriteId);
      });

      // Second request to url2 - should NOT include RECORD_ORDER or OVERWRITE_ID
      cy.intercept('GET', url2).as('request4');
      cy.window().then((win) => {
        win.fetch(url2);
      });
      
      cy.wait('@request4').its('response.body').then((body) => {
        expect(body[RECORD_ORDER.toLowerCase()]).to.be.undefined;
        expect(body['x-stoobly-overwrite-id']).to.be.undefined;
      });
    });

    it('should reset URL tracking when apply() is called again', () => {
      // First request should have overwrite headers
      cy.intercept('GET', url1).as('request1');
      cy.visit(SERVER_URL);
      
      cy.wait('@request1').its('response.body').then((body) => {
        expect(body[RECORD_ORDER.toLowerCase()]).to.equal(RecordOrder.Overwrite);
        expect(body['x-stoobly-overwrite-id']).to.exist;
      });

      // Second request should NOT have overwrite headers
      cy.intercept('GET', url1).as('request2');
      cy.visit(SERVER_URL);
      
      cy.wait('@request2').its('response.body').then((body) => {
        expect(body[RECORD_ORDER.toLowerCase()]).to.be.undefined;
        expect(body['x-stoobly-overwrite-id']).to.be.undefined;
      });

      // Apply again - should reset tracking
      cy.then(() => {
        overwriteInterceptor.withInterceptModeRecord().apply();
      });

      // First request after reapply should have overwrite headers again
      cy.intercept('GET', url1).as('request3');
      cy.visit(SERVER_URL);
      
      cy.wait('@request3').its('response.body').then((body) => {
        expect(body[RECORD_ORDER.toLowerCase()]).to.equal(RecordOrder.Overwrite);
        expect(body['x-stoobly-overwrite-id']).to.exist;
      });
    });
  });
});

describe('disable', () => {
  const stooblyInterceptor = buildStooblyInterceptor();

  beforeEach(() => {
    stooblyInterceptor.enable();
  });

  it('should remove handlers', () => {
    const scenarioKey = 'test-clear';
    const sessionId = 'clear-session';

    stooblyInterceptor.withScenarioKey(scenarioKey);
    stooblyInterceptor.withSessionId(sessionId);

    // First request should have headers
    cy.intercept('GET', `${targetUrl}`).as('getHeaders');
    cy.visit(SERVER_URL);
    cy.wait('@getHeaders').then((interception) => {
      const responseBody = interception.response?.body || {};
      expect(responseBody[SCENARIO_KEY.toLowerCase()]).to.equal(scenarioKey);
      expect(responseBody[SESSION_ID.toLowerCase()]).to.equal(sessionId);
    });

    // Clear handlers
    stooblyInterceptor.disable();

    // Second request should not have headers
    cy.intercept('GET', `${targetUrl}`).as('getHeaders');
    cy.visit(SERVER_URL);
    cy.wait('@getHeaders').then((interception) => {
      const responseBody = interception.response?.body || {};
      expect(responseBody[SCENARIO_KEY.toLowerCase()]).to.be.undefined;
      expect(responseBody[SESSION_ID.toLowerCase()]).to.be.undefined;
    });
  });
});

describe('InterceptorUrl', () => {
  const stooblyInterceptor = buildStooblyInterceptor();
  const headersUrl = `${SERVER_URL}/headers`;
  const apiDataUrl = `${SERVER_URL}/api/data`;

  it('does not set match or rewrite headers when InterceptorUrl has only a pattern', () => {
    stooblyInterceptor.enable({ urls: [{ pattern: headersUrl }] });

    cy.intercept('GET', `${headersUrl}`).as('getHeaders');
    cy.visit(SERVER_URL);

    cy.wait('@getHeaders').then((interception) => {
      const responseBody = interception.response?.body || {};

      expect(responseBody[SESSION_ID.toLowerCase()]).to.exist;
      expect(responseBody[MATCH_RULES.toLowerCase()]).to.be.undefined;
      expect(responseBody[REWRITE_RULES.toLowerCase()]).to.be.undefined;
      expect(responseBody[PUBLIC_DIRECTORY_PATH.toLowerCase()]).to.be.undefined;
      expect(responseBody[RESPONSE_FIXTURES_PATH.toLowerCase()]).to.be.undefined;
      expect(responseBody[OPENAPI_SPECIFICATION_PATH.toLowerCase()]).to.be.undefined;
    });
  });

  it('applies match headers from the matching InterceptorUrl and mock headers from settings', () => {
    const rulesForHeaders = [{ modes: [InterceptMode.replay], components: 'Header' }];
    const rulesForApi = [{ modes: [InterceptMode.replay], components: 'Body' }];
    const publicDirectoryPath = '/shared-public';
    const responseFixturesPath = '/shared-fixtures';
    const openApiSpecificationPath = '/shared-openapi.yaml';

    stooblyInterceptor.enable({
      mode: InterceptMode.mock,
      publicDirectoryPath,
      responseFixturesPath,
      openApiSpecificationPath,
      urls: [
        { pattern: headersUrl, matchRules: rulesForHeaders },
        { pattern: apiDataUrl, matchRules: rulesForApi },
      ],
    });

    cy.intercept('GET', `${headersUrl}`).as('getHeaders');
    cy.intercept('GET', `${apiDataUrl}`).as('getApiData');

    cy.visit(SERVER_URL);

    cy.wait('@getHeaders').then((interception) => {
      const body = interception.response?.body || {};
      const encoded = body[MATCH_RULES.toLowerCase()];
      expect(JSON.parse(atob(encoded))).to.deep.equal(rulesForHeaders);
      expect(body[PUBLIC_DIRECTORY_PATH.toLowerCase()]).to.equal(publicDirectoryPath);
      expect(body[RESPONSE_FIXTURES_PATH.toLowerCase()]).to.equal(responseFixturesPath);
      expect(body[OPENAPI_SPECIFICATION_PATH.toLowerCase()]).to.equal(openApiSpecificationPath);
    });

    cy.window().then((win) => {
      win.fetch(apiDataUrl);
    });

    cy.wait('@getApiData').then((interception) => {
      const body = interception.response?.body || {};
      const encoded = body[MATCH_RULES.toLowerCase()];
      expect(JSON.parse(atob(encoded))).to.deep.equal(rulesForApi);
      expect(body[PUBLIC_DIRECTORY_PATH.toLowerCase()]).to.equal(publicDirectoryPath);
      expect(body[RESPONSE_FIXTURES_PATH.toLowerCase()]).to.equal(responseFixturesPath);
      expect(body[OPENAPI_SPECIFICATION_PATH.toLowerCase()]).to.equal(openApiSpecificationPath);
    });
  });

  it('applies match headers from the matching InterceptorUrl and test headers from settings', () => {
    const rulesForHeaders = [{ modes: [InterceptMode.replay], components: 'Header' }];
    const rulesForApi = [{ modes: [InterceptMode.replay], components: 'Body' }];
    const publicDirectoryPath = '/test-public';
    const responseFixturesPath = '/test-fixtures';
    const openApiSpecificationPath = '/test-openapi.yaml';

    stooblyInterceptor.enable({
      mode: InterceptMode.test,
      test: {
        policy: TestPolicy.Found,
      },
      publicDirectoryPath,
      responseFixturesPath,
      openApiSpecificationPath,
      urls: [
        { pattern: headersUrl, matchRules: rulesForHeaders },
        { pattern: apiDataUrl, matchRules: rulesForApi },
      ],
    });

    cy.intercept('GET', `${headersUrl}`).as('getHeaders');
    cy.intercept('GET', `${apiDataUrl}`).as('getApiData');

    cy.visit(SERVER_URL);

    cy.wait('@getHeaders').then((interception) => {
      const body = interception.response?.body || {};
      const encoded = body[MATCH_RULES.toLowerCase()];
      expect(JSON.parse(atob(encoded))).to.deep.equal(rulesForHeaders);
      expect(body[TEST_POLICY.toLowerCase()]).to.equal(TestPolicy.Found);
      expect(body[PUBLIC_DIRECTORY_PATH.toLowerCase()]).to.equal(publicDirectoryPath);
      expect(body[RESPONSE_FIXTURES_PATH.toLowerCase()]).to.equal(responseFixturesPath);
      expect(body[OPENAPI_SPECIFICATION_PATH.toLowerCase()]).to.equal(openApiSpecificationPath);
    });

    cy.window().then((win) => {
      win.fetch(apiDataUrl);
    });

    cy.wait('@getApiData').then((interception) => {
      const body = interception.response?.body || {};
      const encoded = body[MATCH_RULES.toLowerCase()];
      expect(JSON.parse(atob(encoded))).to.deep.equal(rulesForApi);
      expect(body[TEST_POLICY.toLowerCase()]).to.equal(TestPolicy.Found);
      expect(body[PUBLIC_DIRECTORY_PATH.toLowerCase()]).to.equal(publicDirectoryPath);
      expect(body[RESPONSE_FIXTURES_PATH.toLowerCase()]).to.equal(responseFixturesPath);
      expect(body[OPENAPI_SPECIFICATION_PATH.toLowerCase()]).to.equal(openApiSpecificationPath);
    });
  });
});

describe('Urls', () => {
  const stooblyInterceptor = buildStooblyInterceptor();

  beforeEach(() => {
    stooblyInterceptor.enable();
  });
  
  it('should apply new urls when changing urls', () => {
    const scenarioKey = 'test-url-change';
    stooblyInterceptor.withScenarioKey(scenarioKey);

    cy.intercept('GET', `${targetUrl}`).as('getHeaders');
    cy.visit(SERVER_URL);
    cy.wait('@getHeaders').then((interception) => {
      const responseBody = interception.response?.body || {};
      expect(responseBody[SCENARIO_KEY.toLowerCase()]).to.equal(scenarioKey);
    });

    stooblyInterceptor.enable({ urls: [{ pattern: `${SERVER_URL}/different` }] });

    cy.intercept('GET', `${targetUrl}`).as('getHeaders');
    cy.visit(SERVER_URL);
    cy.wait('@getHeaders').then((interception) => {
      const responseBody = interception.response?.body || {};
      expect(responseBody[SCENARIO_KEY.toLowerCase()]).to.be.undefined;
    });
  });
});

describe('Request sequence id', () => {
  const url1 = `${SERVER_URL}/headers`;
  const url2 = `${SERVER_URL}/api/data`;

  const sequenceInterceptor = stoobly.cypressInterceptor({
    urls: [{ pattern: url1 }, { pattern: url2 }],
  });

  beforeEach(() => {
    sequenceInterceptor.enable({
      urls: [{ pattern: url1 }, { pattern: url2 }],
    });
  });

  afterEach(() => {
    sequenceInterceptor.disable();
  });

  it('starts at 1', () => {
    cy.intercept('GET', url1).as('request1');
    cy.visit(SERVER_URL);

    cy.wait('@request1').its('response.body').then((headers) => {
      expect(headers[sequenceHeader]).to.equal('1');
    });
  });

  it('increments for the same method + scheme + domain + port + path', () => {
    cy.intercept('GET', url1).as('request1');
    cy.visit(SERVER_URL);
    cy.wait('@request1').its('response.body').then((headers) => {
      expect(headers[sequenceHeader]).to.equal('1');
    });

    cy.intercept('GET', url1).as('request2');
    cy.visit(SERVER_URL);
    cy.wait('@request2').its('response.body').then((headers) => {
      expect(headers[sequenceHeader]).to.equal('2');
    });

    cy.intercept('GET', url1).as('request3');
    cy.visit(SERVER_URL);
    cy.wait('@request3').its('response.body').then((headers) => {
      expect(headers[sequenceHeader]).to.equal('3');
    });
  });

  it('tracks separate counters for different paths', () => {
    cy.intercept('GET', url1).as('request1');
    cy.visit(SERVER_URL);
    cy.wait('@request1').its('response.body').then((headers) => {
      expect(headers[sequenceHeader]).to.equal('1');
    });

    cy.intercept('GET', url2).as('request2');
    cy.window().then((win) => {
      win.fetch(url2);
    });
    cy.wait('@request2').its('response.body').then((headers) => {
      expect(headers[sequenceHeader]).to.equal('1');
    });

    cy.intercept('GET', url1).as('request3');
    cy.visit(SERVER_URL);
    cy.wait('@request3').its('response.body').then((headers) => {
      expect(headers[sequenceHeader]).to.equal('2');
    });
  });

  it('resets when a new session is created after disable()', () => {
    cy.intercept('GET', url1).as('request1');
    cy.visit(SERVER_URL);
    cy.wait('@request1').its('response.body').then((headers) => {
      expect(headers[sequenceHeader]).to.equal('1');
    });

    cy.intercept('GET', url1).as('request2');
    cy.visit(SERVER_URL);
    cy.wait('@request2').its('response.body').then((headers) => {
      expect(headers[sequenceHeader]).to.equal('2');

      // Must run inside .then() so disable/enable happen after request2 in the Cypress queue.
      sequenceInterceptor.disable();
      sequenceInterceptor.enable({
        sessionId: 'new-sequence-session',
        urls: [{ pattern: url1 }, { pattern: url2 }],
      });
    });

    cy.intercept('GET', url1).as('request3');
    cy.visit(SERVER_URL);
    cy.wait('@request3').its('response.body').then((headers) => {
      expect(headers[sequenceHeader]).to.equal('1');
    });
  });

  it('does not reset when enable() is called without clearing the session', () => {
    cy.intercept('GET', url1).as('request1');
    cy.visit(SERVER_URL);
    cy.wait('@request1').its('response.body').then((headers) => {
      expect(headers[sequenceHeader]).to.equal('1');

      // Must run inside .then() so re-enable happens after request1 in the Cypress queue.
      sequenceInterceptor.enable({
        urls: [{ pattern: url1 }, { pattern: url2 }],
      });
    });

    cy.intercept('GET', url1).as('request2');
    cy.visit(SERVER_URL);
    cy.wait('@request2').its('response.body').then((headers) => {
      expect(headers[sequenceHeader]).to.equal('2');
    });
  });
});
