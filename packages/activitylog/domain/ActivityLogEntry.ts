type ActivityLogEntryProps = {
  id: string;
  method: string;
  url: string;
  params: string | null;
  query: string | null;
  body: string | null;
  userId: string | null;
  username: string | null;
  time: number;
};

type RecordedRequest = {
  id: string;
  method: string;
  url: string;
  params: unknown;
  query: unknown;
  body: Record<string, unknown>;
  user: { id: string; username: string | null } | null;
  time: number;
};

const MASK = '*****';

/**
 * One request the API logged: who made it, when, and what it carried. Written once and never
 * changed. The passwords a request sends in its body are masked on the way in, so no entry holds one.
 */
class ActivityLogEntry {
  private constructor(readonly props: Readonly<ActivityLogEntryProps>) {}

  static record(request: RecordedRequest): ActivityLogEntry {
    return new ActivityLogEntry({
      id: request.id,
      method: request.method,
      url: request.url,
      params: JSON.stringify(request.params),
      query: JSON.stringify(request.query),
      body: JSON.stringify(ActivityLogEntry.withoutPasswords(request.body)),
      userId: request.user?.id ?? null,
      username: request.user?.username ?? null,
      time: request.time,
    });
  }

  private static withoutPasswords(value: unknown): unknown {
    if (Array.isArray(value)) return value.map(ActivityLogEntry.withoutPasswords);
    if (typeof value !== 'object' || value === null) return value;

    return Object.fromEntries(
      Object.entries(value).map(([key, inner]) => [
        key,
        key === 'password' && inner ? MASK : ActivityLogEntry.withoutPasswords(inner),
      ])
    );
  }

  static restore(props: ActivityLogEntryProps): ActivityLogEntry {
    return new ActivityLogEntry({ ...props });
  }
}

export { ActivityLogEntry };
export type { ActivityLogEntryProps, RecordedRequest };
