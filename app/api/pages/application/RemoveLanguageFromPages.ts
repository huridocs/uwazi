import { AbstractUseCase } from '#api/core/libs/UseCase.js';
import { CannotRemoveLastLocaleError, PageLocaleNotFoundError } from '#api/pages/domain/errors.js';
import { PagesDataSource } from './contracts/PagesDataSource.js';

type Input = {
  language: string;
};

type Output = void;

type Deps = {
  pagesDS: PagesDataSource;
};

class RemoveLanguageFromPagesUseCase extends AbstractUseCase<Input, Output, Deps> {
  async execute(input: Input): Promise<void> {
    const pages = await this.deps.pagesDS.getAll();

    await this.transactionManager.run(async () => {
      for (const page of pages) {
        try {
          page.removeLocale(input.language);
          // eslint-disable-next-line no-await-in-loop
          await this.deps.pagesDS.update(page);
        } catch (error) {
          if (
            error instanceof PageLocaleNotFoundError ||
            error instanceof CannotRemoveLastLocaleError
          ) {
            // locale absent or last locale — skip silently
          } else {
            throw error;
          }
        }
      }
    });
  }
}

export { RemoveLanguageFromPagesUseCase };
export type { Input as RemoveLanguageFromPagesInput };
