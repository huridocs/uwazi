export interface UseCase<Input, Output> {
  execute(input: Input, ...args: any): Promise<Output>;
}
