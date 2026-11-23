import path from 'path';
import { RuntimeImportGraph } from './RuntimeImportGraph.js';

const root = path.resolve(__dirname, '../../..');

/**
 * `#templates` ships in the browser bundle. Everything its entry loads at runtime must be safe
 * there: the package itself, the template domain, shared code, and the npm packages below.
 * Type-only imports are erased and do not count.
 */
const allowed = {
  directories: ['packages/templates/', 'app/api/core/domain/', 'app/shared/'],
  files: ['app/api/common.v2/utils/Array.ts'],
  packages: ['zod'],
};

describe('#templates browser safety', () => {
  it('should only load browser-safe code from its entry', () => {
    const graph = RuntimeImportGraph.from(root, 'packages/templates/index.ts');

    expect(graph.violations(allowed)).toEqual([]);
  });

  it('should report a module outside the allowed list, with the chain that loads it', () => {
    const graph = RuntimeImportGraph.from(
      root,
      'app/api/core/domain/template/CommonPropertyFactory.ts'
    );

    expect(graph.violations(allowed)).toContainEqual([
      'app/api/core/domain/template/CommonPropertyFactory.ts',
      'app/api/core/infrastructure/factories/LoggerFactory.ts',
    ]);
  });

  it('should report an npm package outside the allowed list', () => {
    const graph = RuntimeImportGraph.from(root, 'app/api/core/domain/template/TextProperty.ts');

    expect(graph.violations({ ...allowed, packages: [] })).toContainEqual([
      'app/api/core/domain/template/TextProperty.ts',
      'zod',
    ]);
  });
});
