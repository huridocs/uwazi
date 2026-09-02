import { ObjectId } from 'mongodb';
import { z } from 'zod';

type Props = {
  id?: string;
};

class Id {
  value: string;

  constructor(props: Props) {
    this.value = props?.id || new ObjectId().toString();
  }

  equals(other: Id): boolean {
    return this.value === other.value;
  }
}

const IdSchema = z.string().regex(/^[0-9a-f]{24}$/i, 'must be a valid id');

const parseIdList = (value: string | string[]): string[] => {
  if (Array.isArray(value)) return value;

  const trimmed = value.trim();

  return trimmed.startsWith('[') ? JSON.parse(trimmed) : [value];
};

const IdListQuerySchema = z
  .union([z.string(), z.array(z.string())])
  .transform((value, context) => {
    try {
      return parseIdList(value);
    } catch {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'ids must be a valid JSON array',
      });
      return z.NEVER;
    }
  })
  .pipe(z.array(IdSchema));

export { Id, IdSchema, IdListQuerySchema };
export type { Props as IdProps };
