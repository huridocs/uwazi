export interface QueueMessage {
  id: string;
  message: string;
}

export interface QueueAdapter {
  createQueueAsync(options: { qname: string; vt: number }): Promise<1>;
  changeMessageVisibilityAsync(options: { qname: string; id: string; vt: number }): Promise<0 | 1>;
  deleteMessageAsync(options: { qname: string; id: string }): Promise<0 | 1>;
  receiveMessageAsync(options: { qname: string }): Promise<QueueMessage | {}>;
  sendMessageAsync(options: { qname: string; message: string }): Promise<string>;
}
