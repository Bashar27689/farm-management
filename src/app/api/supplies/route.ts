// src/app/api/supplies/route.ts

import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "../../../lib/auth";

import { prisma } from "../../../lib/prisma";

// =====================================================
// POST - Create Supply
// =====================================================

export async function POST(
  request: NextRequest
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
    const {
      type,
      name,
      quantity,
      price,
      date,
      expiryDate,
    } = await request.json();

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

    const parsedType = String(type).trim();
    const parsedName = String(name).trim();

    const parsedQuantity = Number(quantity);
    const parsedPrice = Number(price);
    const parsedDate = new Date(date);

    if (!parsedType) {
      return NextResponse.json(
        {
          message: "نوع المستلزم مطلوب",
        },
        {
          status: 400,
        }
      );
    }

    if (!parsedName) {
      return NextResponse.json(
        {
          message: "اسم المستلزم مطلوب",
        },
        {
          status: 400,
        }
      );
    }

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

    if (
      Number.isNaN(parsedDate.getTime())
    ) {
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
    // Expiry Date
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
    // Create
    // =================================================

    const supply =
      await prisma.supply.create({
        data: {
          type: parsedType,
          name: parsedName,
          quantity: parsedQuantity,
          price: parsedPrice,
          date: parsedDate,
          expiryDate: parsedExpiryDate,
        },
      });

    return NextResponse.json(
      {
        message: "تم إضافة المستلزم بنجاح",
        supply,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "POST /api/supplies error:",
      error
    );

    return NextResponse.json(
      {
        message: "حدث خطأ في الخادم",
      },
      {
        status: 500,
      }
    );
  }
}

// =====================================================
// GET - Get Supplies
// =====================================================

export async function GET(
  request: NextRequest
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
    // =================================================
    // Get Supplies
    // =================================================

    const supplies =
      await prisma.supply.findMany({
        orderBy: {
          date: "desc",
        },
      });

    // =================================================
    // Statistics
    // =================================================

    const statistics =
      await prisma.$queryRaw<
        Array<{
          totalItems: bigint;
          totalCost: bigint | null;
          feedCount: bigint | null;
          vaccineCount: bigint | null;
          otherCount: bigint | null;
        }>
      >`
        SELECT
          COUNT(*) AS totalItems,

          COALESCE(
            SUM(price * quantity),
            0
          ) AS totalCost,

          SUM(
            CASE
              WHEN type = 'FEED'
              THEN 1
              ELSE 0
            END
          ) AS feedCount,

          SUM(
            CASE
              WHEN type = 'VACCINE'
              THEN 1
              ELSE 0
            END
          ) AS vaccineCount,

          SUM(
            CASE
              WHEN type = 'OTHER'
              THEN 1
              ELSE 0
            END
          ) AS otherCount

        FROM Supply
      `;

    const stats = statistics[0];

    // =================================================
    // Convert BigInt
    // =================================================

    const totalItems = Number(
      stats?.totalItems ?? 0
    );

    const totalCost = Number(
      stats?.totalCost ?? 0
    );

    const byType = {
      FEED: Number(
        stats?.feedCount ?? 0
      ),

      VACCINE: Number(
        stats?.vaccineCount ?? 0
      ),

      OTHER: Number(
        stats?.otherCount ?? 0
      ),
    };

    // =================================================
    // Response
    // =================================================

    return NextResponse.json({
      supplies,

      stats: {
        totalItems,
        totalCost,
        byType,
      },
    });
  } catch (error) {
    console.error(
      "GET /api/supplies error:",
      error
    );

    return NextResponse.json(
      {
        message:
          "حدث خطأ أثناء جلب المستلزمات",
      },
      {
        status: 500,
      }
    );
  }
}

// =====================================================
// PATCH - Update Supply
// =====================================================

export async function PATCH(
  request: NextRequest
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
    const body = await request.json();

    const {
      id,
      type,
      name,
      quantity,
      price,
      date,
      expiryDate,
    } = body;

    // =================================================
    // ID Validation
    // =================================================

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
    // Required Fields Validation
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
          message:
            "جميع الحقول المطلوبة يجب إدخالها",
        },
        {
          status: 400,
        }
      );
    }

    const parsedType = String(type).trim();
    const parsedName = String(name).trim();

    const parsedQuantity = Number(quantity);
    const parsedPrice = Number(price);
    const parsedDate = new Date(date);

    if (!parsedType) {
      return NextResponse.json(
        {
          message: "نوع المستلزم مطلوب",
        },
        {
          status: 400,
        }
      );
    }

    if (!parsedName) {
      return NextResponse.json(
        {
          message: "اسم المستلزم مطلوب",
        },
        {
          status: 400,
        }
      );
    }

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

    if (
      Number.isNaN(parsedDate.getTime())
    ) {
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
    // Expiry Date
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
    // Check Supply
    // =================================================

    const existingSupply =
      await prisma.supply.findUnique({
        where: {
          id: String(id),
        },
      });

    if (!existingSupply) {
      return NextResponse.json(
        {
          message:
            "المستلزم غير موجود",
        },
        {
          status: 404,
        }
      );
    }

    // =================================================
    // Update
    // =================================================

    const supply =
      await prisma.supply.update({
        where: {
          id: String(id),
        },

        data: {
          type: parsedType,
          name: parsedName,
          quantity: parsedQuantity,
          price: parsedPrice,
          date: parsedDate,
          expiryDate: parsedExpiryDate,
        },
      });

    return NextResponse.json(
      {
        message:
          "تم تعديل المستلزم بنجاح",

        supply,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "PATCH /api/supplies error:",
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
  request: NextRequest
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
    const body = await request.json();

    const { id } = body;

    // =================================================
    // ID Validation
    // =================================================

    if (!id) {
      return NextResponse.json(
        {
          message:
            "معرف المستلزم مطلوب",
        },
        {
          status: 400,
        }
      );
    }

    // =================================================
    // Check Supply
    // =================================================

    const existingSupply =
      await prisma.supply.findUnique({
        where: {
          id: String(id),
        },
      });

    if (!existingSupply) {
      return NextResponse.json(
        {
          message:
            "المستلزم غير موجود",
        },
        {
          status: 404,
        }
      );
    }

    // =================================================
    // Delete
    // =================================================

    await prisma.supply.delete({
      where: {
        id: String(id),
      },
    });

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
      "DELETE /api/supplies error:",
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