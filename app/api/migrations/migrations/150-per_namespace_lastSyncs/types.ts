type OldSyncs = {
  name: string;
  lastSync: number;
};

type FaultyOldSync = {
  name: string;
};

type NewSyncs = {
  names: string;
  lastSyncs: {
    [name: string]: number;
  };
};

type Syncs = OldSyncs | NewSyncs | FaultyOldSync;

type DBFixture = {
  syncs: Syncs[];
};

export type { DBFixture, Syncs, OldSyncs, NewSyncs };
