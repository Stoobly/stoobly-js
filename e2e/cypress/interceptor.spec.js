import { PROXY_MODE, RECORD_ORDER, RECORD_POLICY, RECORD_STRATEGY, SCENARIO_KEY, SCENARIO_NAME, SESSION_ID, TEST_TITLE, RecordOrder, RecordPolicy, RecordStrategy } from "../../dist/esm/constants.js";
import Stoobly from '../../dist/esm/stoobly.js';
import { SERVER_URL } from '../server-config';

const scenarioKey = 'test';
const targetUrl = `${SERVER_URL}/headers`;

const stoobly = new Stoobly();
const interceptor = stoobly.cypressInterceptor({ 
  urls: [targetUrl],
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

  afterEach(() => {
    //interceptor.clearRecord();
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
      cy.intercept('GET', `${targetUrl}`).as('getHeaders');

      cy.visit(SERVER_URL);

      cy.wait('@getHeaders').then((interception) => {
        const responseBody = interception.response?.body || {};
        expect(responseBody[PROXY_MODE.toLowerCase()]).to.equal('record');

        // Stop recording
        interceptor.clearRecord();
      });

      cy.visit(SERVER_URL);

      // Expect cy.intercept to be removed
      cy.intercept('GET', `${targetUrl}`).should('not.exist');
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
