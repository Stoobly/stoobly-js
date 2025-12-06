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
    await this.clear();

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

  get urls() {
    return this._urls;
  }

  set urls(urls: (RegExp | string)[]) {
    this._urls = urls;
  }

  async clear() {
    if (!this.appliedPlaywright || !this.page) {
      return;
    }

    for (const url of this.urls) {
      const handler = this.handlers.get(url as string);
      if (!handler) {
        continue;
      }

      await this.page.unroute(url as string, handler);
      this.handlers.delete(url as string);
    }
    
    this.appliedPlaywright = false;
  }

  // For end-to-end frameworks like Playwright, users need to manually set the test title
  setTestTitle(testTitle: string) {
    this.withTestTitle(testTitle);
  }

  withPage(page: Page) {
    // Clear handlers if page changed (Playwright will clean up routes when page closes)
    if (this._page && this._page !== page) {
      this.handlers.clear();
    }

    this.page = page;

    return this;
  }

  private async decoratePlaywright(page: Page) {
    if (this.appliedPlaywright) {
      return;
    }

    // Register routes on the current page
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
