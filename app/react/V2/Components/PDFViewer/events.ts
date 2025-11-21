const events = {
  ON_PAGE_CHANGE: 'onPageChange',
  GO_TO_PAGE: 'goToPage',
  PDF_READY: 'pdfReady',
} as const;

type EventType = (typeof events)[keyof typeof events];

interface EventPayloadMap {
  onPageChange: number;
  goToPage: number;
  pdfReady: void;
}

interface Subscription {
  unsubscribe: () => void;
}

type EventCallback<T extends EventType> = (payload?: EventPayloadMap[T]) => void;

class EventBus {
  private listeners: Map<EventType, Set<EventCallback<any>>>;

  constructor() {
    this.listeners = new Map();
  }

  on<T extends EventType>(eventType: T, callback: EventCallback<T>): Subscription {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }

    this.listeners.get(eventType)?.add(callback);

    return {
      unsubscribe: () => {
        const callbacks = this.listeners.get(eventType);
        if (callbacks) {
          callbacks.delete(callback);
        }
      },
    };
  }

  dispatch<T extends EventType>(eventType: T, payload?: EventPayloadMap[T]) {
    const callbacks = this.listeners.get(eventType);

    if (callbacks) {
      callbacks.forEach(callback => callback(payload));
    }
  }

  clear() {
    this.listeners.clear();
  }
}

const pdfEventBus = new EventBus();

export { events, pdfEventBus };
