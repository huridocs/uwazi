export interface Transactional<ContextType> {
  setTransactionContext(session: ContextType): void;
}
