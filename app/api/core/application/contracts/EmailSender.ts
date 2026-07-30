type EmailMessage = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

interface EmailSender {
  send(message: EmailMessage): Promise<void>;
}

export type { EmailSender, EmailMessage };
