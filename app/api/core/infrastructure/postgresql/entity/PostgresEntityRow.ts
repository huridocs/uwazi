type EntityRow = {
  _id: string;
  sharedId: string;
  language: string;
  title: string;
  template: string;
  published: boolean;
  generatedToc: boolean | null;
  icon: {
    _id: string | null;
    label?: string;
    type?: string;
  };
  creationDate: number;
  editDate: number;
  metadata: Record<string, { value: unknown; label?: string }[]>;
  user: string | null;
  permissions: { refId: string; type: string; level: string }[];
  preview: string | null;
};

export type { EntityRow };
