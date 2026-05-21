import { SyncHandler } from './SyncHandler.js';

type HandlerFactory = () => SyncHandler;

export class SyncHandlerRegistry {
  private static readonly handlers = new Map<string, HandlerFactory>();

  static register(namespace: string, factory: HandlerFactory): void {
    this.handlers.set(namespace, factory);
  }

  static get(namespace: string): SyncHandler | undefined {
    return this.handlers.get(namespace)?.();
  }

  static has(namespace: string): boolean {
    return this.handlers.has(namespace);
  }
}
