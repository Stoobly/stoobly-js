export const CYPRESS_FRAMEWORK = 'cypress' as const;
export const PLAYWRIGHT_FRAMEWORK = 'playwright' as const;

export type TestFramework = typeof CYPRESS_FRAMEWORK | typeof PLAYWRIGHT_FRAMEWORK;

// Module-level variable to store explicitly set framework
let detectedTestFramework: TestFramework | null = null;

/**
 * Explicitly set the test framework being used if known
 */
export function setTestFramework(framework: TestFramework): void {
  detectedTestFramework = framework;
}

export function getCypressTestTitle(): string | null {
  try {
    if (typeof window !== 'undefined' && (window as any).Cypress) {
      const cypress = (window as any).Cypress;

      // Method 1: Direct access to currentTest (most specific - individual test title)
      if (cypress.currentTest?.title) {
        return cypress.currentTest.title;
      }

      // Method 2: Use Cypress.spec for spec file name as fallback
      if (cypress.spec?.name) {
        return cypress.spec.name;
      }

      // Method 3: Through mocha runner as final fallback
      if (cypress.mocha?.getRunner()?.suite?.ctx?.currentTest?.title) {
        const testTitle = cypress.mocha.getRunner().suite.ctx.currentTest.title;
        return testTitle;
      }
    }
  } catch (error) {
    // Silently fail if we can't access test title
  }

  return null;
}


export function getPlaywrightTestTitle(): string | null {
  // Playwright TestInfo is only available as a parameter in test functions and hooks
  // There is no official global API to access it automatically
  // For Playwright, test title would need to be passed explicitly or
  // stored in a custom global variable during test execution

  return null;
}

export function getTestFramework(): TestFramework | null {
  // First check if framework was explicitly set
  if (detectedTestFramework) {
    return detectedTestFramework;
  }

  // Check for Cypress in browser environment
  if (typeof window !== 'undefined' && (window as any).Cypress) {
    return CYPRESS_FRAMEWORK;
  }

  // Check for Cypress in Node.js environment
  if (typeof globalThis !== 'undefined' && (globalThis as any).Cypress) {
    return CYPRESS_FRAMEWORK;
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
      return PLAYWRIGHT_FRAMEWORK;
    }
  }

  return null;
}

export function getTestTitle(): string | null {
  const testFrameworkName = getTestFramework();

  if (testFrameworkName === CYPRESS_FRAMEWORK) {
    return getCypressTestTitle();
  } else if (testFrameworkName === PLAYWRIGHT_FRAMEWORK) {
    return getPlaywrightTestTitle();
  }

  return null;
}
