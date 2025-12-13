import { RecordOrder, RecordPolicy, RecordStrategy } from "@constants/proxy";
import { InterceptorFramework } from "@constants/options";

export interface RecordOptions {
  order?: RecordOrder;
  policy?: RecordPolicy;
  strategy?: RecordStrategy;
}

export interface InterceptorOptions {
  framework?: InterceptorFramework;
  record?: RecordOptions;
  scenarioKey?: string;
  scenarioName?: string;
  sessionId?: string;
  urls: (RegExp | string)[];
}