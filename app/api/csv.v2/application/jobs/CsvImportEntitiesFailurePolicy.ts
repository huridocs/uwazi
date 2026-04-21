const CSV_IMPORT_FAILURE_POLICY = {
  warmupRows: 50,
  failureRatioStop: 0.6,
  consecutiveStop: 25,
  absoluteStop: 500,
} as const;

export { CSV_IMPORT_FAILURE_POLICY };
