import {Page, Route as PlaywrightRoute, Request as PlaywrightRequest } from "../types/playwright";
import {InterceptorOptions} from "../types/options";
import {Interceptor} from "./interceptor";
import {setTestFramework, PLAYWRIGHT_FRAMEWORK} from "../utils/test-detection";
import { InterceptMode } from "@constants/intercept";

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

  // Applies HTTP request interception to fetch and XMLHttpRequest. Clears existing
  // interceptors, sets URL filters if provided, and decorates fetch/XMLHttpRequest to inject custom headers. 
  async apply(options?: Partial<InterceptorOptions>) {
    await this.restore();

    // After clearing intercepts on old urls, apply intercepts on new urls
    this.urls = options?.urls || this.options.urls;
    await this.decorate();

    return this.applySession(options);
  }

  async applyRecord(options?: Partial<InterceptorOptions>) {
    this.withInterceptMode(InterceptMode.record);
    return await this.apply(options);
  }

  async clear() {
    await this.restore();
    this.clearSession();
  }

  async clearRecord() {
    this.withInterceptMode();
    await this.clear();
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

  // Applies HTTP request interception to the current page.
  // Sets URL filters if provided, and decorates Playwright to inject custom headers.
  protected async decorate() {
    if (this.page && !this.page.isClosed()) {
      await this.decoratePlaywright(this.page);
    }
  } 

  // Clears all HTTP request interceptors. Unroutes all registered routes and resets the
  // appliedPlaywright flag. Returns a promise resolving to the session ID.
  protected async restore() {
    if (!this.appliedPlaywright || !this._page) {
      return;
    }

    if (this._page.isClosed()) {
      this.appliedPlaywright = false;
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
