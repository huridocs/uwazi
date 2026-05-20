import React from 'react';

type ClusterProps = {
  position: number;
  data: { count: number };
};

const Cluster = ({ position, data }: ClusterProps) => (
  <button
    type="button"
    style={{ top: `${position}px` }}
    className="absolute block h-6 w-6 rounded-full border border-border-soft bg-(--color-theme-surface-raised) text-[10px] cursor-pointer"
  >
    {data.count}
  </button>
);

export { Cluster };
