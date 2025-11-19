export type Callbacks = {
  onStart: (info: { importId: string }) => void;
  onSuccess: (info: { importId: string }) => void;
  onError: (info: { importId: string; error: Error }) => void;
};
