import React from 'react';

const BeaconRailLabel = ({ text, suffix }: { text: string; suffix?: React.ReactNode }) => (
  <div className="flex min-w-0 flex-1 items-center gap-2">
    <span title={text} className="min-w-0 flex-1 truncate text-[12px] font-medium text-ink">
      {text}
    </span>
    {suffix}
  </div>
);

export { BeaconRailLabel };
