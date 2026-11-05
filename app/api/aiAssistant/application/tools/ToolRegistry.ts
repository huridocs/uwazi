import { documentsFulltextTool, documentsPageTool } from './documentTools.js';
import {
  entitiesCreateTool,
  entitiesDeleteTool,
  entitiesGetTool,
  entitiesUpdateTool,
} from './entityTools.js';
import { filesListTool } from './fileTools.js';
import {
  relationTypesCreateTool,
  relationTypesDeleteTool,
  relationTypesListTool,
  relationTypesUpdateTool,
} from './relationTypeTools.js';
import { relationshipsListTool, relationshipsSaveTool } from './relationshipTools.js';
import { searchQueryTool, searchSnippetsTool } from './searchTools.js';
import { settingsGetTool } from './settingsTools.js';
import {
  templatesCreateTool,
  templatesDeleteTool,
  templatesListTool,
  templatesUpdateTool,
} from './templateTools.js';
import {
  thesauriCreateTool,
  thesauriDeleteTool,
  thesauriListTool,
  thesauriUpdateTool,
} from './thesaurusTools.js';
import type { AssistantTool } from './Tool.js';
import { usersCreateTool, usersDeleteTool, usersListTool, usersUpdateTool } from './userTools.js';

const TOOLS: AssistantTool[] = [
  searchQueryTool,
  searchSnippetsTool,
  entitiesGetTool,
  entitiesCreateTool,
  entitiesUpdateTool,
  entitiesDeleteTool,
  templatesListTool,
  templatesCreateTool,
  templatesUpdateTool,
  templatesDeleteTool,
  thesauriListTool,
  thesauriCreateTool,
  thesauriUpdateTool,
  thesauriDeleteTool,
  relationTypesListTool,
  relationTypesCreateTool,
  relationTypesUpdateTool,
  relationTypesDeleteTool,
  relationshipsListTool,
  relationshipsSaveTool,
  usersListTool,
  usersCreateTool,
  usersUpdateTool,
  usersDeleteTool,
  settingsGetTool,
  filesListTool,
  documentsPageTool,
  documentsFulltextTool,
];

class ToolRegistry {
  constructor(private tools: AssistantTool[]) {}

  list(): AssistantTool[] {
    return [...this.tools];
  }

  get(name: string): AssistantTool {
    const tool = this.tools.find(item => item.name === name);
    if (!tool) {
      throw new Error(`Unknown tool: ${name}`);
    }
    return tool;
  }
}

const defaultRegistry = new ToolRegistry(TOOLS);

const getToolRegistry = () => defaultRegistry;

export { ToolRegistry, getToolRegistry };
