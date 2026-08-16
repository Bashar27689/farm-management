import { NextRequest, NextResponse } from "next/server";

import {
  sendWhatsAppText,
} from "../../../../lib/whatsapp";


export async function POST(
  request: NextRequest
) {
  try {
    const body = await request.json();

    const {
      to,
      message,
    } = body;


    if (!to) {
      return NextResponse.json(
        {
          success: false,
          error: "رقم الهاتف مطلوب",
        },
        {
          status: 400,
        }
      );
    }


    if (!message) {
      return NextResponse.json(
        {
          success: false,
          error: "نص الرسالة مطلوب",
        },
        {
          status: 400,
        }
      );
    }


    const result =
      await sendWhatsAppText(
        to,
        message
      );


    return NextResponse.json({
      success: true,
      data: result,
    });


  } catch (error) {

    console.error(
      "WhatsApp send route error:",
      error
    );


    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "حدث خطأ غير معروف",
      },
      {
        status: 500,
      }
    );
  }
}