type DatasetState = { page?: { datasets?: unknown } };

type DatasetStore<State extends DatasetState> = {
  getState: () => State;
};

const readAt = (source: object, key: string) => Object.getOwnPropertyDescriptor(source, key)?.value;

const datasetView = (datasets: Record<string, unknown>) => {
  const read = (path: readonly string[]) =>
    path.reduce<unknown>((acc, key) => {
      if (!acc || typeof acc !== 'object') return undefined;
      return readAt(acc, key);
    }, datasets);
  return {
    getIn: (path: readonly string[]) => read(path),
    get: (key: string) => datasets[key],
    toJS: () => datasets,
  };
};

const installEntityPageStore = <State extends DatasetState>(
  store: DatasetStore<State>,
  datasets: Record<string, unknown>
) => {
  const original = store.getState.bind(store);
  const view = datasetView(datasets);
  let cachedState: State | undefined;
  let cachedResult: State | undefined;

  store.getState = () => {
    const state = original();
    if (cachedResult && state === cachedState) return cachedResult;
    cachedState = state;
    cachedResult = { ...state, page: { ...state.page, datasets: view } };
    return cachedResult;
  };

  return () => {
    store.getState = original;
  };
};

export { installEntityPageStore };
