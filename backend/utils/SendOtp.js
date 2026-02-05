const nodemailer = require("nodemailer");
const axios = require("axios");

let cachedTransporter = null;

/**
 * Helper: read env with backward compatibility
 * (because your .env uses EMAIL / EMAIL_PASSWORD, while code expects EMAIL_USER / EMAIL_PASS)
 */
function getEnvEmailUser() {
  return process.env.EMAIL_USER || process.env.EMAIL || "";
}
function getEnvEmailPass() {
  return process.env.EMAIL_PASS || process.env.EMAIL_PASSWORD || "";
}

/**
 * Create mail transporter (safe for dev + prod)
 */
const getTransporter = async () => {
  if (cachedTransporter) return cachedTransporter;

  // DEV → Ethereal
  if (process.env.NODE_ENV !== "production") {
    const testAccount = await nodemailer.createTestAccount();

    console.log("📧 Using Ethereal email (DEV)");
    console.log("👤 Test user:", testAccount.user);

    cachedTransporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    return cachedTransporter;
  }

  // PROD → Gmail SMTP
  const EMAIL_USER = getEnvEmailUser();
  const EMAIL_PASS = getEnvEmailPass();

  if (!EMAIL_USER || !EMAIL_PASS) {
    throw new Error("EMAIL_USER/EMAIL_PASS (or EMAIL/EMAIL_PASSWORD) missing in env");
  }

  cachedTransporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
  });

  return cachedTransporter;
};

/**
 * EMAIL OTP
 */
exports.sendOtpEmailUtil = async (email, otpCode) => {
  const transporter = await getTransporter();
  const fromUser = getEnvEmailUser() || "no-reply@tathagat.com";

  const info = await transporter.sendMail({
    from: `"Tathagat" <${fromUser}>`,
    to: email,
    subject: "Tathagat OTP Verification",
    html: `
      <div style="font-family:Arial">
        <h2>Your OTP is</h2>
        <h1 style="letter-spacing:4px">${otpCode}</h1>
        <p>Valid for 5 minutes</p>
      </div>
    `,
    text: `Your OTP is ${otpCode}`,
  });

  if (process.env.NODE_ENV !== "production") {
    const preview = nodemailer.getTestMessageUrl(info);
    if (preview) console.log("🔗 Email preview:", preview);
  }

  console.log("✅ OTP email sent:", info.messageId);
};

/**
 * PHONE OTP (Karix / InstaAlerts)
 */
exports.sendOtpPhoneUtil = async (phoneNumber, otpCode) => {
  // normalize phone: keep only digits, remove leading +91 or 91
  const clean = String(phoneNumber).replace(/^\+?91/, "").replace(/\D/g, "");
  if (clean.length !== 10) {
    throw new Error(`Invalid phone number. Expected 10 digits, got: ${clean.length}`);
  }
  const formattedPhone = `91${clean}`;

  if (!process.env.KARIX_API_KEY) {
    throw new Error("KARIX_API_KEY missing");
  }

  // ✅ DLT template must match EXACTLY with your approved DLT template text
  // Put exact text in .env as KARIX_OTP_TEXT_TEMPLATE
  const smsTemplate =
    process.env.KARIX_OTP_TEXT_TEMPLATE ||
    "Dear User, use {{OTP}} as your sign up otp for mytathagat.com. OTP is confidential and valid for 10 mins.";

  const smsText = smsTemplate.replace(/{{\s*OTP\s*}}/g, String(otpCode));

  const payload = {
    ver: "1.0",
    key: process.env.KARIX_API_KEY,
    encrpt: "0",
    messages: [
      {
        dest: [formattedPhone],
        text: smsText,
        send: process.env.KARIX_SENDER_ID || "TATHGT",
        type: "PM",

        // ✅ DLT IDs (env override)
        dlt_entity_id: process.env.KARIX_DLT_ENTITY_ID || "1101538550000021740",
        dlt_template_id: process.env.KARIX_DLT_TEMPLATE_ID || "1107170349275465220",

        // ✅ must be unique (avoid provider de-dup / issues)
        cust_ref: `${Date.now()}_${clean}`,
      },
    ],
  };

  const smsUrl =
    process.env.KARIX_SMS_URL || "https://japi.instaalerts.zone/httpapi/JsonReceiver";

  const response = await axios.post(smsUrl, payload, { timeout: 15000 });

  // strong validation
  const data = response?.data;
  if (!data) {
    throw new Error("Karix SMS failed: empty response");
  }

  // InstaAlerts often returns: { ackid, time, status: { code:'200', desc:'Request accepted' } }
  if (data?.status?.code && String(data.status.code) !== "200") {
    throw new Error(`Karix SMS rejected: ${JSON.stringify(data)}`);
  }

  console.log("✅ SMS accepted:", data);

  // debug info (optional)
  if (process.env.DEBUG_SMS === "1") {
    return { ...data, __debug: { smsText, formattedPhone } };
  }

  return data;
};
