export function getCypressTestName(): string | null {
  try {
    if (typeof window !== 'undefined' && (window as any).Cypress) {
      const cypress = (window as any).Cypress;

      console.debug('Cypress object found:', { 
        currentTest: cypress.currentTest, 
        spec: cypress.spec,
        mocha: cypress.mocha
      });

      // Method 1: Direct access to currentTest (most specific - individual test name)
      if (cypress.currentTest?.title) {
        console.debug('Found test name via currentTest:', cypress.currentTest.title);
        
        return cypress.currentTest.title;
      }
      
      // Method 2: Use Cypress.spec for spec file name as fallback
      if (cypress.spec?.name) {
        console.debug('Found test name via spec:', cypress.spec.name);
        
        return cypress.spec.name;
      }
      
      // Method 3: Through mocha runner as final fallback
      if (cypress.mocha?.getRunner()?.suite?.ctx?.currentTest?.title) {
        const testName = cypress.mocha.getRunner().suite.ctx.currentTest.title;

        console.debug('Found test name via mocha runner:', testName);

        return testName;
      }
    } else {
      console.debug('Cypress not found in window object');
    }
  } catch (error) {
    // Silently fail if we can't access test name
    console.debug('Failed to get Cypress test name:', error);


  }
  
  console.debug('No Cypress test name found');

  return null;
}


// TODO
export function getPlaywrightTestName(): string | null {
  // Playwright test info is not globally accessible like Cypress
  // It's only available within test hooks and test functions via testInfo parameter
  // For Playwright, test name would need to be passed explicitly or 
  // injected via custom setup in beforeEach hooks
  return null;
}

export function getTestName(): string | null {
  // Try Cypress first, then Playwright
  return getCypressTestName(); // || getPlaywrightTestName();
}