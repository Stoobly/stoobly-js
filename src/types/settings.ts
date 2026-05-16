import { InterceptMode, MockPolicy, RecordOrder, RecordPolicy, RecordStrategy } from "@constants/intercept";
import { MatchRule, RewriteRule } from "@models/config/types";

import { TestFramework } from "../utils/test-detection";

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
  openApiSpecificationPath?: string;
  pattern: RegExp | string;
  publicDirectoryPath?: string;
  responseFixturesPath?: string;
  rewriteRules?: RewriteRule[];
}
