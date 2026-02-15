import {InterceptorOptions} from "../types/options";
import {Interceptor} from "./interceptor";
import {setTestFramework, CYPRESS_FRAMEWORK} from "../utils/test-detection";

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

    this.urls.forEach((url) => {
      (window as any).cy?.intercept(url, (req: { continue: () => void }) => {
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

    this.urls.forEach((url) => {
      (window as any).cy?.intercept(url, (req: { continue: () => void, headers: any }) => {
        const headers = this.decorateHeaders(req.headers);
        this.filterOverwriteHeader(headers, url, urlsToVisit);
        req.headers = headers;

        req.continue();
      });
    });

    this.appliedCypress = true;
  }
}