import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import { GetDatavizDataUseCase } from '#api/dataviz.v2/application/useCases/GetDatavizData.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { DatavizDataSourceFactory } from './DatavizDataSourceFactory.js';
import { DatavizSnapshotsDataSourceFactory } from './DatavizSnapshotsDataSourceFactory.js';
import { DatavizQueryExecutorFactory } from './DatavizQueryExecutorFactory.js';

class GetDatavizDataUseCaseFactory {
  static default(overrides?: { targetLanguage?: LanguageISO6391 }) {
    const { tenant, actor } = ExecutionContext;

    return new GetDatavizDataUseCase(
      {
        datavizDS: DatavizDataSourceFactory.default(),
        snapshotsDS: DatavizSnapshotsDataSourceFactory.default(),
        queryExecutor: DatavizQueryExecutorFactory.default(),
      },
      { actor, tenant, targetLanguage: overrides?.targetLanguage }
    );
  }
}

export { GetDatavizDataUseCaseFactory };
