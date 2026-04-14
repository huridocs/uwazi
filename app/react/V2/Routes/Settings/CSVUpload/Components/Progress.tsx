import React, { useMemo } from 'react';
import { ProgressBar, ProgressBarProps } from '#V2/Components/UI/index.js';
import { CsvImportStatus } from '#app/V2/api/csv/index.js';

const Progress = ({
  current,
  total,
  status,
}: {
  current: number;
  total: number;
  status: CsvImportStatus;
}) => {
  const { progress, color } = useMemo(() => {
    const safeTotal = total > 0 ? total : 1;
    const calculated = (current / safeTotal) * 100;
    let colorByStatus: ProgressBarProps['color'] = 'primary';

    switch (status) {
      case CsvImportStatus.Cancelled:
        colorByStatus = 'warning';
        break;
      case CsvImportStatus.Failed:
        colorByStatus = 'error';
        break;
      case CsvImportStatus.ImportEntitiesDone:
      case CsvImportStatus.Completed:
        colorByStatus = 'success';
        break;
      default:
        colorByStatus = 'gray';
        break;
    }

    return { progress: calculated, color: colorByStatus };
  }, [current, status, total]);

  return (
    <div className="flex flex-col items-center gap-1">
      <ProgressBar progress={progress} color={color} />
      <span style={{ color: 'var(--color-theme-text-muted)' }}>
        {current}/{total}
      </span>
    </div>
  );
};

export { Progress };
