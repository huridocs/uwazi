import { atom } from 'recoil';
import { actions } from 'app/BasicReducer';
import { Page } from '../shared/types';

const pagesAtom = atom({
  key: 'pages',
  default: [] as Page[],
  //sync deprecated redux store
  effects: [
    ({ onSet }) => {
      onSet(pages => {
        actions.set('pages', pages);
      });
    },
  ],
});

export { pagesAtom };
