import { FileContents } from '#api/core/domain/files/FileContents.js';
import { ImageThumbnailRenderer } from '../../application/contracts/ImageThumbnailRenderer.js';
import { libvipsVersionIsUsable } from './libvipsVersion.js';

type VersionReader = () => Promise<string | undefined>;

class PreferSystemVipsRenderer implements ImageThumbnailRenderer {
  private chosen: Promise<ImageThumbnailRenderer> | undefined;

  constructor(
    private version: VersionReader,
    private system: ImageThumbnailRenderer,
    private basic: ImageThumbnailRenderer
  ) {}

  async render(content: FileContents): Promise<FileContents> {
    return (await this.renderer()).render(content);
  }

  private async renderer() {
    this.chosen ??= this.version().then(found =>
      found && libvipsVersionIsUsable(found) ? this.system : this.basic
    );
    return this.chosen;
  }
}

export { PreferSystemVipsRenderer };
