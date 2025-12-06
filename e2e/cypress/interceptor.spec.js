import { INTERCEPT_ACTIVE, PROXY_MODE, RECORD_POLICY, SCENARIO_KEY, SESSION_ID, TEST_TITLE } from "../../src/constants/custom_headers";
import { RecordPolicy } from "../../src/constants/proxy";
import Stoobly from '../../src/stoobly';
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

      expect(responseBody[INTERCEPT_ACTIVE.toLowerCase()]).to.equal('1');
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

      expect(responseBody[INTERCEPT_ACTIVE.toLowerCase()]).to.equal('1');
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
      expect(responseBody[INTERCEPT_ACTIVE.toLowerCase()]).to.equal('1');
      expect(responseBody[PROXY_MODE.toLowerCase()]).to.equal('record');

      // Stop recording
      stoobly.cypress.stopRecord();
    });

    cy.visit(SERVER_URL);

    cy.wait('@getHeaders').then((interception) => {
      const responseBody = interception.response?.body || {};
      expect(responseBody[INTERCEPT_ACTIVE.toLowerCase()]).to.be.undefined;
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
        expect(responseBody[INTERCEPT_ACTIVE.toLowerCase()]).to.equal('1');
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

    it('should send record policy header when policy is "overwrite"', () => {
      const stoobly = new Stoobly();
      stoobly.cypress.startRecord({ urls: [targetUrl], policy: RecordPolicy.Overwrite });

      cy.intercept('GET', `${targetUrl}`).as('getHeaders');

      cy.visit(SERVER_URL);

      cy.wait('@getHeaders').then((interception) => {
        const responseBody = interception.response?.body || {};
        expect(responseBody[RECORD_POLICY.toLowerCase()]).to.equal(RecordPolicy.Overwrite);
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
        expect(responseBody[INTERCEPT_ACTIVE.toLowerCase()]).to.equal('1');
        expect(responseBody[PROXY_MODE.toLowerCase()]).to.equal('record');
      });
    });
  });
});
