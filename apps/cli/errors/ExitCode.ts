enum ExitCode {
  Ok = 0,
  Unexpected = 1,
  Validation = 2,
  NotFound = 3,
  Conflict = 4,
  RuleViolation = 5,
  Interrupted = 130,
}

export { ExitCode };
