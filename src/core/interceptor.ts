import { MATCH_RULES, MOCK_POLICY, OVERWRITE_ID, PROXY_MODE, PUBLIC_DIRECTORY_PATH, RECORD_ORDER, RECORD_POLICY, RECORD_STRATEGY, RESPONSE_FIXTURES_PATH, REWRITE_RULES, SCENARIO_CREATE_IF_MISSING, SCENARIO_KEY, SCENARIO_NAME, SESSION_ID, TEST_TITLE } from "@constants/custom_headers";
import { InterceptMode, MockPolicy, RecordOrder, RecordPolicy, RecordStrategy } from "@constants/intercept";

import { InterceptorSettings, InterceptorUrl } from "../types/settings";
import { getTestTitle } from "../utils/test-detection";

export class Interceptor {
  static originalXMLHttpRequestOpen = typeof XMLHttpRequest !== 'undefined' ? XMLHttpRequest.prototype.open : null;
  static originalFetch = typeof window !== 'undefined' ? window.fetch.bind(window) : null;

  private id: string;
  protected headers: Record<string, string> = {};
  protected settings: InterceptorSettings;
  protected urls: InterceptorUrl[] = [];

  private started: boolean = false; // Locks session creation
  private appliedFetch: boolean = false;
  private appliedXMLHttpRequestOpen: boolean = false;

  constructor(settings: InterceptorSettings) {
    this.settings = settings;
    this.id = Math.random().toString(36).substring(2, 15);
  }

  get urlsToVisit() {
    return this.urls.map((u) => u.pattern).slice();
  }

  protected normalizeUrls(
    urls: (string | RegExp | InterceptorUrl)[]
  ): InterceptorUrl[] {
    if (!urls?.length) return [];

    return urls.map((url, index) => {
      if (typeof url === "string" || url instanceof RegExp) {
        return { pattern: url };
      }

      const interceptorUrl = url as InterceptorUrl;
      const pattern = interceptorUrl.pattern;

      const isValidPattern =
        typeof pattern === "string" || pattern instanceof RegExp;

      if (!isValidPattern) {
        throw new Error(
          `Invalid InterceptorUrl at index ${index}: 'pattern' must be a string or RegExp`
        );
      }

      return interceptorUrl;
    });
  }

  /**
   * Applies HTTP request interception to `window.fetch` and `XMLHttpRequest`.
   *
   * Behavior:
   * - Restores any prior decorations to avoid duplicates, then applies fresh ones.
   * - Normalizes and stores URL patterns from `settings.urls` if provided, otherwise uses constructor `settings.urls`.
   * - Decorates fetch and XHR to inject Stoobly headers for allowed URLs.
   * - Applies header-backed settings (mode, record policy/order/strategy, mock policy, scenario key/name)
   *   using a stable precedence: explicit `settings` > previously set fluent headers > constructor defaults.
   * - Establishes/returns a session ID (explicit `settings.sessionId` > fluent `.withSessionId()` >
   *   constructor `sessionId` > auto-generated timestamp).
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
   * - string — the current session ID
   *
   * Notes:
   * - Use `.enable()` instead for clarity; `enable()` is an alias.
   *
   * @deprecated Use `enable()` instead. `enable()` is an alias provided for clarity.
   */
  apply(settings?: Partial<InterceptorSettings>): string | Promise<string> {
    this.restore();

    // After clearing intercepts on old urls, apply intercepts on new urls
    this.urls = this.normalizeUrls(settings?.urls ?? this.settings.urls);

    this.decorate();

    this.withSettings(settings);

    return this.applySession(settings);
  }

  /**
   * Clears all HTTP request interceptors and resets the interceptor session state.
   *
   * Effects:
   * - Restores the original `window.fetch` and `XMLHttpRequest.prototype.open` implementations.
   * - Stops injecting Stoobly headers into subsequent requests.
   * - Resets internal session state so a new session ID will be chosen on the next `apply()`/`enable()`.
   *
   * Notes:
   * - This does not mutate configured URLs or default headers you've set via the fluent API.
   *   Those will be reused on the next `apply()`/`enable()` call.
   *
   * Returns:
   * - void
   *
   * @deprecated Use `disable()` instead. `disable()` is an alias for clarity and consistency with `enable()`.
   */
  clear() {
    this.restore();
    this.clearSession();
  }

  // Alias for clear()
  disable() {
    return this.clear();
  }

  // Alias for apply()
  enable(settings?: Partial<InterceptorSettings>) {
    return this.apply(settings);
  }

  // Settings term aligns with UI
  withDefaultSettings() {
    this.headers = {};
    this.withSettings();
    return this;
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

  withInterceptModeMock() {
    this.withInterceptMode(InterceptMode.mock);
    return this;
  }

  // Starts recording HTTP requests. Sets proxy mode to record, applies record policy and order
  // if provided, and returns a promise resolving to the session ID.
  withInterceptModeRecord() {
    this.withInterceptMode(InterceptMode.record);
    return this;
  }

  withInterceptModeReplay() {
    this.withInterceptMode(InterceptMode.replay);
    return this;
  }

  withMockPolicy(policy?: MockPolicy) {
    if (!policy) {
      delete this.headers[MOCK_POLICY];
    } else {
      this.headers[MOCK_POLICY] = policy;
    }

    return this;
  }

  withSettings(_settings?: Partial<InterceptorSettings>) {
    // Helper for applying header-backed settings (record order, policy, strategy, scenario key/name)
    // with a consistent precedence model:
    //
    //   1. Value explicitly provided to apply() via `_settings` (fromApply)
    //   2. Existing header value, typically set via fluent API (e.g. `.withScenarioKey()`)
    //   3. Value from constructor settings (fromCtor), but only if no header has been set yet
    //
    // This mirrors the precedence used for `sessionId`, except `sessionId` also falls back to
    // an auto-generated value when neither apply(), fluent API, nor constructor provide one.
    const applySetting = <T>(
      headerKey: string,
      fromApply: T | undefined,
      fromCtor: T | undefined,
      setter: (value: T) => this,
    ) => {
      if (fromApply !== undefined) {
        setter.call(this, fromApply);
      } else if (fromCtor !== undefined && !this.headers[headerKey]) {
        setter.call(this, fromCtor);
      }
    };

    // Only override headers if explicitly provided in _settings, otherwise preserve
    // values set via fluent API (e.g., .withScenarioKey()). For initial setup,
    // use values from this.settings if they exist and weren't set via fluent API.
    applySetting(
      PROXY_MODE,
      _settings?.mode,
      this.settings.mode,
      this.withInterceptMode.bind(this),
    );

    applySetting(
      MOCK_POLICY,
      _settings?.mock?.policy,
      this.settings.mock?.policy,
      this.withMockPolicy.bind(this),
    );

    applySetting(
      RECORD_ORDER,
      _settings?.record?.order,
      this.settings.record?.order,
      this.withRecordOrder.bind(this),
    );

    applySetting(
      RECORD_POLICY,
      _settings?.record?.policy,
      this.settings.record?.policy,
      this.withRecordPolicy.bind(this),
    );

    applySetting(
      RECORD_STRATEGY,
      _settings?.record?.strategy,
      this.settings.record?.strategy,
      this.withRecordStrategy.bind(this),
    );

    applySetting(
      SCENARIO_KEY,
      _settings?.scenarioKey,
      this.settings.scenarioKey,
      this.withScenarioKey.bind(this),
    );

    applySetting(
      SCENARIO_NAME,
      _settings?.scenarioName,
      this.settings.scenarioName,
      this.withScenarioName.bind(this),
    );

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

    // If a scenario name is requested, also ask the server to create the scenario if it's missing.
    if (headers[SCENARIO_NAME]) {
      headers[SCENARIO_CREATE_IF_MISSING] = '1';
    }

    // Dynamically detect test title at interception time
    if (!this.headers[TEST_TITLE]) {
      const testTitle = getTestTitle();

      if (testTitle) {
        headers[TEST_TITLE] = testTitle;
      }
    }

    switch (this.headers[PROXY_MODE]) {
      case InterceptMode.record:
        delete headers[MOCK_POLICY];
        break;
      case InterceptMode.mock:
        delete headers[RECORD_ORDER];
        delete headers[OVERWRITE_ID];
        delete headers[RECORD_POLICY];
        delete headers[RECORD_STRATEGY];
        break;
      default:
        delete headers[MOCK_POLICY];
        delete headers[RECORD_ORDER];
        delete headers[OVERWRITE_ID];
        delete headers[RECORD_POLICY];
        delete headers[RECORD_STRATEGY];
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

  protected applySession(_settings?: Partial<InterceptorSettings>) {
    // In the case where apply() is called multiple times, 
    // return the session ID without setting headers to default values
    if (this.started) {
      return this.headers[SESSION_ID];
    } else {
      this.started = true;
    }

    // Session ID precedence:
    // 1. Explicit _settings.sessionId passed to apply()
    // 2. Existing header set via fluent .withSessionId()
    // 3. sessionId from constructor settings
    // 4. Auto-generated timestamp
    const sessionId =
      _settings?.sessionId ??
      this.headers[SESSION_ID] ??
      this.settings.sessionId ??
      (new Date()).getTime().toString();

    this.withSessionId(sessionId);

    return sessionId;
  }

  protected clearSession() {
    this.started = false;
  }

  private allowedUrl(url: string) {
    return !!this.findMatchingUrl(url);
  }

  private findMatchingUrl(url: string): InterceptorUrl | undefined {
    for (let i = 0; i < this.urls.length; ++i) {
      const interceptorUrl = this.urls[i];
      const pattern = interceptorUrl.pattern;

      if (pattern instanceof RegExp) {
        const match = pattern.test(url);
        if (pattern.global || pattern.sticky) {
          pattern.lastIndex = 0;
        }
        if (match) {
          return interceptorUrl;
        }
      }

      if (pattern === url) {
        return interceptorUrl;
      }
    }

    return undefined;
  }

  private encodeBase64(json: string): string {
    return typeof Buffer !== 'undefined'
      ? Buffer.from(json, 'utf-8').toString('base64')
      : btoa(new TextEncoder().encode(json).reduce((data, byte) => data + String.fromCharCode(byte), ''));
  }

  /**
   * Conditionally applies matchRules, rewriteRules, publicDirectoryPath, and responseFixturesPath
   * headers from the matching InterceptorUrl when the request URL matches a pattern with these options set.
   */
  protected applyUrlSpecificHeaders(
    headers: Record<string, string>,
    interceptorUrl?: InterceptorUrl
  ) {
    if (!interceptorUrl) return;

    if (interceptorUrl.matchRules?.length) {
      headers[MATCH_RULES] = this.encodeBase64(JSON.stringify(interceptorUrl.matchRules));
    }
    if (interceptorUrl.rewriteRules?.length) {
      const serialized = interceptorUrl.rewriteRules.map((rule) => {
        const out: Record<string, unknown> = {};
        if (rule.urlRules) out.url_rules = rule.urlRules;
        if (rule.parameterRules) out.parameter_rules = rule.parameterRules;
        return out;
      });
      headers[REWRITE_RULES] = this.encodeBase64(JSON.stringify(serialized));
    }
    if (interceptorUrl.publicDirectoryPath) {
      headers[PUBLIC_DIRECTORY_PATH] = interceptorUrl.publicDirectoryPath;
    }
    if (interceptorUrl.responseFixturesPath) {
      headers[RESPONSE_FIXTURES_PATH] = interceptorUrl.responseFixturesPath;
    }
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
        self.applyUrlSpecificHeaders(headers, self.findMatchingUrl(url));
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
        self.applyUrlSpecificHeaders(headers, self.findMatchingUrl(url));
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