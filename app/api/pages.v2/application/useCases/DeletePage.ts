import { AbstractUseCase } from '#api/core/libs/UseCase.js';
import { PageReleasesDataSource } from '../contracts/PageReleasesDataSource.js';
import { PagesDataSource } from '../contracts/PagesDataSource.js';
import { TemplatesPageUsageDataSource } from '../contracts/TemplatesPageUsageDataSource.js';
import { PageInUseByTemplatesError } from '../../domain/errors.js';

type Input = {
  sharedId: string;
};

type Output = { ok: true };

type Deps = {
  pagesDS: PagesDataSource;
  pageReleasesDS: PageReleasesDataSource;
  templatesDS: TemplatesPageUsageDataSource;
};

class DeletePageUseCase extends AbstractUseCase<Input, Output, Deps> {
  async execute(input: Input): Promise<Output> {
    const page = (await this.deps.pagesDS.getBySharedId(input.sharedId)).getDataOrThrow();

    const templateNames = await this.deps.templatesDS.getTemplateNamesUsingPageAsEntityView(
      input.sharedId
    );
    if (templateNames.length > 0) {
      throw new PageInUseByTemplatesError(templateNames);
    }

    await this.transactionManager.run(async () => {
      await this.deps.pagesDS.deleteBySharedId(input.sharedId);
      await this.deps.pageReleasesDS.deleteByPageId(page.id);
    });

    return { ok: true };
  }
}

export { DeletePageUseCase };
export type { Input as DeletePageInput };
