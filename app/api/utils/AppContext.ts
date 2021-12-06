import { AsyncLocalStorage } from 'async_hooks';

interface ContextData {
  [k: string]: unknown;
}

class AppContext {
  private storage = new AsyncLocalStorage<ContextData>();

  private getContextObject() {
    const data = this.storage.getStore();
    if (!data) {
      throw new Error('Accessing nonexistent async context');
    }
    return data;
  }

  async run(cb: () => Promise<void>, data: ContextData = {}): Promise<void> {
    return new Promise((resolve, reject) => {
      this.storage.run(data, () => {
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
}

const appContext = new AppContext();

export { appContext };
