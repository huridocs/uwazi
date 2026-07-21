/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render } from '@testing-library/react';
import { CsvImportStatus } from '#app/V2/api/csv/index.js';
import { Progress } from '../Progress.js';

describe('Progress', () => {
  const colorClassByName = {
    gray: 'var(--color-theme-text-muted)',
    success: 'var(--color-theme-feedback-success)',
    warning: 'var(--color-theme-feedback-warning)',
    error: 'var(--color-theme-feedback-danger)',
  } as const;

  type CaseRow = {
    title: string;
    status: CsvImportStatus;
    rowsFailed: number;
    expectedColor: keyof typeof colorClassByName;
  };

  const assertOnlyColor = (
    container: HTMLElement,
    expectedColor: keyof typeof colorClassByName
  ) => {
    const root = container.firstElementChild as HTMLElement;
    const fill = root.children[0]?.children[0] as HTMLElement | undefined;
    expect(fill).toHaveStyle({ backgroundColor: colorClassByName[expectedColor] });
  };

  const cases: CaseRow[] = [
    {
      title: 'completed import with no failed rows should be success',
      status: CsvImportStatus.Completed,
      rowsFailed: 0,
      expectedColor: 'success',
    },
    {
      title: 'completed import with failed rows should be warning',
      status: CsvImportStatus.Completed,
      rowsFailed: 2,
      expectedColor: 'warning',
    },
    {
      title: 'ongoing import should stay gray with no failed rows',
      status: CsvImportStatus.Processing,
      rowsFailed: 0,
      expectedColor: 'gray',
    },
    {
      title: 'ongoing import should stay gray even with failed rows',
      status: CsvImportStatus.Processing,
      rowsFailed: 3,
      expectedColor: 'gray',
    },
    {
      title: 'failed import should be error with no failed rows in stats',
      status: CsvImportStatus.Failed,
      rowsFailed: 0,
      expectedColor: 'error',
    },
    {
      title: 'failed import should be error when failed rows exist',
      status: CsvImportStatus.Failed,
      rowsFailed: 4,
      expectedColor: 'error',
    },
  ];

  it.each(cases)('$title', ({ status, rowsFailed, expectedColor }) => {
    const { container } = render(
      <Progress current={25} total={100} status={status} stats={{ rowsFailed }} />
    );
    assertOnlyColor(container, expectedColor);
  });
});
