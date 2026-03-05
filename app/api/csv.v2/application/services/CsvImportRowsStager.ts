import { FileStorage } from '#api/core/application/contracts/FileStorage.js';
import { FileContents } from '#api/core/domain/files/FileContents.js';
import { CsvImportRow } from '../../domain/CsvImportRow.js';
import { CsvReader } from './CsvReader.js';
import { CsvReaderError } from './CsvReaderError.js';

type StageRowsParams = {
  importId: string;
  destination: string;
  onRowProgress: (info: { importId: string; stagedRows: number }) => void;
  deleteRows: () => Promise<void>;
  insertBatch: (rows: CsvImportRow[]) => Promise<void>;
  shouldContinue?: () => Promise<boolean>;
};

const DEFAULT_ROWS_BATCH_SIZE = 500;

type RowsAccumulator = {
  setHeaders: (headers: string[]) => void;
  handleRow: (values: string[]) => Promise<void>;
  finalize: () => Promise<void>;
};

type RowsAccumulatorParams = {
  importId: string;
  emptyRowIndexes: number[];
  onRowProgress: (info: { importId: string; stagedRows: number }) => void;
  insertBatch: (rows: CsvImportRow[]) => Promise<void>;
  batchSize: number;
  shouldContinue?: () => Promise<boolean>;
};

type AccumulatorContext = {
  batch: CsvImportRow[];
  headers: string[] | null;
  stagedRows: number;
  emptyPointer: number;
  currentIndex: number;
  sortedEmptyIndexes: number[];
  stopped: boolean;
};

const canContinue = async (params: RowsAccumulatorParams) =>
  (await params.shouldContinue?.()) ?? true;

const flushBatch = async (ctx: AccumulatorContext, params: RowsAccumulatorParams) => {
  if (ctx.stopped || !ctx.batch.length) {
    return;
  }
  if (!(await canContinue(params))) {
    ctx.stopped = true;
    ctx.batch.splice(0, ctx.batch.length);
    return;
  }
  const rowsToInsert = ctx.batch.splice(0, ctx.batch.length);
  await params.insertBatch(rowsToInsert);
};

const ensureCapacity = async (ctx: AccumulatorContext, params: RowsAccumulatorParams) => {
  if (!ctx.stopped && ctx.batch.length >= params.batchSize) {
    await flushBatch(ctx, params);
  }
};

const pushRow = (ctx: AccumulatorContext, params: RowsAccumulatorParams, row: CsvImportRow) => {
  ctx.batch.push(row);
  ctx.stagedRows += 1;
  params.onRowProgress({ importId: params.importId, stagedRows: ctx.stagedRows });
};

const assertHeaders = (ctx: AccumulatorContext) => {
  if (!ctx.headers) {
    throw new CsvReaderError('CSV header row missing.');
  }
};

const shouldInsertEmptyRow = (ctx: AccumulatorContext) =>
  ctx.sortedEmptyIndexes[ctx.emptyPointer] === ctx.currentIndex;

const addEmptyRow = (ctx: AccumulatorContext, params: RowsAccumulatorParams) => {
  const emptyRow = CsvImportRow.create({
    importId: params.importId,
    index: ctx.currentIndex,
    headers: ctx.headers!,
    values: new Array(ctx.headers!.length).fill(''),
  });
  pushRow(ctx, params, emptyRow);
  ctx.currentIndex += 1;
  ctx.emptyPointer += 1;
};

const flushEmptyRows = async (ctx: AccumulatorContext, params: RowsAccumulatorParams) => {
  if (ctx.stopped || !ctx.headers) {
    return;
  }
  let added = false;
  while (shouldInsertEmptyRow(ctx)) {
    addEmptyRow(ctx, params);
    added = true;
  }
  if (added) {
    await ensureCapacity(ctx, params);
  }
};

const createRowsAccumulator = (params: RowsAccumulatorParams): RowsAccumulator => {
  const ctx: AccumulatorContext = {
    batch: [],
    headers: null,
    stagedRows: 0,
    emptyPointer: 0,
    currentIndex: 0,
    sortedEmptyIndexes: [...params.emptyRowIndexes].sort((a, b) => a - b),
    stopped: false,
  };

  return {
    setHeaders: (parsedHeaders: string[]) => {
      ctx.headers = parsedHeaders;
    },
    handleRow: async (values: string[]) => {
      if (ctx.stopped || !(await canContinue(params))) {
        ctx.stopped = true;
        ctx.batch.splice(0, ctx.batch.length);
        return;
      }
      assertHeaders(ctx);
      await flushEmptyRows(ctx, params);
      if (ctx.stopped) {
        return;
      }
      const row = CsvImportRow.create({
        importId: params.importId,
        index: ctx.currentIndex,
        headers: ctx.headers!,
        values,
      });
      pushRow(ctx, params, row);
      ctx.currentIndex += 1;
      await ensureCapacity(ctx, params);
    },
    finalize: async () => {
      if (ctx.stopped || !(await canContinue(params))) {
        return;
      }
      assertHeaders(ctx);
      await flushEmptyRows(ctx, params);
      if (ctx.stopped) {
        return;
      }
      await flushBatch(ctx, params);
      if (ctx.stopped) {
        return;
      }
      params.onRowProgress({
        importId: params.importId,
        stagedRows: ctx.stagedRows,
      });
    },
  };
};

export class CsvImportRowsStager {
  private readonly batchSize: number;

  constructor(
    private deps: {
      fileStorage: FileStorage;
    },
    options?: { batchSize?: number }
  ) {
    this.batchSize = options?.batchSize ?? DEFAULT_ROWS_BATCH_SIZE;
  }

  private getCsvFiles(destination: string) {
    return [this.getExtractedCsv(destination), this.getExtractedCsv(destination)];
  }

  async stage(params: StageRowsParams) {
    const [streamFile, detectionFile] = this.getCsvFiles(params.destination);
    const emptyRowIndexes = await CsvReader.collectEmptyRowIndexes(detectionFile);
    await params.deleteRows();
    const accumulator = createRowsAccumulator({
      importId: params.importId,
      emptyRowIndexes,
      onRowProgress: params.onRowProgress,
      insertBatch: params.insertBatch,
      batchSize: this.batchSize,
      shouldContinue: params.shouldContinue,
    });

    await CsvReader.stream(streamFile, {
      onHeaders: accumulator.setHeaders,
      onRow: async ({ values }) => accumulator.handleRow(values),
    });

    await accumulator.finalize();
  }

  private getExtractedCsv(destination: string): FileContents {
    return this.deps.fileStorage.getFile({
      type: 'customPath',
      destination: `${destination}/extracted`,
      filename: 'import.csv',
    });
  }
}
