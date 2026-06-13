import { DATAVIZ_MISSING_BUCKET_KEY } from '#shared/dataviz/missingBucket.js';

type DimensionField = '__primary' | '__secondary';

const isMissingValueExpression = (field: string) => ({
  $or: [{ $eq: [field, null] }, { $eq: [field, ''] }],
});

const coerceMissingValueStages = (pipeline: object[], field: DimensionField) => {
  pipeline.push({
    $addFields: {
      [field]: {
        $cond: {
          if: isMissingValueExpression(`$${field}`),
          then: DATAVIZ_MISSING_BUCKET_KEY,
          else: `$${field}`,
        },
      },
    },
  });
};

export { coerceMissingValueStages };
