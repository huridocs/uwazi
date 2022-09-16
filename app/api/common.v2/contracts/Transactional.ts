export interface Transactional<ContextType> {
  setTransactionContext(context: ContextType): void;

  clearTransactionContext(): void;
}
