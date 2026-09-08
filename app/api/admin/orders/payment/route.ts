import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";

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

    const orderId = String(body?.orderId || "").trim();
    const paymentStatus = String(body?.paymentStatus || "").trim();
    const paymentReference = String(body?.paymentReference || "").trim();
    const paymentAmount = Number(body?.paymentAmount || 0);
    const paymentDate = String(body?.paymentDate || "").trim();

    const allowedPaymentStatuses = [
      "pending",
      "submitted",
      "verified",
      "failed",
      "refunded",
    ];

    if (!orderId || !paymentStatus) {
      return NextResponse.json(
        {
          error:
            "Order ID and payment status are required.",
        },
        { status: 400 }
      );
    }

    if (!allowedPaymentStatuses.includes(paymentStatus)) {
      return NextResponse.json(
        { error: "Invalid payment status." },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(
        "id, order_id, total, customer_id, payment_status, order_status"
      )
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        {
          error:
            orderError?.message || "Order not found.",
        },
        { status: 404 }
      );
    }

    const updateData: Record<string, any> = {
      payment_status: paymentStatus,
    };

    // Payment verification confirms the order.
    if (
      paymentStatus === "verified" &&
      order.payment_status !== "verified"
    ) {
      updateData.payment_status = "verified";
      updateData.order_status = "confirmed";
      updateData.payment_reference = paymentReference || null;
      updateData.payment_amount =
        paymentAmount > 0 ? paymentAmount : Number(order.total || 0);
      updateData.payment_verified_at =
        paymentDate || new Date().toISOString();
      updateData.payment_method_details =
        "WhatsApp / UPI";
    }

    const { error: updateError } = await supabase
      .from("orders")
      .update(updateData)
      .eq("id", order.id);

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 400 }
      );
    }

    // Add order timeline entry when payment is verified.
    if (
      paymentStatus === "verified" &&
      order.payment_status !== "verified"
    ) {
      const { error: historyError } = await supabase
        .from("order_status_history")
        .insert({
          order_id: order.id,
          status: "confirmed",
          changed_at: new Date().toISOString(),
          note: "Payment verified. Order confirmed.",
        });

      if (historyError) {
        console.error(
          "Order history error:",
          historyError
        );
      }
    }

    return NextResponse.json({
      success: true,
      order_id: order.order_id,
      payment_status: updateData.payment_status,
      order_status:
        updateData.order_status || order.order_status,
    });
  } catch (error) {
    console.error("Payment update error:", error);

    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
