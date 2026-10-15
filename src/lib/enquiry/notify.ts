// Enquiry notifications (PRD §10). The visitor's address is used as Reply-To, never as the sender.
import type { Enquiry } from './store.ts';

export interface Notifier {
  /** Tell the owner about a new enquiry. Throws on failure so the caller can retry later. */
  notifyOwner(enquiry: Enquiry): Promise<void>;
  /** Short receipt to the visitor. Sent at most once per enquiry, with no response-time promise. */
  acknowledge(enquiry: Enquiry): Promise<void>;
  /** Operational alert to the owner and backup, e.g. after repeated delivery failure. No message contents. */
  alert(subject: string, text: string): Promise<void>;
}

export interface NotifyConfig {
  provider: 'log' | 'resend';
  from: string;
  to: string[];
  backupTo: string[];
  resendApiKey?: string;
  siteName: string;
}

const oneLine = (s: string) => s.replace(/[\r\n]+/g, ' ').slice(0, 120);

export function ownerEmail(e: Enquiry, siteName: string) {
  return {
    subject: oneLine(`Website enquiry from ${e.name}`),
    text: [
      `New enquiry received through the ${siteName} website.`,
      '',
      `Name: ${e.name}`,
      `Email: ${e.email}`,
      `Phone: ${e.phone || 'not given'}`,
      `Received: ${new Date(e.createdAt).toUTCString()}`,
      `Reference: ${e.id}`,
      '',
      'Message:',
      e.message,
      '',
      'Reply to this email to answer the visitor directly.',
    ].join('\n'),
  };
}

export function acknowledgementEmail(e: Enquiry, siteName: string) {
  return {
    subject: `We received your enquiry: ${siteName}`,
    text: [
      `Dear ${e.name},`,
      '',
      `Thank you for getting in touch. Your enquiry has been received.`,
      '',
      `Reference: ${e.id}`,
      '',
      `${siteName}`,
    ].join('\n'),
  };
}

/** Development notifier: records that a notification would be sent, without logging message contents. */
export class LogNotifier implements Notifier {
  public sent: { kind: string; id?: string }[] = [];
  async notifyOwner(e: Enquiry) {
    this.sent.push({ kind: 'owner', id: e.id });
    console.info(`[enquiry] owner notification (log provider) for ${e.id}`);
  }
  async acknowledge(e: Enquiry) {
    this.sent.push({ kind: 'ack', id: e.id });
    console.info(`[enquiry] acknowledgement (log provider) for ${e.id}`);
  }
  async alert(subject: string, text: string) {
    this.sent.push({ kind: 'alert' });
    console.error(`[enquiry] ALERT: ${subject}\n${text}`);
  }
}

/** Resend (https://resend.com) over its HTTPS API. Swappable for another provider behind the same interface. */
export class ResendNotifier implements Notifier {
  private cfg: NotifyConfig;

  constructor(cfg: NotifyConfig) {
    this.cfg = cfg;
    if (!cfg.resendApiKey) throw new Error('RESEND_API_KEY is not set');
    if (!cfg.to.length) throw new Error('NOTIFY_TO is not set');
  }

  private async send(body: Record<string, unknown>) {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.cfg.resendApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: this.cfg.from, ...body }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) throw new Error(`Email provider responded ${res.status}`);
  }

  async notifyOwner(e: Enquiry) {
    const { subject, text } = ownerEmail(e, this.cfg.siteName);
    await this.send({ to: this.cfg.to, reply_to: e.email, subject, text });
  }
  async acknowledge(e: Enquiry) {
    const { subject, text } = acknowledgementEmail(e, this.cfg.siteName);
    await this.send({ to: [e.email], reply_to: this.cfg.to[0], subject, text });
  }
  async alert(subject: string, text: string) {
    const to = [...new Set([...this.cfg.to, ...this.cfg.backupTo])];
    await this.send({ to, subject: oneLine(subject), text });
  }
}

export function createNotifier(cfg: NotifyConfig): Notifier {
  return cfg.provider === 'resend' ? new ResendNotifier(cfg) : new LogNotifier();
}
