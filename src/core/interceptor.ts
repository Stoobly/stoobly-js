import { PROXY_MODE, RECORD_ORDER, RECORD_POLICY, RECORD_STRATEGY, SCENARIO_KEY, SCENARIO_NAME, SESSION_ID, TEST_TITLE } from "@constants/custom_headers";
import { ProxyMode, RecordOrder, RecordPolicy, RecordStrategy } from "@constants/proxy";

import { InterceptorOptions } from "../types/options";
import { getTestTitle } from "../utils/test-detection";

export class Interceptor {
  constructor(options: InterceptorOptions) {
    this.urls = options.urls;

    this.withRecordOrder(options.record?.order);
    this.withRecordPolicy(options.record?.policy);
    this.withRecordStrategy(options.record?.strategy);
    this.withScenarioKey(options.scenarioKey);
    this.withScenarioName(options.scenarioName);
    this.withSessionId(options.sessionId);
  }

  static originalXMLHttpRequestOpen = typeof XMLHttpRequest !== 'undefined' ? XMLHttpRequest.prototype.open : null;
  static originalFetch = typeof window !== 'undefined' ? window.fetch.bind(window) : null;

  protected _urls: (RegExp | string)[] = [];
  protected _sessionId: string | null = null;

  private appliedFetch: boolean = false;
  private appliedXMLHttpRequestOpen: boolean = false;
  private headers: Record<string, string> = {};

  get urls() {
    return this._urls;
  }

  set urls(urls: (RegExp | string)[]) {
    this._urls = urls;
  }

  get sessionId(): string | null {
    return this._sessionId;
  }

  set sessionId(sessionId: string | null) {
    this._sessionId = sessionId;
  }

  // Applies HTTP request interception to fetch and XMLHttpRequest. Clears existing
  // interceptors, sets URL filters if provided, and decorates fetch/XMLHttpRequest to inject custom headers. 
  apply() {
    this.clear();

    this.decorateFetch();
    this.decorateXMLHttpRequestOpen();
  }

  clear() {
    this.clearFetch();
    this.clearXMLHttpRequestOpen();
  }
  
  // Starts recording HTTP requests. Sets proxy mode to record, applies record policy and order
  // if provided, and returns a promise resolving to the session ID.
  startRecord() {
    this.withProxyMode(ProxyMode.record);

    this.apply();
  }

  // Resets proxy mode, record policy, and order headers to their default values.
  // This effectively stops recording requests without modifying other headers.
  stopRecord() {
    this.withProxyMode();

    // Do not call apply, the changes will reflect dynamically
  }

  withTestTitle(title?: string) {
    if (!title) {
      delete this.headers[TEST_TITLE];
    } else {
      this.headers[TEST_TITLE] = title;
    }

    return this;
  }

  withProxyMode(mode?: ProxyMode) {
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
      this.headers[SESSION_ID] = (new Date()).getTime().toString();
    } else {
      this.headers[SESSION_ID] = sessionId;
    }
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

  private clearFetch() {
    if (this.appliedFetch && Interceptor.originalFetch) {
      window.fetch = Interceptor.originalFetch;
    }

    this.appliedFetch = false;
  }

  private clearXMLHttpRequestOpen() {
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