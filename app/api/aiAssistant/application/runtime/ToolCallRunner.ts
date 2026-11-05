import type { AIAssistantNotifier } from '../contracts/AIAssistantNotifier.js';
import type { LlmChatMessage, LlmToolCall } from '../contracts/LlmProvider.js';
import type { AssistantTool, ToolContext } from '../tools/Tool.js';
import { toJsonSafe } from '../tools/serialize.js';
import type { ConfirmationDecision, ConfirmationGate } from './ConfirmationGate.js';
import { runSequentially } from './runSequentially.js';

type ToolCallRunnerDependencies = {
  toolsByName: Map<string, AssistantTool>;
  confirmationGate: ConfirmationGate;
  notifier: AIAssistantNotifier;
};

type RunAllInput = {
  calls: LlmToolCall[];
  ctx: ToolContext;
  jobId: string;
  sessionId?: string;
};

type RunOneInput = {
  call: LlmToolCall;
  ctx: ToolContext;
  jobId: string;
  sessionId?: string;
};

class ToolCallRunner {
  constructor(private deps: ToolCallRunnerDependencies) {}

  async runAll(input: RunAllInput): Promise<LlmChatMessage[]> {
    return runSequentially(input.calls, async call => {
      const content = await this.runOne({
        call,
        ctx: input.ctx,
        jobId: input.jobId,
        sessionId: input.sessionId,
      });
      return {
        role: 'tool' as const,
        tool_call_id: call.id,
        name: call.name,
        content,
      };
    });
  }

  private async runOne(input: RunOneInput): Promise<string> {
    const tool = this.deps.toolsByName.get(input.call.name);
    if (!tool) {
      return JSON.stringify({ error: `Unknown tool: ${input.call.name}` });
    }
    if (tool.adminOnly && input.ctx.actor.role !== 'admin') {
      return JSON.stringify({ error: 'This action requires an admin user' });
    }

    const denied = await this.confirmWrite(tool, input);
    if (denied) {
      return denied;
    }

    return this.invoke(tool, input);
  }

  private async confirmWrite(tool: AssistantTool, input: RunOneInput): Promise<string | null> {
    if (
      tool.sideEffect !== 'write' ||
      this.deps.confirmationGate.shouldSkipSession(input.sessionId)
    ) {
      return null;
    }

    this.deps.notifier.toolConfirm({
      jobId: input.jobId,
      toolCallId: input.call.id,
      toolName: tool.name,
      description: tool.description,
      arguments: input.call.arguments,
    });

    return this.afterDecision(
      await this.deps.confirmationGate.wait(input.jobId, input.call.id),
      input.sessionId
    );
  }

  private afterDecision(decision: ConfirmationDecision, sessionId?: string): string | null {
    if (decision === 'no') {
      return JSON.stringify({ error: 'The user declined this action' });
    }
    if (decision === 'yes_dont_ask' && sessionId) {
      this.deps.confirmationGate.skipForSession(sessionId);
    }
    return null;
  }

  private async invoke(tool: AssistantTool, input: RunOneInput): Promise<string> {
    this.markActivity(input, 'started');
    try {
      const result = await tool.execute(input.call.arguments, input.ctx);
      this.markActivity(input, 'finished');
      return JSON.stringify(toJsonSafe(result));
    } catch (error) {
      this.markActivity(input, 'finished');
      return JSON.stringify({
        error: error instanceof Error ? error.message : 'Tool failed',
      });
    }
  }

  private markActivity(input: RunOneInput, status: 'started' | 'finished') {
    this.deps.notifier.toolActivity({
      jobId: input.jobId,
      toolName: input.call.name,
      status,
    });
  }
}

export { ToolCallRunner };
