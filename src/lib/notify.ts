// Centralised outbound-message helper. Today every send is a stub that just
// records a row in the Notification table; swapping in MSG91 / SES / FCM /
// Twilio later means changing only the bodies of these functions.
//
// All functions intentionally swallow errors — a notification-logging failure
// must never break the underlying business flow (OTP issuance, payout, etc).

import { prisma } from "./db";
import type {
  NotificationChannel,
  NotificationStatus,
} from "../../generated/prisma";

type LogArgs = {
  channel: NotificationChannel;
  recipient: string;
  template: string;
  body: string;
  context?: string;
  status?: NotificationStatus;
  error?: string;
};

async function logNotification(args: LogArgs): Promise<void> {
  try {
    await prisma.notification.create({
      data: {
        channel: args.channel,
        recipient: args.recipient,
        template: args.template,
        body: args.body,
        context: args.context,
        status: args.status ?? "SENT",
        error: args.error,
      },
    });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("[notify] failed to log notification:", e);
  }
}

export async function sendSms(
  recipient: string,
  template: string,
  body: string,
  context?: string
): Promise<void> {
  // TODO: integrate MSG91 / Twilio. For now: log only.
  await logNotification({ channel: "SMS", recipient, template, body, context });
}

export async function sendEmail(
  recipient: string,
  template: string,
  body: string,
  context?: string
): Promise<void> {
  // TODO: integrate SES / SendGrid.
  await logNotification({ channel: "EMAIL", recipient, template, body, context });
}

export async function sendPush(
  recipient: string,
  template: string,
  body: string,
  context?: string
): Promise<void> {
  // TODO: integrate FCM / APNs.
  await logNotification({ channel: "PUSH", recipient, template, body, context });
}

export async function sendWhatsapp(
  recipient: string,
  template: string,
  body: string,
  context?: string
): Promise<void> {
  // TODO: integrate WhatsApp Business API.
  await logNotification({ channel: "WHATSAPP", recipient, template, body, context });
}
