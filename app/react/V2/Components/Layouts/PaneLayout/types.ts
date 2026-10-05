type PaneSnap = 'half' | 'full';

type PaneProps = React.PropsWithChildren & {
  background?: string;
  className?: string;
  mobileSnap?: PaneSnap;
  mobileTitle?: string;
  onMobileClose?: () => void;
};

type PaneLayoutProps = {
  children: React.ReactNode;
  defaultRatios?: number[];
  minPaneRatios?: number[];
  localStorageKey?: string;
  className?: string;
  requestedPane?: { index: number; id: number };
};

export type { PaneProps, PaneLayoutProps, PaneSnap };
