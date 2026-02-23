import { RecordOrder, RecordPolicy, RecordStrategy } from "@constants/intercept";
import { TestFramework } from "../utils/test-detection";
import { MatchRule, RewriteRule } from "@models/config/types";

export interface RecordOptions {
  order?: RecordOrder;
  policy?: RecordPolicy;
  strategy?: RecordStrategy;
}

export interface InterceptorOptions {
  framework?: TestFramework;
  record?: RecordOptions;
  scenarioKey?: string;
  scenarioName?: string;
  sessionId?: string;
  urls: (string | RegExp)[] | InterceptorUrl[];
}

export interface InterceptorUrl {
  matchRules?: MatchRule[];
  pattern: RegExp | string;
  rewriteRules?: RewriteRule[];
}
