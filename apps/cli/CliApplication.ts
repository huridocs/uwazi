import type { Writable } from 'stream';
import yargs, { Argv } from 'yargs';
import { config } from '#api/config.js';
import { ErrorMapper } from './errors/ErrorMapper.js';
import { ExitCode } from './errors/ExitCode.js';
import { UsageError } from './errors/UsageError.js';
import { Presenter } from './output/Presenter.js';
import { AuditMiddleware } from './pipeline/AuditMiddleware.js';
import type { CliContext } from './pipeline/CliContext.js';
import { Pipeline } from './pipeline/Pipeline.js';
import { ControllerMiddleware } from './routing/ControllerMiddleware.js';
import type { CliArgv, Route } from './routing/Route.js';
import { CliConfig, Env } from './runtime/CliConfig.js';
import { CliConnections, ConnectionNeeds } from './runtime/CliConnections.js';
import { ConsoleRedirect } from './runtime/ConsoleRedirect.js';
import { InterruptGuard } from './runtime/InterruptGuard.js';

type Connections = {
  open(needs: ConnectionNeeds): Promise<void>;
  close(): Promise<void>;
};

type CliApplicationOptions = {
  routes: Route[];
  connections?: Connections;
  stdout?: Writable;
  stderr?: Writable;
  env?: Env;
};

/**
 * The `uwazi` binary: parses the command line and runs one route through the pipeline. Owns
 * the per-command lifecycle, so routes only map input to a use case.
 */
class CliApplication {
  private readonly routes: Route[];

  private readonly connections: Connections;

  private readonly stdout?: Writable;

  private readonly stderr?: Writable;

  private readonly env: Env;

  constructor({
    routes,
    connections = CliConnections,
    stdout,
    stderr,
    env,
  }: CliApplicationOptions) {
    this.routes = routes;
    this.connections = connections;
    this.stdout = stdout;
    this.stderr = stderr;
    this.env = env ?? process.env;
  }

  async run(argv: string[]): Promise<ExitCode> {
    let exitCode = ExitCode.Ok;

    try {
      await this.parser(argv, code => {
        exitCode = code;
      }).parseAsync();
    } catch (error) {
      const presenter = this.presenter(argv.includes('--json'), argv.includes('--verbose'));
      presenter.error(ErrorMapper.toPayload(error, {}), error);
      return ErrorMapper.toExitCode(error);
    }

    return exitCode;
  }

  private parser(argv: string[], onExit: (code: ExitCode) => void): Argv {
    const parser = yargs(argv)
      .scriptName('uwazi')
      .usage('$0 <command>')
      .option('json', { type: 'boolean', default: false, describe: 'Machine-readable output' })
      .option('verbose', { type: 'boolean', default: false, describe: 'Print stack traces' })
      .demandCommand(1, 'Choose a command')
      .strict()
      .help()
      .version(config.VERSION)
      .exitProcess(false)
      .fail((message, error) => {
        throw error ?? new UsageError(message);
      });

    return this.registerRoutes(parser, onExit);
  }

  private registerRoutes(parser: Argv, onExit: (code: ExitCode) => void): Argv {
    // Reached only when no known command matched: with no routes registered, yargs would
    // otherwise accept any word as a positional argument and exit successfully.
    parser.command(
      '$0',
      false,
      noOptions => noOptions,
      () => {
        throw new UsageError('Choose a command');
      }
    );

    this.groups().forEach((routes, group) => {
      parser.command(group, `Manage ${group}`, groupParser => {
        routes.forEach(route => {
          groupParser.command(route.name, route.describe, route.options, async args => {
            onExit(await this.execute(route, args));
          });
        });
        return groupParser.demandCommand(1, `Choose a ${group} command`);
      });
    });

    return parser;
  }

  private async execute(route: Route, argv: CliArgv): Promise<ExitCode> {
    const presenter = this.presenter(Boolean(argv.json), Boolean(argv.verbose));

    return this.guarded(async () => {
      try {
        presenter.result(await this.handle(route, argv));
        return ExitCode.Ok;
      } catch (error) {
        presenter.error(ErrorMapper.toPayload(error, route.fieldMap), error);
        return ErrorMapper.toExitCode(error);
      }
    });
  }

  /**
   * Process-level concerns around one command: console output kept off stdout, Ctrl-C
   * handled, and connections always closed so the process can exit.
   */
  private async guarded<R>(fn: () => Promise<R>): Promise<R> {
    const redirect = new ConsoleRedirect();
    const guard = new InterruptGuard(async () => this.connections.close());

    redirect.redirectToStderr();
    guard.listen();

    try {
      return await fn();
    } finally {
      await this.connections.close();
      guard.stop();
      redirect.restore();
    }
  }

  /** Input and configuration are checked before anything connects. */
  private async handle(route: Route, argv: CliArgv): Promise<unknown> {
    const input = route.toInput(argv);
    CliConfig.assertRequired(CliConfig.requiredFor(route.needs, this.env), this.env);
    await this.connections.open(route.needs);

    const context: CliContext = {
      route: `${route.group} ${route.name}`,
      input,
      json: Boolean(argv.json),
    };
    await new Pipeline([new AuditMiddleware(), new ControllerMiddleware(route)]).run(context);

    return context.result;
  }

  private groups(): Map<string, Route[]> {
    return this.routes.reduce(
      (groups, route) => groups.set(route.group, [...(groups.get(route.group) ?? []), route]),
      new Map<string, Route[]>()
    );
  }

  private presenter(json: boolean, verbose: boolean): Presenter {
    return new Presenter({ json, verbose, stdout: this.stdout, stderr: this.stderr });
  }
}

export { CliApplication };
export type { CliApplicationOptions, Connections };
