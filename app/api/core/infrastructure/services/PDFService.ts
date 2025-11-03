// eslint-disable-next-line node/no-restricted-import
import { PDFService } from 'api/core/application/contracts/PDFService';
import { Result } from 'api/core/libs/Result';
import { ShellExecutor } from 'api/core/libs/shell/ShellExecutor';
import { File } from 'api/files.v2/model/File';
import franc from 'franc';
// eslint-disable-next-line node/no-restricted-import
import { createReadStream } from 'fs';
import * as os from 'os';
import path from 'path';
import { LanguageUtils } from 'shared/language';

class PDFServiceAdapter implements PDFService {
  private shell: ShellExecutor;

  constructor(shell?: ShellExecutor) {
    this.shell = shell || new ShellExecutor();
  }

  async extractText(file: File) {
    const tempPath = await file.asTmpDiskFile();
    const commandResult = await this.shell.execute('pdftotext', [tempPath, '-']);
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

  async createThumbnail(file: File) {
    const pdfPath = await file.asTmpDiskFile();

    const thumbnailPath = path.join(os.tmpdir(), `thumbnail_${Date.now()}_${Math.random()}`);

    const commandResult = await this.shell.execute('pdftoppm', [
      '-f',
      '1',
      '-singlefile',
      '-scale-to',
      '320',
      '-jpeg',
      pdfPath,
      thumbnailPath,
    ]);

    if (commandResult.isError()) {
      return commandResult;
    }
    return Result.ok(
      new File({
        filename: path.basename(pdfPath),
        source: createReadStream(`${thumbnailPath}.jpg`),
      })
    );
  }
}

export { PDFServiceAdapter as PDFService };
