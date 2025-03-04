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

  async run(cb: () => Promise<void>, data: ContextData = {}): Promise<void> {
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
}

const appContext = new AppContext();

export { appContext };
