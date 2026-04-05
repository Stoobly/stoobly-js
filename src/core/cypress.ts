import {InterceptorSettings} from "../types/settings";
import {setTestFramework, CYPRESS_FRAMEWORK} from "../utils/test-detection";
import {Interceptor} from "./interceptor";

export class Cypress extends Interceptor {
  private appliedCypress: boolean = false;

  constructor(settings: InterceptorSettings) {
    super(settings);

    setTestFramework(CYPRESS_FRAMEWORK);
  }

  withScenarioNameFromTest() {
    const cypress = (window as any).Cypress;
    const titlePath = cypress?.currentTest?.titlePath;
    const title = cypress?.currentTest?.title;

    const scenarioName = Array.isArray(titlePath) && titlePath.length
      ? titlePath.map(String).join(' > ')
      : typeof title === 'string' && title.length
        ? title
        : undefined;

    this.withScenarioName(scenarioName);

    return this;
  }

  protected async decorate() {
    this.decorateCypress();
  }

  protected async restore() {
    if (!this.appliedCypress) {
      return;
    }

    this.urls.forEach((interceptorUrl) => {
      (window as any).cy?.intercept(interceptorUrl.pattern, (req: { continue: () => void }) => {
        req.continue();
      });
    });

    this.appliedCypress = false;
  }

  private decorateCypress() {
    if (this.appliedCypress) {
      return;
    }

    const urlsToVisit = this.urlsToVisit;

    this.urls.forEach((interceptorUrl) => {
      (window as any).cy?.intercept(interceptorUrl.pattern, (req: { continue: () => void, headers: any }) => {
        const headers = this.decorateHeaders(req.headers);
        this.applyUrlSpecificHeaders(headers, interceptorUrl);
        this.filterOverwriteHeader(headers, interceptorUrl.pattern, urlsToVisit);
        req.headers = headers;

        req.continue();
      });
    });

    this.appliedCypress = true;
  }
}