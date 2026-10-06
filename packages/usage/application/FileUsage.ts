import { FileKind } from './FileKind.js';
import type { ContentUsage, FileTypeCounts } from './TenantUsage.js';

/** Files counted per stored type and mimetype, as a backend groups them. */
type FileGroup = { type: string | null; mimetype: string | null; count: number; size: number };

type FilesUsage = Pick<ContentUsage, 'filesCount' | 'filesByBucket' | 'filesStorage'>;

const FILE_TYPES = ['document', 'attachment', 'custom', 'thumbnail'] as const;

const isFileType = (type: string | null): type is keyof FileTypeCounts =>
  FILE_TYPES.includes(type as keyof FileTypeCounts);

class FileUsage {
  static summarize(groups: FileGroup[]): FilesUsage {
    const filesCount: FileTypeCounts = { document: 0, attachment: 0, custom: 0, thumbnail: 0 };

    groups.forEach(({ type, count }) => {
      if (isFileType(type)) {
        filesCount[type] += count;
      }
    });

    return {
      filesCount,
      filesByBucket: FileKind.bucket(groups),
      filesStorage: groups.reduce((total, { size }) => total + size, 0),
    };
  }
}

export { FileUsage };
export type { FileGroup };
