import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();

    const orderId = String(body.order_id || "").trim();
    const reason = String(body.reason || "").trim();

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required." },
        { status: 400 }
      );
    }

    if (!reason) {
      return NextResponse.json(
        { error: "Cancellation reason is required." },
        { status: 400 }
      );
    }

    const customerId = user.id;

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, order_id, order_status, payment_status")
      .eq("order_id", orderId)
      .eq("customer_id", customerId)
      .maybeSingle();

    if (orderError) {
      console.error("Cancel order lookup error:", orderError);

      return NextResponse.json(
        { error: orderError.message },
        { status: 500 }
      );
    }

    if (!order) {
      return NextResponse.json(
        { error: "Order not found." },
        { status: 404 }
      );
    }

    if (!["pending", "confirmed"].includes(order.order_status)) {
      return NextResponse.json(
        {
          error:
            "This order can no longer be cancelled because it has already been packed, shipped, delivered, or cancelled.",
        },
        { status: 400 }
      );
    }

    const { error: updateError } = await supabase
      .from("orders")
      .update({
        order_status: "cancelled",
        cancellation_reason: reason,
        cancelled_at: new Date().toISOString(),
      })
      .eq("id", order.id)
      .eq("customer_id", customerId);

    if (updateError) {
      console.error("Cancel order update error:", updateError);

      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    const { error: historyError } = await supabase
      .from("order_status_history")
      .insert({
        order_id: order.id,
        status: "cancelled",
        note: `Order cancelled by customer. Reason: ${reason}`,
      });

    if (historyError) {
      console.error("Cancel history error:", historyError);
    }

    return NextResponse.json({
      success: true,
      message: "Order cancelled successfully.",
    });
  } catch (error) {
    console.error("Cancel order error:", error);

    return NextResponse.json(
      { error: "Unable to cancel order." },
      { status: 500 }
    );
  }
}
