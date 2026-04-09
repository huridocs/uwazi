import React, { useMemo } from 'react';
import { ProgressBar, ProgressBarProps } from '#V2/Components/UI/index.js';

const Progress = ({
  current,
  total,
  failed,
  canceled,
}: {
  current: number;
  total: number;
  failed?: boolean;
  canceled?: boolean;
}) => {
  const { progress, color } = useMemo(() => {
    const safeTotal = total > 0 ? total : 1;
    const calculated = (current / safeTotal) * 100;
    let colorByStatus: ProgressBarProps['color'] = 'primary';

    if (current === safeTotal) {
      colorByStatus = 'success';
    } else if (canceled) {
      colorByStatus = 'warning';
    } else if (failed) {
      colorByStatus = 'error';
    }

    return { progress: calculated, color: colorByStatus };
  }, [canceled, current, failed, total]);

  return (
    <div className="flex flex-row gap-2 items-center">
      <ProgressBar progress={progress} color={color} />
      <span className="text-gray-500">
        {current}/{total}
      </span>
    </div>
  );
};

export { Progress };
