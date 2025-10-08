export function getCypressTestName(): string | null {
  try {
    if (typeof window !== 'undefined' && (window as any).Cypress) {
      const cypress = (window as any).Cypress;

      // Method 1: Direct access to currentTest (most specific - individual test name)
      if (cypress.currentTest?.title) {
        return cypress.currentTest.title;
      }
      
      // Method 2: Use Cypress.spec for spec file name as fallback
      if (cypress.spec?.name) {
        return cypress.spec.name;
      }
      
      // Method 3: Through mocha runner as final fallback
      if (cypress.mocha?.getRunner()?.suite?.ctx?.currentTest?.title) {
        const testName = cypress.mocha.getRunner().suite.ctx.currentTest.title;
        return testName;
      }
    }
  } catch (error) {
    // Silently fail if we can't access test name
  }
  
  return null;
}


export function getPlaywrightTestName(): string | null {
  // Playwright TestInfo is only available as a parameter in test functions and hooks
  // There is no official global API to access it automatically
  // For Playwright, test name would need to be passed explicitly or 
  // stored in a custom global variable during test execution

  return null;
}

export function getTestFramework(): 'cypress' | 'playwright' | null {
  // Check for Cypress in browser environment
  if (typeof window !== 'undefined' && (window as any).Cypress) {
    return 'cypress';
  }

  // Check for Cypress in Node.js environment
  if (typeof globalThis !== 'undefined' && (globalThis as any).Cypress) {
    return 'cypress';
  }

  // Check for Playwright (Node.js environment)
  if (typeof (globalThis as any).process !== 'undefined' && (globalThis as any).process.env) {
    const process = (globalThis as any).process;

    // Check for Playwright-specific environment variables that are commonly set
    if (process.env.PWTEST_UNDER_TEST ||
        process.env.PLAYWRIGHT_TEST_BASE_URL ||
        process.env.PLAYWRIGHT_BROWSERS_PATH ||
        process.env.PWTEST_SKIP_TEST_OUTPUT ||
        process.argv?.some((arg: string) => arg.includes('playwright'))) {
      return 'playwright';
    }
  }

  return null;
}

export function getTestName(): string | null {
  const testFrameworkName = getTestFramework();

  if (testFrameworkName === 'cypress') {
    return getCypressTestName();
  } else if (testFrameworkName === 'playwright') {
    return getPlaywrightTestName();
  }

  return null;
}
