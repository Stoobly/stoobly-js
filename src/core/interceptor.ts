import { SCENARIO_KEY, SESSION_ID, TEST_TITLE } from "../constants/custom_headers";
import { Page } from "../types/playwright";
import { getTestTitle } from "../utils/test-detection";

export class Interceptor {
  static originalXMLHttpRequestOpen = typeof XMLHttpRequest !== 'undefined' ? XMLHttpRequest.prototype.open : null;
  static originalFetch = typeof window !== 'undefined' ? window.fetch.bind(window) : null;

  private _applied: boolean = false;
  private urls: (RegExp | string)[] = [];
  private scenarioKey: string | null = null;
  private sessionId: string | null = null;
  private testTitle: string | null = null;

  get applied() {
    return this._applied;
  }

  apply(sessionId?: string) {
    let cb;

    if (typeof window !== "undefined" && "cy" in window) {
      cb = () => this.decorateCypress(); // Cypress loads the application within an iframe
    } else {
      cb = () => {
        this.decorateFetch();
        this.decorateXMLHttpRequestOpen();
      }
    }

    return this.withSession(cb, sessionId);
  }

  applyCypress(sessionId?: string) {
    const cb = () => this.decorateCypress();

    return this.withSession(cb, sessionId);
  }

  async applyPlaywright(page: Page, sessionId?: string) {
    const cb = () => this.decoratePlaywright(page);

    return await this.withSession(cb, sessionId);
  }

  clear() {
    if (Interceptor.originalFetch) {
      window.fetch = Interceptor.originalFetch;
    }

    if (Interceptor.originalXMLHttpRequestOpen) {
      XMLHttpRequest.prototype.open = Interceptor.originalXMLHttpRequestOpen;
    }

    this._applied = false;
  }

  withUrls(urls: (RegExp | string)[]) {
    this.urls = urls;
  }

  withScenario(key: string): void {
    this.scenarioKey = key;
  }

  withTestTitle(title: string): void {
    this.testTitle = title;
  }

  private allowedUrl(url: string) {
    for (let i = 0; i < this.urls.length; ++i) {
      const urlAllowed = this.urls[i];

      if (urlAllowed instanceof RegExp) {
        if (urlAllowed.test(url)) {
          return true;
        }
      }

      if (urlAllowed === url) {
        return true;
      }
    }

    return false;
  }

  private decorateCypress() {
    this.urls.forEach((url) => {
      (window as any).cy?.intercept(url, (req: { continue: () => void, headers: any }) => {
        if (this.scenarioKey) {
          req.headers[SCENARIO_KEY] = this.scenarioKey;
        }

        if (this.sessionId) {
          req.headers[SESSION_ID] = this.sessionId;
        }

        // Dynamically detect test title at interception time
        const testTitle = this.testTitle || getTestTitle();
        if (testTitle) {
          req.headers[TEST_TITLE] = testTitle;
        }

        req.continue();
      });
    });
  }

  private decorateFetch() {
    if (!Interceptor.originalFetch) {
      return false;
    }

    const self = this;
    const original = Interceptor.originalFetch;

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const url = input instanceof Request ? input.url : input.toString();

      if (self.allowedUrl(url)) {
        const customHeaders: Record<string, string> = {};

        if (self.scenarioKey) {
          customHeaders[SCENARIO_KEY] = self.scenarioKey;
        }

        if (self.sessionId) {
          customHeaders[SESSION_ID] = self.sessionId;
        }

        // Dynamically detect test title at interception time
        const testTitle = self.testTitle || getTestTitle();
        if (testTitle) {
          customHeaders[TEST_TITLE] = testTitle;
        }

        if (!init) init = {};
        init.headers = {
          ...(init.headers as Record<string, string>),
          ...customHeaders,
        };
      }

      return original(input, init);
    };

    return true;
  }

  private async decoratePlaywright(page: Page) {
    for (const url of this.urls) {
      await page.route(url as string, async (route, req) => {
        const headers = {
          ...req.headers(),
        }

        if (this.scenarioKey) {
          headers[SCENARIO_KEY] = this.scenarioKey;
        }

        if (this.sessionId) {
          headers[SESSION_ID] = this.sessionId;
        }

        if (this.testTitle) {
          headers[TEST_TITLE] = this.testTitle;
        }

        await route.continue({ headers });
      });
    }
  }

  private decorateXMLHttpRequestOpen() {
    if (!Interceptor.originalXMLHttpRequestOpen) {
      return false;
    }

    const self = this;
    const original = Interceptor.originalXMLHttpRequestOpen;

    XMLHttpRequest.prototype.open = function (
      method: string,
      url: string,
      async: boolean = true,
      user?: string | null,
      password?: string | null
    ): void {
      this.addEventListener("readystatechange", function () {
        if (this.readyState !== 1) {
          return; // Not opened
        }

        if (!self.allowedUrl(url)) {
          return;
        }

        if (self.scenarioKey) {
          this.setRequestHeader(SCENARIO_KEY, self.scenarioKey);
        }

        if (self.sessionId) {
          this.setRequestHeader(SESSION_ID, self.sessionId);
        }

        // Dynamically detect test title at interception time
        const testTitle = self.testTitle || getTestTitle();
        if (testTitle) {
          this.setRequestHeader(TEST_TITLE, testTitle);
        }
      });
      return original.apply(this, arguments as any);
    };

    return true;
  }

  private async withSession(cb: () => void | Promise<void>, sessionId?: string) {
    this.sessionId = sessionId || (new Date()).getTime().toString();
    await cb();
    this._applied = true;
    return this.sessionId;
  }
}