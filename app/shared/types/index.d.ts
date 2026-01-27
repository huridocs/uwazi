import { Store } from 'redux';
import { ClientFeatureFlags } from '#shared/types.js';
import { RequestError } from '#V2/shared/errorUtils.js';
import { IStore } from '#app/istore.js';
import { updatePageDatasets } from '#app/Pages/utils/updatePageDatasets.js';
import { AtomStoreData } from '#V2/atoms/index.js';
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
    __entryClientExecuting?: boolean;
    __entryClientRouterCreated?: boolean;
    __entryClientAboutToHydrate?: boolean;
    __entryClientHydrated?: boolean;
    __loginComponentDidMount?: boolean;
  }
}
