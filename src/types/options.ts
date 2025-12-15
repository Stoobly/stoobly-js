import { RecordOrder, RecordPolicy, RecordStrategy } from "@constants/proxy";
import { TestFramework } from "../utils/test-detection";

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
  urls: (RegExp | string)[];
}