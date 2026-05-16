export enum InterceptMode {
  mock = 'mock',
  record = 'record',
  replay = 'replay',
  test = 'test',
}

export enum FilterAction {
  Exclude = 'exclude',
  Include = 'include',
}

export enum MockPolicy {
  All = 'all',
  Found = 'found',
  None = 'none',
}

export enum RecordOrder {
  Append = 'append',
  Overwrite = 'overwrite',
}

export enum RecordPolicy {
  All = 'all',
  Api = 'api',
  Found = 'found',
  None = 'none',
  NotFound = 'not_found',
}

export enum RecordStrategy {
  Full = 'full',
  Minimal = 'minimal',
}

export enum ReplayPolicy {
  All = 'all',
}

export enum RequestParameter {
  Header = 'Header',
  BodyParam = 'Body Param',
  QueryParam = 'Query Param',
}

export enum TestPolicy {
  Found = 'found',
  None = 'none',
}

export enum TestStrategy {
  Custom = 'custom',
  Contract = 'contract',
  Diff = 'diff',
  Fuzzy = 'fuzzy',
}