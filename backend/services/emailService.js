const nodemailer = require("nodemailer");
require("dotenv").config();

// ─── Brevo HTTPS transport — used when BREVO_API_KEY is set.
// Hosts like Render's free tier block outbound SMTP ports, so
// production sends over HTTPS instead. Same sendMail() shape as
// nodemailer, so the email functions below don't change. ───
const brevoTransport = {
  sendMail: async ({ to, subject, html }) => {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": process.env.BREVO_API_KEY,
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        sender: {
          name: "MoneyMap",
          email: process.env.EMAIL_FROM || process.env.GMAIL_USER,
        },
        to: [{ email: to }],
        subject,
        htmlContent: html,
      }),
    });
    if (!res.ok) {
      const detail = await res.text();
      throw new Error(`Brevo email failed (${res.status}): ${detail}`);
    }
    return res.json();
  },
};

// Create transporter — Brevo in production, Gmail SMTP locally
const transporter = process.env.BREVO_API_KEY
  ? brevoTransport
  : nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

// ─── Shared email shell — works well on desktop, mobile
// clients, and shows a clean preview in mobile notifications ───
const emailTemplate = (content, footerNote, preheader) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>MoneyMap</title>
  <style>
    @media only screen and (max-width: 480px) {
      .email-outer { padding: 1rem 0.75rem !important; }
      .email-card  { padding: 1.5rem 1.25rem !important; }
      .otp-text    { font-size: 1.6rem !important; letter-spacing: 4px !important; }
      .row-card    { padding: 0.75rem !important; }
    }
  </style>
</head>
<body style="margin:0; padding:0; background:#f9fafb;">

  <!-- Preheader: controls the short preview text shown in mobile
       notifications / inbox list, hidden from the visible email -->
  <div style="display:none; max-height:0; overflow:hidden; opacity:0;">
    ${preheader || "MoneyMap — your personal finance tracker"}
  </div>

  <div class="email-outer" style="
    font-family: -apple-system, Arial, sans-serif;
    max-width: 500px;
    width: 100%;
    margin: 0 auto;
    padding: 2rem 1rem;
    background: #f9fafb;
    box-sizing: border-box;
  ">
    <div class="email-card" style="
      background: #ffffff;
      border-radius: 12px;
      padding: 2rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      box-sizing: border-box;
    ">
      <!-- Logo -->
      <div style="text-align: center; margin-bottom: 1.5rem;">
        <div style="
          display: inline-block;
          background: #2563eb;
          color: white;
          width: 48px;
          height: 48px;
          border-radius: 12px;
          font-size: 1.5rem;
          font-weight: 700;
          line-height: 48px;
          text-align: center;
        ">₹</div>
        <h2 style="
          color: #1e293b;
          margin: 0.5rem 0 0;
          font-size: 1.3rem;
        ">MoneyMap</h2>
      </div>

      ${content}

      <!-- Footer -->
      <div style="
        margin-top: 2rem;
        padding-top: 1rem;
        border-top: 1px solid #e5e7eb;
        text-align: center;
        color: #94a3b8;
        font-size: 0.8rem;
        line-height: 1.6;
      ">
        Made with ❤️ by <span style="color:#2563eb; font-weight:700;">Ashutosh</span> | MoneyMap
        <br/>
        ${footerNote || "This OTP expires in 10 minutes. If you did not request this, ignore this email."}
      </div>
    </div>
  </div>
</body>
</html>
`;

// OTP box style
const otpBox = (otp) => `
  <div style="
    background: #f1f5f9;
    border: 2px dashed #2563eb;
    border-radius: 8px;
    padding: 1rem;
    text-align: center;
    margin: 1.5rem 0;
  ">
    <p class="otp-text" style="
      font-size: 1.75rem;
      font-weight: bold;
      color: #2563eb;
      letter-spacing: 6px;
      margin: 0;
      font-family: 'Courier New', monospace;
      white-space: nowrap;
      word-break: keep-all;
    ">${otp}</p>
    <p style="
      color: #94a3b8;
      font-size: 0.75rem;
      margin: 0.4rem 0 0;
    ">Enter this 6-digit code</p>
  </div>
`;

// 1. Send Verification Email
const sendVerificationEmail = async (email, otp) => {
  const content = `
    <h3 style="color: #1e293b; margin-bottom: 0.5rem;">
      Verify your email
    </h3>
    <p style="color: #64748b; font-size: 0.95rem; line-height: 1.6;">
      Welcome to MoneyMap! Use the OTP below
      to verify your email address.
    </p>
    ${otpBox(otp)}
    <p style="color: #94a3b8; font-size: 0.85rem; text-align: center;">
      Enter this code on the verification page
    </p>
  `;

  await transporter.sendMail({
    from: `"MoneyMap" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: "Verify your MoneyMap account",
    html: emailTemplate(
      content,
      null,
      "Welcome to MoneyMap! Verify your email to get started.",
    ),
  });
};

// 2. Send Forgot Password Email
const sendForgotPasswordEmail = async (email, otp) => {
  const content = `
    <h3 style="color: #1e293b; margin-bottom: 0.5rem;">
      Reset your password
    </h3>
    <p style="color: #64748b; font-size: 0.95rem; line-height: 1.6;">
      We received a request to reset your MoneyMap password.
      Use the OTP below to proceed.
    </p>
    ${otpBox(otp)}
    <p style="color: #94a3b8; font-size: 0.85rem; text-align: center;">
      If you did not request this, ignore this email.
      Your password will not change.
    </p>
  `;

  await transporter.sendMail({
    from: `"MoneyMap" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: "Reset your MoneyMap password",
    html: emailTemplate(
      content,
      null,
      "Use this OTP to reset your MoneyMap password.",
    ),
  });
};

// 3. Send Change Password Email
const sendChangePasswordEmail = async (email, otp) => {
  const content = `
    <h3 style="color: #1e293b; margin-bottom: 0.5rem;">
      Change your password
    </h3>
    <p style="color: #64748b; font-size: 0.95rem; line-height: 1.6;">
      You requested to change your MoneyMap password.
      Use the OTP below to confirm.
    </p>
    ${otpBox(otp)}
    <p style="color: #94a3b8; font-size: 0.85rem; text-align: center;">
      If you did not request this, please
      change your password immediately.
    </p>
  `;

  await transporter.sendMail({
    from: `"MoneyMap" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: "Change your MoneyMap password",
    html: emailTemplate(
      content,
      null,
      "Use this OTP to confirm your password change.",
    ),
  });
};

// 4. Send Bill Reminder Email
// Rows are stacked "cards" instead of a rigid <table> so they
// reflow cleanly on narrow mobile screens with no horizontal scroll
const sendBillReminderEmail = async (email, userName, bills) => {
  const billCards = bills
    .map((bill) => {
      const statusColor =
        bill.status === "overdue"
          ? "#dc2626"
          : bill.status === "due-today"
            ? "#ea580c"
            : "#ca8a04";

      const statusLabel =
        bill.status === "overdue"
          ? "Overdue"
          : bill.status === "due-today"
            ? "Due Today"
            : `Due in ${bill.daysUntilDue} days`;

      return `
      <div class="row-card" style="
        display: table;
        width: 100%;
        padding: 0.9rem;
        border-bottom: 1px solid #cbd5e1;
        box-sizing: border-box;
      ">
        <div style="display: table-cell; vertical-align: middle;">
          <p style="margin: 0; color: #1e293b; font-weight: 600; font-size: 0.9rem;">
            ${bill.name}
          </p>
          <p style="margin: 0.25rem 0 0; color: #64748b; font-size: 0.85rem;">
            Rs. ${bill.amount.toLocaleString("en-IN")}
          </p>
        </div>
        <div style="display: table-cell; vertical-align: middle; text-align: right; white-space: nowrap;">
          <span style="
            background: ${statusColor}20;
            color: ${statusColor};
            padding: 3px 10px;
            border-radius: 9999px;
            font-size: 0.72rem;
            font-weight: 600;
          ">${statusLabel}</span>
        </div>
      </div>
    `;
    })
    .join("");

  const totalAmount = bills.reduce((s, b) => s + b.amount, 0);

  const content = `
    <h3 style="color: #1e293b; margin-bottom: 0.5rem;">
      Bill Payment Reminder
    </h3>
    <p style="color: #64748b; font-size: 0.95rem; line-height: 1.6;">
      Hi ${userName}, you have <strong>${bills.length} bill${bills.length > 1 ? "s" : ""}</strong>
      that need your attention.
    </p>

    <div style="
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      margin: 1.5rem 0;
      overflow: hidden;
    ">
      ${billCards}
      <div style="
        display: table;
        width: 100%;
        padding: 0.9rem;
        background: #f8fafc;
        box-sizing: border-box;
      ">
        <div style="display: table-cell; font-weight: 700; color: #1e293b; font-size: 0.9rem;">
          Total
        </div>
        <div style="display: table-cell; text-align: right; font-weight: 700; color: #dc2626; font-size: 0.9rem;">
          Rs. ${totalAmount.toLocaleString("en-IN")}
        </div>
      </div>
    </div>

    <div style="text-align: center; margin-top: 1rem;">
      <a href="${process.env.CLIENT_URL}/bills"
        style="
          background: #2563eb;
          color: white;
          padding: 10px 24px;
          border-radius: 8px;
          text-decoration: none;
          font-weight: 600;
          font-size: 0.9rem;
          display: inline-block;
        "
      >
        View Bills
      </a>
    </div>
  `;

  await transporter.sendMail({
    from: `"MoneyMap" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: `Bill Reminder - ${bills.length} bill${bills.length > 1 ? "s" : ""} need attention`,
    html: emailTemplate(
      content,
      "You are receiving this because you have bills due on MoneyMap.",
      `You have ${bills.length} bill${bills.length > 1 ? "s" : ""} totaling Rs. ${totalAmount.toLocaleString("en-IN")} needing attention.`,
    ),
  });
};

// 5. Send Budget Alert Email
// Rows are stacked "cards" like Bill Reminder, one per category
// that has crossed Warning (80%) or Exceeded (100%) of its limit
const sendBudgetAlertEmail = async (email, userName, month, alerts) => {
  const alertCards = alerts
    .map((alert) => {
      const isExceeded = alert.status === "exceeded";
      const statusColor = isExceeded ? "#dc2626" : "#ca8a04";
      const statusLabel = isExceeded ? "Exceeded" : "Warning";
      const pct = Math.round((alert.spent / alert.limit) * 100);

      return `
      <div class="row-card" style="
        padding: 0.9rem;
        border-bottom: 1px solid #cbd5e1;
        box-sizing: border-box;
      ">
        <div style="display: table; width: 100%;">
          <div style="display: table-cell; vertical-align: middle;">
            <p style="margin: 0; color: #1e293b; font-weight: 600; font-size: 0.9rem;">
              ${alert.category}
            </p>
            <p style="margin: 0.25rem 0 0; color: #64748b; font-size: 0.85rem;">
              Rs. ${alert.spent.toLocaleString("en-IN")} of Rs. ${alert.limit.toLocaleString("en-IN")}
            </p>
          </div>
          <div style="display: table-cell; vertical-align: middle; text-align: right; white-space: nowrap;">
            <span style="
              background: ${statusColor}20;
              color: ${statusColor};
              padding: 3px 10px;
              border-radius: 9999px;
              font-size: 0.72rem;
              font-weight: 600;
            ">${statusLabel} — ${pct}%</span>
          </div>
        </div>
        <div style="
          margin-top: 0.6rem;
          height: 6px;
          border-radius: 9999px;
          background: #f1f5f9;
          overflow: hidden;
        ">
          <div style="
            width: ${Math.min(pct, 100)}%;
            height: 100%;
            background: ${statusColor};
            border-radius: 9999px;
          "></div>
        </div>
      </div>
    `;
    })
    .join("");

  const exceededCount = alerts.filter((a) => a.status === "exceeded").length;
  const warningCount = alerts.filter((a) => a.status === "warning").length;

  const content = `
    <h3 style="color: #1e293b; margin-bottom: 0.5rem;">
      Budget Alert
    </h3>
    <p style="color: #64748b; font-size: 0.95rem; line-height: 1.6;">
      Hi ${userName}, here's your budget status for <strong>${month}</strong>.
      ${exceededCount > 0 ? `<strong>${exceededCount} categor${exceededCount > 1 ? "ies have" : "y has"} been exceeded</strong>` : ""}
      ${exceededCount > 0 && warningCount > 0 ? " and " : ""}
      ${warningCount > 0 ? `<strong>${warningCount} categor${warningCount > 1 ? "ies are" : "y is"} nearing the limit</strong>` : ""}.
    </p>

    <div style="
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      margin: 1.5rem 0;
      overflow: hidden;
    ">
      ${alertCards}
    </div>

    <div style="text-align: center; margin-top: 1rem;">
      <a href="${process.env.CLIENT_URL}/budget"
        style="
          background: #2563eb;
          color: white;
          padding: 10px 24px;
          border-radius: 8px;
          text-decoration: none;
          font-weight: 600;
          font-size: 0.9rem;
          display: inline-block;
        "
      >
        View Budget
      </a>
    </div>
  `;

  await transporter.sendMail({
    from: `"MoneyMap" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: `Budget Alert — ${alerts.length} categor${alerts.length > 1 ? "ies" : "y"} need attention`,
    html: emailTemplate(
      content,
      "You are receiving this because one or more budgets are nearing or over their limit on MoneyMap.",
      `${alerts.length} budget categor${alerts.length > 1 ? "ies" : "y"} ${alerts.length > 1 ? "are" : "is"} nearing or over the limit this month.`,
    ),
  });
};

module.exports = {
  sendVerificationEmail,
  sendForgotPasswordEmail,
  sendChangePasswordEmail,
  sendBillReminderEmail,
  sendBudgetAlertEmail,
};
