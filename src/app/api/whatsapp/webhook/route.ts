import {
  NextRequest,
  NextResponse,
} from "next/server";

export const runtime = "nodejs";

const VERIFY_TOKEN =
  process.env.WHATSAPP_VERIFY_TOKEN;

/**
 * Meta Webhook Verification
 */
export async function GET(
  request: NextRequest
) {
  const searchParams =
    request.nextUrl.searchParams;

  const mode =
    searchParams.get("hub.mode");

  const token =
    searchParams.get("hub.verify_token");

  const challenge =
    searchParams.get("hub.challenge");

  console.log("WhatsApp Webhook Verification");

  if (
    mode === "subscribe" &&
    token === VERIFY_TOKEN &&
    challenge
  ) {
    console.log(
      "WhatsApp Webhook Verification: SUCCESS"
    );

    return new NextResponse(
      challenge,
      {
        status: 200,
      }
    );
  }

  console.error(
    "WhatsApp Webhook Verification: FAILED"
  );

  return new NextResponse(
    "Forbidden",
    {
      status: 403,
    }
  );
}

/**
 * WhatsApp Webhook Events
 */
export async function POST(
  request: NextRequest
) {
  try {
    const body =
      await request.json();

    console.log(
      "========================================"
    );

    console.log(
      "WHATSAPP WEBHOOK RECEIVED"
    );

    console.log(
      JSON.stringify(
        body,
        null,
        2
      )
    );

    console.log(
      "========================================"
    );

    /**
     * نتأكد أن الحدث من WhatsApp
     */
    if (
      body?.object !==
      "whatsapp_business_account"
    ) {
      console.log(
        "Webhook ignored: invalid object"
      );

      return NextResponse.json({
        success: true,
      });
    }

    const entries =
      body?.entry ?? [];

    for (const entry of entries) {
      const changes =
        entry?.changes ?? [];

      for (const change of changes) {
        const value =
          change?.value;

        if (!value) {
          continue;
        }

        /**
         * ========================================
         * MESSAGE STATUS
         * ========================================
         */
        const statuses =
          value?.statuses ?? [];

        for (
          const status
          of statuses
        ) {
          console.log(
            "========================================"
          );

          console.log(
            "WHATSAPP MESSAGE STATUS"
          );

          console.log(
            "Message ID:",
            status?.id
          );

          console.log(
            "Recipient:",
            status?.recipient_id
          );

          console.log(
            "Status:",
            status?.status
          );

          console.log(
            "Timestamp:",
            status?.timestamp
          );

          console.log(
            "Conversation:",
            JSON.stringify(
              status?.conversation,
              null,
              2
            )
          );

          console.log(
            "Pricing:",
            JSON.stringify(
              status?.pricing,
              null,
              2
            )
          );

          /**
           * في حالة فشل الإرسال
           */
          if (
            status?.status ===
            "failed"
          ) {
            console.error(
              "❌ WHATSAPP MESSAGE FAILED"
            );

            console.error(
              "Errors:",
              JSON.stringify(
                status?.errors,
                null,
                2
              )
            );
          }

          /**
           * في حالة التسليم
           */
          if (
            status?.status ===
            "delivered"
          ) {
            console.log(
              "✅ WHATSAPP MESSAGE DELIVERED"
            );
          }

          /**
           * في حالة الإرسال
           */
          if (
            status?.status ===
            "sent"
          ) {
            console.log(
              "✅ WHATSAPP MESSAGE SENT"
            );
          }

          /**
           * في حالة القراءة
           */
          if (
            status?.status ===
            "read"
          ) {
            console.log(
              "✅ WHATSAPP MESSAGE READ"
            );
          }

          console.log(
            "========================================"
          );
        }

        /**
         * ========================================
         * INCOMING MESSAGES
         * ========================================
         */
        const messages =
          value?.messages ?? [];

        for (
          const message
          of messages
        ) {
          const from =
            message?.from;

          const messageId =
            message?.id;

          const type =
            message?.type;

          console.log(
            "========================================"
          );

          console.log(
            "WHATSAPP INCOMING MESSAGE"
          );

          console.log(
            "From:",
            from
          );

          console.log(
            "Message ID:",
            messageId
          );

          console.log(
            "Type:",
            type
          );

          /**
           * رسالة نصية
           */
          if (
            type === "text"
          ) {
            const text =
              message?.text?.body;

            console.log(
              "Message text:",
              text
            );
          }

          console.log(
            "========================================"
          );
        }
      }
    }

    /**
     * يجب الرد بسرعة على Meta
     */
    return NextResponse.json(
      {
        success: true,
      },
      {
        status: 200,
      }
    );

  } catch (error) {
    console.error(
      "WhatsApp Webhook Error:",
      error
    );

    /**
     * نعيد 200 حتى لا تعيد Meta
     * إرسال الحدث بسبب خطأ داخلي.
     */
    return NextResponse.json(
      {
        success: false,
      },
      {
        status: 200,
      }
    );
  }
}