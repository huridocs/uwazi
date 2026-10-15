/** The parsed body or query of a logged request, plus whatever was loaded to describe it. */
type ActivityData = Record<string, any>;

type RelatedDataKind =
  | 'entity'
  | 'entityFromPublicForm'
  | 'template'
  | 'file'
  | 'permissions'
  | 'suggestion'
  | 'extractor'
  | 'user';

/**
 * What the rest of the application knows about the things a request touched, as it is now. Each
 * loader returns the data it was given with what it found added to it.
 */
type RelatedData = Record<RelatedDataKind, (data: ActivityData) => Promise<ActivityData>>;

export type { ActivityData, RelatedData, RelatedDataKind };
