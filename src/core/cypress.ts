import {InterceptOptions} from "../types/options";
import {Interceptor} from "./interceptor";
import {setTestFramework, CYPRESS_FRAMEWORK} from "../utils/test-detection";

export class Cypress extends Interceptor {
  private appliedCypress: boolean = false;

  async apply(options?: InterceptOptions) {
    if (options?.urls) {
      this.urls = options.urls;
    }

    const cb = () => this.decorateCypress();

    return this.withSession(cb, options?.sessionId);
  }

  applyScenario(scenarioKey?: string, options?: InterceptOptions) {
    setTestFramework(CYPRESS_FRAMEWORK);

    this.withScenario(scenarioKey);
    return this.apply(options);
  }
  
  clear() {
    if (this.appliedCypress) {
      this.urls.forEach((url) => {
        (window as any).cy?.intercept(url, (req: { continue: () => void }) => {
          req.continue();
        });
      });
    }

    this.appliedCypress = false;
  }

  private decorateCypress() {
    if (this.appliedCypress) {
      return;
    }

    this.urls.forEach((url) => {
      (window as any).cy?.intercept(url, (req: { continue: () => void, headers: any }) => {
        req.headers = this.decorateHeaders(req.headers); 

        req.continue();
      });
    });

    this.appliedCypress = true;
  }
}