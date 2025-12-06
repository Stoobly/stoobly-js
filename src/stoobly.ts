import {DEFAULT_UI_URL} from './constants/config';
import {Cypress} from './core/cypress';
import {ConfigResource, HttpService} from './core/http';
import {Interceptor} from './core/interceptor';
import {Playwright} from './core/playwright';
import {Config} from './models/config';

export default class Stoobly {
  httpService: HttpService;

  private _cypress: Cypress | null = null;
  private _interceptor: Interceptor | null = null;
  private _playwright: Playwright | null = null;

  constructor(apiUrl: string = DEFAULT_UI_URL) {
    this.httpService = new HttpService(apiUrl);
  }

  get config() {
    const resource = new ConfigResource(this.httpService);
    return new Config(resource);
  }

  get cypress() {
    if (!this._cypress) {
      this._cypress = new Cypress();
    }

    return this._cypress;
  }

  get interceptor() {
    if (!this._interceptor) {
      this._interceptor = new Interceptor();
    }

    return this._interceptor;
  }

  get playwright() {
    if (!this._playwright) {
      this._playwright = new Playwright();
    }

    return this._playwright;
  }

  set apiUrl(url: string) {
    this.httpService = new HttpService(url);
  }
}
