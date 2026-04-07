/**
 * Email templates for Samjho AI accessibility platform
 * All templates use inline CSS for email client compatibility.
 * Design: dark theme matching the web app (slate backgrounds, cyan accents).
 */

/* ── shared styles ─────────────────────────────────────────────────────── */
const fontFamily =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', sans-serif";
const bgColor = '#08080a';
const cardBg = '#16161d';
const cardBorder = '#2a2a35';
const accentColor = '#00e5ff';
const accentSecondary = '#3b82f6';
const textColor = '#e2e2e2';
const mutedTextColor = '#6b6b7b';

function css(name: string) {
  const m: Record<string, string> = {
    fontFamily, fontSize: '', fontWeight: '', color: '', lineHeight: '',
    letterSpacing: '', textTransform: '', wordBreak: '', textAlign: '',
  };
  return name;
}

function baseLayout(title: string, bodyHtml: string, footerExtra?: string): string {
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${title}</title>
  <!--[if !mso]><!-->
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <!--<![endif]-->
  <style type="text/css">
    @media only screen and (max-width: 600px) {
      .mobile-pad { padding-left: 20px !important; padding-right: 20px !important; }
    }
  </style>
</head>
<body style="margin:0; padding:0; background-color:${bgColor}; width:100%; min-height:100%; font-family:${fontFamily}">
  <div style="display:none;font-size:1px;color:${bgColor};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${title}</div>

  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:${bgColor};">
    <tr>
      <td align="center" style="padding: 32px 16px 48px;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:540px; margin:0 auto;">

          <!-- Header / Brand -->
          <tr>
            <td align="center" style="padding-bottom: 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding-bottom: 8px;">
                    <div style="width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg,${accentColor},${accentSecondary});opacity:0.9;"></div>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="font-family:${fontFamily}; font-size:22px; font-weight:600; color:#ffffff; letter-spacing:-0.5px;">
                    Samjho AI
                  </td>
                </tr>
                <tr>
                  <td align="center" style="font-family:${fontFamily}; font-size:12px; color:${mutedTextColor}; letter-spacing:1px; text-transform:uppercase; padding-top:2px;">
                    Accessibility Platform
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="border-radius:16px; overflow:hidden; border:1px solid ${cardBorder}; background-color:${cardBg};">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <!-- Top accent bar -->
                <tr>
                  <td style="height:3px; background:linear-gradient(90deg,${accentColor},${accentSecondary},${accentColor});"></td>
                </tr>
                <!-- Body -->
                <tr>
                  <td class="mobile-pad" style="padding: 32px 36px;">
                    ${bodyHtml}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Divider -->
          <tr><td style="height:24px; line-height:24px; font-size:24px;">&nbsp;</td></tr>

          <!-- Footer -->
          <tr>
            <td align="center">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="font-family:${fontFamily}; font-size:11px; color:${mutedTextColor}; line-height:18px; text-align:center;">
                    ${footerExtra || ''}
                    <br />
                    &copy; ${new Date().getFullYear()} Samjho AI. All rights reserved.
                    <br />
                    If you did not request this email, please ignore it &mdash; no action is needed.
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/* ── Building blocks ───────────────────────────────────────────────────── */
function ctaButton(href: string, label: string): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="border-radius:10px; background:linear-gradient(135deg,${accentColor},${accentSecondary});">
          <a href="${href}" target="_blank"
             style="display:inline-block; padding:14px 36px; font-family:${fontFamily}; font-size:15px; font-weight:600; color:#050507; text-decoration:none; border-radius:10px; letter-spacing:0.3px;">
            ${label} &rarr;
          </a>
        </td>
      </tr>
    </table>`;
}

function heading(text: string): string {
  return `<h1 style="margin:0 0 10px; font-family:${fontFamily}; font-size:22px; font-weight:600; color:#ffffff; letter-spacing:-0.3px; line-height:1.3;">${text}</h1>`;
}

function pMain(text: string): string {
  return `<p style="margin:0 0 20px; font-family:${fontFamily}; font-size:15px; color:${textColor}; line-height:1.65;">${text}</p>`;
}

function pMuted(text: string): string {
  return `<p style="margin:0 0 12px; font-family:${fontFamily}; font-size:13px; color:${mutedTextColor}; line-height:1.5;">${text}</p>`;
}

function pFallback(href: string, label?: string): string {
  return `<p style="margin:24px 0 0; font-family:${fontFamily}; font-size:12px; color:${mutedTextColor}; word-break:break-all; line-height:1.5;">
    ${label || 'Or paste this link into your browser:'}<br/>
    <a href="${href}" style="color:${accentColor}; text-decoration:none;">${href}</a>
  </p>`;
}

/* ── Exported templates ──────────────────────────────────────────────────── */

/** Verification email — sent after registration */
export function verificationEmailTemplate(name: string, token: string, origin: string): string {
  const link = `${origin}/auth?verified=true&token=${token}`;
  const body =
    heading(`Welcome, ${name}!`) +
    pMain("You're one step away from accessing Samjho AI — the accessibility platform designed to break communication barriers.") +
    pMuted("Please verify your email address to unlock:") +
    ctaButton(link, 'Verify Email Address') +
    pFallback(link);

  return baseLayout(
    'Verify your email — Samjho AI',
    body,
    'Sent to your registered email address.'
  );
}

/** Password reset email */
export function passwordResetEmailTemplate(token: string, origin: string): string {
  const link = `${origin}/auth?reset=true&resetToken=${token}`;
  const body =
    heading('Reset your password') +
    pMain('We received a request to reset your Samjho AI account password. Click the button below to choose a new one.') +
    ctaButton(link, 'Reset Password') +
    pFallback(link) +
    pMain('This link will expire in 30 minutes. If you did not make this request, you can safely ignore this email.') +
    pMuted('For security, this password reset link can only be used once.');

  return baseLayout(
    'Reset your password — Samjho AI',
    body,
    'If you did not request a password reset, your account is still secure.'
  );
}

/** Dev console: pretty-print a link */
export function devVerificationLink(name: string, email: string, link: string, subject: string): string {
  const w = 62;
  const border = '='.repeat(w);
  return [
    border,
    `  Samjho AI — ${subject}`,
    border,
    `  Name : ${name}`,
    `  Email: ${email}`,
    ``,
    `  Link: ${link}`,
    border,
  ].join('\n');
}
