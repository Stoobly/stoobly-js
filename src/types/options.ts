import { InterceptMode, MockPolicy, RecordOrder, RecordPolicy, RecordStrategy } from "@constants/intercept";
import { TestFramework } from "../utils/test-detection";
import { MatchRule, RewriteRule } from "@models/config/types";

export interface MockOptions {
  policy?: MockPolicy;
}

export interface RecordOptions {
  order?: RecordOrder;
  policy?: RecordPolicy;
  strategy?: RecordStrategy;
}

export interface InterceptorOptions {
  framework?: TestFramework;
  mock?: MockOptions;
  mode?: InterceptMode;
  record?: RecordOptions;
  scenarioKey?: string;
  scenarioName?: string;
  sessionId?: string;
  urls: (string | RegExp | InterceptorUrl)[];
}

export interface InterceptorUrl {
  matchRules?: MatchRule[];
  pattern: RegExp | string;
  publicDirectoryPath?: string;
  responseFixturesPath?: string;
  rewriteRules?: RewriteRule[];
}
