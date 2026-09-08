import { NextResponse } from "next/server";
import PDFDocument from "pdfkit";
import { Resend } from "resend";
import { requireAdmin } from "@/lib/admin-auth";

export const runtime = "nodejs";

type OrderItem = {
  product_name: string;
  size?: string | null;
  color?: string | null;
  quantity: number;
  unit_price: number;
  total: number;
};

function money(value: unknown) {
  return `₹${Number(value || 0).toFixed(2)}`;
}

function safe(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function POST(request: Request) {
  try {
    const adminCheck = await requireAdmin();

    if (!adminCheck.authorized) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const clientOrder = body?.order;

    if (!clientOrder?.id) {
      return NextResponse.json(
        { error: "Order ID is required." },
        { status: 400 }
      );
    }

    const { data: orderData, error: orderError } =
      await adminCheck.supabase
        .from("orders")
        .select(`
          id,
          order_id,
          subtotal,
          offer_discount,
          coupon_discount,
          delivery_charge,
          total,
          payment_method,
          payment_status,
          payment_reference,
          payment_verified_at,
          payment_amount,
          payment_method_details,
          payment_confirmation_sent_at,
          created_at,
          customer:customers(
            id,
            name,
            email,
            phone,
            address,
            city,
            state,
            pincode
          ),
          items:order_items(
            product_name,
            size,
            color,
            quantity,
            unit_price,
            total
          )
        `)
        .eq("id", clientOrder.id)
        .single();

    if (orderError || !orderData) {
      return NextResponse.json(
        { error: "Order not found." },
        { status: 404 }
      );
    }

    const customer = Array.isArray(orderData.customer)
      ? orderData.customer[0]
      : orderData.customer;

    const items = (orderData.items || []) as OrderItem[];

    const order = {
      ...orderData,
      customer,
      items,
    };

    if (order.payment_status !== "verified") {
      return NextResponse.json(
        { error: "Payment is not verified yet." },
        { status: 400 }
      );
    }

    if (clientOrder.payment_status !== "verified") {
      return NextResponse.json(
        { error: "Invalid payment confirmation request." },
        { status: 400 }
      );
    }

    if (order.payment_confirmation_sent_at) {
      return NextResponse.json({
        success: true,
        alreadySent: true,
        message: "Payment confirmation email already sent.",
      });
    }

    if (!customer?.email) {
      return NextResponse.json(
        { error: "Customer email is missing." },
        { status: 400 }
      );
    }

    const resendKey = process.env.RESEND_API_KEY;

    if (!resendKey) {
      return NextResponse.json(
        { error: "RESEND_API_KEY is not configured." },
        { status: 500 }
      );
    }

    const customerName = customer.name || "Valued Customer";
    const firstName = String(customerName).trim().split(/\s+/)[0] || "Customer";

    const createdDate = new Date(order.created_at);

    const paymentDate = order.payment_verified_at
      ? new Date(order.payment_verified_at)
      : new Date();

    const formattedOrderDate = createdDate.toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      dateStyle: "medium",
      timeStyle: "short",
    });

    const formattedPaymentDate = paymentDate.toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      dateStyle: "medium",
      timeStyle: "short",
    });

    const subtotal = Number(order.subtotal || 0);
    const offerDiscount = Number(order.offer_discount || 0);
    const couponDiscount = Number(order.coupon_discount || 0);
    const delivery = Number(order.delivery_charge || 0);
    const total = Number(order.total || 0);
    const paidAmount = Number(order.payment_amount || total);

    /*
     * PREMIUM PDF
     */
    const pdf = await new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({
        size: "A4",
        margin: 42,
        info: {
          Title: `Order Invoice - ${order.order_id}`,
          Author: "Model Town Garments",
          Subject: "Payment Confirmation & Order Invoice",
        },
      });

      const chunks: Buffer[] = [];

      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const pageWidth = 595.28;
      const left = 42;
      const right = pageWidth - 42;
      const contentWidth = right - left;

      // Header gradient-style layered branding
      doc
        .rect(0, 0, pageWidth, 128)
        .fill("#102A56");

      doc
        .rect(0, 108, pageWidth, 20)
        .fill("#D4A72C");

      doc
        .fillColor("#FFFFFF")
        .font("Helvetica-Bold")
        .fontSize(23)
        .text("MODEL TOWN", left, 30);

      doc
        .fontSize(23)
        .text("GARMENTS", left, 56);

      doc
        .fillColor("#DCE7FF")
        .font("Helvetica")
        .fontSize(9)
        .text(
          "Jama Masjid Road, Joya, Amroha, Uttar Pradesh",
          left,
          88
        );

      doc
        .fontSize(9)
        .text(
          "Phone / WhatsApp: 9917001830  •  modeltowngarments.shop",
          left,
          101
        );

      // Confirmation badge
      doc
        .roundedRect(405, 35, 145, 48, 10)
        .fill("#FFFFFF");

      doc
        .fillColor("#102A56")
        .font("Helvetica-Bold")
        .fontSize(11)
        .text("PAYMENT", 418, 45);

      doc
        .fillColor("#16845B")
        .fontSize(15)
        .text("CONFIRMED", 418, 61);

      // Title
      doc
        .fillColor("#102A56")
        .font("Helvetica-Bold")
        .fontSize(21)
        .text("Order Invoice", left, 155);

      doc
        .fillColor("#64748B")
        .font("Helvetica")
        .fontSize(9)
        .text(
          "Thank you for choosing Model Town Garments.",
          left,
          182
        );

      // Order information card
      doc
        .roundedRect(left, 205, contentWidth, 68, 10)
        .fill("#F3F6FA");

      doc
        .fillColor("#64748B")
        .font("Helvetica-Bold")
        .fontSize(8)
        .text("ORDER ID", left + 15, 219);

      doc
        .fillColor("#102A56")
        .fontSize(12)
        .text(order.order_id, left + 15, 234);

      doc
        .fillColor("#64748B")
        .fontSize(8)
        .text("ORDER DATE", 250, 219);

      doc
        .fillColor("#102A56")
        .font("Helvetica-Bold")
        .fontSize(10)
        .text(formattedOrderDate, 250, 234);

      doc
        .fillColor("#64748B")
        .fontSize(8)
        .text("PAYMENT STATUS", 420, 219);

      doc
        .fillColor("#16845B")
        .fontSize(10)
        .text("VERIFIED", 420, 234);

      // Customer section
      doc
        .fillColor("#102A56")
        .font("Helvetica-Bold")
        .fontSize(14)
        .text("Customer Details", left, 302);

      doc
        .roundedRect(left, 325, contentWidth, 92, 10)
        .fill("#F8FAFC");

      doc
        .fillColor("#172033")
        .font("Helvetica-Bold")
        .fontSize(11)
        .text(customerName, left + 15, 340);

      doc
        .font("Helvetica")
        .fontSize(9)
        .fillColor("#475569")
        .text(customer.email || "", left + 15, 358);

      doc.text(customer.phone || "", left + 15, 373);

      const address = [
        customer.address,
        customer.city,
        customer.state,
        customer.pincode
          ? `- ${customer.pincode}`
          : "",
      ]
        .filter(Boolean)
        .join(", ");

      doc.text(address, left + 15, 389, {
        width: contentWidth - 30,
      });

      // Items heading
      doc
        .fillColor("#102A56")
        .font("Helvetica-Bold")
        .fontSize(14)
        .text("Your Purchase", left, 445);

      // Table header
      let y = 470;

      doc
        .roundedRect(left, y, contentWidth, 28, 6)
        .fill("#102A56");

      doc
        .fillColor("#FFFFFF")
        .font("Helvetica-Bold")
        .fontSize(8)
        .text("PRODUCT", left + 10, y + 9);

      doc.text("QTY", 345, y + 9);
      doc.text("PRICE", 390, y + 9);
      doc.text("TOTAL", 475, y + 9);

      y += 35;

      items.forEach((item) => {
        if (y > 690) {
          doc.addPage();
          y = 50;
        }

        const rowHeight = 46;

        doc
          .roundedRect(left, y, contentWidth, rowHeight, 5)
          .fill("#F8FAFC");

        doc
          .fillColor("#172033")
          .font("Helvetica-Bold")
          .fontSize(9)
          .text(
            item.product_name || "Product",
            left + 10,
            y + 8,
            { width: 215 }
          );

        doc
          .fillColor("#64748B")
          .font("Helvetica")
          .fontSize(7)
          .text(
            `Size: ${item.size || "-"}  •  Color: ${item.color || "-"}`,
            left + 10,
            y + 25,
            { width: 215 }
          );

        doc
          .fillColor("#172033")
          .fontSize(9)
          .text(String(item.quantity || 0), 350, y + 16);

        doc.text(money(item.unit_price), 390, y + 16);
        doc
          .font("Helvetica-Bold")
          .text(money(item.total), 475, y + 16);

        y += rowHeight + 6;
      });

      // Summary
      if (y > 650) {
        doc.addPage();
        y = 55;
      }

      y += 10;

      doc
        .fillColor("#102A56")
        .font("Helvetica-Bold")
        .fontSize(14)
        .text("Payment Summary", left, y);

      y += 25;

      const summaryX = 330;
      const valueX = 465;

      const summaryRow = (
        label: string,
        value: string,
        valueColor = "#172033"
      ) => {
        doc
          .fillColor("#64748B")
          .font("Helvetica")
          .fontSize(9)
          .text(label, summaryX, y);

        doc
          .fillColor(valueColor)
          .font("Helvetica-Bold")
          .text(value, valueX, y);

        y += 19;
      };

      summaryRow("Subtotal", money(subtotal));
      summaryRow(
        "Offer Discount",
        `-${money(offerDiscount)}`,
        "#16845B"
      );
      summaryRow(
        "Coupon Discount",
        `-${money(couponDiscount)}`,
        "#16845B"
      );
      summaryRow("Delivery", money(delivery));

      y += 4;

      doc
        .roundedRect(summaryX - 12, y, 225, 42, 8)
        .fill("#102A56");

      doc
        .fillColor("#FFFFFF")
        .font("Helvetica-Bold")
        .fontSize(10)
        .text("TOTAL PAID", summaryX, y + 14);

      doc
        .fontSize(14)
        .text(money(total), valueX, y + 12);

      y += 62;

      // Payment details
      if (y > 705) {
        doc.addPage();
        y = 55;
      }

      doc
        .fillColor("#102A56")
        .font("Helvetica-Bold")
        .fontSize(14)
        .text("Payment Details", left, y);

      y += 23;

      doc
        .roundedRect(left, y, contentWidth, 82, 10)
        .fill("#EEF7F3");

      doc
        .fillColor("#475569")
        .font("Helvetica")
        .fontSize(8)
        .text("PAYMENT STATUS", left + 15, y + 13);

      doc
        .fillColor("#16845B")
        .font("Helvetica-Bold")
        .fontSize(10)
        .text("VERIFIED", left + 15, y + 28);

      doc
        .fillColor("#475569")
        .font("Helvetica")
        .fontSize(8)
        .text("AMOUNT PAID", 190, y + 13);

      doc
        .fillColor("#172033")
        .font("Helvetica-Bold")
        .fontSize(10)
        .text(money(paidAmount), 190, y + 28);

      doc
        .fillColor("#475569")
        .font("Helvetica")
        .fontSize(8)
        .text("PAYMENT METHOD", 330, y + 13);

      doc
        .fillColor("#172033")
        .font("Helvetica-Bold")
        .fontSize(9)
        .text(
          order.payment_method_details ||
            order.payment_method ||
            "UPI / WhatsApp",
          330,
          y + 28,
          { width: 105 }
        );

      doc
        .fillColor("#475569")
        .font("Helvetica")
        .fontSize(8)
        .text("PAYMENT DATE", left + 15, y + 55);

      doc
        .fillColor("#172033")
        .font("Helvetica-Bold")
        .fontSize(8)
        .text(formattedPaymentDate, left + 15, y + 68);

      doc
        .fillColor("#475569")
        .font("Helvetica")
        .fontSize(8)
        .text("UTR / TRANSACTION ID", 330, y + 55);

      doc
        .fillColor("#172033")
        .font("Helvetica-Bold")
        .fontSize(8)
        .text(
          order.payment_reference || "Not provided",
          330,
          y + 68,
          { width: 170 }
        );

      y += 105;

      // Personalized customer message
      if (y > 710) {
        doc.addPage();
        y = 55;
      }

      doc
        .roundedRect(left, y, contentWidth, 105, 12)
        .fill("#FFF8E8");

      doc
        .fillColor("#A06A00")
        .font("Helvetica-Bold")
        .fontSize(13)
        .text(`Thank you, ${firstName}!`, left + 17, y + 16);

      doc
        .fillColor("#475569")
        .font("Helvetica")
        .fontSize(9)
        .text(
          "Your payment has been successfully verified and your order is now confirmed.",
          left + 17,
          y + 40,
          { width: contentWidth - 34 }
        );

      doc.text(
        "We are preparing your order with care. You can check your latest order status from your Model Town Garments account.",
        left + 17,
        y + 57,
        { width: contentWidth - 34 }
      );

      doc
        .fillColor("#102A56")
        .font("Helvetica-Bold")
        .fontSize(9)
        .text(
          "We look forward to serving you again. ❤️",
          left + 17,
          y + 82
        );

      y += 128;

      // Delivery address
      if (y > 710) {
        doc.addPage();
        y = 55;
      }

      doc
        .fillColor("#102A56")
        .font("Helvetica-Bold")
        .fontSize(13)
        .text("Delivery Address", left, y);

      y += 21;

      doc
        .fillColor("#475569")
        .font("Helvetica")
        .fontSize(9)
        .text(address || "Address not available", left, y, {
          width: contentWidth,
        });

      // Footer
      const footerY = 780;

      doc
        .moveTo(left, footerY - 15)
        .lineTo(right, footerY - 15)
        .strokeColor("#D4A72C")
        .lineWidth(2)
        .stroke();

      doc
        .fillColor("#102A56")
        .font("Helvetica-Bold")
        .fontSize(9)
        .text(
          "MODEL TOWN GARMENTS",
          left,
          footerY
        );

      doc
        .fillColor("#64748B")
        .font("Helvetica")
        .fontSize(7)
        .text(
          "Jama Masjid Road, Joya, Amroha, Uttar Pradesh",
          left,
          footerY + 14
        );

      doc
        .text(
          "Website: modeltowngarments.shop  •  WhatsApp: 9917001830",
          left,
          footerY + 25
        );

      doc
        .fillColor("#94A3B8")
        .fontSize(7)
        .text(
          "This is a computer-generated payment confirmation and order invoice.",
          left,
          footerY + 42,
          { align: "center", width: contentWidth }
        );

      doc.end();
    });

    /*
     * PREMIUM EMAIL
     */
    const itemHtml = items
      .map(
        (item) => `
          <tr>
            <td style="padding:16px 10px;border-bottom:1px solid #e8edf3;">
              <div style="font-weight:800;color:#102a56;font-size:14px;">
                ${safe(item.product_name || "Product")}
              </div>
              <div style="font-size:12px;color:#64748b;margin-top:5px;">
                Size: ${safe(item.size || "-")}
                &nbsp; • &nbsp;
                Color: ${safe(item.color || "-")}
              </div>
            </td>
            <td style="padding:16px 8px;text-align:center;border-bottom:1px solid #e8edf3;">
              ${Number(item.quantity || 0)}
            </td>
            <td style="padding:16px 8px;text-align:right;border-bottom:1px solid #e8edf3;">
              ${money(item.unit_price)}
            </td>
            <td style="padding:16px 8px;text-align:right;border-bottom:1px solid #e8edf3;font-weight:800;">
              ${money(item.total)}
            </td>
          </tr>
        `
      )
      .join("");

    const resend = new Resend(resendKey);

    const { error: emailError } = await resend.emails.send({
      from: "Model Town Garments <no-reply@modeltowngarments.shop>",
      to: [customer.email],
      subject: `Payment Confirmed • ${order.order_id} • Model Town Garments`,
      html: `
<!doctype html>
<html>
<body style="margin:0;background:#f3f6fa;font-family:Arial,Helvetica,sans-serif;color:#172033;">
  <div style="max-width:720px;margin:auto;padding:20px 10px;">

    <div style="background:#102a56;border-radius:20px 20px 0 0;padding:34px;color:white;">
      <div style="font-size:12px;letter-spacing:3px;font-weight:800;color:#d4a72c;">
        MODEL TOWN GARMENTS
      </div>

      <div style="font-size:30px;font-weight:900;margin-top:10px;">
        Payment Confirmed
      </div>

      <div style="font-size:14px;color:#dbe7ff;margin-top:8px;">
        Your order is now successfully confirmed.
      </div>
    </div>

    <div style="background:white;padding:30px;border-radius:0 0 20px 20px;">

      <h2 style="margin:0;color:#102a56;">
        Thank you, ${safe(firstName)}! 🎉
      </h2>

      <p style="color:#64748b;line-height:1.7;">
        Your payment has been successfully verified and your order
        <strong>${safe(order.order_id)}</strong> is now confirmed.
        We are preparing it with care.
      </p>

      <div style="background:#eef7f3;border:1px solid #cde9dc;border-radius:14px;padding:18px;margin:22px 0;">
        <div style="color:#16845b;font-size:12px;font-weight:800;">
          PAYMENT VERIFIED
        </div>
        <div style="font-size:25px;font-weight:900;color:#102a56;margin-top:5px;">
          ${money(paidAmount)}
        </div>
        <div style="font-size:12px;color:#64748b;margin-top:5px;">
          UTR: ${safe(order.payment_reference || "Not provided")}
        </div>
        <div style="font-size:12px;color:#64748b;">
          ${safe(formattedPaymentDate)}
        </div>
      </div>

      <h3 style="color:#102a56;margin-top:28px;">
        Order Details
      </h3>

      <table width="100%" cellpadding="0" cellspacing="0"
        style="border-collapse:collapse;font-size:13px;">
        <tr style="background:#102a56;color:white;">
          <th style="padding:12px;text-align:left;">Product</th>
          <th style="padding:12px;">Qty</th>
          <th style="padding:12px;text-align:right;">Price</th>
          <th style="padding:12px;text-align:right;">Total</th>
        </tr>

        ${itemHtml}
      </table>

      <div style="margin-top:24px;border-top:1px solid #e8edf3;padding-top:18px;">
        <table width="100%" style="font-size:14px;">
          <tr>
            <td style="padding:6px;color:#64748b;">Subtotal</td>
            <td style="padding:6px;text-align:right;">${money(subtotal)}</td>
          </tr>

          <tr>
            <td style="padding:6px;color:#16845b;">Offer Discount</td>
            <td style="padding:6px;text-align:right;color:#16845b;">
              -${money(offerDiscount)}
            </td>
          </tr>

          <tr>
            <td style="padding:6px;color:#16845b;">Coupon Discount</td>
            <td style="padding:6px;text-align:right;color:#16845b;">
              -${money(couponDiscount)}
            </td>
          </tr>

          <tr>
            <td style="padding:6px;color:#64748b;">Delivery</td>
            <td style="padding:6px;text-align:right;">${money(delivery)}</td>
          </tr>

          <tr>
            <td style="padding:14px 6px;font-size:18px;font-weight:900;color:#102a56;">
              TOTAL PAID
            </td>
            <td style="padding:14px 6px;text-align:right;font-size:20px;font-weight:900;color:#102a56;">
              ${money(total)}
            </td>
          </tr>
        </table>
      </div>

      <div style="background:#f8fafc;border-radius:14px;padding:18px;margin-top:20px;">
        <strong style="color:#102a56;">Delivery Address</strong>
        <div style="color:#64748b;line-height:1.7;margin-top:7px;">
          ${safe(customer.address || "")}<br>
          ${safe(customer.city || "")}${customer.city && customer.state ? ", " : ""}
          ${safe(customer.state || "")}
          ${customer.pincode ? ` - ${safe(customer.pincode)}` : ""}
        </div>
      </div>

      <div style="background:#fff8e8;border-radius:14px;padding:20px;margin-top:20px;">
        <strong style="color:#a06a00;font-size:16px;">
          What's next?
        </strong>

        <p style="color:#475569;line-height:1.7;margin-bottom:0;">
          Your order is confirmed. You can follow its progress from
          <strong>My Orders</strong> in your Model Town Garments account.
          We will keep your order status updated as it moves through
          packing, shipping and delivery.
        </p>
      </div>

      <div style="text-align:center;margin-top:28px;padding-top:20px;border-top:1px solid #e8edf3;">
        <div style="font-size:15px;font-weight:900;color:#102a56;">
          Model Town Garments
        </div>

        <div style="font-size:12px;color:#64748b;margin-top:5px;">
          Jama Masjid Road, Joya, Amroha, Uttar Pradesh
        </div>

        <div style="font-size:12px;color:#64748b;">
          WhatsApp: 9917001830 • modeltowngarments.shop
        </div>

        <div style="font-size:11px;color:#94a3b8;margin-top:14px;">
          Your premium invoice is attached to this email.
        </div>
      </div>

    </div>
  </div>
</body>
</html>
      `,
      attachments: [
        {
          filename: `Model-Town-Garments-Invoice-${order.order_id}.pdf`,
          content: pdf.toString("base64"),
        },
      ],
    });

    if (emailError) {
      console.error("Resend payment confirmation error:", emailError);

      return NextResponse.json(
        { error: "Payment confirmation email could not be sent." },
        { status: 500 }
      );
    }

    const { error: markSentError } =
      await adminCheck.supabase
        .from("orders")
        .update({
          payment_confirmation_sent_at: new Date().toISOString(),
        })
        .eq("id", order.id)
        .is("payment_confirmation_sent_at", null);

    if (markSentError) {
      console.error(
        "Failed to mark payment confirmation email as sent:",
        markSentError
      );
    }

    return NextResponse.json({
      success: true,
      message: "Premium payment confirmation email and invoice sent.",
    });
  } catch (error) {
    console.error("Payment confirmation email error:", error);

    return NextResponse.json(
      { error: "Unable to send payment confirmation invoice." },
      { status: 500 }
    );
  }
}
