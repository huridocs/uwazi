type ThesaurusValue = {
  id?: string;
  label: string;
  values?: {
    id?: string;
    label: string;
    name?: string;
  }[];
};

type Thesaurus = {
  _id: string;
  name: string;
  values: ThesaurusValue[];
};

type ThesaurusInput = Omit<Thesaurus, '_id'> & { _id?: string };

export type { Thesaurus, ThesaurusValue, ThesaurusInput };
