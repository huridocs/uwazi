import { AtomStoreData } from './atoms';
import { ClientFeatureFlags } from './shared/types';

declare global {
  interface Window {
    __atomStoreData__?: AtomStoreData;
    __featureFlags__?: ClientFeatureFlags;
  }
}
