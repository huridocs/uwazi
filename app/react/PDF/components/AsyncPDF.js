import {asyncComponent} from 'react-async-component';
import {isClient} from 'app/utils';

export default asyncComponent({
  resolve: () => {
    if (!isClient) {
      return Promise.resolve(() => false);
    }
    return System.import('./PDF');
  }
});
