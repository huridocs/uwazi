type Available = {
  labeled: number;
  unlabeled: number;
  maxTotal: number;
};

/**
 * How many labeled and unlabeled suggestions a process-run batch should take.
 *
 * Aim for half of each; when one side cannot fill its half, give the slots it leaves to the
 * other. Extracted from the mongo `$facet` it used to be fused with — the sampling is
 * store-specific, this arithmetic is not, and reimplementing it per store would let the two
 * drift.
 */
export const balancedSampleSizes = ({ labeled, unlabeled, maxTotal }: Available) => {
  const idealHalf = Math.floor(maxTotal / 2);

  let unlabeledSize = Math.min(idealHalf, unlabeled);
  let labeledSize = Math.min(idealHalf, labeled);

  const remainingSlots = maxTotal - (unlabeledSize + labeledSize);

  if (remainingSlots > 0) {
    if (unlabeled > unlabeledSize) {
      unlabeledSize = Math.min(unlabeled, unlabeledSize + remainingSlots);
    } else if (labeled > labeledSize) {
      labeledSize = Math.min(labeled, labeledSize + remainingSlots);
    }
  }

  return { labeled: labeledSize, unlabeled: unlabeledSize };
};
