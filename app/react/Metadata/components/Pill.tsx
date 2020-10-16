import React from 'react';

interface PillProps {
  children: React.ReactNode;
  color: string;
}

export const Pill = (props: PillProps) => (
  <span className="pill" style={{ backgroundColor: props.color }}>
    {props.children}
  </span>
);
