import { configureToMatchImageSnapshot } from 'jest-image-snapshot';

const toMatchImageSnapshot = configureToMatchImageSnapshot({
  failureThreshold: 0.07,
  failureThresholdType: 'percent',
  comparisonMethod: 'ssim',
  allowSizeMismatch: true,
});

expect.extend({ toMatchImageSnapshot });
