import { atom } from 'jotai';
import { ClientRelationshipType } from '#app/apiResponseTypes.js';

const relationshipTypesAtom = atom([] as ClientRelationshipType[]);

export { relationshipTypesAtom };
