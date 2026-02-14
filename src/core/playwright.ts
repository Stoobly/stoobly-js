import {Page, Route as PlaywrightRoute, Request as PlaywrightRequest, BrowserContext } from "../types/playwright";
import {InterceptorOptions} from "../types/options";
import {Interceptor} from "./interceptor";
import {setTestFramework, PLAYWRIGHT_FRAMEWORK} from "../utils/test-detection";
import { InterceptMode } from "@constants/intercept";

export class Playwright extends Interceptor {
  private appliedPlaywright: boolean = false;
  private pageHandlers: Map<string, (route: PlaywrightRoute, req: PlaywrightRequest) => Promise<void>> = new Map();
  private contextHandlers: Map<string, (route: PlaywrightRoute, req: PlaywrightRequest) => Promise<void>> = new Map();
  private _page: Page | null = null;
  private _context: BrowserContext | null = null;

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

  get context() {
    return this._context;
  }

  set context(context: BrowserContext | null) {
    this._context = context;
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
      this.pageHandlers.clear();
    }

    this.page = page;

    return this;
  }

  // Sets the browser context for request interception. This enables intercepting requests from
  // browser extensions, service workers, and all pages in the context.
  // Returns the Interceptor instance for chaining.
  withContext(context: BrowserContext) {
    // Clear handlers if context changed
    if (this._context && this._context !== context) {
      this.contextHandlers.clear();
    }

    this.context = context;

    return this;
  }

  // Applies HTTP request interception to the current page and/or context.
  // Sets URL filters if provided, and decorates Playwright to inject custom headers.
  protected async decorate() {
    // Apply to page if set
    if (this._page && !this._page.isClosed()) {
      await this.decoratePlaywright(this._page, this.pageHandlers);
    }

    // Apply to context if set
    if (this._context) {
      await this.decoratePlaywright(this._context, this.contextHandlers);
    }
  } 

  // Clears all HTTP request interceptors. Unroutes all registered routes and resets the
  // appliedPlaywright flag. Returns a promise resolving to the session ID.
  protected async restore() {
    if (!this.appliedPlaywright) {
      return;
    }

    // Restore page routes
    if (this._page && !this._page.isClosed()) {
      await this.restoreTarget(this._page, this.pageHandlers);
    }

    // Restore context routes
    if (this._context) {
      await this.restoreTarget(this._context, this.contextHandlers);
    }
    
    this.appliedPlaywright = false;
  }

  private async restoreTarget(
    target: Page | BrowserContext,
    handlers: Map<string, (route: PlaywrightRoute, req: PlaywrightRequest) => Promise<void>>
  ) {
    for (const url of this.urls) {
      const handler = handlers.get(url as string);
      if (!handler) {
        continue;
      }

      try {
        await target.unroute(url as string, handler);
      } catch (error) {
        // Ignore errors if context/page is already closed
        console.warn('Failed to unroute:', (error as Error).message);
      }

      handlers.delete(url as string);
    }
  }

  private async decoratePlaywright(
    target: Page | BrowserContext,
    handlers: Map<string, (route: PlaywrightRoute, req: PlaywrightRequest) => Promise<void>>
  ) {
    const urlsToVisit = this.urls.slice();

    // Register routes on the current page or context
    for (const url of this.urls) {
      const handler = async (route: PlaywrightRoute, req: PlaywrightRequest) => {
        const headers = this.decorateHeaders(req.headers());
        this.filterOverwriteHeader(headers, url, urlsToVisit);

        await route.continue({ headers: headers });
      }
      
      try {
        await target.route(url as string, handler);
        handlers.set(url as string, handler);
      } catch (error) {
        // Ignore errors if context/page is already closed
        console.warn('Failed to route:', (error as Error).message);
      }
    }

    this.appliedPlaywright = true;
  }
}
