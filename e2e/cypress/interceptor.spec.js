import { PROXY_MODE, RECORD_ORDER, RECORD_POLICY, RECORD_STRATEGY, SCENARIO_KEY, SCENARIO_NAME, SESSION_ID, TEST_TITLE, RecordOrder, RecordPolicy, RecordStrategy } from "../../dist/esm/constants.js";
import Stoobly from '../../dist/esm/stoobly.js';
import { SERVER_URL } from '../server-config';

const stoobly = new Stoobly();
const targetUrl = `${SERVER_URL}/headers`;
const interceptor = stoobly.cypressInterceptor({ 
  urls: [targetUrl],
});

describe('applyScenario', () => {
  const scenarioKey = 'test';
  const sessionId = 'id';

  beforeEach(() => {
    // Test title is automatically detected in the Cypress integration
    interceptor.withScenarioKey(scenarioKey);
    interceptor.withSessionId(sessionId);
    interceptor.apply();
  });

  it('should send request with Stoobly headers', () => {
    // Intercept the request to inspect headers or body
    cy.intercept('GET', `${targetUrl}`).as('getHeaders');

    cy.visit(SERVER_URL);

    cy.wait('@getHeaders').then((interception) => {
      const responseBody = interception.response?.body || {};

      expect(responseBody[SCENARIO_KEY.toLowerCase()]).to.equal(scenarioKey);
      expect(responseBody[SESSION_ID.toLowerCase()]).to.equal(sessionId);
      expect(responseBody[TEST_TITLE.toLowerCase()]).to.equal(Cypress.currentTest.title)
      expect(responseBody[TEST_TITLE.toLowerCase()]).to.equal('should send request with Stoobly headers')
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

describe('applyScenario with scenarioName', () => {
  const scenarioName = 'test-scenario-name';
  const sessionId = 'id';

  beforeEach(() => {
    // Test title is automatically detected in the Cypress integration
    interceptor.withScenarioKey(undefined); // Clear scenario key when using scenario name
    interceptor.withScenarioName(scenarioName);
    interceptor.withSessionId(sessionId);
    interceptor.apply();
  });

  it('should send request with scenario name header', () => {
    // Intercept the request to inspect headers or body
    cy.intercept('GET', `${targetUrl}`).as('getHeaders');

    cy.visit(SERVER_URL);

    cy.wait('@getHeaders').then((interception) => {
      const responseBody = interception.response?.body || {};

      expect(responseBody[SCENARIO_NAME.toLowerCase()]).to.equal(scenarioName);
      expect(responseBody[SESSION_ID.toLowerCase()]).to.equal(sessionId);
      expect(responseBody[TEST_TITLE.toLowerCase()]).to.equal(Cypress.currentTest.title);
      // Should not have scenario key when using scenario name
      expect(responseBody[SCENARIO_KEY.toLowerCase()]).to.be.undefined;
    });
  });
});

describe('startRecord', () => {
  const sessionId = 'record-session';

  beforeEach(() => {
    interceptor.stopRecord();
    interceptor.withSessionId(sessionId);
    interceptor.startRecord();
    interceptor.apply();
  });

  it('should send request with intercept and record headers', () => {
    cy.intercept('GET', `${targetUrl}`).as('getHeaders');

    cy.visit(SERVER_URL);

    cy.wait('@getHeaders').then((interception) => {
      const responseBody = interception.response?.body || {};

      expect(responseBody[PROXY_MODE.toLowerCase()]).to.equal('record');
      expect(responseBody[SESSION_ID.toLowerCase()]).to.equal(sessionId);
      expect(responseBody[TEST_TITLE.toLowerCase()]).to.equal(Cypress.currentTest.title);
      expect(responseBody[TEST_TITLE.toLowerCase()]).to.equal('should send request with intercept and record headers');
    });
  });

  describe('without session id', () => {
    beforeEach(() => {
      interceptor.stopRecord();
      interceptor.withSessionId(undefined);
      interceptor.startRecord();
      interceptor.apply();
    });

    it('should send record headers without session id when not provided', () => {
      cy.intercept('GET', `${targetUrl}`).as('getHeaders');

      cy.visit(SERVER_URL);

      cy.wait('@getHeaders').then((interception) => {
        const responseBody = interception.response?.body || {};

        expect(responseBody[PROXY_MODE.toLowerCase()]).to.equal('record');
        expect(responseBody[SESSION_ID.toLowerCase()]).to.exist;
        expect(responseBody[SESSION_ID.toLowerCase()]).to.not.equal(sessionId);
      });
    });
  });

  describe('stopRecord', () => {
    beforeEach(() => {
      interceptor.stopRecord();
      interceptor.withSessionId(sessionId);
      interceptor.startRecord();
      interceptor.apply();
    });

    it('should remove intercept headers', () => {
      cy.intercept('GET', `${targetUrl}`).as('getHeaders');

      cy.visit(SERVER_URL);

      cy.wait('@getHeaders').then((interception) => {
        const responseBody = interception.response?.body || {};
        expect(responseBody[PROXY_MODE.toLowerCase()]).to.equal('record');

        // Stop recording
        interceptor.stopRecord();
      });

      cy.visit(SERVER_URL);

      cy.wait('@getHeaders').then((interception) => {
        const responseBody = interception.response?.body || {};
        expect(responseBody[PROXY_MODE.toLowerCase()]).to.be.undefined;
      });
    });
  });

  describe('record options', () => {
    beforeEach(() => {
      interceptor.stopRecord();
      // Reset all record options
      interceptor.withRecordPolicy(undefined);
      interceptor.withRecordOrder(undefined);
      interceptor.withRecordStrategy(undefined);
    });

    it('should send record policy header when policy is "all"', () => {
      interceptor.withRecordPolicy(RecordPolicy.All);
      interceptor.startRecord();
      interceptor.apply();

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
      interceptor.withRecordOrder(undefined);
      interceptor.withRecordStrategy(undefined);
      interceptor.startRecord();
      interceptor.apply();

      cy.intercept('GET', `${targetUrl}`).as('getHeaders');

      cy.visit(SERVER_URL);

      cy.wait('@getHeaders').then((interception) => {
        const responseBody = interception.response?.body || {};
        expect(responseBody[RECORD_POLICY.toLowerCase()]).to.equal(RecordPolicy.Found);
      });
    });

    it('should send record policy header when policy is "not_found"', () => {
      interceptor.withRecordPolicy(RecordPolicy.NotFound);
      interceptor.withRecordOrder(undefined);
      interceptor.withRecordStrategy(undefined);
      interceptor.startRecord();
      interceptor.apply();

      cy.intercept('GET', `${targetUrl}`).as('getHeaders');

      cy.visit(SERVER_URL);

      cy.wait('@getHeaders').then((interception) => {
        const responseBody = interception.response?.body || {};
        expect(responseBody[RECORD_POLICY.toLowerCase()]).to.equal(RecordPolicy.NotFound);
      });
    });

    it('should send record order header when order is "overwrite"', () => {
      interceptor.withRecordPolicy(undefined);
      interceptor.withRecordOrder(RecordOrder.Overwrite);
      interceptor.withRecordStrategy(undefined);
      interceptor.startRecord();
      interceptor.apply();

      cy.intercept('GET', `${targetUrl}`).as('getHeaders');

      cy.visit(SERVER_URL);

      cy.wait('@getHeaders').then((interception) => {
        const responseBody = interception.response?.body || {};
        expect(responseBody[RECORD_ORDER.toLowerCase()]).to.equal(RecordOrder.Overwrite);
      });
    });

    it('should not send record policy header when policy is not provided', () => {
      interceptor.withRecordPolicy(undefined);
      interceptor.withRecordOrder(undefined);
      interceptor.withRecordStrategy(undefined);
      interceptor.startRecord();
      interceptor.apply();

      cy.intercept('GET', `${targetUrl}`).as('getHeaders');

      cy.visit(SERVER_URL);

      cy.wait('@getHeaders').then((interception) => {
        const responseBody = interception.response?.body || {};
        expect(responseBody[RECORD_POLICY.toLowerCase()]).to.be.undefined;
        expect(responseBody[PROXY_MODE.toLowerCase()]).to.equal('record');
      });
    });

    it('should send record strategy header when strategy is "full"', () => {
      interceptor.withRecordPolicy(undefined);
      interceptor.withRecordOrder(undefined);
      interceptor.withRecordStrategy(RecordStrategy.Full);
      interceptor.startRecord();
      interceptor.apply();

      cy.intercept('GET', `${targetUrl}`).as('getHeaders');

      cy.visit(SERVER_URL);

      cy.wait('@getHeaders').then((interception) => {
        const responseBody = interception.response?.body || {};
        expect(responseBody[RECORD_STRATEGY.toLowerCase()]).to.equal(RecordStrategy.Full);
        expect(responseBody[PROXY_MODE.toLowerCase()]).to.equal('record');
      });
    });

    it('should send record strategy header when strategy is "minimal"', () => {
      interceptor.withRecordPolicy(undefined);
      interceptor.withRecordOrder(undefined);
      interceptor.withRecordStrategy(RecordStrategy.Minimal);
      interceptor.startRecord();
      interceptor.apply();

      cy.intercept('GET', `${targetUrl}`).as('getHeaders');

      cy.visit(SERVER_URL);

      cy.wait('@getHeaders').then((interception) => {
        const responseBody = interception.response?.body || {};
        expect(responseBody[RECORD_STRATEGY.toLowerCase()]).to.equal(RecordStrategy.Minimal);
        expect(responseBody[PROXY_MODE.toLowerCase()]).to.equal('record');
      });
    });

    it('should not send record strategy header when strategy is not provided', () => {
      interceptor.withRecordPolicy(undefined);
      interceptor.withRecordOrder(undefined);
      interceptor.withRecordStrategy(undefined);
      interceptor.startRecord();
      interceptor.apply();

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
