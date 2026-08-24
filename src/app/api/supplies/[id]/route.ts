import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";

// =====================================================
// PUT - Update Supply
// =====================================================

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = getCurrentUser(request);

  if (!user) {
    return NextResponse.json(
      {
        message: "غير مصرح",
      },
      {
        status: 401,
      }
    );
  }

  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        {
          message: "معرف المستلزم مطلوب",
        },
        {
          status: 400,
        }
      );
    }

    const body = await request.json();

    const {
      type,
      name,
      quantity,
      price,
      date,
      expiryDate,
    } = body;

    // =================================================
    // Validation
    // =================================================

    if (
      !type ||
      !name ||
      quantity === undefined ||
      quantity === null ||
      price === undefined ||
      price === null ||
      !date
    ) {
      return NextResponse.json(
        {
          message: "جميع الحقول المطلوبة يجب إدخالها",
        },
        {
          status: 400,
        }
      );
    }

    const trimmedType = String(type).trim();
    const trimmedName = String(name).trim();

    if (!trimmedType) {
      return NextResponse.json(
        {
          message: "نوع المستلزم مطلوب",
        },
        {
          status: 400,
        }
      );
    }

    if (!trimmedName) {
      return NextResponse.json(
        {
          message: "اسم المستلزم مطلوب",
        },
        {
          status: 400,
        }
      );
    }

    const parsedQuantity = Number(quantity);
    const parsedPrice = Number(price);

    if (
      !Number.isInteger(parsedQuantity) ||
      parsedQuantity <= 0
    ) {
      return NextResponse.json(
        {
          message:
            "الكمية يجب أن تكون رقمًا صحيحًا أكبر من صفر",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !Number.isInteger(parsedPrice) ||
      parsedPrice < 0
    ) {
      return NextResponse.json(
        {
          message:
            "السعر يجب أن يكون رقمًا صحيحًا أكبر من أو يساوي صفر",
        },
        {
          status: 400,
        }
      );
    }

    // =================================================
    // Parse Date
    // =================================================

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return NextResponse.json(
        {
          message: "التاريخ غير صالح",
        },
        {
          status: 400,
        }
      );
    }

    // =================================================
    // Parse Expiry Date
    // =================================================

    let parsedExpiryDate: Date | null = null;

    if (
      expiryDate !== undefined &&
      expiryDate !== null &&
      String(expiryDate).trim() !== ""
    ) {
      parsedExpiryDate = new Date(expiryDate);

      if (
        Number.isNaN(
          parsedExpiryDate.getTime()
        )
      ) {
        return NextResponse.json(
          {
            message:
              "تاريخ انتهاء الصلاحية غير صالح",
          },
          {
            status: 400,
          }
        );
      }
    }

    // =================================================
    // Check Supply Exists
    // =================================================

    const existingSupply =
      await prisma.supply.findUnique({
        where: {
          id,
        },
      });

    if (!existingSupply) {
      return NextResponse.json(
        {
          message: "المستلزم غير موجود",
        },
        {
          status: 404,
        }
      );
    }

    // =================================================
    // Update Supply
    // =================================================

    const supply =
      await prisma.supply.update({
        where: {
          id,
        },

        data: {
          type: trimmedType,
          name: trimmedName,
          quantity: parsedQuantity,
          price: parsedPrice,
          date: parsedDate,
          expiryDate: parsedExpiryDate,
        },
      });

    // =================================================
    // Response
    // =================================================

    return NextResponse.json(
      {
        message:
          "تم تعديل بيانات المستلزم بنجاح",

        supply,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "PUT /api/supplies/[id] error:",
      error
    );

    return NextResponse.json(
      {
        message:
          "حدث خطأ أثناء تعديل المستلزم",
      },
      {
        status: 500,
      }
    );
  }
}

// =====================================================
// DELETE - Delete Supply
// =====================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = getCurrentUser(request);

  if (!user) {
    return NextResponse.json(
      {
        message: "غير مصرح",
      },
      {
        status: 401,
      }
    );
  }

  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        {
          message: "معرف المستلزم مطلوب",
        },
        {
          status: 400,
        }
      );
    }

    // =================================================
    // Check Supply Exists
    // =================================================

    const existingSupply =
      await prisma.supply.findUnique({
        where: {
          id,
        },
      });

    if (!existingSupply) {
      return NextResponse.json(
        {
          message: "المستلزم غير موجود",
        },
        {
          status: 404,
        }
      );
    }

    // =================================================
    // Delete Supply
    // =================================================

    await prisma.supply.delete({
      where: {
        id,
      },
    });

    // =================================================
    // Response
    // =================================================

    return NextResponse.json(
      {
        message:
          "تم حذف المستلزم بنجاح",
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "DELETE /api/supplies/[id] error:",
      error
    );

    return NextResponse.json(
      {
        message:
          "حدث خطأ أثناء حذف المستلزم",
      },
      {
        status: 500,
      }
    );
  }
}