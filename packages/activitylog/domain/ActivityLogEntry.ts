type ActivityLogEntryProps = {
  id: string;
  method: string;
  url: string;
  /** JSON, as the request carried it. */
  params: string;
  /** JSON, as the request carried it. */
  query: string;
  /** JSON, with the password masked. */
  body: string;
  /** null for a request made without a user. */
  userId: string | null;
  username: string | null;
  /** Epoch ms. */
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
 * changed. The password a request sends in its body is masked on the way in, so no entry holds one.
 */
class ActivityLogEntry {
  private constructor(readonly props: Readonly<ActivityLogEntryProps>) {}

  static record(request: RecordedRequest): ActivityLogEntry {
    const body = { ...request.body };
    if (body.password) body.password = MASK;

    return new ActivityLogEntry({
      id: request.id,
      method: request.method,
      url: request.url,
      params: JSON.stringify(request.params),
      query: JSON.stringify(request.query),
      body: JSON.stringify(body),
      userId: request.user?.id ?? null,
      username: request.user?.username ?? null,
      time: request.time,
    });
  }

  /** An entry already stored, taken as it is. */
  static restore(props: ActivityLogEntryProps): ActivityLogEntry {
    return new ActivityLogEntry({ ...props });
  }
}

export { ActivityLogEntry };
export type { ActivityLogEntryProps, RecordedRequest };
