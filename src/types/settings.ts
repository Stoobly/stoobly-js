import { InterceptMode, MockPolicy, RecordOrder, RecordPolicy, RecordStrategy, TestPolicy } from "@constants/intercept";
import { MatchRule, RewriteRule } from "@models/config/types";

export interface MockSettings {
  openApiSpecificationPath?: string;
  policy?: MockPolicy;
  publicDirectoryPath?: string;
  responseFixturesPath?: string;
}

export interface TestSettings {
  openApiSpecificationPath?: string;
  policy?: TestPolicy;
  publicDirectoryPath?: string;
  responseFixturesPath?: string;
}

export interface RecordSettings {
  order?: RecordOrder;
  policy?: RecordPolicy;
  strategy?: RecordStrategy;
}

export interface InterceptorSettings {
  mock?: MockSettings;
  mode?: InterceptMode;
  record?: RecordSettings;
  scenarioKey?: string;
  scenarioName?: string;
  sessionId?: string;
  test?: TestSettings;
  urls: (string | RegExp | InterceptorUrl)[];
}

export interface InterceptorUrl {
  matchRules?: MatchRule[];
  pattern: RegExp | string;
  rewriteRules?: RewriteRule[];
}
