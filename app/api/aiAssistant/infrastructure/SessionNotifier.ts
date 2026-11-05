import { emitToSession } from '#api/socketio/setupSockets.js';
import type { AIAssistantNotifier } from '../application/contracts/AIAssistantNotifier.js';

class SessionNotifier implements AIAssistantNotifier {
  constructor(private sessionId?: string) {}

  reply(payload: Parameters<AIAssistantNotifier['reply']>[0]) {
    this.emit('aiAssistant:reply', payload);
  }

  progress(payload: Parameters<AIAssistantNotifier['progress']>[0]) {
    this.emit('aiAssistant:progress', payload);
  }

  error(payload: Parameters<AIAssistantNotifier['error']>[0]) {
    this.emit('aiAssistant:error', payload);
  }

  toolConfirm(payload: Parameters<AIAssistantNotifier['toolConfirm']>[0]) {
    this.emit('aiAssistant:tool_confirm', payload);
  }

  toolActivity(payload: Parameters<AIAssistantNotifier['toolActivity']>[0]) {
    this.emit('aiAssistant:tool_activity', payload);
  }

  private emit(event: string, payload: object) {
    if (this.sessionId) {
      emitToSession(this.sessionId, event, payload);
    }
  }
}

export { SessionNotifier };
