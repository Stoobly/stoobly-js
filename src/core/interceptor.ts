import { MATCH_RULES, OVERWRITE_ID, PROXY_MODE, RECORD_ORDER, RECORD_POLICY, RECORD_STRATEGY, REWRITE_RULES, SCENARIO_KEY, SCENARIO_NAME, SESSION_ID, TEST_TITLE } from "@constants/custom_headers";
import { InterceptMode, RecordOrder, RecordPolicy, RecordStrategy } from "@constants/intercept";
import { MatchRule, RewriteRule } from "@models/config/types";

import { InterceptorOptions, InterceptorUrl } from "../types/options";
import { getTestTitle } from "../utils/test-detection";

export class Interceptor {
  static originalXMLHttpRequestOpen = typeof XMLHttpRequest !== 'undefined' ? XMLHttpRequest.prototype.open : null;
  static originalFetch = typeof window !== 'undefined' ? window.fetch.bind(window) : null;

  private id: string;
  protected headers: Record<string, string> = {};
  protected options: InterceptorOptions;
  protected urls: InterceptorUrl[] = [];

  private started: boolean = false;
  private appliedFetch: boolean = false;
  private appliedXMLHttpRequestOpen: boolean = false;

  constructor(options: InterceptorOptions) {
    this.options = options;
    this.id = Math.random().toString(36).substring(2, 15);
  }

  get urlsToVisit() {
    return this.urls.map((u) => u.pattern).slice();
  }

  // Applies HTTP request interception to fetch and XMLHttpRequest. Clears existing
  // interceptors, sets URL filters if provided, and decorates fetch/XMLHttpRequest to inject custom headers. 
  apply(options?: Partial<InterceptorOptions>): string | Promise<string> {
    this.restore();

    // After clearing intercepts on old urls, apply intercepts on new urls
    this.urls = options?.urls || this.options.urls;

    this.decorate();

    return this.applySession(options);
  }
  
  // Starts recording HTTP requests. Sets proxy mode to record, applies record policy and order
  // if provided, and returns a promise resolving to the session ID.
  applyRecord(options?: Partial<InterceptorOptions>) {
    this.withInterceptMode(InterceptMode.record);
    return this.apply(options);
  }

  clear() {
    this.restore();
    this.clearSession();
  }

  // Resets proxy mode, record policy, and order headers to their default values.
  // This effectively stops recording requests without modifying other headers.
  clearRecord() {
    this.withInterceptMode();
    this.clear();
  }

  withTestTitle(title?: string) {
    if (!title) {
      delete this.headers[TEST_TITLE];
    } else {
      this.headers[TEST_TITLE] = title;
    }

    return this;
  }

  withInterceptMode(mode?: InterceptMode) {
    if (!mode) {
      delete this.headers[PROXY_MODE];
    } else {
      this.headers[PROXY_MODE] = mode;
    }

    return this;
  }

  withMatchRules(matchRules?: MatchRule[]) {
    if (!matchRules?.length) {
      delete this.headers[MATCH_RULES];
    } else {
      const json = JSON.stringify(matchRules);
      this.headers[MATCH_RULES] = typeof Buffer !== 'undefined'
        ? Buffer.from(json, 'utf-8').toString('base64')
        : btoa(unescape(encodeURIComponent(json)));
    }

    return this;
  }

  withRecordOrder(order?: RecordOrder) {
    if (!order) {
      delete this.headers[RECORD_ORDER];
      delete this.headers[OVERWRITE_ID];
    } else {
      this.headers[RECORD_ORDER] = order;
    }

    if (order === RecordOrder.Overwrite) {
      // Use instance ID for OVERWRITE_ID to group all requests in this recording session.
      // The ID remains constant across multiple apply() calls, ensuring that all requests
      // from the same interceptor instance belong to the same "overwrite batch" on the server.
      // This allows the server to treat all first requests (per URL pattern) as part of a 
      // single atomic overwrite operation that replaces existing scenario data.
      //
      // Example scenario use case:
      //   const interceptor = new Interceptor({ 
      //     scenarioKey: 'user-login',
      //     record: { order: RecordOrder.Overwrite }
      //   });
      //   // this.id = "abc123" (generated once)
      //
      //   // Test Run 1:
      //   await interceptor.apply();
      //   // Server: "Replace 'user-login' scenario with requests from batch abc123"
      //
      //   // Test Run 2 (same interceptor, new apply()):
      //   await interceptor.apply();
      //   // Server: "Replace 'user-login' scenario with requests from batch abc123 (updated)"
      this.headers[OVERWRITE_ID] = this.id;
    }

    return this;
  }

  withRecordPolicy(policy?: RecordPolicy) {
    if (!policy) {
      delete this.headers[RECORD_POLICY];
    } else {
      this.headers[RECORD_POLICY] = policy;
    }

    return this;
  }

  withRecordStrategy(strategy?: RecordStrategy) {
    if (!strategy) {
      delete this.headers[RECORD_STRATEGY];
    } else {
      this.headers[RECORD_STRATEGY] = strategy;
    }

    return this;
  }

  withRewriteRules(rewriteRules?: RewriteRule[]) {
    if (!rewriteRules?.length) {
      delete this.headers[REWRITE_RULES];
    } else {
      const json = JSON.stringify(rewriteRules);
      this.headers[REWRITE_RULES] = typeof Buffer !== 'undefined'
        ? Buffer.from(json, 'utf-8').toString('base64')
        : btoa(unescape(encodeURIComponent(json)));
    }

    return this;
  }

  withScenarioKey(key?: string) {
    if (!key) {
      delete this.headers[SCENARIO_KEY];
    } else {
      this.headers[SCENARIO_KEY] = key;
    }

    return this;
  }

  withScenarioName(name?: string) {
    if (!name) {
      delete this.headers[SCENARIO_NAME];
    } else {
      this.headers[SCENARIO_NAME] = name;
    }

    return this;
  }

  withSessionId(sessionId?: string) {
    if (!sessionId) {
      delete this.headers[SESSION_ID];
    } else {
      this.headers[SESSION_ID] = sessionId;
    }

    return this;
  }

  protected decorate() {
    this.decorateFetch();
    this.decorateXMLHttpRequestOpen(); 
  }

  protected restore() {
    this.restoreFetch();
    this.restoreXMLHttpRequestOpen();
  }

  protected decorateHeaders(initialHeaders: Record<string, string>) {
    const headers = {
      ...initialHeaders,
      ...this.headers,
    };

    // Dynamically detect test title at interception time
    if (!this.headers[TEST_TITLE]) {
      const testTitle = getTestTitle();

      if (testTitle) {
        headers[TEST_TITLE] = testTitle;
      }
    }

    return headers;
  }

  /**
   * Filters out the overwrite record order header after the first request to each URL pattern.
   * 
   * The overwrite header (RECORD_ORDER and OVERWRITE_ID) should only be sent once per URL 
   * pattern in this.urls, not once per actual request URL. This method mutates the urlsToVisit 
   * array to track which patterns have already been visited.
   * 
   * Implementation notes:
   * - urlsToVisit is a copy of this.urls created when the interceptor is decorated
   * - Each request removes its matching pattern from urlsToVisit
   * - When urlsToVisit is empty or pattern not found, both RECORD_ORDER and OVERWRITE_ID 
   *   are removed from subsequent requests
   * 
   * Pattern matching:
   * - String patterns: Direct equality check (url === urlPattern)
   * - RegExp patterns: Pattern test against the actual URL
   * 
   * Lifecycle safety:
   * - For fetch/XHR: urlsToVisit is created once per decorate() call and shared across
   *   all intercepted requests. This is safe because restore() removes the interceptor
   *   and decorate() creates a fresh urlsToVisit.
   * - For Playwright: urlsToVisit is created per decoratePlaywright() call. When withPage()
   *   is called with a different page (e.g., in beforeEach), the old handlers are cleaned
   *   up via restore() and new handlers with fresh urlsToVisit are created.
   * - For Cypress: Same lifecycle as Playwright - decorateCypress() creates fresh urlsToVisit
   *   and restore() cleans up old interceptors.
   * 
   * Example:
   *   this.urls = [{ pattern: /\/api\/.+/ }, { pattern: 'https://example.com/exact' }]
   *
   *   Request 1 to /api/users - matches first pattern, removes from urlsToVisit, includes headers
   *   Request 2 to /api/posts - pattern already removed, omits overwrite headers
   *   Request 3 to exact URL - matches second pattern, removes from urlsToVisit, includes headers
   *   Request 4 to exact URL - pattern already removed, omits overwrite headers
   * 
   * @param headers - The headers object to potentially modify
   * @param url - The URL or URL pattern being requested (actual URL for fetch/XHR, pattern for Playwright/Cypress)
   * @param urlsToVisit - Mutable array of URL patterns that haven't been visited yet
   */
  protected filterOverwriteHeader(
    headers: Record<string, string>,
    url: RegExp | string,
    urlsToVisit: (RegExp | string)[],
  ) {
    // Only send overwrite record order once for the first request to each URL pattern
    if (headers[RECORD_ORDER] === RecordOrder.Overwrite) {
      for (let i = 0; i < urlsToVisit.length; ++i) {
        const urlPattern = urlsToVisit[i];

        // Case 1: Both url and urlPattern are the same RegExp object (Playwright/Cypress)
        if (url instanceof RegExp && urlPattern instanceof RegExp && url.source === urlPattern.source) {
          urlsToVisit.splice(i, 1);
          return;
        }

        // Case 2: urlPattern is a RegExp and url is an actual request URL string (fetch/XHR)
        // Test if the pattern matches the actual URL
        if (urlPattern instanceof RegExp && typeof url === 'string') {
          // Handle stateful RegExp with global/sticky flags
          // Reset lastIndex to avoid issues with repeated tests on the same RegExp instance
          const match = urlPattern.test(url);
          if (urlPattern.global || urlPattern.sticky) {
            urlPattern.lastIndex = 0;
          }
          if (match) {
            urlsToVisit.splice(i, 1);
            return;
          }
        }

        // Case 3: Direct string equality (exact string patterns)
        if (urlPattern === url) {
          urlsToVisit.splice(i, 1);
          return;
        }
      }
      // Pattern not found in urlsToVisit, remove both overwrite headers
      delete headers[RECORD_ORDER];
      delete headers[OVERWRITE_ID];
    }
  }

  protected applySession(_options?: Partial<InterceptorOptions>) {
    // In the case where apply() is called multiple times, 
    // return the session ID without setting headers to default values
    if (this.started) {
      return this.headers[SESSION_ID];
    } else {
      this.started = true;
    }

    const options = {
      ...this.options,
      ..._options,
    }
    
    this.withRecordOrder(options.record?.order);
    this.withRecordPolicy(options.record?.policy);
    this.withRecordStrategy(options.record?.strategy);
    this.withScenarioKey(options.scenarioKey);
    this.withScenarioName(options.scenarioName);

    if (this.urls.length) {
      const matchRules = this.urls.flatMap((u) => u.matchRules ?? []);
      const rewriteRules = this.urls.flatMap((u) => u.rewriteRules ?? []);
      this.withMatchRules(matchRules.length ? matchRules : undefined);
      this.withRewriteRules(rewriteRules.length ? rewriteRules : undefined);
    }

    const sessionId = options.sessionId || (new Date()).getTime().toString();
    this.withSessionId(sessionId);
    return sessionId;
  }

  protected clearSession() {
    this.headers = {};
    this.started = false;
  }

  private allowedUrl(url: string) {
    for (let i = 0; i < this.urls.length; ++i) {
      const pattern = this.urls[i].pattern;

      if (pattern instanceof RegExp) {
        if (pattern.test(url)) {
          return true;
        }
      }

      if (pattern === url) {
        return true;
      }
    }

    return false;
  }

  private restoreFetch() {
    if (this.appliedFetch && Interceptor.originalFetch) {
      window.fetch = Interceptor.originalFetch;
    }

    this.appliedFetch = false;
  }

  private restoreXMLHttpRequestOpen() {
    if (this.appliedXMLHttpRequestOpen && Interceptor.originalXMLHttpRequestOpen) {
      XMLHttpRequest.prototype.open = Interceptor.originalXMLHttpRequestOpen;
    }

    this.appliedXMLHttpRequestOpen = false;
  }

  private decorateFetch() {
    if (this.appliedFetch || !Interceptor.originalFetch) {
      return;
    }

    const self = this;
    const original = Interceptor.originalFetch;
    const urlsToVisit = this.urlsToVisit;

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const url = input instanceof Request ? input.url : input.toString();

      if (self.allowedUrl(url)) {
        if (!init) {
          init = {};
        }

        if (!init.headers) {
          init.headers = {};
        }
        
        const headers = self.decorateHeaders(init.headers as Record<string, string>);
        self.filterOverwriteHeader(headers, url, urlsToVisit);
        init.headers = headers;
      }

      return original(input, init);
    };

    this.appliedFetch = true;
  }

  private decorateXMLHttpRequestOpen() {
    if (this.appliedXMLHttpRequestOpen || !Interceptor.originalXMLHttpRequestOpen) {
      return;
    }

    const self = this;
    const original = Interceptor.originalXMLHttpRequestOpen;
    const urlsToVisit = this.urlsToVisit;

    XMLHttpRequest.prototype.open = function (
      _method: string,
      url: string,
      _async: boolean = true,
      _user?: string | null,
      _password?: string | null
    ): void {
      this.addEventListener("readystatechange", function () {
        if (this.readyState !== 1) {
          return; // Not opened
        }

        if (!self.allowedUrl(url)) {
          return;
        }

        const headers = self.decorateHeaders({});
        self.filterOverwriteHeader(headers, url, urlsToVisit);

        Object.entries(headers).forEach(([key, value]) => {
          this.setRequestHeader(key, value);
        });
      });
      return original.apply(this, arguments as any);
    };

    this.appliedXMLHttpRequestOpen = true;
  }
}