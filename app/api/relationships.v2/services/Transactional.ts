export interface Transactional<ContextType> {
  setTransactionContext(context: ContextType): void;
}
