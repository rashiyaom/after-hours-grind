import nodemailer from "nodemailer";
import { env } from "../config/env.js";
import { buildLoginAlertEmailHtml, buildPasswordResetCodeEmailHtml, buildPasswordResetEmailHtml, buildWelcomeEmailHtml } from "./emailTemplates.js";

const smtpHost = env.SMTP_HOST?.trim();
const smtpUser = env.SMTP_USER?.trim();
const smtpPass = env.SMTP_PASS?.trim();

export const isMailerConfigured = Boolean(smtpHost && smtpUser && smtpPass);

let cachedTransporter: nodemailer.Transporter | null = null;

const getTransporter = (): nodemailer.Transporter => {
  if (!isMailerConfigured) {
    throw new Error("SMTP is not configured");
  }

  if (!cachedTransporter) {
    cachedTransporter = nodemailer.createTransport({
      host: smtpHost,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });
  }

  return cachedTransporter;
};

export async function sendPasswordResetEmail(email: string, resetLink: string): Promise<void> {
  const transporter = getTransporter();
  await transporter.sendMail({
    from: env.MAIL_FROM,
    to: email,
    subject: "Reset your password",
    text: `You requested a password reset. Open this link to continue: ${resetLink}\n\nIf you did not request this, you can ignore this email.`,
    html: buildPasswordResetEmailHtml(resetLink),
  });
}

export async function sendPasswordResetCodeEmail(email: string, code: string): Promise<void> {
  const transporter = getTransporter();
  await transporter.sendMail({
    from: env.MAIL_FROM,
    to: email,
    subject: "Your password reset verification code",
    text: `Your password reset verification code is: ${code}`,
    html: buildPasswordResetCodeEmailHtml(code),
  });
}

export async function sendLoginAlertEmail(email: string, name: string): Promise<void> {
  const transporter = getTransporter();
  await transporter.sendMail({
    from: env.MAIL_FROM,
    to: email,
    subject: "[THE afterhour socials] New sign-in detected",
    text: `Hi ${name}, your account has just signed in on THE afterhour socials. If this wasn't you, reset your password right away.`,
    html: buildLoginAlertEmailHtml(name),
  });
}

export async function sendWelcomeEmail(email: string, name: string): Promise<void> {
  const transporter = getTransporter();
  await transporter.sendMail({
    from: env.MAIL_FROM,
    to: email,
    subject: "Welcome to THE afterhour socials",
    text: `Hi ${name}, your account was created successfully. Welcome to THE afterhour socials.`,
    html: buildWelcomeEmailHtml(name),
  });
}
