import { actions } from '#app/BasicReducer/index.js';
import { store } from '#app/store.js';

const updatePageDatasets = (name: string, data: any) => {
  if (!store) {
    return;
  }

  const currentDatasets = store.getState().page.datasets?.toJS();

  if (currentDatasets && currentDatasets[name]) {
    currentDatasets[name] = data;
    store.dispatch(actions.set('page/datasets', currentDatasets));
  }
};

export { updatePageDatasets };
