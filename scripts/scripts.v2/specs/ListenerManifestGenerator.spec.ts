// eslint-disable-next-line no-restricted-imports
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import path from 'path';
import { ListenerManifestError } from '../ListenerManifestError.js';
import { ListenerManifestGenerator } from '../ListenerManifestGenerator.js';

const listenerSource = (name: string) => `
@PrivilegedJob()
class ${name} extends Listener<SomethingHappened, Deps> {
  static eventName = SomethingHappened.name;
}
export { ${name} };
`;

const factorySource = (listener: string) => `
class ${listener}Factory {
  static default(): ${listener} {
    return new ${listener}({});
  }
}
export { ${listener}Factory };
`;

describe('ListenerManifestGenerator', () => {
  let repo: string;

  const write = async (file: string, content: string) => {
    await mkdir(path.dirname(path.join(repo, file)), { recursive: true });
    await writeFile(path.join(repo, file), content);
  };

  const generator = () =>
    new ListenerManifestGenerator(
      repo,
      [
        { root: 'app/api', output: 'app/api/listeners.generated.ts' },
        { root: 'packages/pkg', output: 'packages/pkg/infrastructure/listeners.generated.ts' },
      ],
      async source => source
    );

  beforeEach(async () => {
    repo = await mkdtemp(path.join(tmpdir(), 'listener-manifests-'));
    await write('app/api/core/listeners/BListener.ts', listenerSource('BListener'));
    await write('app/api/core/factories/BListenerFactory.ts', factorySource('BListener'));
    await write('app/api/pages/listeners/AListener.ts', listenerSource('AListener'));
    await write('app/api/pages/factories/AListenerFactory.ts', factorySource('AListener'));
    await write(
      'packages/pkg/infrastructure/listeners/PkgListener.ts',
      listenerSource('PkgListener')
    );
    await write(
      'packages/pkg/infrastructure/factories/PkgListenerFactory.ts',
      factorySource('PkgListener')
    );
  });

  afterEach(async () => {
    await rm(repo, { recursive: true, force: true });
  });

  it('should list every listener of a module with its factory, sorted by name', async () => {
    const manifests = await generator().generate();

    expect(manifests.get('app/api/listeners.generated.ts')).toMatchSnapshot();
    expect(manifests.get('packages/pkg/infrastructure/listeners.generated.ts')).toMatchSnapshot();
  });

  it('should ignore listeners declared in specs and in generated files', async () => {
    await write('app/api/core/specs/SpecListener.spec.ts', listenerSource('SpecListener'));
    await write('app/api/other.generated.ts', listenerSource('GeneratedListener'));

    const manifest = (await generator().generate()).get('app/api/listeners.generated.ts')!;

    expect(manifest).not.toContain('SpecListener');
    expect(manifest).not.toContain('GeneratedListener');
  });

  it('should fail when a listener has no factory', async () => {
    await write('app/api/core/listeners/Orphan.ts', listenerSource('Orphan'));

    await expect(generator().generate()).rejects.toThrow(
      new ListenerManifestError('Orphan (app/api/core/listeners/Orphan.ts) has no OrphanFactory')
    );
  });

  it('should fail when two listeners share a name', async () => {
    await write('packages/pkg/infrastructure/listeners/AListener.ts', listenerSource('AListener'));

    await expect(generator().generate()).rejects.toThrow(ListenerManifestError);
  });

  it('should write the manifests, and report none stale afterwards', async () => {
    await generator().write();

    expect(await readFile(path.join(repo, 'app/api/listeners.generated.ts'), 'utf8')).toBe(
      (await generator().generate()).get('app/api/listeners.generated.ts')
    );
    expect(await generator().stale()).toEqual([]);
  });

  it('should report a manifest as stale when a listener was added after writing', async () => {
    await generator().write();
    await write('app/api/core/listeners/CListener.ts', listenerSource('CListener'));
    await write('app/api/core/factories/CListenerFactory.ts', factorySource('CListener'));

    expect(await generator().stale()).toEqual(['app/api/listeners.generated.ts']);
  });
});
