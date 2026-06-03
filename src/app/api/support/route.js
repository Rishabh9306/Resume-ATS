import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req) {
  try {
    const body = await req.json();
    const { type, userId, userEmail, page } = body;

    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const from = process.env.SMTP_FROM || 'noreply@resumeats.com';
    const to = 'gupta.rishabh0406@gmail.com';

    // Format the email body
    let subject = '';
    let htmlContent = '';

    if (type === 'feedback') {
      const { rating, message } = body;
      const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating);
      subject = `[Feedback] ${rating}/5 Rating from ${userEmail || 'Anonymous'}`;
      htmlContent = `
        <div style="font-family: sans-serif; padding: 24px; color: #1f2937; max-width: 600px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff;">
          <h2 style="color: #6c63ff; border-bottom: 2px solid #f3f4f6; padding-bottom: 12px; margin-top: 0; font-size: 20px;">⭐ New Feedback Recieved</h2>
          <table style="width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 14px;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; width: 140px; color: #4b5563;">Experience Rating:</td>
              <td style="padding: 8px 0; font-size: 16px; color: #fbbf24; font-weight: bold;">${stars} (${rating}/5)</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">User Email:</td>
              <td style="padding: 8px 0;"><a href="mailto:${userEmail || 'anonymous'}" style="color: #6c63ff; text-decoration: none;">${userEmail || 'anonymous'}</a></td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">User ID:</td>
              <td style="padding: 8px 0; font-family: monospace; font-size: 12px; color: #9ca3af;">${userId || 'anonymous'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">Source Page:</td>
              <td style="padding: 8px 0; color: #4b5563;">${page || 'unknown'}</td>
            </tr>
          </table>
          <div style="margin-top: 24px; padding: 16px; background-color: #f9fafb; border-left: 4px solid #6c63ff; border-radius: 4px;">
            <p style="margin: 0; font-weight: bold; color: #374151; font-size: 13px; margin-bottom: 6px;">Comments:</p>
            <p style="margin: 0; white-space: pre-wrap; line-height: 1.5; color: #4b5563; font-size: 14px;">
              ${message ? message : 'No comments provided.'}
            </p>
          </div>
          <div style="margin-top: 24px; font-size: 11px; color: #9ca3af; text-align: center; border-top: 1px solid #f3f4f6; padding-top: 12px;">
            Sent automatically by ResumeATS support integration.
          </div>
        </div>
      `;
    } else if (type === 'bug') {
      const { category, severity, description, steps, userAgent } = body;
      subject = `[Bug Report] [${severity}] ${category} from ${userEmail || 'Anonymous'}`;
      
      let severityColor = '#f59e0b'; // Medium (Amber)
      if (severity === 'Low') severityColor = '#10b981'; // Green
      if (severity === 'Critical') severityColor = '#ef4444'; // Red

      htmlContent = `
        <div style="font-family: sans-serif; padding: 24px; color: #1f2937; max-width: 600px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff;">
          <h2 style="color: #ef4444; border-bottom: 2px solid #f3f4f6; padding-bottom: 12px; margin-top: 0; font-size: 20px;">🐛 New Bug Report</h2>
          <table style="width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 14px;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; width: 140px; color: #4b5563;">Category:</td>
              <td style="padding: 8px 0; font-weight: bold; color: #374151;">${category}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">Severity:</td>
              <td style="padding: 8px 0;"><span style="background-color: ${severityColor}; color: white; padding: 3px 10px; border-radius: 9999px; font-weight: bold; font-size: 11px;">${severity}</span></td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">User Email:</td>
              <td style="padding: 8px 0;"><a href="mailto:${userEmail || 'anonymous'}" style="color: #6c63ff; text-decoration: none;">${userEmail || 'anonymous'}</a></td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">Source Page:</td>
              <td style="padding: 8px 0; color: #4b5563;">${page || 'unknown'}</td>
            </tr>
          </table>

          <div style="margin-top: 24px; padding: 16px; background-color: #fef2f2; border-left: 4px solid #ef4444; border-radius: 4px;">
            <p style="margin: 0; font-weight: bold; color: #991b1b; font-size: 13px; margin-bottom: 6px;">Description:</p>
            <p style="margin: 0; white-space: pre-wrap; line-height: 1.5; color: #7f1d1d; font-size: 14px;">
              ${description}
            </p>
          </div>

          ${steps ? `
          <div style="margin-top: 16px; padding: 16px; background-color: #f9fafb; border-left: 4px solid #4b5563; border-radius: 4px;">
            <p style="margin: 0; font-weight: bold; color: #374151; font-size: 13px; margin-bottom: 6px;">Steps to Reproduce:</p>
            <p style="margin: 0; white-space: pre-wrap; line-height: 1.5; color: #4b5563; font-size: 14px;">
              ${steps}
            </p>
          </div>
          ` : ''}

          <div style="margin-top: 20px; font-size: 11px; color: #9ca3af; word-break: break-all;">
            <strong>User Agent:</strong> ${userAgent || 'N/A'}
          </div>

          <div style="margin-top: 24px; font-size: 11px; color: #9ca3af; text-align: center; border-top: 1px solid #f3f4f6; padding-top: 12px;">
            Sent automatically by ResumeATS support integration.
          </div>
        </div>
      `;
    }

    if (!host || !user || !pass) {
      console.log('=== EMAIL LOG (SMTP Credentials Missing) ===');
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log('============================================');
      return NextResponse.json({ success: true, warning: 'SMTP configuration missing' });
    }

    const transporter = nodemailer.createTransport({
      host,
      port: parseInt(port) || 587,
      secure: port === '465',
      auth: { user, pass },
    });

    await transporter.sendMail({
      from: `"${from}" <${user}>`,
      to,
      subject,
      html: htmlContent,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Email API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
