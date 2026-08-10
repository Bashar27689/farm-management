// src/app/api/invoice-pdf/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { getCurrentUser } from "../../../lib/auth";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";

// =============================
// Convert Image To Base64
// =============================
function getImageBase64(filePath: string) {
  try {
    const absolutePath = path.join(
      process.cwd(),
      filePath
    );

    if (!fs.existsSync(absolutePath)) {
      return "";
    }

    const buffer = fs.readFileSync(absolutePath);

    const ext = path
      .extname(filePath)
      .replace(".", "")
      .toLowerCase();

    return `data:image/${ext};base64,${buffer.toString(
      "base64"
    )}`;

  } catch {
    return "";
  }
}


// =============================
// Load Cairo Font
// =============================
function getFontBase64() {
  try {

    const fontPath = path.join(
      process.cwd(),
      "public/fonts/Cairo-Regular.ttf"
    );

    const font = fs.readFileSync(fontPath);

    return font.toString("base64");

  } catch {
    return "";
  }
}


// =============================
// POST
// =============================
export async function POST(
  request: NextRequest
) {

  try {
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


    const {
      invoiceId
    } = await request.json();


    if (!invoiceId) {

      return NextResponse.json(
        {
          message:
          "معرف الفاتورة مطلوب"
        },
        {
          status:400
        }
      );

    }



    const invoice =
      await prisma.invoice.findUnique({

        where:{
          id: invoiceId
        },

        include:{
          customer:true,
          sales:true
        }

      });



    if(!invoice){

      return NextResponse.json(
        {
          message:
          "الفاتورة غير موجودة"
        },
        {
          status:404
        }
      );

    }



    let items:any={};

    try {

      items =
        typeof invoice.items === "string"
        ?
        JSON.parse(invoice.items)
        :
        invoice.items;


    }catch{

      items={
        shopName:"بيض",
        trayCount:0,
        pricePerTray:0
      };

    }



    const total =
      (items.trayCount || 0)
      *
      (items.pricePerTray || 0);



    const logo =
      getImageBase64(
        "public/assets/farm Logo.png"
      );


    const signature =
      getImageBase64(
        "public/assets/signature.png"
      );


    const font =
      getFontBase64();



    const date =
      new Date(invoice.date)
      .toLocaleDateString(
        "ar-EG",
        {
          year:"numeric",
          month:"long",
          day:"numeric"
        }
      );




    const html = `

<!DOCTYPE html>

<html lang="ar" dir="rtl">

<head>

<meta charset="UTF-8">

<style>


@font-face {

font-family:Cairo;

src:url(data:font/ttf;base64,${font});

}


*{

box-sizing:border-box;

}


body{

font-family:Cairo;
direction:rtl;
padding:5px;
color:#333;

}



.header{

display:flex;
justify-content:space-between;
align-items:center;

border-bottom:
2px solid #1B5E20;

padding-bottom:20px;

}


.logo{

width:100px;
height:100px;
object-fit:contain;

}



.title{

text-align:right;

}



.title h1{

color:#1B5E20;
font-size:28px;

}



.info{

display:flex;
justify-content:space-between;

margin-top:20px;

}



.section{

margin-top:25px;

font-size:20px;
font-weight:bold;
color:#1B5E20;

}



.customer{

background:#f5f5f5;

padding:15px;

margin-top:10px;

}



table{

width:100%;

border-collapse:collapse;

margin-top:20px;

}



th{

background:#1B5E20;
color:white;

padding:10px;

}



td{

padding:10px;

border-bottom:1px solid #ddd;

text-align:center;

}



.total{

margin-top:30px;

font-size:22px;

font-weight:bold;

color:#1B5E20;

text-align:left;

}



.signature{

margin-top:70px;

text-align:center;

}



.signature img{

width:100%;

height:100%;

object-fit:contain;

}






</style>

</head>



<body>



<div class="header">


<div>

${
logo
?
`<img class="logo" src="${logo}">`
:
""
}


</div>



<div class="title">

<h1>
فاتورة مبيعات
</h1>
</div>


</div>




<div class="info">

<div>
التاريخ:
${date}
</div>


<div>
رقم الفاتورة:
${invoice.number}
</div>


</div>




<div class="section">

بيانات العميل

</div>


<div class="customer">

<div>
الاسم:
${invoice.customer?.name ?? ""}
</div>


<div>
الهاتف:
${invoice.customer?.phone ?? ""}
</div>
</div>





<div class="section">

تفاصيل الفاتورة

</div>



<table>


<tr>

<th>
اسم الدكان
</th>


<th>
الكمية
</th>


<th>
السعر
</th>


<th>
المجموع
</th>


</tr>



<tr>


<td>
${items.shopName ?? "بيض"}
</td>


<td>
${items.trayCount ?? 0}
</td>


<td>
${items.pricePerTray ?? 0}
</td>


<td>
${total}
</td>


</tr>


</table>




<div class="total">

المجموع الكلي:
${invoice.total}
ل.س

</div>




<div class="signature">


${
signature
?
`<img src="${signature}">`
:
""
}


</div>


</body>

</html>

`;

const { default: puppeteer } = await import("puppeteer");

    const browser = await puppeteer.launch({
  
  headless: true,
  args:[
    "--no-sandbox",
    "--disable-setuid-sandbox"
  ]
});


    const page =
      await browser.newPage();



    await page.setContent(
      html,
      {
        waitUntil:"load"
      }
    );



    const pdf =
      await page.pdf({

        format:"A4",

        printBackground:true

      });



    await browser.close();



    return new NextResponse(
      Buffer.from(pdf),
      {

        headers:{

          "Content-Type":
          "application/pdf",

          "Content-Disposition":
          `attachment; filename=invoice-${invoice.number}.pdf`

        }

      }
    );



  }

  catch(error){

    console.error(
      "PDF Error:",
      error
    );


    return NextResponse.json(
      {
        message:
        "حدث خطأ أثناء إنشاء PDF",

        error:
        (error as Error).message
      },
      {
        status:500
      }
    );

  }

}