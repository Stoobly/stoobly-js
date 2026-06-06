import { InterceptMode, MockPolicy, RecordOrder, RecordPolicy, RecordStrategy, TestPolicy } from "@constants/intercept";
import { MatchRule, RewriteRule } from "@models/config/types";

export interface MockSettings {
  policy?: MockPolicy;
}

export interface TestSettings {
  policy?: TestPolicy;
}

export interface RecordSettings {
  order?: RecordOrder;
  policy?: RecordPolicy;
  strategy?: RecordStrategy;
}

export interface InterceptorSettings {
  mock?: MockSettings;
  mode?: InterceptMode;
  openApiSpecificationPath?: string;
  publicDirectoryPath?: string;
  record?: RecordSettings;
  responseFixturesPath?: string;
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
