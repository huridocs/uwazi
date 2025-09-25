type PaneProps = React.PropsWithChildren & {
  background?: string;
  className?: string;
};

type PaneLayoutProps = {
  children: React.ReactElement<PaneProps>[];
  className?: string;
};

export type { PaneProps, PaneLayoutProps };
