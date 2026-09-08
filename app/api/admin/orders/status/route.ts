import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { Resend } from "resend";

const allowedStatuses = [
  "pending",
  "confirmed",
  "packed",
  "shipped",
  "out_for_delivery",
  "delivered",
  "cancelled",
  "returned",
];

const flow = [
  "pending",
  "confirmed",
  "packed",
  "shipped",
  "out_for_delivery",
  "delivered",
];

export async function POST(request: Request) {
  try {
    const adminCheck = await requireAdmin();

    if (!adminCheck.authorized) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 }
      );
    }

    const { orderId, orderStatus, note } = await request.json();

    if (!orderId || !orderStatus) {
      return NextResponse.json(
        { error: "Order ID and status are required." },
        { status: 400 }
      );
    }

    if (!allowedStatuses.includes(orderStatus)) {
      return NextResponse.json(
        { error: "Invalid order status." },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, order_id, order_status, payment_status, total, delivered_email_sent_at, customer:customers(name, email)")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: "Order not found." },
        { status: 404 }
      );
    }

    if (order.order_status === orderStatus) {
      return NextResponse.json({
        success: true,
        order_id: order.order_id,
        order_status: order.order_status,
      });
    }

    // Normal delivery flow cannot start before payment verification.
    if (
      ["confirmed", "packed", "shipped", "out_for_delivery", "delivered"].includes(
        orderStatus
      ) &&
      order.payment_status !== "verified"
    ) {
      return NextResponse.json(
        {
          error:
            "Payment must be verified before this order can move through delivery.",
        },
        { status: 400 }
      );
    }

    // Prevent accidentally moving backwards in the normal flow.
    const oldIndex = flow.indexOf(order.order_status);
    const newIndex = flow.indexOf(orderStatus);

    if (
      oldIndex >= 0 &&
      newIndex >= 0 &&
      newIndex < oldIndex
    ) {
      return NextResponse.json(
        {
          error:
            "Order status cannot move backwards.",
        },
        { status: 400 }
      );
    }

    const changedAt = new Date().toISOString();

    const { error: updateError } = await supabase
      .from("orders")
      .update({
        order_status: orderStatus,
      })
      .eq("id", order.id);

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 400 }
      );
    }

    const { error: historyError } = await supabase
      .from("order_status_history")
      .insert({
        order_id: order.id,
        status: orderStatus,
        changed_at: changedAt,
        note:
          String(note || "").trim() ||
          `Order status changed to ${orderStatus.replaceAll("_", " ")}`,
      });

    if (historyError) {
      // Roll back the visible status if its timeline entry failed.
      await supabase
        .from("orders")
        .update({
          order_status: order.order_status,
        })
        .eq("id", order.id);

      return NextResponse.json(
        {
          error:
            "Status update failed because timeline history could not be saved.",
        },
        { status: 400 }
      );
    }

    // Send delivery confirmation email automatically when the order becomes delivered.
    if (orderStatus === "delivered" && !order.delivered_email_sent_at) {
      const customer = Array.isArray(order.customer)
        ? order.customer[0]
        : order.customer;

      if (!customer?.email) {
        console.error("Delivery email skipped: customer email is missing.");
      } else {
        const resendKey = process.env.RESEND_API_KEY;

        if (!resendKey) {
          console.error("Delivery email skipped: RESEND_API_KEY is not configured.");
        } else {
          const resend = new Resend(resendKey);

          const { error: emailError } = await resend.emails.send({
            from: "Model Town Garments <no-reply@modeltowngarments.shop>",
            to: [customer.email],
            subject: `Order Delivered — ${order.order_id}`,
            html: `
              <div style="font-family:Arial,sans-serif;max-width:650px;margin:auto;color:#172033">
                <div style="background:#102a56;padding:28px;border-radius:16px 16px 0 0;color:white">
                  <h1 style="margin:0;font-size:24px">MODEL TOWN GARMENTS</h1>
                  <p style="margin:8px 0 0;opacity:.8">Delivery Confirmation</p>
                </div>
                <div style="padding:28px;border:1px solid #e5e7eb;border-top:0">
                  <h2 style="margin-top:0">Your order has been delivered</h2>
                  <p>Hi ${customer.name || "Customer"},</p>
                  <p>
                    Your order <strong>${order.order_id}</strong>
                    has been successfully delivered.
                  </p>
                  <div style="background:#f7f9fc;padding:18px;border-radius:12px;margin:20px 0">
                    <p><strong>Order ID:</strong> ${order.order_id}</p>
                    <p><strong>Order Status:</strong> Delivered</p>
                    <p><strong>Total:</strong> ₹${Number(order.total || 0).toFixed(2)}</p>
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
          } else {
            const { error: markSentError } = await supabase
              .from("orders")
              .update({
                delivered_email_sent_at: new Date().toISOString(),
              })
              .eq("id", order.id)
              .is("delivered_email_sent_at", null);

            if (markSentError) {
              console.error(
                "Failed to mark delivery email as sent:",
                markSentError
              );
            }
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      order_id: order.order_id,
      order_status: orderStatus,
      changed_at: changedAt,
    });
  } catch (error) {
    console.error("Order status API error:", error);

    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
