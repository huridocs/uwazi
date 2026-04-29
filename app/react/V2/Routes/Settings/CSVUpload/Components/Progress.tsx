import React, { useMemo } from 'react';
import { ProgressBar, ProgressBarProps } from '#V2/Components/UI/index.js';
import { CsvImportStatus, type CsvImportListRow } from '#app/V2/api/csv/index.js';

const Progress = ({
  current,
  total,
  status,
  stats,
}: {
  current: number;
  total: number;
  status: CsvImportStatus;
  stats: CsvImportListRow['stats'];
}) => {
  const { progress, color } = useMemo(() => {
    const safeTotal = total > 0 ? total : 1;
    const calculated = (current / safeTotal) * 100;
    const rowsFailed = stats?.rowsFailed ?? 0;
    let colorByStatus: ProgressBarProps['color'] = 'gray';

    if (status === CsvImportStatus.Cancelled) {
      colorByStatus = 'warning';
    } else if (status === CsvImportStatus.Failed) {
      colorByStatus = 'error';
    } else if (
      status === CsvImportStatus.ImportEntitiesDone ||
      status === CsvImportStatus.Completed
    ) {
      colorByStatus = rowsFailed > 0 ? 'warning' : 'success';
    }

    return { progress: calculated, color: colorByStatus };
  }, [current, stats?.rowsFailed, status, total]);

  return (
    <div className="flex flex-col gap-1 items-center">
      <ProgressBar progress={progress} color={color} />
      <span className="[color:var(--color-theme-text-muted)]">
        {current}/{total}
      </span>
    </div>
  );
};

export { Progress };
