const normalizeProvider = () => (process.env.SMS_PROVIDER || "mock").toLowerCase().trim();

const getProviderError = (data, fallback) => {
  if (!data) return fallback;
  if (typeof data.message === "string") return data.message;
  if (Array.isArray(data.message)) return data.message.join(", ");
  if (typeof data.error === "string") return data.error;
  return fallback;
};

const normalizeIndianMobile = (phone) => {
  let digits = String(phone || "").replace(/\D/g, "");

  if (digits.length === 12 && digits.startsWith("91")) {
    digits = digits.slice(2);
  }

  if (digits.length !== 10) {
    throw new Error("Fast2SMS requires a valid 10 digit Indian mobile number");
  }

  return digits;
};

const sendTwilioSms = async ({ to, message }) => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !from) {
    throw new Error("Twilio SMS settings are missing in backend/.env");
  }

  const params = new URLSearchParams({
    To: to,
    From: from,
    Body: message,
  });

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Twilio SMS send failed");
  }

  return {
    provider: "twilio",
    messageId: data.sid || "",
    status: data.status || "sent",
  };
};

const sendFast2Sms = async ({ to, message }) => {
  const apiKey = process.env.FAST2SMS_API_KEY;

  if (!apiKey) {
    throw new Error("FAST2SMS_API_KEY is missing in backend/.env");
  }

  const numbers = normalizeIndianMobile(to);

  const response = await fetch("https://www.fast2sms.com/dev/bulkV2", {
    method: "POST",
    headers: {
      authorization: apiKey,
      accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      route: process.env.FAST2SMS_ROUTE || "q",
      message,
      language: "english",
      flash: 0,
      numbers,
    }),
  });

  const data = await response.json();

  if (!response.ok || data.return === false) {
    console.error("Fast2SMS send failed:", data);
    throw new Error(getProviderError(data, "Fast2SMS send failed"));
  }

  return {
    provider: "fast2sms",
    messageId: String(data.request_id || ""),
    status: "sent",
  };
};

export const sendSms = async ({ to, message }) => {
  const provider = normalizeProvider();

  if (!to || !message) {
    throw new Error("Phone number and message are required");
  }

  if (provider === "twilio") {
    return sendTwilioSms({ to, message });
  }

  if (provider === "fast2sms") {
    return sendFast2Sms({ to, message });
  }

  console.log(`\nMOCK SMS\nTo: ${to}\nMessage: ${message}\n`);
  return {
    provider: "mock",
    messageId: "",
    status: "mock",
    mock: true,
  };
};
