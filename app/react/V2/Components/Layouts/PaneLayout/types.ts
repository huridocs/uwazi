type PaneProps = React.PropsWithChildren & {
  background?: string;
  className?: string;
};

type PaneLayoutProps = {
  children: React.ReactElement<PaneProps>[];
  defaultRatios?: number[];
  minPaneRatios?: number[];
  localStorageKey?: string;
  className?: string;
};

export type { PaneProps, PaneLayoutProps };
