import { NextResponse } from "next/server";
import PDFDocument from "pdfkit";
import { Resend } from "resend";
import { requireAdmin } from "@/lib/admin-auth";

export const runtime = "nodejs";

type OrderItem = {
  product_name: string;
  size: string;
  color: string;
  quantity: number;
  unit_price: number;
  total: number;
};

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
    const clientOrder = body.order;

    if (!clientOrder?.id) {
      return NextResponse.json(
        { error: "Order ID is required." },
        { status: 400 }
      );
    }

    const { data: orderData, error: orderError } = await adminCheck.supabase
      .from("orders")
      .select(`
        id,
        order_id,
        subtotal,
        offer_discount,
        coupon_discount,
        delivery_charge,
        total,
        payment_status,
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

    const order = {
      ...orderData,
      customer: Array.isArray(orderData.customer)
        ? orderData.customer[0]
        : orderData.customer,
      items: orderData.items || [],
    };

    if (order.payment_status !== "verified") {
      return NextResponse.json(
        { error: "Payment is not verified." },
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
      return NextResponse.json(
        {
          success: true,
          alreadySent: true,
          message: "Payment confirmation email already sent.",
        },
        { status: 200 }
      );
    }

    if (!order.customer?.email) {
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

    const items = (order.items || []) as OrderItem[];

    const pdf = await new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({
        size: "A4",
        margin: 50,
      });

      const chunks: Buffer[] = [];

      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      doc.fontSize(22).font("Helvetica-Bold").text("MODEL TOWN GARMENTS");

      doc
        .fontSize(10)
        .font("Helvetica")
        .text("Jama Masjid Road, Joya, Amroha, Uttar Pradesh")
        .text("Phone: 9917001830");

      doc.moveDown();
      doc.fontSize(16).font("Helvetica-Bold").text("TAX INVOICE");

      doc.moveDown();

      doc
        .fontSize(10)
        .font("Helvetica")
        .text(`Order ID: ${order.order_id}`)
        .text(
          `Order Date: ${new Date(order.created_at).toLocaleString("en-IN")}`
        )
        .text(`Payment Status: ${order.payment_status}`);

      doc.moveDown();

      doc.font("Helvetica-Bold").text("Customer");
      doc.font("Helvetica").text(order.customer.name || "Customer");

      if (order.customer.email) {
        doc.text(order.customer.email);
      }

      if (order.customer.phone) {
        doc.text(order.customer.phone);
      }

      if (order.customer.address) {
        doc.text(
          `${order.customer.address}, ${order.customer.city || ""}, ${
            order.customer.state || ""
          } - ${order.customer.pincode || ""}`
        );
      }

      doc.moveDown();

      doc.font("Helvetica-Bold").text("Order Items");
      doc.moveDown(0.5);

      items.forEach((item) => {
        doc
          .font("Helvetica")
          .text(
            `${item.product_name} | Size: ${item.size} | Color: ${item.color}`
          )
          .text(
            `Qty: ${item.quantity} × ₹${Number(item.unit_price).toFixed(2)} = ₹${Number(item.total).toFixed(2)}`
          );

        doc.moveDown(0.5);
      });

      doc.moveDown();

      doc.font("Helvetica-Bold").text("Payment Summary");

      doc
        .font("Helvetica")
        .text(`Subtotal: ₹${Number(order.subtotal || 0).toFixed(2)}`)
        .text(
          `Offer Discount: -₹${Number(order.offer_discount || 0).toFixed(2)}`
        )
        .text(
          `Coupon Discount: -₹${Number(order.coupon_discount || 0).toFixed(2)}`
        )
        .text(
          `Delivery: ₹${Number(order.delivery_charge || 0).toFixed(2)}`
        );

      doc.moveDown();

      doc
        .fontSize(14)
        .font("Helvetica-Bold")
        .text(`TOTAL PAID: ₹${Number(order.total || 0).toFixed(2)}`);

      doc.moveDown(2);

      doc
        .fontSize(9)
        .font("Helvetica")
        .text("Thank you for shopping with Model Town Garments.")
        .text("This is a computer-generated invoice.");

      doc.end();
    });

    const resend = new Resend(resendKey);

    const { error } = await resend.emails.send({
      from: "Model Town Garments <no-reply@modeltowngarments.shop>",
      to: [order.customer.email],
      subject: `Payment Confirmed — Order ${order.order_id}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:650px;margin:auto;color:#172033">
          <div style="background:#102a56;padding:28px;border-radius:16px 16px 0 0;color:white">
            <h1 style="margin:0;font-size:24px">MODEL TOWN GARMENTS</h1>
            <p style="margin:8px 0 0;opacity:.8">Payment Confirmation</p>
          </div>

          <div style="padding:28px;border:1px solid #e5e7eb;border-top:0">
            <h2 style="margin-top:0">Payment Successful</h2>

            <p>
              Your payment for order
              <strong>${order.order_id}</strong>
              has been verified successfully.
            </p>

            <div style="background:#f7f9fc;padding:18px;border-radius:12px;margin:20px 0">
              <p><strong>Order ID:</strong> ${order.order_id}</p>
              <p><strong>Payment Status:</strong> Verified</p>
              <p><strong>Total Paid:</strong> ₹${Number(order.total).toFixed(2)}</p>
            </div>

            <h3>Order Items</h3>

            ${items
              .map(
                (item) => `
                  <div style="padding:10px 0;border-bottom:1px solid #eee">
                    <strong>${item.product_name}</strong><br>
                    Size: ${item.size} · Color: ${item.color} · Qty: ${item.quantity}<br>
                    ₹${Number(item.total).toFixed(2)}
                  </div>
                `
              )
              .join("")}

            <p style="margin-top:24px">
              Your invoice is attached to this email.
            </p>

            <p style="color:#64748b;font-size:13px">
              Model Town Garments<br>
              Jama Masjid Road, Joya, Amroha, Uttar Pradesh<br>
              Phone: 9917001830
            </p>
          </div>
        </div>
      `,
      attachments: [
        {
          filename: `Invoice-${order.order_id}.pdf`,
          content: pdf.toString("base64"),
        },
      ],
    });

    if (error) {
      console.error("Resend error:", error);

      return NextResponse.json(
        { error: "Email could not be sent." },
        { status: 500 }
      );
    }

    const { error: markSentError } = await adminCheck.supabase
      .from("orders")
      .update({
        payment_confirmation_sent_at: new Date().toISOString(),
      })
      .eq("id", order.id)
      .is("payment_confirmation_sent_at", null);

    if (markSentError) {
      console.error("Failed to mark payment email as sent:", markSentError);
      return NextResponse.json(
        { error: "Email sent, but order status could not be updated." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Payment confirmation email sent.",
    });
  } catch (error) {
    console.error("Payment email error:", error);

    return NextResponse.json(
      { error: "Unable to send payment confirmation email." },
      { status: 500 }
    );
  }
}
