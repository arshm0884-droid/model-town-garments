import { NextResponse } from "next/server";
import { Resend } from "resend";
import { requireAdmin } from "@/lib/admin-auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const adminCheck = await requireAdmin();

    if (!adminCheck.authorized) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 }
      );
    }

    const { orderId } = await request.json();

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required." },
        { status: 400 }
      );
    }

    const { data: order, error } = await adminCheck.supabase
      .from("orders")
      .select(`
        id,
        order_id,
        total,
        order_status,
        delivered_email_sent_at,
        customer:customers(
          name,
          email
        )
      `)
      .eq("id", orderId)
      .single();

    if (error || !order) {
      return NextResponse.json(
        { error: "Order not found." },
        { status: 404 }
      );
    }

    if (order.order_status !== "delivered") {
      return NextResponse.json(
        { error: "Order is not marked as delivered." },
        { status: 400 }
      );
    }

    if (order.delivered_email_sent_at) {
      return NextResponse.json({
        success: true,
        alreadySent: true,
        message: "Delivery email already sent.",
      });
    }

    const customer = Array.isArray(order.customer)
      ? order.customer[0]
      : order.customer;

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

    const resend = new Resend(resendKey);

    const { error: emailError } =
      await resend.emails.send({
        from:
          "Model Town Garments <no-reply@modeltowngarments.shop>",
        to: [customer.email],
        subject: `Order Delivered — ${order.order_id}`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:650px;margin:auto;color:#172033">
            <div style="background:#102a56;padding:28px;border-radius:16px 16px 0 0;color:white">
              <h1 style="margin:0;font-size:24px">
                MODEL TOWN GARMENTS
              </h1>
              <p style="margin:8px 0 0;opacity:.8">
                Delivery Confirmation
              </p>
            </div>

            <div style="padding:28px;border:1px solid #e5e7eb;border-top:0">
              <h2 style="margin-top:0">
                Your order has been delivered
              </h2>

              <p>
                Hi ${customer.name || "Customer"},
              </p>

              <p>
                Your order
                <strong>${order.order_id}</strong>
                has been successfully delivered.
              </p>

              <div style="background:#f7f9fc;padding:18px;border-radius:12px;margin:20px 0">
                <p>
                  <strong>Order ID:</strong>
                  ${order.order_id}
                </p>

                <p>
                  <strong>Order Status:</strong>
                  Delivered
                </p>

                <p>
                  <strong>Total:</strong>
                  ₹${Number(order.total || 0).toFixed(2)}
                </p>

                <p>
                  <strong>Delivered At:</strong>
                  ${new Date().toLocaleString("en-IN", {
                    timeZone: "Asia/Kolkata",
                  })}
                </p>
              </div>

              <p>
                Thank you for shopping with
                <strong>Model Town Garments</strong>.
              </p>

              <p style="color:#64748b;font-size:13px">
                Model Town Garments<br>
                Jama Masjid Road, Joya, Amroha, Uttar Pradesh<br>
                Phone: 9917001830
              </p>
            </div>
          </div>
        `,
      });

    if (emailError) {
      console.error("Delivered email error:", emailError);

      return NextResponse.json(
        { error: "Delivery email could not be sent." },
        { status: 500 }
      );
    }

    const { error: markSentError } =
      await adminCheck.supabase
        .from("orders")
        .update({
          delivered_email_sent_at:
            new Date().toISOString(),
        })
        .eq("id", order.id)
        .is("delivered_email_sent_at", null);

    if (markSentError) {
      console.error(
        "Failed to mark delivery email:",
        markSentError
      );

      return NextResponse.json(
        {
          error:
            "Email sent, but delivery email status could not be saved.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Delivery confirmation email sent.",
    });
  } catch (error) {
    console.error("Delivered email API error:", error);

    return NextResponse.json(
      { error: "Unable to send delivery email." },
      { status: 500 }
    );
  }
}
