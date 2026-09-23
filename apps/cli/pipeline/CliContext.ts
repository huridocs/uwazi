/** What flows through the pipeline for one command invocation. */
type CliContext<Input = unknown> = {
  route: string;
  input: Input;
  json: boolean;
  result?: unknown;
};

export type { CliContext };
