import Immutable from 'immutable';
import { getMarkers } from '#app/Map/helper.js';
import type { MarkerInput } from '#app/Map/MapHelper.js';
import type { Template } from '#app/apiResponseTypes.js';
import type { LibrarySearchHit } from '#shared/types/librarySearch.js';

const libraryMapMarkers = (rows: LibrarySearchHit[], templates: Template[]): MarkerInput[] =>
  getMarkers(Immutable.fromJS(rows), Immutable.fromJS(templates));

export { libraryMapMarkers };
