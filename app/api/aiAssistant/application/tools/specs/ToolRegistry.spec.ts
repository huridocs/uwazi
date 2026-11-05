import { getToolRegistry } from '../ToolRegistry.js';

const EXPECTED_TOOLS = [
  { name: 'search_query', adminOnly: false, sideEffect: 'read' },
  { name: 'search_snippets', adminOnly: false, sideEffect: 'read' },
  { name: 'entities_get', adminOnly: false, sideEffect: 'read' },
  { name: 'entities_create', adminOnly: false, sideEffect: 'write' },
  { name: 'entities_update', adminOnly: false, sideEffect: 'write' },
  { name: 'entities_delete', adminOnly: false, sideEffect: 'write' },
  { name: 'templates_list', adminOnly: false, sideEffect: 'read' },
  { name: 'templates_create', adminOnly: true, sideEffect: 'write' },
  { name: 'templates_update', adminOnly: true, sideEffect: 'write' },
  { name: 'templates_delete', adminOnly: true, sideEffect: 'write' },
  { name: 'thesauri_list', adminOnly: false, sideEffect: 'read' },
  { name: 'thesauri_create', adminOnly: true, sideEffect: 'write' },
  { name: 'thesauri_update', adminOnly: true, sideEffect: 'write' },
  { name: 'thesauri_delete', adminOnly: true, sideEffect: 'write' },
  { name: 'relation_types_list', adminOnly: false, sideEffect: 'read' },
  { name: 'relation_types_create', adminOnly: true, sideEffect: 'write' },
  { name: 'relation_types_update', adminOnly: true, sideEffect: 'write' },
  { name: 'relation_types_delete', adminOnly: true, sideEffect: 'write' },
  { name: 'relationships_list', adminOnly: false, sideEffect: 'read' },
  { name: 'relationships_save', adminOnly: false, sideEffect: 'write' },
  { name: 'users_list', adminOnly: true, sideEffect: 'read' },
  { name: 'users_create', adminOnly: true, sideEffect: 'write' },
  { name: 'users_update', adminOnly: false, sideEffect: 'write' },
  { name: 'users_delete', adminOnly: true, sideEffect: 'write' },
  { name: 'settings_get', adminOnly: false, sideEffect: 'read' },
  { name: 'files_list', adminOnly: false, sideEffect: 'read' },
  { name: 'documents_page', adminOnly: false, sideEffect: 'read' },
  { name: 'documents_fulltext', adminOnly: false, sideEffect: 'read' },
] as const;

describe('ToolRegistry', () => {
  it('should register one tool per initial action, grouped by domain', () => {
    const registry = getToolRegistry();
    const names = registry.list().map(tool => tool.name);

    expect(names).toEqual(EXPECTED_TOOLS.map(tool => tool.name));
    expect(new Set(names).size).toBe(28);
  });

  it('should mark admin-only tools the same way the HTTP routes do', () => {
    const byName = Object.fromEntries(
      getToolRegistry()
        .list()
        .map(tool => [tool.name, tool])
    );

    EXPECTED_TOOLS.forEach(expected => {
      expect(byName[expected.name]?.adminOnly).toBe(expected.adminOnly);
      expect(byName[expected.name]?.sideEffect).toBe(expected.sideEffect);
    });
  });

  it('should reject unknown tools', () => {
    expect(() => getToolRegistry().get('ix_extract')).toThrow(/unknown tool/i);
  });
});
