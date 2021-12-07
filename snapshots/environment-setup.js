const { configureToMatchImageSnapshot } = require('jest-image-snapshot');

const toMatchImageSnapshot = configureToMatchImageSnapshot({
  failureThreshold: 0.07,
  failureThresholdType: 'percent',
  allowSizeMismatch: true,
});

expect.extend({ toMatchImageSnapshot });
