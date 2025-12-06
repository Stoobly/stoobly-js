import { ProxyMode } from "@constants/intercept";

import { INTERCEPT_ACTIVE, PROXY_MODE, RECORD_POLICY, SCENARIO_KEY, SESSION_ID, TEST_TITLE } from "../constants/custom_headers";
import { InterceptOptions, RecordOptions } from "../types/options";
import { getTestTitle } from "../utils/test-detection";
import { RecordPolicy } from "@constants/policy";

export class Interceptor {
  static originalXMLHttpRequestOpen = typeof XMLHttpRequest !== 'undefined' ? XMLHttpRequest.prototype.open : null;
  static originalFetch = typeof window !== 'undefined' ? window.fetch.bind(window) : null;

  protected _urls: (RegExp | string)[] = [];

  private appliedFetch: boolean = false;
  private appliedXMLHttpRequestOpen: boolean = false;
  private headers: Record<string, string> = {};

  get urls() {
    return this._urls;
  }

  set urls(urls: (RegExp | string)[]) {
    this.clear();
    this._urls = urls;
  }

  async apply(options?: InterceptOptions) {
    if (options?.urls) {
      this.urls = options.urls;
    }

    const cb = () => {
      this.decorateFetch();
      this.decorateXMLHttpRequestOpen();
    }

    return await this.withSession(cb, options?.sessionId);
  }

  applyScenario(scenarioKey?: string, options?: InterceptOptions) {
    this.withScenario(scenarioKey);
    return this.apply(options);
  }

  clear() {
    this.clearFetch();
    this.clearXMLHttpRequestOpen();
  }
  
  startRecord(options?: RecordOptions) {
    this.withIntercept(true);
    this.withProxyMode(ProxyMode.record);
    this.withRecordPolicy(options?.policy);
    return this.apply(options);
  }

  stopRecord() {
    this.withIntercept(false);
    this.withProxyMode();
  }

  withIntercept(value?: boolean) {
    if (!value) {
      delete this.headers[INTERCEPT_ACTIVE];
    } else {
      this.headers[INTERCEPT_ACTIVE] = value ? '1' : '0';
    }
  }

  withProxyMode(mode?: ProxyMode): void {
    if (!mode) {
      delete this.headers[PROXY_MODE];
    } else {
      this.headers[PROXY_MODE] = mode;
    }
  }

  withRecordPolicy(policy?: RecordPolicy): void {
    if (!policy) {
      delete this.headers[RECORD_POLICY];
    } else {
      this.headers[RECORD_POLICY] = policy;
    }
  }

  withScenario(key?: string): void {
    if (!key) {
      delete this.headers[SCENARIO_KEY];
    } else {
      this.headers[SCENARIO_KEY] = key;
    }
  }

  withTestTitle(title?: string): void {
    if (!title) {
      delete this.headers[TEST_TITLE];
    } else {
      this.headers[TEST_TITLE] = title;
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
      method: string,
      url: string,
      async: boolean = true,
      user?: string | null,
      password?: string | null
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

  protected async withSession(cb: () => void | Promise<void>, sessionId?: string) {
    this.headers[SESSION_ID] = sessionId || (new Date()).getTime().toString();
    await cb();
    return this.headers[SESSION_ID];
  }
}