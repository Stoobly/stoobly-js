import { PROXY_MODE, RECORD_ORDER, RECORD_POLICY, RECORD_STRATEGY, SCENARIO_KEY, SCENARIO_NAME, SESSION_ID, TEST_TITLE, RecordOrder, RecordPolicy, RecordStrategy } from "../../dist/esm/constants.js";
import Stoobly from '../../dist/esm/stoobly.js';
import { SERVER_URL } from '../server-config';

const scenarioKey = 'test';
const targetUrl = `${SERVER_URL}/headers`;

const stoobly = new Stoobly();
const interceptor = stoobly.cypressInterceptor({ 
  urls: [{ pattern: targetUrl }],
  scenarioKey,
});

describe('apply scenario with key', () => {
  const sessionId = 'id';

  beforeEach(() => {
    // Test title is automatically detected in the Cypress integration
    interceptor.apply({ sessionId });
  });

  after(() => {
    interceptor.clear();
  });

  it('should send default intercept headers', () => {
    // Intercept the request to inspect headers or body
    cy.intercept('GET', `${targetUrl}`).as('getHeaders');

    cy.visit(SERVER_URL);

    cy.wait('@getHeaders').then((interception) => {
      const responseBody = interception.response?.body || {};

      expect(responseBody[SCENARIO_KEY.toLowerCase()]).to.equal(scenarioKey);
      expect(responseBody[SESSION_ID.toLowerCase()]).to.equal(sessionId);
      expect(responseBody[TEST_TITLE.toLowerCase()]).to.equal(Cypress.currentTest.title)
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

describe('apply scenario with name', () => {
  const scenarioName = 'test-scenario-name';

  beforeEach(() => {
    // Test title is automatically detected in the Cypress integration
    interceptor.apply({ scenarioKey: undefined, scenarioName });
  });

  after(() => {
    interceptor.clear();
  });

  it('should send request with scenario name header', () => {
    // Intercept the request to inspect headers or body
    cy.intercept('GET', `${targetUrl}`).as('getHeaders');

    cy.visit(SERVER_URL);

    cy.wait('@getHeaders').then((interception) => {
      const responseBody = interception.response?.body || {};

      expect(responseBody[SCENARIO_NAME.toLowerCase()]).to.equal(scenarioName);
      expect(responseBody[TEST_TITLE.toLowerCase()]).to.equal(Cypress.currentTest.title);
      // Should not have scenario key when using scenario name
      expect(responseBody[SCENARIO_KEY.toLowerCase()]).to.be.undefined;
    });
  });
});

describe('applyRecord', () => {
  beforeEach(() => {
    interceptor.applyRecord();
  });

  it('should send request with intercept and record headers', () => {
    cy.intercept('GET', `${targetUrl}`).as('getHeaders');

    cy.visit(SERVER_URL);

    cy.wait('@getHeaders').then((interception) => {
      const responseBody = interception.response?.body || {};

      expect(responseBody[PROXY_MODE.toLowerCase()]).to.equal('record');
      expect(responseBody[TEST_TITLE.toLowerCase()]).to.equal(Cypress.currentTest.title);
      expect(responseBody[TEST_TITLE.toLowerCase()]).to.equal('should send request with intercept and record headers');
    });
  });

  describe('without session id', () => {
    it('should send record headers without session id when not provided', () => {
      interceptor.withSessionId(undefined);

      cy.intercept('GET', `${targetUrl}`).as('getHeaders');

      cy.visit(SERVER_URL);

      cy.wait('@getHeaders').then((interception) => {
        const responseBody = interception.response?.body || {};

        expect(responseBody[PROXY_MODE.toLowerCase()]).to.equal('record');
        expect(responseBody[SESSION_ID.toLowerCase()]).to.not.exist;
      });
    });
  });

  describe('clearRecord', () => {
    it('should remove intercept headers', () => {
      interceptor.clearRecord();

      cy.intercept('GET', `${targetUrl}`).as('getHeaders');

      cy.visit(SERVER_URL);

      // Expect cy.intercept to be removed
      cy.get('@getHeaders.all').then((interceptions) => {
        // The 'interceptions' variable is an array of all requests that matched
        // We expect this array to be empty (length of 0).
        expect(interceptions).to.have.length(0);
      });
    });
  });

  describe('record options', () => {
    it('should send record policy header when policy is "all"', () => {
      interceptor.withRecordPolicy(RecordPolicy.All);

      cy.intercept('GET', `${targetUrl}`).as('getHeaders');

      cy.visit(SERVER_URL);

      cy.wait('@getHeaders').then((interception) => {
        const responseBody = interception.response?.body || {};
        expect(responseBody[RECORD_POLICY.toLowerCase()]).to.equal(RecordPolicy.All);
        expect(responseBody[PROXY_MODE.toLowerCase()]).to.equal('record');
      });
    });

    it('should send record policy header when policy is "found"', () => {
      interceptor.withRecordPolicy(RecordPolicy.Found);

      cy.intercept('GET', `${targetUrl}`).as('getHeaders');

      cy.visit(SERVER_URL);

      cy.wait('@getHeaders').then((interception) => {
        const responseBody = interception.response?.body || {};
        expect(responseBody[RECORD_POLICY.toLowerCase()]).to.equal(RecordPolicy.Found);
      });
    });

    it('should send record policy header when policy is "not_found"', () => {
      interceptor.withRecordPolicy(RecordPolicy.NotFound);

      cy.intercept('GET', `${targetUrl}`).as('getHeaders');

      cy.visit(SERVER_URL);

      cy.wait('@getHeaders').then((interception) => {
        const responseBody = interception.response?.body || {};
        expect(responseBody[RECORD_POLICY.toLowerCase()]).to.equal(RecordPolicy.NotFound);
      });
    });

    it('should send record order header when order is "overwrite"', () => {
      interceptor.withRecordOrder(RecordOrder.Overwrite);

      cy.intercept('GET', `${targetUrl}`).as('getHeaders');

      cy.visit(SERVER_URL);

      cy.wait('@getHeaders').then((interception) => {
        const responseBody = interception.response?.body || {};
        expect(responseBody[RECORD_ORDER.toLowerCase()]).to.equal(RecordOrder.Overwrite);
      });
    });

    it('should not send record policy header when policy is not provided', () => {
      interceptor.withRecordPolicy(undefined);

      cy.intercept('GET', `${targetUrl}`).as('getHeaders');

      cy.visit(SERVER_URL);

      cy.wait('@getHeaders').then((interception) => {
        const responseBody = interception.response?.body || {};
        expect(responseBody[RECORD_POLICY.toLowerCase()]).to.be.undefined;
        expect(responseBody[PROXY_MODE.toLowerCase()]).to.equal('record');
      });
    });

    it('should send record strategy header when strategy is "full"', () => {
      interceptor.withRecordStrategy(RecordStrategy.Full);

      cy.intercept('GET', `${targetUrl}`).as('getHeaders');

      cy.visit(SERVER_URL);

      cy.wait('@getHeaders').then((interception) => {
        const responseBody = interception.response?.body || {};
        expect(responseBody[RECORD_STRATEGY.toLowerCase()]).to.equal(RecordStrategy.Full);
        expect(responseBody[PROXY_MODE.toLowerCase()]).to.equal('record');
      });
    });

    it('should send record strategy header when strategy is "minimal"', () => {
      interceptor.withRecordStrategy(RecordStrategy.Minimal);

      cy.intercept('GET', `${targetUrl}`).as('getHeaders');

      cy.visit(SERVER_URL);

      cy.wait('@getHeaders').then((interception) => {
        const responseBody = interception.response?.body || {};
        expect(responseBody[RECORD_STRATEGY.toLowerCase()]).to.equal(RecordStrategy.Minimal);
        expect(responseBody[PROXY_MODE.toLowerCase()]).to.equal('record');
      });
    });

    it('should not send record strategy header when strategy is not provided', () => {
      interceptor.withRecordStrategy(undefined);

      cy.intercept('GET', `${targetUrl}`).as('getHeaders');

      cy.visit(SERVER_URL);

      cy.wait('@getHeaders').then((interception) => {
        const responseBody = interception.response?.body || {};
        expect(responseBody[RECORD_STRATEGY.toLowerCase()]).to.be.undefined;
        expect(responseBody[PROXY_MODE.toLowerCase()]).to.equal('record');
      });
    });
  });
});

describe('Record order overwrite - per URL pattern tracking', () => {
  const url1 = `${SERVER_URL}/headers`;
  const url2 = `${SERVER_URL}/api/data`;
  
  const overwriteInterceptor = stoobly.cypressInterceptor({ 
    urls: [{ pattern: url1 }, { pattern: url2 }],
    record: {
      order: RecordOrder.Overwrite,
      policy: RecordPolicy.All,
      strategy: RecordStrategy.Full,
    },
    scenarioKey: 'overwrite-test',
  });

  afterEach(() => {
    overwriteInterceptor.clear();
  });

  it('should send overwrite headers only once per URL pattern', () => {
    overwriteInterceptor.applyRecord();
    
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
    // First apply
    overwriteInterceptor.applyRecord();

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
      overwriteInterceptor.applyRecord();
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
