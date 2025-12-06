import { RecordOrder, RecordPolicy } from "@constants/proxy";

export interface InterceptOptions {
  urls?: (RegExp | string)[];
  sessionId?: string;
}

export interface RecordOptions extends InterceptOptions {
  order?: RecordOrder;
  policy?: RecordPolicy;
}