import {Page} from '../types/playwright';
import {ApplyScenarioOptions} from "../types/options";
import {Interceptor} from "./interceptor";
import {setTestFramework, PLAYWRIGHT_FRAMEWORK} from "../utils/test-detection";

export class Playwright {
  interceptor: Interceptor;

  constructor(interceptor: Interceptor) {
    this.interceptor = interceptor;
  }

  applyScenario(page: Page, scenarioKey?: string, options?: ApplyScenarioOptions) {
    setTestFramework(PLAYWRIGHT_FRAMEWORK);

    if (this.interceptor.applied) {
      this.interceptor.clear();
    }

    if (scenarioKey) {
      this.interceptor.withScenario(scenarioKey);
      this.interceptor.withUrls(options?.urls || []);
      return this.interceptor.applyPlaywright(page, options?.sessionId);
    }
  }

  // For end-to-end frameworks like Playwright, users need to manually set the test title
  setTestTitle(testTitle: string) {
    this.interceptor.withTestTitle(testTitle);
  }
}
