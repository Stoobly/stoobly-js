import {InterceptorOptions} from "../types/options";
import {setTestFramework, CYPRESS_FRAMEWORK} from "../utils/test-detection";
import {Interceptor} from "./interceptor";

export class Cypress extends Interceptor {
  private appliedCypress: boolean = false;

  constructor(options: InterceptorOptions) {
    super(options);

    setTestFramework(CYPRESS_FRAMEWORK);
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
        this.filterOverwriteHeader(headers, interceptorUrl.pattern, urlsToVisit);
        req.headers = headers;

        req.continue();
      });
    });

    this.appliedCypress = true;
  }
}