import React from 'react';

const BeaconRailLabel = ({
  text,
  suffix,
  foreground,
}: {
  text: string;
  suffix?: React.ReactNode;
  foreground?: string;
}) => (
  <div className="flex min-w-0 flex-1 items-center gap-2">
    <span
      title={text}
      className="min-w-0 flex-1 truncate text-[12px] font-medium text-ink"
      style={foreground ? { color: foreground } : undefined}
    >
      {text}
    </span>
    {suffix}
  </div>
);

export { BeaconRailLabel };
