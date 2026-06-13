export class DatavizError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'DatavizError';
  }
}

export class DatavizNotFoundError extends DatavizError {
  constructor(datavizId: string) {
    super('DATAVIZ_NOT_FOUND', `Dataviz not found: ${datavizId}`, { datavizId });
  }
}

export class DatavizInvalidQueryError extends DatavizError {
  constructor(message: string, details?: Record<string, unknown>) {
    super('DATAVIZ_INVALID_QUERY', message, details);
  }
}

export class DatavizBrokenError extends DatavizError {
  constructor(reason: string, details?: Record<string, unknown>) {
    super('DATAVIZ_BROKEN', reason, details);
  }
}

export class DatavizLiveNotAllowedError extends DatavizError {
  constructor(reasons: string[]) {
    super('DATAVIZ_LIVE_NOT_ALLOWED', 'Live refresh is not allowed for this configuration', {
      reasons,
    });
  }
}

export class DatavizProcessingError extends DatavizError {
  constructor(datavizId: string) {
    super('DATAVIZ_PROCESSING', `Dataviz snapshot is being refreshed: ${datavizId}`, {
      datavizId,
    });
  }
}

export class DatavizQueryTimeoutError extends DatavizError {
  constructor() {
    super('DATAVIZ_QUERY_TIMEOUT', 'Dataviz query timed out');
  }
}

export class DatavizUnauthorizedError extends DatavizError {
  constructor() {
    super('DATAVIZ_UNAUTHORIZED', 'Unauthorized');
  }
}

export class DatavizSnapshotUnavailableError extends DatavizError {
  constructor(datavizId: string) {
    super(
      'DATAVIZ_SNAPSHOT_UNAVAILABLE',
      `No snapshot available for public embed: ${datavizId}`,
      { datavizId }
    );
  }
}
