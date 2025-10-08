import { SERVER_URL } from '../server-config';
import { SCENARIO_KEY, SESSION_ID, TEST_NAME } from "../../src/constants/custom_headers";
import Stoobly from '../../src/stoobly';

describe('applyScenario', () => {
  const scenarioKey = 'test';
  const sessionId = 'id';
  const targetUrl = `${SERVER_URL}/headers`;

  beforeEach(() => {
    const stoobly = new Stoobly();
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
      expect(responseBody[TEST_NAME.toLowerCase()]).to.exist;
      expect(responseBody[TEST_NAME.toLowerCase()]).to.equal('should send request with Stoobly headers')
    });
  });

  it('another test should have a different test name in the headers', () => {
    // Intercept the request to inspect headers or body
    cy.intercept('GET', `${targetUrl}`).as('getHeaders');

    cy.visit(SERVER_URL);

    cy.wait('@getHeaders').then((interception) => {
      const responseBody = interception.response?.body || {};

      expect(responseBody[TEST_NAME.toLowerCase()]).to.equal('another test should have a different test name in the headers')
    });
  });
});
