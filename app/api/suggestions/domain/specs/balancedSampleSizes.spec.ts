import { balancedSampleSizes } from '../balancedSampleSizes.js';

/**
 * The allocation the process run uses to pick its next batch. It was arithmetic living inside a
 * mongo method; it is domain logic, so it is tested without a database and each store only has to
 * sample the sizes it is told.
 */
describe('balancedSampleSizes', () => {
  it('should split the batch evenly when both sides have enough', () => {
    expect(balancedSampleSizes({ labeled: 50, unlabeled: 50, maxTotal: 10 })).toEqual({
      labeled: 5,
      unlabeled: 5,
    });
  });

  it('should give the leftover slots to whichever side still has rows', () => {
    expect(balancedSampleSizes({ labeled: 50, unlabeled: 2, maxTotal: 10 })).toEqual({
      labeled: 8,
      unlabeled: 2,
    });

    expect(balancedSampleSizes({ labeled: 1, unlabeled: 50, maxTotal: 10 })).toEqual({
      labeled: 1,
      unlabeled: 9,
    });
  });

  it('should never ask for more than exists', () => {
    expect(balancedSampleSizes({ labeled: 3, unlabeled: 4, maxTotal: 100 })).toEqual({
      labeled: 3,
      unlabeled: 4,
    });
  });

  it('should ask for nothing when there is nothing', () => {
    expect(balancedSampleSizes({ labeled: 0, unlabeled: 0, maxTotal: 10 })).toEqual({
      labeled: 0,
      unlabeled: 0,
    });
  });

  /**
   * An odd batch size cannot be halved evenly. The spare slot goes through the same reallocation
   * as any other leftover, so it is given to the unlabeled side first.
   */
  it('should hand the odd slot of an odd batch to the unlabeled side', () => {
    expect(balancedSampleSizes({ labeled: 50, unlabeled: 50, maxTotal: 11 })).toEqual({
      labeled: 5,
      unlabeled: 6,
    });
  });

  it('should take everything from one side when the other is empty', () => {
    expect(balancedSampleSizes({ labeled: 0, unlabeled: 50, maxTotal: 10 })).toEqual({
      labeled: 0,
      unlabeled: 10,
    });
  });
});
