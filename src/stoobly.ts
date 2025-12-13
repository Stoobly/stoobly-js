import { InterceptorFramework } from '@constants/options';
import {DEFAULT_UI_URL} from './constants/config';
import {Cypress} from './core/cypress';
import {ConfigResource, HttpService} from './core/http';
import {Interceptor} from './core/interceptor';
import {Playwright} from './core/playwright';
import {Config} from './models/config';
import { InterceptorOptions } from './types';

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

  cypressInterceptor(options: InterceptorOptions) {
    return new Cypress(options);
  }

  interceptor(options: InterceptorOptions) {
    if (options.framework === InterceptorFramework.CYPRESS) {
      return new Cypress(options);
    }

    if (options.framework === InterceptorFramework.PLAYWRIGHT) {
      return new Playwright(options);
    }

    return new Interceptor(options);
  }

  playwrightInterceptor(options: InterceptorOptions) {
    return new Playwright(options);
  }
}
