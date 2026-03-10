import { Store } from 'redux';
import { AtomStoreData } from 'app/V2/atoms';
import { ClientFeatureFlags } from 'app/V2/shared/types';
import { RequestError } from 'app/V2/shared/errorUtils';
import { IStore } from 'app/istore';
import { updatePageDatasets } from 'app/Pages/utils/updatePageDatasets';
import { openEntitySidePanel } from 'app/Pages/utils/openEntitySidePanel';

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
