import { objectIdSchema } from 'shared/types/commonSchemas';

export const emitSchemaTypes = true;

export enum ModelStatus {
  processing = 'processing',
  failed = 'failed',
  ready = 'ready',
}

export const IXModelSchema = {
  type: 'object',
  additionalProperties: false,
  title: 'IXModelType',
  definitions: { objectIdSchema },
  required: ['extractorId', 'creationDate'],
  properties: {
    _id: objectIdSchema,
    extractorId: objectIdSchema,
    creationDate: { type: 'number' },
    status: { type: 'string', enum: Object.values(ModelStatus), default: ModelStatus.processing },
    findingSuggestions: { type: 'boolean', default: true },
    processRun: {
      type: 'object',
      optional: true,
      additionalProperties: false,
      properties: {
        suggestionsRunTimestamp: { type: 'number', optional: true },
        // persisted copy of request options
        mode: { type: 'string', optional: true },
        find: {
          type: 'object',
          optional: true,
          properties: {
            enabled: { type: 'boolean', optional: true },
            size: { type: 'number', optional: true },
            filters: {
              type: 'object',
              optional: true,
              properties: {
                nonProcessed: { type: 'boolean', optional: true },
                obsolete: { type: 'boolean', optional: true },
                error: { type: 'boolean', optional: true },
              },
            },
            selectedSharedIds: { type: 'array', items: { type: 'string' }, optional: true },
          },
        },
        autoAccept: {
          type: 'object',
          optional: true,
          properties: {
            enabled: { type: 'boolean', optional: true },
            source: { type: 'string', optional: true },
            overwriteMode: { type: 'string', optional: true },
          },
        },
        autoAcceptProgress: {
          type: 'object',
          optional: true,
          properties: {
            total: { type: 'number', optional: true },
            processed: { type: 'number', optional: true },
          },
        },
        // per-run queue storage (selected mode)
        findSuggestionsSharedIds: { type: 'array', items: { type: 'string' }, optional: true },
        findSuggestionsInitialSharedIdsCount: { type: 'number', optional: true },
        // cohort for auto-accept in selected mode
        selectedSharedIdsForAutoAccept: {
          type: 'array',
          items: { type: 'string' },
          optional: true,
        },
      },
    },
    maxSuggestionsToFind: { type: 'number' },
    totalSuggestionsToFind: { type: 'number' },
  },
};
