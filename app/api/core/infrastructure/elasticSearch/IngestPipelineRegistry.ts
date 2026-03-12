import { IngestPipelineDefinition } from './Types';

const IngestPipelineRegistry: Record<string, IngestPipelineDefinition> = {
  documentTimestamps: {
    id: 'document_timestamps',
    description: 'Sets created_at on first write, updated_at on every write',
    processors: [
      {
        set: {
          field: 'created_at',
          value: '{{_ingest.timestamp}}',
          if: 'ctx.created_at == null',
        },
      },
      {
        set: {
          field: 'updated_at',
          value: '{{_ingest.timestamp}}',
        },
      },
    ],
  },
} as const;

export { IngestPipelineRegistry };
