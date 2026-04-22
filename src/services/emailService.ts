import sgMail from '@sendgrid/mail';
import logger from '../utils/logger';

sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');

const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'team@tryclarityapp.live';
const FROM_NAME = 'Clarity';

export const sendTeamInvite = async (
  memberEmail: string,
  memberName: string,
  leaderName: string,
  teamGoal: string,
  inviteLink: string
): Promise<void> => {
  const msg = {
    to: memberEmail,
    from: {
      email: FROM_EMAIL,
      name: FROM_NAME
    },
    subject: `${leaderName} invited you to a Clarity alignment check`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
        <div style="max-width:560px;margin:40px auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          
          <!-- Header -->
          <div style="background:linear-gradient(135deg,#4A90E2,#357ABD);padding:32px;text-align:center;">
            <h1 style="margin:0;color:white;font-size:28px;font-weight:700;letter-spacing:-0.5px;">✨ Clarity</h1>
            <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">Team Alignment Check</p>
          </div>

          <!-- Body -->
          <div style="padding:32px;">
            <h2 style="margin:0 0 8px;color:#1a1a2e;font-size:22px;">Hi ${memberName} 👋</h2>
            <p style="margin:0 0 24px;color:#64748b;font-size:16px;line-height:1.6;">
              <strong style="color:#1a1a2e;">${leaderName}</strong> has invited you to complete a quick alignment check for your team.
            </p>

            <!-- Goal Card -->
            <div style="background:#f0f7ff;border-left:4px solid #4A90E2;border-radius:8px;padding:16px 20px;margin-bottom:28px;">
              <p style="margin:0 0 4px;color:#4A90E2;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Team Goal</p>
              <p style="margin:0;color:#1a1a2e;font-size:16px;line-height:1.5;font-weight:500;">${teamGoal}</p>
            </div>

            <p style="margin:0 0 24px;color:#64748b;font-size:15px;line-height:1.6;">
              It takes less than 2 minutes. Share your understanding of the goal and get an instant AI alignment score.
            </p>

            <!-- CTA Button -->
            <div style="text-align:center;margin-bottom:28px;">
              <a href="${inviteLink}" 
                style="display:inline-block;background:linear-gradient(135deg,#4A90E2,#357ABD);color:white;text-decoration:none;padding:16px 40px;border-radius:12px;font-size:16px;font-weight:700;letter-spacing:0.3px;">
                Start Alignment Check →
              </a>
            </div>

            <p style="margin:0;color:#94a3b8;font-size:13px;text-align:center;">
              Or copy this link: <a href="${inviteLink}" style="color:#4A90E2;">${inviteLink}</a>
            </p>
          </div>

          <!-- Footer -->
          <div style="background:#f8fafc;padding:20px 32px;border-top:1px solid #e2e8f0;text-align:center;">
            <p style="margin:0;color:#94a3b8;font-size:12px;">
              Sent by Clarity • AI-powered team alignment
              <br>
              <a href="https://tryclarityapp.live" style="color:#4A90E2;">tryclarityapp.live</a>
            </p>
          </div>

        </div>
      </body>
      </html>
    `
  };

  try {
    await sgMail.send(msg);
    logger.info('Invite email sent', { to: memberEmail });
  } catch (error: any) {
    logger.error('SendGrid error', { message: error.message });
    throw new Error('Failed to send invite email. Please try again.');
  }
};

export const sendBulkInvites = async (
  members: Array<{ email: string; name: string }>,
  leaderName: string,
  teamGoal: string,
  inviteLink: string
): Promise<{ sent: number; failed: number }> => {
  let sent = 0;
  let failed = 0;

  for (const member of members) {
    try {
      await sendTeamInvite(
        member.email,
        member.name,
        leaderName,
        teamGoal,
        inviteLink
      );
      sent++;
    } catch (error) {
      failed++;
      logger.error('Failed to send invite', { email: member.email });
    }
  }

  return { sent, failed };
};