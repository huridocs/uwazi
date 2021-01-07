import { AsyncLocalStorage } from 'async_hooks';

interface ContextData {
  [k: string]: unknown;
}

class AppContext {
  private storage = new AsyncLocalStorage<ContextData>();

  async run(cb: () => Promise<void>, data: ContextData = {}): Promise<void> {
    return new Promise((resolve, reject) => {
      this.storage.run(data, () => {
        cb()
          .then(resolve)
          .catch(reject);
      });
    });
  }

  get(key: string) {
    const data = this.storage.getStore();
    return data && data[key];
  }

  set(key: string, value: unknown) {
    const data = this.storage.getStore();
    if (data) data[key] = value;
  }
}

const appContext = new AppContext();

export { appContext };
