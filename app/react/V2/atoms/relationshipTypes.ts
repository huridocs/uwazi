import { atom } from 'jotai';
import { ClientRelationshipType } from '../../apiResponseTypes.js';

const relationshipTypesAtom = atom([] as ClientRelationshipType[]);

export { relationshipTypesAtom };
