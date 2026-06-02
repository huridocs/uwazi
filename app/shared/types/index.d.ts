import { Store } from 'redux';
import { AtomStoreData } from '#V2/atoms/index.js';
import { ClientFeatureFlags } from '#app/V2/shared/types.js';
import { RequestError } from '#app/V2/shared/errorUtils.js';
import { IStore } from '#app/istore.js';
import { updatePageDatasets } from '#app/Pages/utils/updatePageDatasets.js';
import { openEntitySidePanel } from '#app/Pages/utils/openEntitySidePanel.js';

declare global {
  namespace jest {
    interface Matchers<R> {
      toNeedAuthorization(): R;
    }
  }

  interface Window {
    UWAZI_VERSION: string;
    UWAZI_ENVIRONMENT: string;
    SENTRY_APP_DSN: string;
    __atomStoreData__?: AtomStoreData;
    __featureFlags__?: ClientFeatureFlags;
    __loadingError__?: RequestError;
    __reduxData__: any;
    store: Store<IStore>;
    updatePageDatasets: typeof updatePageDatasets;
    openEntitySidePanel: typeof openEntitySidePanel;
    _paq?: [string[]]; //matomo
  }
}
