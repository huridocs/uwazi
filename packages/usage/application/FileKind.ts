const FILE_KINDS = [
  'pdf',
  'image',
  'video',
  'audio',
  'office',
  'text',
  'other',
  'unknown',
] as const;

type FileKindName = (typeof FILE_KINDS)[number];

type KindUsage = { count: number; size: number };

type FilesByKind = Record<FileKindName, KindUsage>;

type MimetypeUsage = { mimetype: string | null; count: number; size: number };

const OFFICE_MIMETYPES = new Set([
  'application/msword',
  'application/vnd.ms-excel',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.oasis.opendocument.text',
  'application/vnd.oasis.opendocument.spreadsheet',
  'application/vnd.oasis.opendocument.presentation',
]);

const PREFIXED_KINDS: [string, FileKindName][] = [
  ['image/', 'image'],
  ['video/', 'video'],
  ['audio/', 'audio'],
  ['text/', 'text'],
];

/** The broad kind a file's mimetype falls in, as usage reports group files. */
class FileKind {
  static readonly ALL: readonly FileKindName[] = FILE_KINDS;

  static of(mimetype: string | null | undefined): FileKindName {
    const normalized = mimetype?.trim().toLowerCase();

    if (!normalized) {
      return 'unknown';
    }

    if (normalized === 'application/pdf') {
      return 'pdf';
    }

    const prefixed = PREFIXED_KINDS.find(([prefix]) => normalized.startsWith(prefix));
    if (prefixed) {
      return prefixed[1];
    }

    return OFFICE_MIMETYPES.has(normalized) ? 'office' : 'other';
  }

  static empty(): FilesByKind {
    return Object.fromEntries(FILE_KINDS.map(kind => [kind, { count: 0, size: 0 }])) as FilesByKind;
  }

  static bucket(groups: MimetypeUsage[]): FilesByKind {
    return groups.reduce((byKind, { mimetype, count, size }) => {
      const kind = byKind[FileKind.of(mimetype)];
      kind.count += count;
      kind.size += size;
      return byKind;
    }, FileKind.empty());
  }
}

export { FileKind };
export type { FileKindName, FilesByKind, KindUsage, MimetypeUsage };
