import {Page, Route as PlaywrightRoute, Request as PlaywrightRequest } from "../types/playwright";
import {InterceptOptions} from "../types/options";
import {Interceptor} from "./interceptor";
import {setTestFramework, PLAYWRIGHT_FRAMEWORK} from "../utils/test-detection";

export class Playwright extends Interceptor {
  private appliedPlaywright: boolean = false;
  private handlers: Map<string, (route: PlaywrightRoute, req: PlaywrightRequest) => Promise<void>> = new Map();
  private _page: Page | null = null;

  get page() {
    if (!this._page) {
      throw new Error("Page is required. Call withPage() to set the page.");
    }

    return this._page;
  }

  set page(page: Page) {
    this._page = page;
  }

  async apply(options?: InterceptOptions) {
    if (options?.urls) {
      this.urls = options.urls;
    }

    const cb = async () => this.decoratePlaywright(this.page);

    return await this.withSession(cb, options?.sessionId);
  } 

  applyScenario(scenarioKey?: string, options?: InterceptOptions) {
    setTestFramework(PLAYWRIGHT_FRAMEWORK);

    this.withScenario(scenarioKey);
    return this.apply(options);
  }

  clear() {
    if (!this.appliedPlaywright) {
      return;
    }

    for (const url of this.urls) {
      const handler = this.handlers.get(url as string);
      if (!handler) {
        continue;
      }

      this.page.unroute(url as string, handler);
    }

    this.handlers.clear();
    this.appliedPlaywright = false;
  }

  // For end-to-end frameworks like Playwright, users need to manually set the test title
  setTestTitle(testTitle: string) {
    this.withTestTitle(testTitle);
  }

  withPage(page: Page) {
    this.page = page;
    return this;
  }

  private async decoratePlaywright(page: Page) {
    if (this.appliedPlaywright) {
      return;
    }

    for (const url of this.urls) {
      const handler = async (route: PlaywrightRoute, req: PlaywrightRequest) => {
        const headers = this.decorateHeaders(req.headers());

        await route.continue({ headers });
      }
      await page.route(url as string, handler);
      this.handlers.set(url as string, handler);
    }

    this.appliedPlaywright = true;
  }
}
