import { Id } from '#api/core/libs/Id.js';
import { z } from 'zod';
import uuid from 'node-uuid';

type ThesaurusValue = {
  id: string;
  label: string;
  values?: { id: string; label: string }[];
};

type Props = {
  id: string;
  name: string;
  values: ThesaurusValue[];
};

type ThesaurusValueCreateProps = {
  label: string;
  values?: { label: string }[];
};

type CreateProps = {
  name: string;
  values?: ThesaurusValueCreateProps[];
};

const getDuplicatedLabels = (values: { label: string }[] | undefined): string[] => {
  if (!values) return [];
  const labels = values.map(v => v.label);
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  labels.forEach(label => {
    if (seen.has(label)) {
      duplicates.add(label);
    }
    seen.add(label);
  });

  return Array.from(duplicates);
};

const ValueEntrySchema = z.object({
  id: z.string({
    message: 'ID is required',
  }),

  label: z
    .string({ message: 'Label is required' })
    .trim()
    .min(1, { message: 'Label cannot be empty' }),
});

const ValueSchema = ValueEntrySchema.extend({
  values: z.array(ValueEntrySchema).optional(),
});

const Schema = z
  .object({
    id: z.string({ message: 'ID is required' }),
    name: z
      .string({ message: 'Name is required' })
      .trim()
      .min(1, { message: 'Name cannot be empty' }),
    values: z.array(ValueSchema),
  })
  .superRefine((data, ctx) => {
    const duplicated: string[] = getDuplicatedLabels(data.values);

    data.values?.forEach(v => {
      const childDuplicates = getDuplicatedLabels(v.values);
      duplicated.push(...childDuplicates.map(label => `${v.label}/${label}`));
    });

    if (duplicated.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Duplicated labels: ${duplicated.join(', ')}`,
        path: ['values'],
      });
    }
  });

class Thesaurus {
  id: string;

  name: string;

  values: ThesaurusValue[];

  constructor(props: Props) {
    const parsed = Schema.parse(props);

    this.id = parsed.id;
    this.name = parsed.name;
    this.values = parsed.values;
  }

  getValueByLabel(label: string): ThesaurusValue | undefined {
    return this.values.find(v => v.label === label);
  }

  addValues(props: ThesaurusValueCreateProps[]): Thesaurus {
    const thesauriValues = props.map(value => Thesaurus.createThesaurusValue(value));
    const parsed: ThesaurusValue[] = [];

    this.values.forEach(existingValue => {
      if (!existingValue.values) {
        return parsed.push(existingValue);
      }

      const existingToAdd = thesauriValues.find(v => v.label === existingValue.label);
      if (existingToAdd && existingToAdd.values) {
        const uniqueSubValues = existingToAdd.values!.filter(
          newSubValue => !existingValue.values?.some(ev => ev.label === newSubValue.label)
        );

        parsed.push({
          ...existingValue,
          values: [...existingValue.values, ...uniqueSubValues],
        });
      }
    });

    thesauriValues.forEach(value => {
      const alreadyExists = parsed.find(v => v.label === value.label);
      if (value.values || alreadyExists) return;

      parsed.push(value);
    });

    return this.clone({
      values: parsed,
    });
  }

  private clone(props: Partial<Props>): Thesaurus {
    return new Thesaurus({
      id: this.id,
      name: props.name ?? this.name,
      values: props.values ?? structuredClone(this.values),
    });
  }

  private static createThesaurusValue(value: ThesaurusValueCreateProps): ThesaurusValue {
    return {
      id: uuid.v4(),
      label: value.label,
      values: value.values
        ? value.values.map(subValue => ({
            id: uuid.v4(),
            label: subValue.label,
          }))
        : undefined,
    };
  }

  static create(props: CreateProps) {
    return new Thesaurus({
      id: new Id({}).value,
      ...props,
      values: props.values?.map(value => Thesaurus.createThesaurusValue(value)) || [],
    });
  }
}

export { Thesaurus };
export type { CreateProps as CreateThesaurusProps };
