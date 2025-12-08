import { PROXY_MODE, RECORD_ORDER, RECORD_POLICY, RECORD_STRATEGY, SCENARIO_KEY, SESSION_ID, TEST_TITLE, RecordOrder, RecordPolicy, RecordStrategy } from "../../dist/esm/constants.js";
import Stoobly from '../../dist/esm/stoobly.js';
import { SERVER_URL } from '../server-config';

describe('applyScenario', () => {
  const stoobly = new Stoobly();
  const scenarioKey = 'test';
  const sessionId = 'id';
  const targetUrl = `${SERVER_URL}/headers`;

  beforeEach(() => {
    // Test title is automatically detected in the Cypress integration
    stoobly.cypress.applyScenario(scenarioKey, { sessionId, urls: [targetUrl] });
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

describe('startRecord', () => {
  const sessionId = 'record-session';
  const targetUrl = `${SERVER_URL}/headers`;

  it('should send request with intercept and record headers', () => {
    const stoobly = new Stoobly();
    stoobly.cypress.startRecord({ urls: [targetUrl], sessionId });

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

  it('should send record headers without session id when not provided', () => {
    const stoobly = new Stoobly();
    stoobly.cypress.startRecord({ urls: [targetUrl] });

    cy.intercept('GET', `${targetUrl}`).as('getHeaders');

    cy.visit(SERVER_URL);

    cy.wait('@getHeaders').then((interception) => {
      const responseBody = interception.response?.body || {};

      expect(responseBody[PROXY_MODE.toLowerCase()]).to.equal('record');
      expect(responseBody[SESSION_ID.toLowerCase()]).to.exist;
      expect(responseBody[SESSION_ID.toLowerCase()]).to.not.equal(sessionId);
    });
  });

  it('stopRecord should remove intercept headers', () => {
    const stoobly = new Stoobly();
    stoobly.cypress.startRecord({ urls: [targetUrl], sessionId });

    cy.intercept('GET', `${targetUrl}`).as('getHeaders');

    cy.visit(SERVER_URL);

    cy.wait('@getHeaders').then((interception) => {
      const responseBody = interception.response?.body || {};
      expect(responseBody[PROXY_MODE.toLowerCase()]).to.equal('record');

      // Stop recording
      stoobly.cypress.stopRecord();
    });

    cy.visit(SERVER_URL);

    cy.wait('@getHeaders').then((interception) => {
      const responseBody = interception.response?.body || {};
      expect(responseBody[PROXY_MODE.toLowerCase()]).to.be.undefined;
    });
  });

  describe('record options', () => {
    const targetUrl = `${SERVER_URL}/headers`;

    it('should send record policy header when policy is "all"', () => {
      const stoobly = new Stoobly();
      stoobly.cypress.startRecord({ urls: [targetUrl], policy: RecordPolicy.All });

      cy.intercept('GET', `${targetUrl}`).as('getHeaders');

      cy.visit(SERVER_URL);

      cy.wait('@getHeaders').then((interception) => {
        const responseBody = interception.response?.body || {};
        expect(responseBody[RECORD_POLICY.toLowerCase()]).to.equal(RecordPolicy.All);
        expect(responseBody[PROXY_MODE.toLowerCase()]).to.equal('record');
      });
    });

    it('should send record policy header when policy is "found"', () => {
      const stoobly = new Stoobly();
      stoobly.cypress.startRecord({ urls: [targetUrl], policy: RecordPolicy.Found });

      cy.intercept('GET', `${targetUrl}`).as('getHeaders');

      cy.visit(SERVER_URL);

      cy.wait('@getHeaders').then((interception) => {
        const responseBody = interception.response?.body || {};
        expect(responseBody[RECORD_POLICY.toLowerCase()]).to.equal(RecordPolicy.Found);
      });
    });

    it('should send record policy header when policy is "not_found"', () => {
      const stoobly = new Stoobly();
      stoobly.cypress.startRecord({ urls: [targetUrl], policy: RecordPolicy.NotFound });

      cy.intercept('GET', `${targetUrl}`).as('getHeaders');

      cy.visit(SERVER_URL);

      cy.wait('@getHeaders').then((interception) => {
        const responseBody = interception.response?.body || {};
        expect(responseBody[RECORD_POLICY.toLowerCase()]).to.equal(RecordPolicy.NotFound);
      });
    });

    it('should send record order header when order is "overwrite"', () => {
      const stoobly = new Stoobly();
      stoobly.cypress.startRecord({ urls: [targetUrl], order: RecordOrder.Overwrite });

      cy.intercept('GET', `${targetUrl}`).as('getHeaders');

      cy.visit(SERVER_URL);

      cy.wait('@getHeaders').then((interception) => {
        const responseBody = interception.response?.body || {};
        expect(responseBody[RECORD_ORDER.toLowerCase()]).to.equal(RecordOrder.Overwrite);
      });
    });

    it('should not send record policy header when policy is not provided', () => {
      const stoobly = new Stoobly();
      stoobly.cypress.startRecord({ urls: [targetUrl] });

      cy.intercept('GET', `${targetUrl}`).as('getHeaders');

      cy.visit(SERVER_URL);

      cy.wait('@getHeaders').then((interception) => {
        const responseBody = interception.response?.body || {};
        expect(responseBody[RECORD_POLICY.toLowerCase()]).to.be.undefined;
        expect(responseBody[PROXY_MODE.toLowerCase()]).to.equal('record');
      });
    });

    it('should send record strategy header when strategy is "full"', () => {
      const stoobly = new Stoobly();
      stoobly.cypress.startRecord({ urls: [targetUrl], strategy: RecordStrategy.Full });

      cy.intercept('GET', `${targetUrl}`).as('getHeaders');

      cy.visit(SERVER_URL);

      cy.wait('@getHeaders').then((interception) => {
        const responseBody = interception.response?.body || {};
        expect(responseBody[RECORD_STRATEGY.toLowerCase()]).to.equal(RecordStrategy.Full);
        expect(responseBody[PROXY_MODE.toLowerCase()]).to.equal('record');
      });
    });

    it('should send record strategy header when strategy is "minimal"', () => {
      const stoobly = new Stoobly();
      stoobly.cypress.startRecord({ urls: [targetUrl], strategy: RecordStrategy.Minimal });

      cy.intercept('GET', `${targetUrl}`).as('getHeaders');

      cy.visit(SERVER_URL);

      cy.wait('@getHeaders').then((interception) => {
        const responseBody = interception.response?.body || {};
        expect(responseBody[RECORD_STRATEGY.toLowerCase()]).to.equal(RecordStrategy.Minimal);
        expect(responseBody[PROXY_MODE.toLowerCase()]).to.equal('record');
      });
    });

    it('should not send record strategy header when strategy is not provided', () => {
      const stoobly = new Stoobly();
      stoobly.cypress.startRecord({ urls: [targetUrl] });

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
