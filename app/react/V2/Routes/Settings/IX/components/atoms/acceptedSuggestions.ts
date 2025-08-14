import { atom } from 'jotai';

const acceptedSuggestions = atom<Set<string>>();

export { acceptedSuggestions };
