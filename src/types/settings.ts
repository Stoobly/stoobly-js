import { InterceptMode, MockPolicy, RecordOrder, RecordPolicy, RecordStrategy } from "@constants/intercept";
import { TestFramework } from "../utils/test-detection";
import { MatchRule, RewriteRule } from "@models/config/types";

export interface MockSettings {
  policy?: MockPolicy;
}

export interface RecordSettings {
  order?: RecordOrder;
  policy?: RecordPolicy;
  strategy?: RecordStrategy;
}

export interface InterceptorSettings {
  framework?: TestFramework;
  mock?: MockSettings;
  mode?: InterceptMode;
  record?: RecordSettings;
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
