import fs from 'fs';
import path from 'path';
import ts from 'typescript';

type Allowed = {
  /** Paths relative to the repository root, ending with a slash. */
  directories: string[];
  files: string[];
  packages: string[];
};

/** Each chain runs from the entry to the first module that is not allowed. */
type Violation = string[];

const importSpecifiers =
  /(?:import|export)\s[^'"]*?from\s*['"]([^'"]+)['"]|import\s*['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)/g;

/**
 * The modules a file loads at runtime, followed transitively. Each file is transpiled first, so
 * imports used only as types are erased the way the bundler erases them.
 */
class RuntimeImportGraph {
  private readonly edges = new Map<string, string[]>();

  private constructor(
    private readonly root: string,
    private readonly entry: string,
    private readonly options: ts.CompilerOptions
  ) {}

  static from(root: string, entry: string) {
    const config = ts.getParsedCommandLineOfConfigFile(
      path.join(root, 'tsconfig.json'),
      {},
      {
        ...ts.sys,
        onUnRecoverableConfigFileDiagnostic: diagnostic => {
          throw new Error(ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'));
        },
      }
    );

    const graph = new RuntimeImportGraph(root, entry, config!.options);
    graph.load(entry);
    return graph;
  }

  violations(allowed: Allowed): Violation[] {
    const found: Violation[] = [];
    const visited = new Set<string>();

    const visit = (module: string, chain: string[]) => {
      if (visited.has(module)) return;
      visited.add(module);

      (this.edges.get(module) ?? []).forEach(next => {
        if (!RuntimeImportGraph.isAllowed(next, allowed)) {
          found.push([...chain, next]);
          return;
        }
        visit(next, [...chain, next]);
      });
    };

    visit(this.entry, [this.entry]);
    return found;
  }

  private static isAllowed(module: string, { directories, files, packages }: Allowed) {
    return (
      packages.includes(module) ||
      files.includes(module) ||
      directories.some(directory => module.startsWith(directory))
    );
  }

  private load(module: string) {
    if (this.edges.has(module)) return;

    const fileName = path.join(this.root, module);
    const { outputText } = ts.transpileModule(fs.readFileSync(fileName, 'utf8'), {
      fileName,
      compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
    });

    const imports = [...outputText.matchAll(importSpecifiers)]
      .map(match => match[1] ?? match[2] ?? match[3])
      .map(specifier => this.resolve(specifier, fileName));

    this.edges.set(module, imports);

    imports.filter(next => this.isSourceFile(next)).forEach(next => this.load(next));
  }

  /** A path relative to the root for a source file, or the bare specifier for anything else. */
  private resolve(specifier: string, fromFile: string) {
    const { resolvedModule } = ts.resolveModuleName(specifier, fromFile, this.options, ts.sys);

    if (!resolvedModule || resolvedModule.isExternalLibraryImport) return specifier;

    return path.relative(this.root, resolvedModule.resolvedFileName);
  }

  private isSourceFile(module: string) {
    return !module.endsWith('.d.ts') && fs.existsSync(path.join(this.root, module));
  }
}

export { RuntimeImportGraph };
