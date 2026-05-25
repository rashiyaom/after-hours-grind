const BRAND = {
  name: "THE afterhour socials",
  bg: "#050505",
  card: "#0D0D0D",
  text: "#EFEFEF",
  muted: "#9A9A9A",
  accent: "#4DD2FF",
  accentAlt: "#C9F85A",
};

const shell = (title: string, subtitle: string, contentHtml: string): string => `
  <div style="margin:0;padding:0;background:${BRAND.bg};font-family:Inter,Segoe UI,Arial,sans-serif;color:${BRAND.text};">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${BRAND.bg};padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:${BRAND.card};border:1px solid #1C1C1C;border-radius:16px;overflow:hidden;">
            <tr>
              <td style="padding:24px 24px 10px 24px;border-bottom:1px solid #1C1C1C;">
                <div style="font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:${BRAND.accent};font-weight:700;">${BRAND.name}</div>
                <h1 style="margin:10px 0 0 0;font-size:24px;line-height:1.3;color:${BRAND.text};">${title}</h1>
                <p style="margin:8px 0 0 0;color:${BRAND.muted};font-size:14px;">${subtitle}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:24px;">
                ${contentHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:16px 24px;border-top:1px solid #1C1C1C;color:${BRAND.muted};font-size:12px;">
                SPORTS -MADE SOCIAL
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </div>
`;

export const buildPasswordResetEmailHtml = (resetLink: string): string =>
  shell(
    "Reset Your Password",
    "No fluff. Just secure access recovery.",
    `
      <p style="margin:0 0 16px 0;color:${BRAND.text};font-size:14px;line-height:1.7;">
        We received a request to reset your password.
      </p>
      <p style="margin:0 0 22px 0;color:${BRAND.text};font-size:14px;line-height:1.7;">
        Use the button below. This link expires soon for security.
      </p>
      <a href="${resetLink}" style="display:inline-block;background:${BRAND.accent};color:#081018;text-decoration:none;font-weight:700;font-size:14px;padding:12px 18px;border-radius:10px;">Reset Password</a>
      <p style="margin:18px 0 0 0;color:${BRAND.muted};font-size:12px;line-height:1.6;">
        If you did not request this, ignore this email and your account remains unchanged.
      </p>
    `
  );

export const buildPasswordResetCodeEmailHtml = (code: string): string =>
  shell(
    "Verify Password Reset",
    "Enter this verification code to continue.",
    `
      <p style="margin:0 0 16px 0;color:${BRAND.text};font-size:14px;line-height:1.7;">
        Use this code to verify your password reset request:
      </p>
      <div style="display:inline-block;padding:10px 14px;border-radius:10px;border:1px solid #1F1F1F;background:#101010;color:${BRAND.accent};font-size:20px;letter-spacing:0.18em;font-weight:700;">
        ${code}
      </div>
      <p style="margin:18px 0 0 0;color:${BRAND.muted};font-size:12px;line-height:1.6;">
        If you did not request this, you can ignore this email.
      </p>
    `
  );

export const buildLoginAlertEmailHtml = (name: string): string =>
  shell(
    "THE afterhour socials login alert",
    "A sign-in just happened on your account.",
    `
      <p style="margin:0 0 16px 0;color:${BRAND.text};font-size:14px;line-height:1.7;">
        Hi ${name},
      </p>
      <p style="margin:0 0 18px 0;color:${BRAND.text};font-size:14px;line-height:1.7;">
        Your account has just signed in successfully on <strong style="color:${BRAND.accent};">THE afterhour socials</strong>.
      </p>
      <div style="padding:12px 14px;background:#111;border:1px solid #1F1F1F;border-radius:10px;color:${BRAND.muted};font-size:12px;line-height:1.6;">
        If this was not you, reset your password immediately.
      </div>
      <p style="margin:16px 0 0 0;color:${BRAND.accentAlt};font-size:12px;line-height:1.6;font-weight:700;">
        THE afterhour socials • Security update
      </p>
    `
  );

export const buildWelcomeEmailHtml = (name: string): string =>
  shell(
    "Welcome to THE afterhour socials",
    "Your account is live. Let us get to work.",
    `
      <p style="margin:0 0 16px 0;color:${BRAND.text};font-size:14px;line-height:1.7;">
        Hi ${name},
      </p>
      <p style="margin:0 0 18px 0;color:${BRAND.text};font-size:14px;line-height:1.7;">
        Your account has been created successfully. You can now sign in and start your journey.
      </p>
      <div style="padding:12px 14px;background:#111;border:1px solid #1F1F1F;border-radius:10px;color:${BRAND.muted};font-size:12px;line-height:1.6;">
        Keep your password private and use the forgot password flow anytime you need account recovery.
      </div>
      <p style="margin:16px 0 0 0;color:${BRAND.accentAlt};font-size:12px;line-height:1.6;font-weight:700;">
        Welcome aboard.
      </p>
    `
  );
