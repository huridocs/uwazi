type ActivityAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'MIGRATE' | 'RAW' | 'WARNING';

/** What a logged request did, in words an administrator reads. */
type ActivityDescription = {
  action: ActivityAction;
  description?: string;
  name?: string;
  extra?: string;
  errorStack?: string;
};

export type { ActivityAction, ActivityDescription };
