import type { ApiError } from './ApiError.js';

type RequestPolicies = {
  notification?: boolean;
  auth?: boolean;
};

type ApiClientEvent =
  | { type: 'request:start'; id: string; method: string; path: string }
  | { type: 'request:success'; id: string; durationMs: number }
  | { type: 'request:error'; id: string; error: ApiError; policies?: RequestPolicies }
  | { type: 'retry:scheduled'; id: string; attempt: number; delayMs: number }
  | { type: 'upload:progress'; id: string; percent: number };

type ApiClientEventListener = (event: ApiClientEvent) => void;

class ApiClientEventBus {
  private listeners = new Set<ApiClientEventListener>();

  subscribe(listener: ApiClientEventListener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  on<K extends ApiClientEvent['type']>(
    type: K,
    listener: (event: Extract<ApiClientEvent, { type: K }>) => void
  ) {
    return this.subscribe(event => {
      if (event.type === type) listener(event as Extract<ApiClientEvent, { type: K }>);
    });
  }

  emit(event: ApiClientEvent) {
    this.listeners.forEach(listener => {
      listener(event);
    });
  }
}

export { ApiClientEventBus };
export type { ApiClientEvent, ApiClientEventListener, RequestPolicies };
