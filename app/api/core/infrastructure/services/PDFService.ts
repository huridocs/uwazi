// eslint-disable-next-line node/no-restricted-import
import { PDFService } from '#api/core/application/contracts/PDFService.js';
import { DomainError } from '#api/core/domain/error/DomainError.js';
import { Result } from '#api/core/libs/Result.js';
import { ShellExecutor } from '#api/core/libs/shell/ShellExecutor.js';
import { FileContents } from '#api/core/domain/files/FileContents.js';
import franc from 'franc';
// eslint-disable-next-line node/no-restricted-import
import { DiskFile } from '#api/core/infrastructure/files/DiskFile.js';
import * as os from 'os';
import path from 'path';
import { LanguageUtils } from '#shared/language/index.js';
import { inspect } from 'util';
import { FileContentsIO } from '../files/FileContentIO.js';

class FileIsNotAPDF extends DomainError {
  constructor(file: DiskFile, cause?: Error) {
    super(`File is not a pdf ${file.path}`, 'file.not_pdf', cause);
  }
}

class PDFServiceAdapter implements PDFService {
  private shell: ShellExecutor;

  private filesIO: FileContentsIO;

  constructor(shell?: ShellExecutor, filesIO?: FileContentsIO) {
    this.shell = shell || new ShellExecutor();
    this.filesIO = filesIO || new FileContentsIO();
  }

  async extractText(file: FileContents) {
    const diskFile = await this.filesIO.toDisk(file);
    const result = await this.executeShellCommand('pdftotext', [diskFile.path, '-'], diskFile);
    if (result.isError()) {
      return result;
    }
    const stdout = result.getData();
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

    const diskFile = await this.filesIO.toDisk(file);
    const result = await this.executeShellCommand(
      'pdftoppm',
      ['-f', '1', '-singlefile', '-scale-to', '320', '-jpeg', diskFile.path, thumbnailPath],
      diskFile
    );

    if (result.isError()) {
      return result;
    }
    const thumbFullPath = `${thumbnailPath}.jpg`;
    return Result.ok(new DiskFile(thumbFullPath));
  }

  private async executeShellCommand(command: string, args: string[], file: DiskFile) {
    const commandResult = await this.shell.execute(command, args);

    if (commandResult.isError()) {
      const error = commandResult.getError();
      if (inspect(error).match(/syntax error/i)) {
        return Result.fail(new FileIsNotAPDF(file, error));
      }
    }
    return commandResult;
  }
}

export { FileIsNotAPDF, PDFServiceAdapter as PDFService };
