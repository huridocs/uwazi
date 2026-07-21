import { AbstractUseCase } from '#api/core/libs/UseCase.js';
import { PageReleasesDataSource } from '../contracts/PageReleasesDataSource.js';
import { PagesDataSource } from '../contracts/PagesDataSource.js';

type Input = {
  sharedId: string;
};

type Output = { ok: true };

type Deps = {
  pagesDS: PagesDataSource;
  pageReleasesDS: PageReleasesDataSource;
};

class DeletePageUseCase extends AbstractUseCase<Input, Output, Deps> {
  async execute(input: Input): Promise<Output> {
    const pageResult = await this.deps.pagesDS.getBySharedId(input.sharedId);
    if (pageResult.isError()) {
      throw pageResult.getError();
    }
    const page = pageResult.getDataOrThrow();

    await this.transactionManager.run(async () => {
      await this.deps.pagesDS.deleteBySharedId(input.sharedId);
      await this.deps.pageReleasesDS.deleteByPageId(page.id);
    });

    return { ok: true };
  }
}

export { DeletePageUseCase };
export type { Input as DeletePageInput };
