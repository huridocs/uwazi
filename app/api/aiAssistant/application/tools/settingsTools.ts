import { z } from 'zod';
import { SettingsQueryServiceFactory } from '#api/core/infrastructure/factories/SettingsQueryServiceFactory.js';
import { defineTool } from './Tool.js';
import { toJsonSafe } from './serialize.js';

const settingsGetTool = defineTool({
  name: 'settings_get',
  domain: 'settings',
  sideEffect: 'read',
  description:
    'Get collection settings as the current user would see GET /api/settings (admin vs public projection). Does not include LLM API keys.',
  parameters: z.object({}),
  execute: async () => toJsonSafe(await SettingsQueryServiceFactory.default().get()),
});

export { settingsGetTool };
