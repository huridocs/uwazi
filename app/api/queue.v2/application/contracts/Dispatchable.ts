import { LanguageISO6391 } from 'shared/types/commonTypes';

type Primitive = string | number | boolean | LanguageISO6391 | undefined;
type RecordValue = Primitive | RecordValue[] | { [key: string]: RecordValue };
export type Params = Record<string, RecordValue>;

export interface HeartbeatCallback {
  (): Promise<void>;
}

export interface Dispatchable {
  handleDispatch(heartbeat: HeartbeatCallback, params: Params): Promise<void>;
}
