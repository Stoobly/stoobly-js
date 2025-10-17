import {ApplyScenarioOptions} from "../types/options";
import {Interceptor} from "./interceptor";
import {setTestFramework, CYPRESS_FRAMEWORK} from "../utils/test-detection";

export class Cypress {
  interceptor: Interceptor;

  constructor(interceptor: Interceptor) {
    this.interceptor = interceptor;
  }

  applyScenario(scenarioKey?: string, options?: ApplyScenarioOptions) {
    setTestFramework(CYPRESS_FRAMEWORK);

    if (this.interceptor.applied) {
      this.interceptor.clear();
    }

    if (scenarioKey) {
      this.interceptor.withScenario(scenarioKey);
      this.interceptor.withUrls(options?.urls || []);
      return this.interceptor.applyCypress(options?.sessionId);
    }
  } 
}