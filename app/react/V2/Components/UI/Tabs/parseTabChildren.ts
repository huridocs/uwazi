import React from 'react';

type TabProps = {
  id: string;
  label: React.ReactNode;
  children: React.ReactNode;
};

type TabGroupEntry = {
  id: string;
  label: React.ReactNode;
  content: React.ReactNode;
};

const isTabElement = (child: React.ReactNode): child is React.ReactElement<TabProps> =>
  React.isValidElement<TabProps>(child) &&
  typeof child.props.id === 'string' &&
  child.props.label !== undefined;

const parseTabChildren = (children: React.ReactNode): TabGroupEntry[] =>
  React.Children.toArray(children).filter(isTabElement).map(child => ({
    id: child.props.id,
    label: child.props.label,
    content: child.props.children,
  }));

export type { TabProps, TabGroupEntry };
export { isTabElement, parseTabChildren };
