const FIELD =
  'login-field h-10 w-full rounded-md border px-3 text-sm placeholder:text-ink-muted focus:outline-none disabled:cursor-wait';

const FIELD_IDLE =
  'border-border bg-paper text-ink focus:border-carbon/40 focus:ring-2 focus:ring-carbon/20 disabled:bg-warm';

const FIELD_ERROR = 'border-emphasis bg-seal-tint text-seal focus:border-emphasis focus:ring-2';

const INPUT = `${FIELD} ${FIELD_IDLE}`;

const inputClass = (invalid?: boolean) => (invalid ? `${FIELD} ${FIELD_ERROR}` : INPUT);

const showsControlError = (
  fieldInvalid: boolean | undefined,
  tone: string | undefined,
  anyFieldInvalid: boolean
) => Boolean(fieldInvalid) || (tone === 'error' && !anyFieldInvalid);

const LABEL = 'mb-1.5 block text-sm font-medium text-ink';

const TEXT_LINK =
  'cursor-pointer rounded-sm text-sm text-ink-secondary underline decoration-border underline-offset-4 hover:text-ink hover:decoration-ink-tertiary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-carbon/30';

export { INPUT, LABEL, TEXT_LINK, inputClass, showsControlError };
