import { RecordPolicy } from "@constants/policy";

export interface InterceptOptions {
  urls?: (RegExp | string)[];
  sessionId?: string;
}

export interface RecordOptions extends InterceptOptions {
  policy?: RecordPolicy;
}