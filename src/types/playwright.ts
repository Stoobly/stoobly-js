export interface Page {
  route: (
    url: string, 
    route: (
      route: { continue: (options: { headers?: any }) => void }, 
      request: { headers: () => any }
    ) => void
  ) => void
}