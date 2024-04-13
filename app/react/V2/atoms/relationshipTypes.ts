import { atom } from 'jotai';
import { atomEffect } from 'jotai-effect';
import { ClientRelationshipType } from 'app/apiResponseTypes';
import { store } from 'app/store';

const relationshipTypesAtom = atom([] as ClientRelationshipType[]);

//sync deprecated redux store
atomEffect(get => {
  const value = get(relationshipTypesAtom);
  store?.dispatch({ type: 'relationTypes/SET', value });
});

export { relationshipTypesAtom };
