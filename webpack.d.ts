interface ImportMeta {
  readonly webpackHot?: {
    accept: (dependencies: string | string[], callback?: (updatedModules: any[]) => void) => void;
    decline: (dependencies?: string | string[]) => void;
    dispose: (callback: (data: any) => void) => void;
    addDisposeHandler: (callback: (data: any) => void) => void;
    removeDisposeHandler: (callback: (data: any) => void) => void;
    invalidate: () => void;
    status: () => 'idle' | 'check' | 'prepare' | 'ready' | 'dispose' | 'apply' | 'abort' | 'fail';
    addStatusHandler: (callback: (status: string) => void) => void;
    removeStatusHandler: (callback: (status: string) => void) => void;
  };
}
