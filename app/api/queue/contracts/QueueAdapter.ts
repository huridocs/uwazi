export interface QueueMessage {
  id: string;
  message: string;
}

export interface QueueAdapter {
  changeMessageVisibilityAsync(options: { qname: string; id: string; vt: number }): Promise<void>;
  deleteMessageAsync(options: { qname: string; id: string }): Promise<void>;
  receiveMessageAsync(options: { qname: string }): Promise<QueueMessage | {}>;
  sendMessageAsync(options: { qname: string; message: string }): Promise<string>;
}
