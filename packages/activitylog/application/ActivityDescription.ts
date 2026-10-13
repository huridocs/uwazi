type ActivityAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'MIGRATE' | 'RAW' | 'WARNING';

/** What a logged request did, in words an administrator reads. */
type ActivityDescription = {
  action: ActivityAction;
  /** Absent on a migration log of a type that is not known. */
  description?: string;
  name?: string;
  extra?: string;
  /** Only on a WARNING: why the entry could not be described. */
  errorStack?: string;
};

export type { ActivityAction, ActivityDescription };
