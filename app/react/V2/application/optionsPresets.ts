import { CompositionOptions } from './services/processors/types';

export const cardViewOptions: CompositionOptions = {
  includeTemplate: true,
  includeMetadata: true,
  includeRelationships: false,
  includeFiles: false,
  includeNavigation: false,
  includePermissions: true,
  onlyForCards: true,
  translateLabels: true,
};

export const fullDetailOptions: CompositionOptions = {
  includeTemplate: true,
  includeMetadata: true,
  includeRelationships: true,
  combineGeolocation: true,
  includeFiles: true,
  includeNavigation: true,
  includePermissions: true,
  dateFormat: 'YYYY-MM-DD',
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
  dateFormat: 'YYYY-MM-DD',
  includePropertyMetadata: true,
  translateLabels: true,
  flattenStructures: true,
  flattenRelationships: true,
  flattenCoordinates: true,
  flattenMediaFiles: true,
  flattenTimelines: true,
};
