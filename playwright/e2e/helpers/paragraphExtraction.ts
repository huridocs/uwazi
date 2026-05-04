import { APIRequestContext, expect } from '@playwright/test';

type PXStatusRow = {
  entity?: {
    sharedId?: string;
    title?: string;
  };
  status?: {
    status?: string;
  };
};

type PXStatusesResponse = {
  totalRows?: number;
  rows?: PXStatusRow[];
};

type PollSnapshot = {
  attempt: number;
  totalRows: number;
  processed: number;
  processing: number;
  newCount: number;
  error: number;
  obsolete: number;
  domRows: number;
};

type WaitForProcessedRowsResult = {
  processedRows: PXStatusRow[];
  snapshots: PollSnapshot[];
};

type WaitForProcessedRowsOptions = {
  timeoutMs?: number;
  pollIntervalMs?: number;
  getDomRowsCount?: () => Promise<number>;
};

const countStatuses = (rows: PXStatusRow[]) =>
  rows.reduce(
    (acc, row) => {
      const status = row.status?.status;
      if (status === 'processed') acc.processed += 1;
      if (status === 'processing') acc.processing += 1;
      if (status === 'new') acc.newCount += 1;
      if (status === 'error') acc.error += 1;
      if (status === 'obsolete') acc.obsolete += 1;
      return acc;
    },
    { processed: 0, processing: 0, newCount: 0, error: 0, obsolete: 0 }
  );

export const waitForProcessedParagraphRows = async (
  request: APIRequestContext,
  extractorId: string,
  options: WaitForProcessedRowsOptions = {}
): Promise<WaitForProcessedRowsResult> => {
  const timeoutMs = options.timeoutMs ?? 60_000;
  const pollIntervalMs = options.pollIntervalMs ?? 1500;
  const startedAt = Date.now();
  const snapshots: PollSnapshot[] = [];
  let attempt = 0;

  while (Date.now() - startedAt < timeoutMs) {
    attempt += 1;
    const response = await request.get(
      `/api/paragraphExtraction/extractorStatuses?id=${encodeURIComponent(extractorId)}&page[number]=1&page[size]=200`,
      {
        headers: { 'X-Requested-With': 'XMLHttpRequest' },
      }
    );
    const responseBody = await response.text();
    expect(
      response.ok(),
      `extractorStatuses request failed: ${response.status()} ${responseBody.slice(0, 400)}`
    ).toBeTruthy();

    const payload = JSON.parse(responseBody) as PXStatusesResponse;
    const rows = payload.rows || [];
    const counters = countStatuses(rows);
    const domRows = options.getDomRowsCount ? await options.getDomRowsCount() : 0;
    snapshots.push({
      attempt,
      totalRows: payload.totalRows || rows.length,
      processed: counters.processed,
      processing: counters.processing,
      newCount: counters.newCount,
      error: counters.error,
      obsolete: counters.obsolete,
      domRows,
    });

    if (counters.error > 0) {
      throw new Error(
        `Paragraph extraction has ${counters.error} row(s) in error for extractor ${extractorId}; aborting instead of waiting. Last snapshot: ${JSON.stringify(snapshots[snapshots.length - 1])}`
      );
    }

    const processedRows = rows.filter(row => row.status?.status === 'processed');
    if (processedRows.length > 0) {
      return { processedRows, snapshots };
    }

    await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
  }

  const recentSnapshots = snapshots.slice(-3);
  throw new Error(
    `Timed out after ${timeoutMs}ms waiting for at least one processed row (extractor ${extractorId}). If nothing completes in ~90s locally, check workers/services — extending the wait usually hides real failures. Last snapshots: ${JSON.stringify(recentSnapshots)}`
  );
};
