import { PROXY_MODE, RECORD_ORDER, RECORD_POLICY, RECORD_STRATEGY, SCENARIO_KEY, SCENARIO_NAME, SESSION_ID, TEST_TITLE } from "@constants/custom_headers";
import { InterceptMode, RecordOrder, RecordPolicy, RecordStrategy } from "@constants/intercept";

import { InterceptorOptions } from "../types/options";
import { getTestTitle } from "../utils/test-detection";

export class Interceptor {
  constructor(options: InterceptorOptions) {
    this.options = options;
  }

  static originalXMLHttpRequestOpen = typeof XMLHttpRequest !== 'undefined' ? XMLHttpRequest.prototype.open : null;
  static originalFetch = typeof window !== 'undefined' ? window.fetch.bind(window) : null;

  protected headers: Record<string, string> = {};
  protected options: InterceptorOptions;
  protected urls: (RegExp | string)[] = [];

  private started: boolean = false;
  private appliedFetch: boolean = false;
  private appliedXMLHttpRequestOpen: boolean = false;

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

  withRecordOrder(order?: RecordOrder) {
    if (!order) {
      delete this.headers[RECORD_ORDER];
    } else {
      this.headers[RECORD_ORDER] = order;
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

    // Only send overwrite record order once
    if (this.headers[RECORD_ORDER] === RecordOrder.Overwrite) {
      delete this.headers[RECORD_ORDER];
    }

    // Dynamically detect test title at interception time
    if (!this.headers[TEST_TITLE]) {
      const testTitle = getTestTitle();

      if (testTitle) {
        headers[TEST_TITLE] = testTitle;
      }
    }

    return headers;
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

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const url = input instanceof Request ? input.url : input.toString();

      if (self.allowedUrl(url)) {
        if (!init) {
          init = {};
        }

        if (!init.headers) {
          init.headers = {};
        }

        init.headers = self.decorateHeaders(init.headers as Record<string, string>);
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

        Object.entries(headers).forEach(([key, value]) => {
          this.setRequestHeader(key, value);
        });
      });
      return original.apply(this, arguments as any);
    };

    this.appliedXMLHttpRequestOpen = true;
  }
}