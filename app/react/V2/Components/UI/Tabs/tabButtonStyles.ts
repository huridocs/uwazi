const activeClass = 'text-ink bg-vellum';
const inactiveClass = 'text-ink-tertiary bg-paper hover:text-ink-secondary';

const tabListScrollClass =
  'min-w-0 max-w-full w-full shrink-0 overflow-x-auto overflow-y-visible [-webkit-overflow-scrolling:touch] [scrollbar-width:thin]';

const tabListClass =
  'inline-flex items-stretch w-max max-w-none shrink-0 rounded-md border border-border shadow-sm overflow-hidden';

const tabTriggerBaseClass =
  'flex items-center justify-center gap-1 px-2.5 py-2 text-center text-xs font-medium leading-tight transition-colors md:px-3 md:py-2.5 focus-visible:outline-hidden focus-visible:[box-shadow:0_0_0_4px_var(--color-theme-control-ring)]';

const getTabShapeClass = (index: number, totalTabs: number) => {
  if (totalTabs === 1) {
    return 'rounded-md';
  }
  if (index === 0) {
    return 'rounded-l-md';
  }
  if (index === totalTabs - 1) {
    return 'rounded-r-md';
  }
  return 'rounded-none';
};

const getTabDividerClass = (index: number) => (index === 0 ? '' : 'shrink-0 border-l border-border');

export {
  activeClass,
  inactiveClass,
  tabListScrollClass,
  tabListClass,
  tabTriggerBaseClass,
  getTabShapeClass,
  getTabDividerClass,
};
