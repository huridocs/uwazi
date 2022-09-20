export interface Transactional<ContextType = unknown> {
  setTransactionContext(context: ContextType): void;
  clearTransactionContext(): void;
}
