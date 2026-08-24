// src/app/api/production/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";

// =====================================================
// POST - Create Production
// =====================================================

export async function POST(
  request: NextRequest
) {
  const user =
    getCurrentUser(request);

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
      eggCount,
      date,
    } = await request.json();

    // =================================================
    // Validation
    // =================================================

    if (
      eggCount === undefined ||
      eggCount === null ||
      !date
    ) {
      return NextResponse.json(
        {
          message:
            "عدد البيض والتاريخ مطلوبان",
        },
        {
          status: 400,
        }
      );
    }

    const parsedEggCount =
      Number(eggCount);

    const parsedDate =
      new Date(date);

    if (
      !Number.isInteger(
        parsedEggCount
      ) ||
      parsedEggCount <= 0
    ) {
      return NextResponse.json(
        {
          message:
            "عدد البيض يجب أن يكون رقمًا صحيحًا أكبر من صفر",
        },
        {
          status: 400,
        }
      );
    }

    if (
      Number.isNaN(
        parsedDate.getTime()
      )
    ) {
      return NextResponse.json(
        {
          message:
            "التاريخ غير صالح",
        },
        {
          status: 400,
        }
      );
    }

    // =================================================
    // Check Existing Production
    // =================================================

    const existing =
      await prisma.production.findFirst({
        where: {
          date: parsedDate,
        },

        select: {
          id: true,
        },
      });

    if (existing) {
      return NextResponse.json(
        {
          message:
            "تم إدخال الإنتاج لهذا اليوم مسبقاً",
        },
        {
          status: 400,
        }
      );
    }

    // =================================================
    // Create Production
    // =================================================

    const production =
      await prisma.production.create({
        data: {
          eggCount:
            parsedEggCount,

          date:
            parsedDate,
        },
      });

    return NextResponse.json({
      message:
        "تم إدخال الإنتاج بنجاح",

      production,
    });
  } catch (error) {
    console.error(
      "Error creating production:",
      error
    );

    return NextResponse.json(
      {
        message:
          "حدث خطأ في الخادم",
      },
      {
        status: 500,
      }
    );
  }
}

// =====================================================
// GET - Production
// =====================================================

export async function GET(
  request: NextRequest
) {
  const user =
    getCurrentUser(request);

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
    const url =
      new URL(request.url);

    const startDate =
      url.searchParams.get(
        "startDate"
      );

    const endDate =
      url.searchParams.get(
        "endDate"
      );

    // =================================================
    // Where
    // =================================================

    const where: {
      date?: {
        gte?: Date;
        lte?: Date;
      };
    } = {};

    if (
      startDate &&
      endDate
    ) {
      const start =
        new Date(startDate);

      const end =
        new Date(endDate);

      if (
        Number.isNaN(
          start.getTime()
        ) ||
        Number.isNaN(
          end.getTime()
        )
      ) {
        return NextResponse.json(
          {
            message:
              "نطاق التاريخ غير صالح",
          },
          {
            status: 400,
          }
        );
      }

      where.date = {
        gte: start,
        lte: end,
      };
    }

    // =================================================
    // Get Production Records
    // =================================================

    const productions =
      await prisma.production.findMany({
        where,

        orderBy: {
          date: "desc",
        },
      });

    // =================================================
    // Database Aggregate
    // =================================================

    const aggregate =
      await prisma.production.aggregate({
        where,

        _sum: {
          eggCount: true,
        },

        _count: {
          _all: true,
        },
      });

    const totalEggs =
      aggregate._sum.eggCount ?? 0;

    const count =
      aggregate._count._all;

    const average =
      count > 0
        ? Math.round(
            totalEggs / count
          )
        : 0;

    // =================================================
    // Response
    // =================================================

    return NextResponse.json({
      productions,

      stats: {
        totalEggs,

        average,

        count,
      },
    });
  } catch (error) {
    console.error(
      "Error fetching productions:",
      error
    );

    return NextResponse.json(
      {
        message:
          "حدث خطأ في الخادم",
      },
      {
        status: 500,
      }
    );
  }
}

// =====================================================
// DELETE - Production
// =====================================================

export async function DELETE(
  request: NextRequest
) {
  const user =
    getCurrentUser(request);

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

  // =================================================
  // Admin Only
  // =================================================

  if (
    user.role !== "ADMIN"
  ) {
    return NextResponse.json(
      {
        message:
          "غير مصرح - هذه الميزة للمدير فقط",
      },
      {
        status: 403,
      }
    );
  }

  try {
    const url =
      new URL(request.url);

    const id =
      url.searchParams.get(
        "id"
      );

    if (!id) {
      return NextResponse.json(
        {
          message:
            "معرف الإنتاج مطلوب",
        },
        {
          status: 400,
        }
      );
    }

    // =================================================
    // Delete
    // =================================================

    await prisma.production.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      message:
        "تم الحذف بنجاح",
    });
  } catch (error) {
    console.error(
      "Error deleting production:",
      error
    );

    return NextResponse.json(
      {
        message:
          "حدث خطأ في الخادم",
      },
      {
        status: 500,
      }
    );
  }
}