import {InterceptorSettings} from "../types/settings";
import {scenarioNameFromFileAndTitle} from "../utils/scenario-name";
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
    // Cypress.spec.name is typically already the basename; fall back to relative/absolute.
    const file =
      cypress?.spec?.name ||
      cypress?.spec?.relative ||
      cypress?.spec?.absolute;
    const title = cypress?.currentTest?.title;

    this.withScenarioName(scenarioNameFromFileAndTitle(file, title));

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
      (window as any).cy?.intercept(interceptorUrl.pattern, (req: {
        continue: () => void;
        headers: Record<string, string>;
        method: string;
        url: string;
      }) => {
        const headers = this.decorateHeaders(req.headers);
        this.applyUrlSpecificHeaders(headers, interceptorUrl);
        this.applyRequestSequenceIdHeader(headers, req.method, req.url);
        this.filterOverwriteHeader(headers, interceptorUrl.pattern, urlsToVisit);
        req.headers = headers;

        req.continue();
      });
    });

    this.appliedCypress = true;
  }
}
