import { TelemetryCollector } from 'api/core/libs/logger/TelemetryCollector';
import { AsyncLocalStorage } from 'async_hooks';

interface ContextData {
  [k: string]: unknown;
}

class AppContext {
  private storage = new AsyncLocalStorage<ContextData>();

  private defaultData: { [k: string]: any } = {};

  private getContextObject() {
    const data = this.storage.getStore();
    if (!data) {
      throw new Error('Accessing nonexistent async context');
    }
    return data;
  }

  async run<T>(cb: () => Promise<T>, data: ContextData = {}): Promise<T> {
    return new Promise((resolve, reject) => {
      this.storage.run({ ...this.defaultData, ...data }, () => {
        cb().then(resolve).catch(reject);
      });
    });
  }

  get(key: string) {
    return this.getContextObject()[key];
  }

  set(key: string, value: unknown) {
    this.getContextObject()[key] = value;
  }

  setValueAsDefault(key: string, value: unknown) {
    this.defaultData[key] = value;
  }

  getTelemetryCollector() {
    return this.get('telemetryCollector') as TelemetryCollector;
  }

  setTelemetryCollector(telemetryCollector: TelemetryCollector) {
    this.set('telemetryCollector', telemetryCollector);
  }
}

const appContext = new AppContext();

export { appContext };
