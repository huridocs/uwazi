import { CompositionOptions } from './services/processors/types';

export const DEFAULT_ENTITY_BASE_PATH = '/entityv2/';
export const cardViewOptions: CompositionOptions = {
  includeTemplate: true,
  includeMetadata: true,
  includeRelationships: false,
  includeFiles: false,
  includeNavigation: false,
  includePermissions: true,
  formatDates: true,
  dateFormat: 'LLL d, yyyy',
  onlyForCards: true,
  translateLabels: true,
};

export const fullDetailOptions: CompositionOptions = {
  entityBasePath: DEFAULT_ENTITY_BASE_PATH,
  includeTemplate: true,
  includeMetadata: true,
  includeRelationships: true,
  combineGeolocation: true,
  includeFiles: true,
  includeNavigation: true,
  includePermissions: true,
  formatDates: true,
  dateFormat: 'LLL d, yyyy',
  includePropertyMetadata: true,
  translateLabels: true,
};

export const editionModeOptions: CompositionOptions = {
  includeTemplate: true,
  includeMetadata: true,
  includeRelationships: true,
  includeFiles: true,
  includeNavigation: false,
  includePermissions: true,
  editionMode: true,
  formatDates: true,
  dateFormat: 'LLL d, yyyy',
  includePropertyMetadata: true,
  translateLabels: true,
  flattenStructures: true,
  flattenRelationships: true,
  flattenCoordinates: true,
  flattenMediaFiles: true,
  flattenTimelines: true,
};
