type Signal = {
  promise: Promise<void>;
  cbHolder: { finish: Function };
  numberOfCalls: number;
  targetCalls?: number;
};

function createRecord(targetCalls?: number) {
  const cbHolder: { finish: Function } = { finish: () => {} };
  const promise = new Promise<void>(resolve => {
    cbHolder.finish = resolve;
  });

  return {
    promise,
    cbHolder,
    numberOfCalls: 0,
    targetCalls,
  };
}

export function createSignals() {
  const jobSignals: Record<string, Signal> = {};

  return {
    signal(index: string) {
      if (!jobSignals[index]) {
        jobSignals[index] = createRecord();
      }

      jobSignals[index].numberOfCalls += 1;

      if (
        !jobSignals[index].targetCalls ||
        jobSignals[index].numberOfCalls >= jobSignals[index].targetCalls
      ) {
        jobSignals[index].cbHolder.finish();
      }
    },

    async signaled(index: string, requiredCalls: number = 1) {
      if (requiredCalls < 1) {
        throw new Error('Required calls must be greater than 0');
      }

      if (!jobSignals[index]) {
        jobSignals[index] = createRecord(requiredCalls);
      } else {
        jobSignals[index].targetCalls = requiredCalls;
      }

      return jobSignals[index].promise;
    },
  };
}
