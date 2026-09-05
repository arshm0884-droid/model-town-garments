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

    const phone = String(user.user_metadata?.phone || "").replace(/\\D/g, "");
    let customer = null;

    if (user.email) {
      const { data } = await supabase
        .from("customers")
        .select("id")
        .eq("email", user.email)
        .limit(1)
        .maybeSingle();

      customer = data;
    }

    if (!customer && phone) {
      const { data } = await supabase
        .from("customers")
        .select("id")
        .eq("phone", phone)
        .limit(1)
        .maybeSingle();

      customer = data;
    }

    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found." },
        { status: 404 }
      );
    }

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, order_id, order_status")
      .eq("order_id", orderId)
      .eq("customer_id", customer.id)
      .maybeSingle();

    if (orderError || !order) {
      return NextResponse.json(
        { error: "Order not found." },
        { status: 404 }
      );
    }

    if (!["pending", "confirmed"].includes(order.order_status)) {
      return NextResponse.json(
        { error: "This order can no longer be cancelled." },
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
      .eq("customer_id", customer.id);

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
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
