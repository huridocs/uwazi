import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import type { LanguageISO6391 } from '#shared/types/commonTypes.js';
import type { User } from '#api/users.v2/model/User.js';

type ToolContext = {
  actor: User;
  language: LanguageISO6391;
  sessionId?: string;
  protocol: string;
  instanceHost: string;
};

type ToolSideEffect = 'read' | 'write';

type AssistantTool = {
  name: string;
  description: string;
  domain: string;
  sideEffect: ToolSideEffect;
  adminOnly: boolean;
  parameters: Record<string, unknown>;
  parse: (args: unknown) => unknown;
  execute: (args: unknown, ctx: ToolContext) => Promise<unknown>;
};

type DefineToolInput<T extends z.ZodType> = {
  name: string;
  description: string;
  domain: string;
  sideEffect: ToolSideEffect;
  adminOnly?: boolean;
  parameters: T;
  execute: (args: z.infer<T>, ctx: ToolContext) => Promise<unknown>;
};

const jsonSchemaFromZod = (schema: z.ZodType): Record<string, unknown> => {
  const jsonSchema = zodToJsonSchema(schema, { $refStrategy: 'none' }) as Record<string, unknown>;
  delete jsonSchema.$schema;
  return jsonSchema;
};

const defineTool = <T extends z.ZodType>(input: DefineToolInput<T>): AssistantTool => ({
  name: input.name,
  description: input.description,
  domain: input.domain,
  sideEffect: input.sideEffect,
  adminOnly: Boolean(input.adminOnly),
  parameters: jsonSchemaFromZod(input.parameters),
  parse: args => input.parameters.parse(args),
  execute: async (args, ctx) => input.execute(input.parameters.parse(args), ctx),
});

export { defineTool };
export type { AssistantTool, ToolContext, ToolSideEffect };
