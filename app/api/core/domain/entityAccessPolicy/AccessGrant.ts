import { z } from 'zod';
import { AccessLevel } from './AccessLevel.js';
import { GrantType } from './GrantType.js';

const AccessGrantSchema = z.object({
  refId: z.string().min(1),
  type: z.nativeEnum(GrantType),
  level: z.nativeEnum(AccessLevel),
});

type AccessGrantProps = z.infer<typeof AccessGrantSchema>;

class AccessGrant {
  readonly refId: string;

  readonly type: GrantType;

  readonly level: AccessLevel;

  constructor(props: AccessGrantProps) {
    const parsed = AccessGrantSchema.parse(props);
    this.refId = parsed.refId;
    this.type = parsed.type;
    this.level = parsed.level;
  }

  equals(other: AccessGrant): boolean {
    return this.refId === other.refId && this.type === other.type && this.level === other.level;
  }
}

export { AccessGrant };
export type { AccessGrantProps };
