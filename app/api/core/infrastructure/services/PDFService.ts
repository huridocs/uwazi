// eslint-disable-next-line node/no-restricted-import
import { PDFService } from 'api/core/application/contracts/PDFService';
import { Result } from 'api/core/libs/Result';
import { ShellExecutor } from 'api/core/libs/shell/ShellExecutor';
import { FileContents } from 'api/files.v2/model/FileContents';
import franc from 'franc';
// eslint-disable-next-line node/no-restricted-import
import * as os from 'os';
import path from 'path';
import { LanguageUtils } from 'shared/language';

class PDFServiceAdapter implements PDFService {
  private shell: ShellExecutor;

  constructor(shell?: ShellExecutor) {
    this.shell = shell || new ShellExecutor();
  }

  async extractText(file: FileContents) {
    const commandResult = await this.shell.execute('pdftotext', [
      file.getFullPath().getDataOrThrow(),
      '-',
    ]);
    if (commandResult.isError()) {
      return commandResult;
    }
    const stdout = commandResult.getData();
    const pages = stdout.split('\f').slice(0, -1);

    return Result.ok({
      language: LanguageUtils.fromISO639_3(franc(stdout)),
      pages: pages.reduce<{ [k: string]: string }>(
        (memo, page, index) => ({
          ...memo,
          [index + 1]: page.replace(/(\S+)(\s?)/g, `$1[[${index + 1}]]$2`),
        }),
        {}
      ),
      totalPages: pages.length,
    });
  }

  async createThumbnail(file: FileContents) {
    const thumbFileName = `thumbnail_${Date.now()}_${Math.random()}`;
    const thumbnailPath = path.join(os.tmpdir(), thumbFileName);

    const commandResult = await this.shell.execute('pdftoppm', [
      '-f',
      '1',
      '-singlefile',
      '-scale-to',
      '320',
      '-jpeg',
      file.getFullPath().getDataOrThrow(),
      thumbnailPath,
    ]);

    if (commandResult.isError()) {
      return commandResult;
    }
    return Result.ok(new FileContents(`${thumbnailPath}.jpg`));
  }
}

export { PDFServiceAdapter as PDFService };
