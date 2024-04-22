import { atom } from 'jotai';
import { ClientRelationshipType } from 'app/apiResponseTypes';

const relationshipTypesAtom = atom([] as ClientRelationshipType[]);

export { relationshipTypesAtom };
