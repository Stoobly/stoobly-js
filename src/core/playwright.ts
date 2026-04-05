import { InterceptMode } from "@constants/intercept";

import { InterceptorSettings } from "../types/settings";
import {Page, Route as PlaywrightRoute, Request as PlaywrightRequest, BrowserContext } from "../types/playwright";
import {setTestFramework, PLAYWRIGHT_FRAMEWORK} from "../utils/test-detection";
import {Interceptor} from "./interceptor";

export class Playwright extends Interceptor {
  private appliedPlaywright: boolean = false;
  private pageHandlers: Map<string, (route: PlaywrightRoute, req: PlaywrightRequest) => Promise<void>> = new Map();
  private contextHandlers: Map<string, (route: PlaywrightRoute, req: PlaywrightRequest) => Promise<void>> = new Map();
  private _page: Page | null = null;
  private _context: BrowserContext | null = null;

  constructor(settings: InterceptorSettings) {
    super(settings);

    setTestFramework(PLAYWRIGHT_FRAMEWORK);
  }

  withScenarioNameFromTest(testInfo: { titlePath?: Array<string | unknown>; title?: unknown }) {
    const titlePath = testInfo?.titlePath;
    const title = testInfo?.title;

    const scenarioName =
      Array.isArray(titlePath) && titlePath.length
        ? titlePath.map(String).join(' > ')
        : typeof title === 'string' && title.length
          ? title
          : undefined;

    this.withScenarioName(scenarioName);

    return this;
  }

  get page() {
    if (!this._page) {
      throw new Error("Page is required. Call withPage() to set the page.");
    }

    return this._page;
  }

  // Sets the current page for request interception.
  // Clears any existing handlers if the page changes to avoid duplicate route registrations.
  set page(page: Page) {
    // Clear handlers if page changed (Playwright will clean up routes when page closes)
    if (this._page && this._page !== page) {
      this.pageHandlers.clear();
    }

    this._page = page;
  }

  get context() {
    return this._context;
  }

  // Sets the browser context for request interception.
  // This enables intercepting requests from browser extensions, service workers, and all pages in the context.
  set context(context: BrowserContext | null) {
    // Clear handlers if context changed
    if (this._context && this._context !== context) {
      this.contextHandlers.clear();
    }

    this._context = context;
  }

  /**
   * Applies HTTP request interception to the configured Playwright `Page` and/or `BrowserContext`.
   *
   * Behavior:
   * - Restores any prior routes to avoid duplicates, then registers fresh routes on the active page/context.
   * - Normalizes and stores URL patterns from `settings.urls` if provided, otherwise uses constructor `settings.urls`.
   * - For matching requests, injects Stoobly headers and applies URL-specific options (match/rewrite rules, fixtures).
   * - Applies header-backed settings with stable precedence: explicit `settings` > fluent headers > constructor defaults.
   * - Establishes/returns a session ID (explicit `settings.sessionId` > fluent `.withSessionId()` >
   *   constructor `sessionId` > auto-generated timestamp).
   *
   * Requirements:
   * - Call `.withPage(page)` and/or `.withContext(context)` before applying to define interception targets.
   *
   * Parameters:
   * - settings (optional): Partial<InterceptorSettings>
   *   - urls?: (string | RegExp | InterceptorUrl)[] — URL filters to intercept
   *   - mode?: InterceptMode — proxy mode (mock, record, replay)
   *   - mock?: { policy?: MockPolicy }
   *   - record?: { order?: RecordOrder; policy?: RecordPolicy; strategy?: RecordStrategy }
   *   - scenarioKey?: string
   *   - scenarioName?: string
   *   - sessionId?: string
   *
   * Returns:
   * - Promise<string> — the current session ID
   *
   * Notes:
   * - Use `.enable()` instead for clarity; `enable()` is an alias.
   *
   * @deprecated Use `enable()` instead. `enable()` is an alias provided for clarity.
   */
  async apply(settings?: Partial<InterceptorSettings>) {
    await this.restore();

    // After clearing intercepts on old urls, apply intercepts on new urls
    this.urls = this.normalizeUrls(settings?.urls ?? this.settings.urls);
    await this.decorate();

    this.withSettings(settings);

    return this.applySession(settings);
  }

  // @deprecated Use `enableForPage()` instead. `enableForPage()` is an alias provided for clarity.
  async applyToPage(page: Page, settings?: Partial<InterceptorSettings>) {
    this.withPage(page);
    return await this.apply(settings);
  }

  // @deprecated Use `enableForContext()` instead. `enableForContext()` is an alias provided for clarity.
  async applyToContext(context: BrowserContext, settings?: Partial<InterceptorSettings>) {
    this.withContext(context);
    return await this.apply(settings);
  }

  /**
   * Clears all Playwright request interceptors and resets the interceptor session state.
   *
   * Effects:
   * - Unroutes all previously registered page/context routes.
   * - Stops injecting Stoobly headers into subsequent Playwright requests.
   * - Resets internal session state so a new session ID will be chosen on the next `apply()`/`enable()`.
   *
   * Notes:
   * - Does not clear configured URLs or fluent header settings; those persist for the next `apply()`/`enable()`.
   *
   * Returns:
   * - Promise<void>
   *
   * @deprecated Use `disable()` instead. `disable()` is an alias for clarity and consistency with `enable()`.
   */
  async clear() {
    await this.restore();
    this.clearSession();
  }

  async disable() {
    return await this.clear();
  }

  async enable(settings?: Partial<InterceptorSettings>) {
    return await this.apply(settings);
  }

  async enableForPage(page: Page, settings?: Partial<InterceptorSettings>) {
    this.withPage(page);
    return await this.enable(settings);
  }

  async enableForContext(context: BrowserContext, settings?: Partial<InterceptorSettings>) {
    this.withContext(context);
    return await this.enable(settings);
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
    for (const interceptorUrl of this.urls) {
      const pattern = interceptorUrl.pattern;
      // Use the same stable string key as in decoratePlaywright
      const mapKey = pattern instanceof RegExp ? pattern.source : pattern;
      const handler = handlers.get(mapKey);
      if (!handler) {
        continue;
      }

      try {
        await target.unroute(pattern, handler);
      } catch (error) {
        // Ignore errors if context/page is already closed
        console.warn('Failed to unroute:', (error as Error).message);
      }

      handlers.delete(mapKey);
    }
  }

  private async decoratePlaywright(
    target: Page | BrowserContext,
    handlers: Map<string, (route: PlaywrightRoute, req: PlaywrightRequest) => Promise<void>>
  ) {
    const urlsToVisit = this.urlsToVisit;

    // Register routes on the current page or context
    for (const interceptorUrl of this.urls) {
      const pattern = interceptorUrl.pattern;
      const handler = async (route: PlaywrightRoute, req: PlaywrightRequest) => {
        const headers = this.decorateHeaders(req.headers());
        this.applyUrlSpecificHeaders(headers, interceptorUrl);
        this.filterOverwriteHeader(headers, pattern, urlsToVisit);

        await route.continue({ headers: headers });
      }
      
      // Use a stable string key for the Map
      const mapKey = pattern instanceof RegExp ? pattern.source : pattern;
      
      try {
        await target.route(pattern, handler);
        handlers.set(mapKey, handler);
      } catch (error) {
        // Ignore errors if context/page is already closed
        console.warn('Failed to route:', (error as Error).message);
      }
    }

    this.appliedPlaywright = true;
  }

  private withPage(page: Page) {
    this.page = page;

    return this;
  }

  private withContext(context: BrowserContext) {
    this.context = context;

    return this;
  }
}
