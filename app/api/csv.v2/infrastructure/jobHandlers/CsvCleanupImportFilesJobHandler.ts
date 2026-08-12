import { UwaziJobHandler, UwaziJobParams } from '#api/core/infrastructure/jobs/UwaziJobHandler.js';
import {
  HeartbeatCallback,
  JobInfo,
  Params as DispatchableParams,
} from '#api/core/libs/queue/application/contracts/Dispatchable.js';
import { CsvCleanupImportFilesJob } from '../../application/jobs/CsvCleanupImportFilesJob.js';

type Params = UwaziJobParams & {
  tenantName: string;
  importId: string;
};

type Deps = {
  useCase: CsvCleanupImportFilesJob;
};

export class CsvCleanupImportFilesJobHandler extends UwaziJobHandler<Params> {
  constructor(private deps: Deps) {
    super();
  }

  private static parseParams(params: DispatchableParams): Params {
    const { importId, tenantName, userId } = params;
    if (typeof importId !== 'string') {
      throw new Error('CsvCleanupImportFilesJobHandler requires params.importId:string');
    }
    if (typeof tenantName !== 'string') {
      throw new Error('CsvCleanupImportFilesJobHandler requires params.tenantName:string');
    }
    if (typeof userId !== 'string') {
      throw new Error('CsvCleanupImportFilesJobHandler requires params.userId:string');
    }
    return { importId, tenantName, userId };
  }

  async handleDispatch(
    heartbeat: HeartbeatCallback,
    params: DispatchableParams,
    jobInfo?: JobInfo
  ): Promise<void> {
    return super.handleDispatch(
      heartbeat,
      CsvCleanupImportFilesJobHandler.parseParams(params),
      jobInfo
    );
  }

  async handle(_heartbeat: HeartbeatCallback, params: Params): Promise<void> {
    await this.deps.useCase.execute({
      importId: params.importId,
    });
  }
}
