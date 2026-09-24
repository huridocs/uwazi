type AuditEntry = {
  route: string;
  input: unknown;
  outcome: 'success' | 'failure';
  error?: unknown;
};

/** Where CLI operations get audited. Not implemented yet: plug one into AuditMiddleware. */
interface AuditRecorder {
  record(entry: AuditEntry): Promise<void>;
}

export type { AuditEntry, AuditRecorder };
