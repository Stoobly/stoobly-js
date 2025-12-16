export interface Page {
  isClosed: () => boolean;
  route: (
    url: string, 
    route: (
      route: { continue: (options: { headers?: any }) => void }, 
      request: { headers: () => any }
    ) => void
  ) => void,
  unroute: (url: string, handler: (route: any, req: any) => Promise<void>) => void
}

export interface Route {
  continue: (options: { headers?: any }) => void;
}

export interface Request {
  headers: () => any;
}