import {Page, Route as PlaywrightRoute, Request as PlaywrightRequest } from "../types/playwright";
import {InterceptorOptions} from "../types/options";
import {Interceptor} from "./interceptor";
import {setTestFramework, PLAYWRIGHT_FRAMEWORK} from "../utils/test-detection";

export class Playwright extends Interceptor {
  private appliedPlaywright: boolean = false;
  private handlers: Map<string, (route: PlaywrightRoute, req: PlaywrightRequest) => Promise<void>> = new Map();
  private _page: Page | null = null;

  constructor(options: InterceptorOptions) {
    super(options);

    setTestFramework(PLAYWRIGHT_FRAMEWORK);
  }

  get page() {
    if (!this._page) {
      throw new Error("Page is required. Call withPage() to set the page.");
    }

    return this._page;
  }

  set page(page: Page) {
    this._page = page;
  }

  // Applies HTTP request interception to the current page. Clears existing handlers,
  // sets URL filters if provided, and decorates Playwright to inject custom headers.
  async apply() {
    await this.clear();
    await this.decoratePlaywright(this.page);
  } 

  // Clears all HTTP request interceptors. Unroutes all registered routes and resets the
  // appliedPlaywright flag. Returns a promise resolving to the session ID.
  async clear() {
    if (!this.appliedPlaywright || !this._page) {
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

  // Sets the current page for request interception. Clears any existing handlers if the page
  // changes to avoid duplicate route registrations. Returns the Interceptor instance for chaining.
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
