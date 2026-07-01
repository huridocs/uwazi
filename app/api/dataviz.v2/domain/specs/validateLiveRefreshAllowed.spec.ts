import { DatavizLiveNotAllowedError } from '../errors.js';
import { validateLiveRefreshAllowed } from '../validators/validateLiveRefreshAllowed.js';

const baseQuery = {
  sources: [{ templateId: 't1' }],
  dimensions: [{ property: 'color', propertyType: 'select' as const }],
  measures: [{ aggregation: 'count' as const }],
};

describe('validateLiveRefreshAllowed', () => {
  it('should allow live mode for simple queries', () => {
    expect(() => validateLiveRefreshAllowed('live', baseQuery)).not.toThrow();
  });

  it('should reject live mode for multi-source queries', () => {
    expect(() =>
      validateLiveRefreshAllowed('live', {
        ...baseQuery,
        sources: [{ templateId: 't1' }, { templateId: 't2' }],
      })
    ).toThrow(DatavizLiveNotAllowedError);
  });

  it('should skip validation for snapshot modes', () => {
    expect(() =>
      validateLiveRefreshAllowed('snapshot_manual', {
        ...baseQuery,
        sources: [{ templateId: 't1' }, { templateId: 't2' }],
      })
    ).not.toThrow();
  });
});
