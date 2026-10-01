import { config } from '#api/config.js';
import { FEATURE_FLAGS, FeatureFlagsSchema, isFeatureFlagGroup } from '../featureFlags.js';

describe('feature flags registry', () => {
  describe('FeatureFlagsSchema', () => {
    it('should accept every declared flag', () => {
      const every = {
        s3Storage: true,
        esReplicas: 2,
        sync: true,
        deactivateTestJob: false,
        paragraphExtraction: true,
        fileCacheHeaders: true,
        themeCustomization: true,
        testing: true,
        newHeader: false,
        featureFlagEntityViewerv2: true,
        featureFlagLibraryV2: true,
        postgresCore: true,
        postgresPages: true,
        postgresCsv: true,
        aiAssistant: true,
        aiAssistantServiceUrl: 'http://ai',
        translationService: true,
        translationServiceUrl: 'http://translate',
        telemetry: { enabled: true, sampleRate: 0.5 },
        prometheus: { enabled: false, sampleRate: 0.1 },
      };

      expect(FeatureFlagsSchema.parse(every)).toEqual(every);
    });

    it('should accept a partial object', () => {
      expect(FeatureFlagsSchema.parse({ postgresCore: true })).toEqual({ postgresCore: true });
      expect(FeatureFlagsSchema.parse({ telemetry: { enabled: true } })).toEqual({
        telemetry: { enabled: true },
      });
    });

    it('should reject an unknown flag', () => {
      expect(() => FeatureFlagsSchema.parse({ notAFlag: true })).toThrow();
      expect(() => FeatureFlagsSchema.parse({ telemetry: { notAFlag: true } })).toThrow();
    });

    it('should reject a flag of the wrong type', () => {
      expect(() => FeatureFlagsSchema.parse({ postgresCore: 'yes' })).toThrow();
      expect(() => FeatureFlagsSchema.parse({ esReplicas: 'two' })).toThrow();
    });
  });

  describe('isFeatureFlagGroup', () => {
    it('should tell a group apart from a scalar flag', () => {
      expect(isFeatureFlagGroup(FEATURE_FLAGS.telemetry)).toBe(true);
      expect(isFeatureFlagGroup(FEATURE_FLAGS.postgresCore)).toBe(false);
    });
  });

  describe('drift', () => {
    it('should declare every flag the default tenant sets', () => {
      const declared = Object.keys(FEATURE_FLAGS);
      const defaults = Object.keys(config.defaultTenant.featureFlags ?? {});

      expect(defaults.filter(flag => !declared.includes(flag))).toEqual([]);
    });
  });
});
