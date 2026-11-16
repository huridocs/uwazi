const SHOWN_COUNT = 10;

type ClampedItems<T> = {
  shown: readonly T[];
  overflows: boolean;
};

const clampItems = <T>(items: readonly T[], expanded: boolean): ClampedItems<T> => {
  const overflows = items.length > SHOWN_COUNT;
  return {
    shown: !overflows || expanded ? items : items.slice(0, SHOWN_COUNT),
    overflows,
  };
};

export { clampItems };
export type { ClampedItems };
