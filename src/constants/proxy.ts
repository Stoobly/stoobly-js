export enum FirewallAction {
  Exclude = 'exclude',
  Include = 'include',
}

export enum ProxyMode {
  mock = 'mock',
  record = 'record',
  replay = 'replay',
  test = 'test',
}

export enum MockPolicy {
  All = 'all',
  Found = 'found',
}

export enum RecordOrder {
  Append = 'append',
  Overwrite = 'overwrite'
}

export enum RecordPolicy {
  All = 'all',
  Found = 'found',
  NotFound = 'not_found',
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
  All = 'all',
  Found = 'found',
}

export enum TestStrategy {
  Diff = 'diff',
  Fuzzy = 'fuzzy',
  Custom = 'custom',
}