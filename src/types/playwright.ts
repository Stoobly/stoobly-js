export interface Page {
  isClosed: () => boolean;
  route: (
    url: string | RegExp, 
    route: (
      route: { continue: (options: { headers?: any }) => void }, 
      request: { headers: () => any }
    ) => void
  ) => void,
  unroute: (url: string | RegExp, handler: (route: any, req: any) => Promise<void>) => void,
  context: () => BrowserContext
}

export interface BrowserContext {
  route: (
    url: string | RegExp, 
    route: (
      route: { continue: (options: { headers?: any }) => void }, 
      request: { headers: () => any }
    ) => void
  ) => void,
  unroute: (url: string | RegExp, handler: (route: any, req: any) => Promise<void>) => void
}

export interface Route {
  continue: (options: { headers?: any }) => void;
}

export interface Request {
  headers: () => any;
}