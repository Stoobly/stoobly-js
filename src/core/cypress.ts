import {ApplyScenarioOptions} from "../types/options";
import {Interceptor} from "./interceptor";

export class Cypress {
  interceptor: Interceptor;

  constructor(interceptor: Interceptor) {
    this.interceptor = interceptor;
  }

  applyScenario(scenarioKey?: string, options?: ApplyScenarioOptions) {
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