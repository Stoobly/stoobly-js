import { SERVER_URL } from '../server-config';
import { SCENARIO_KEY, SESSION_ID, TEST_TITLE } from "../../src/constants/custom_headers";
import Stoobly from '../../src/stoobly';

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
