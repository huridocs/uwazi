import { CompositionOptions } from './services/processors/types';

export const DEFAULT_ENTITY_BASE_PATH = '/entityv2/';

export const cardViewOptions: CompositionOptions = {
  includeTemplate: true,
  formatDates: true,
  dateFormat: 'LLL d, yyyy',
  onlyForCards: true,
  translateLabels: true,
};

export const fullDetailOptions: CompositionOptions = {
  entityBasePath: DEFAULT_ENTITY_BASE_PATH,
  includeTemplate: true,
  combineGeolocation: true,
  formatDates: true,
  dateFormat: 'LLL d, yyyy',
  includePropertyMetadata: true,
  translateLabels: true,
  includeSupportingFiles: true,
};

export const editionModeOptions: CompositionOptions = {
  includeTemplate: true,
  editionMode: true,
  formatDates: true,
  dateFormat: 'LLL d, yyyy',
  includePropertyMetadata: true,
  translateLabels: true,
};
