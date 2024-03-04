import { atom } from 'recoil';
import { ClientRelationshipType } from 'app/apiResponseTypes';
import { store } from 'app/store';

const relationshipTypesAtom = atom({
  key: 'relationshipTypes',
  default: [] as ClientRelationshipType[],
  //sync deprecated redux store
  effects: [
    ({ onSet }) => {
      onSet(newValue => {
        store?.dispatch({ type: 'relationTypes/SET', value: newValue });
      });
    },
  ],
});

export { relationshipTypesAtom };
