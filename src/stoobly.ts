import { InterceptorFramework } from '@constants/options';
import {DEFAULT_UI_URL} from './constants/config';
import {Cypress} from './core/cypress';
import {ConfigResource, HttpService} from './core/http';
import {Interceptor} from './core/interceptor';
import {Playwright} from './core/playwright';
import {Config} from './models/config';
import { InterceptorSettings } from './types';

export default class Stoobly {
  httpService: HttpService;

  constructor(apiUrl: string = DEFAULT_UI_URL) {
    this.httpService = new HttpService(apiUrl);
  }

  get config() {
    const resource = new ConfigResource(this.httpService);
    return new Config(resource);
  }

  set apiUrl(url: string) {
    this.httpService = new HttpService(url);
  }

  cypressInterceptor(settings: InterceptorSettings) {
    return new Cypress(settings);
  }

  interceptor(settings: InterceptorSettings) {
    if (settings.framework === InterceptorFramework.CYPRESS) {
      return new Cypress(settings);
    }

    if (settings.framework === InterceptorFramework.PLAYWRIGHT) {
      return new Playwright(settings);
    }

    return new Interceptor(settings);
  }

  playwrightInterceptor(settings: InterceptorSettings) {
    return new Playwright(settings);
  }
}
