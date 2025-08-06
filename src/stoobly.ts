import {DEFAULT_UI_URL} from './constants/config';
import {Cypress} from './core/cypress';
import {ConfigResource, HttpService} from './core/http';
import {Interceptor} from './core/interceptor';
import {Playwright} from './core/playwright';
import {Config} from './models/config';
import {ApplyScenarioOptions} from './types/options';

export default class Stoobly {
  cypress: Cypress;
  httpService: HttpService;
  interceptor: Interceptor;
  playwright: Playwright;

  constructor(apiUrl: string = DEFAULT_UI_URL) {
    this.httpService = new HttpService(apiUrl);
    this.interceptor = new Interceptor();

    this.cypress = new Cypress(this.interceptor);
    this.playwright = new Playwright(this.interceptor);
  }

  get config() {
    const resource = new ConfigResource(this.httpService);
    return new Config(resource);
  }

  set apiUrl(url: string) {
    this.httpService = new HttpService(url);
  }

  applyScenario(scenarioKey?: string, options?: ApplyScenarioOptions) {
    if (this.interceptor.applied) {
      this.interceptor.clear();
    } 

    if (scenarioKey) {
      this.interceptor.withScenario(scenarioKey);
      this.interceptor.withUrls(options?.urls || []);
      return this.interceptor.apply(options?.sessionId);
    }
  } 
}
