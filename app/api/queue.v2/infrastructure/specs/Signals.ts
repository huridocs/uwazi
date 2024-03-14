type Signal = { promise: Promise<void>; cbHolder: { finish: Function } };

function createRecord() {
  const cbHolder: { finish: Function } = { finish: () => {} };
  const promise = new Promise<void>(resolve => {
    cbHolder.finish = resolve;
  });

  return {
    promise,
    cbHolder,
  };
}

export function createSignals() {
  const jobSignals: Record<string, Signal> = {};

  return {
    signal(index: string) {
      if (!jobSignals[index]) {
        jobSignals[index] = createRecord();
      }

      jobSignals[index].cbHolder.finish();
    },

    async signaled(index: string) {
      if (!jobSignals[index]) {
        jobSignals[index] = createRecord();
      }

      return jobSignals[index].promise;
    },
  };
}
