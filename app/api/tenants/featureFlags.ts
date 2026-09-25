import { z } from 'zod';

/**
 * The one declaration of every tenant feature flag. The `Tenant` type, the mongoose schema and the
 * schema the CLI validates against are all derived from it, so a flag is added in one place.
 */
const FEATURE_FLAGS = {
  s3Storage: 'boolean',
  esReplicas: 'number',
  sync: 'boolean',
  deactivateTestJob: 'boolean',
  paragraphExtraction: 'boolean',
  fileCacheHeaders: 'boolean',
  themeCustomization: 'boolean',
  testing: 'boolean',
  newHeader: 'boolean',
  featureFlagEntityViewerv2: 'boolean',
  featureFlagLibraryV2: 'boolean',
  postgresCore: 'boolean',
  postgresPages: 'boolean',
  postgresCsv: 'boolean',
  aiAssistant: 'boolean',
  aiAssistantServiceUrl: 'string',
  translationService: 'boolean',
  translationServiceUrl: 'string',
  telemetry: { enabled: 'boolean', sampleRate: 'number' },
  prometheus: { enabled: 'boolean', sampleRate: 'number' },
} as const;

type FeatureFlagType = 'boolean' | 'number' | 'string';
type FeatureFlagGroup = Readonly<Record<string, FeatureFlagType>>;
type FeatureFlagDefinition = FeatureFlagType | FeatureFlagGroup;

type Registry = typeof FEATURE_FLAGS;
type FeatureFlagName = keyof Registry;

type ValueOf<T> = T extends 'boolean'
  ? boolean
  : T extends 'number'
    ? number
    : T extends 'string'
      ? string
      : never;

type FeatureFlags = {
  [K in FeatureFlagName]?: Registry[K] extends FeatureFlagType
    ? ValueOf<Registry[K]>
    : { [G in keyof Registry[K]]?: ValueOf<Registry[K][G]> };
};

const isFeatureFlagGroup = (definition: FeatureFlagDefinition): definition is FeatureFlagGroup =>
  typeof definition === 'object';

const zodTypes = {
  boolean: z.boolean(),
  number: z.number(),
  string: z.string(),
} satisfies Record<FeatureFlagType, z.ZodTypeAny>;

const mongoTypes = {
  boolean: Boolean,
  number: Number,
  string: String,
} satisfies Record<FeatureFlagType, BooleanConstructor | NumberConstructor | StringConstructor>;

const map = <T>(definition: FeatureFlagDefinition, scalar: (type: FeatureFlagType) => T) =>
  isFeatureFlagGroup(definition)
    ? Object.fromEntries(Object.entries(definition).map(([name, type]) => [name, scalar(type)]))
    : scalar(definition);

const entries = Object.entries(FEATURE_FLAGS) as [FeatureFlagName, FeatureFlagDefinition][];

/** Every flag optional, unknown flags rejected, groups validated field by field. */
const FeatureFlagsSchema = z
  .object(
    Object.fromEntries(
      entries.map(([name, definition]) => [
        name,
        (isFeatureFlagGroup(definition)
          ? z.object(map(definition, type => zodTypes[type].optional()) as z.ZodRawShape).strict()
          : zodTypes[definition]
        ).optional(),
      ])
    )
  )
  .strict() as unknown as z.ZodType<FeatureFlags, z.ZodTypeDef, unknown>;

/** The `featureFlags` branch of the tenants mongoose schema. */
const featureFlagsMongoSchema: Record<string, unknown> = Object.fromEntries(
  entries.map(([name, definition]) => [name, map(definition, type => mongoTypes[type])])
);

export { FEATURE_FLAGS, FeatureFlagsSchema, featureFlagsMongoSchema, isFeatureFlagGroup };
export type { FeatureFlagDefinition, FeatureFlagGroup, FeatureFlagName, FeatureFlags };
