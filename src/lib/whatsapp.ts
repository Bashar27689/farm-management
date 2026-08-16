const WHATSAPP_ACCESS_TOKEN =
  process.env.WHATSAPP_ACCESS_TOKEN;

const WHATSAPP_PHONE_NUMBER_ID =
  process.env.WHATSAPP_PHONE_NUMBER_ID;

const WHATSAPP_API_VERSION = "v26.0";

const WHATSAPP_API_URL =
  `https://graph.facebook.com/${WHATSAPP_API_VERSION}`;


function checkWhatsAppConfig() {
  if (!WHATSAPP_ACCESS_TOKEN) {
    throw new Error(
      "WHATSAPP_ACCESS_TOKEN is not configured"
    );
  }

  if (!WHATSAPP_PHONE_NUMBER_ID) {
    throw new Error(
      "WHATSAPP_PHONE_NUMBER_ID is not configured"
    );
  }
}


/**
 * إرسال رسالة نصية
 */
export async function sendWhatsAppText(
  to: string,
  message: string
) {
  checkWhatsAppConfig();

  const response = await fetch(
    `${WHATSAPP_API_URL}/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
    {
      method: "POST",
      headers: {
        Authorization:
          `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "text",
        text: {
          preview_url: false,
          body: message,
        },
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    console.error(
      "WhatsApp text error:",
      data
    );

    throw new Error(
      data?.error?.message ||
        "Failed to send WhatsApp message"
    );
  }

  return data;
}


/**
 * رفع ملف إلى WhatsApp
 */
async function uploadWhatsAppMedia(
  file: Buffer,
  filename: string,
  mimeType: string
) {
  checkWhatsAppConfig();

  const formData = new FormData();

  const blob = new Blob(
    [file],
    {
      type: mimeType,
    }
  );

  formData.append(
    "file",
    blob,
    filename
  );

  formData.append(
    "messaging_product",
    "whatsapp"
  );

  formData.append(
    "type",
    mimeType
  );


  const response = await fetch(
    `${WHATSAPP_API_URL}/${WHATSAPP_PHONE_NUMBER_ID}/media`,
    {
      method: "POST",
      headers: {
        Authorization:
          `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
      },
      body: formData,
    }
  );


  const data =
    await response.json();


  if (!response.ok) {
    console.error(
      "WhatsApp media upload error:",
      data
    );

    throw new Error(
      data?.error?.message ||
        "Failed to upload WhatsApp media"
    );
  }


  return data;
}


/**
 * إرسال PDF عبر WhatsApp
 */
export async function sendWhatsAppDocument(
  to: string,
  file: Buffer,
  filename: string,
  caption?: string
) {
  checkWhatsAppConfig();


  // رفع PDF إلى Meta
  const media =
    await uploadWhatsAppMedia(
      file,
      filename,
      "application/pdf"
    );


  const mediaId =
    media?.id;


  if (!mediaId) {
    throw new Error(
      "WhatsApp did not return a media ID"
    );
  }


  // إرسال PDF للمستلم
  const response = await fetch(
    `${WHATSAPP_API_URL}/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
    {
      method: "POST",

      headers: {
        Authorization:
          `Bearer ${WHATSAPP_ACCESS_TOKEN}`,

        "Content-Type":
          "application/json",
      },

      body: JSON.stringify({
        messaging_product:
          "whatsapp",

        recipient_type:
          "individual",

        to,

        type: "document",

        document: {
          id: mediaId,
          filename,

          ...(caption
            ? {
                caption,
              }
            : {}),
        },
      }),
    }
  );


  const data =
    await response.json();


  if (!response.ok) {
    console.error(
      "WhatsApp document error:",
      data
    );

    throw new Error(
      data?.error?.message ||
        "Failed to send WhatsApp document"
    );
  }


  return data;
}