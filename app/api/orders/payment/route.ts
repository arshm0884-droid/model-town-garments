import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const orderId = String(body?.orderId || "").trim();
    const paymentReference = String(
      body?.paymentReference || ""
    ).trim();

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required." },
        { status: 400 }
      );
    }

    if (!paymentReference) {
      return NextResponse.json(
        { error: "Payment reference is required." },
        { status: 400 }
      );
    }

    if (paymentReference.length < 4) {
      return NextResponse.json(
        { error: "Invalid payment reference." },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, order_id, customer_id, payment_status, order_status")
      .eq("order_id", orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: "Order not found." },
        { status: 404 }
      );
    }

    // Logged-in customers can only submit payment for their own order.
    if (user && order.customer_id && order.customer_id !== user.id) {
      return NextResponse.json(
        { error: "You are not authorized for this order." },
        { status: 403 }
      );
    }

    if (order.payment_status === "verified") {
      return NextResponse.json(
        {
          error: "Payment for this order is already verified.",
        },
        { status: 400 }
      );
    }

    if (order.payment_status === "refunded") {
      return NextResponse.json(
        { error: "This order has already been refunded." },
        { status: 400 }
      );
    }

    const { error: updateError } = await supabase
      .from("orders")
      .update({
        payment_reference: paymentReference,
        payment_status: "submitted",
      })
      .eq("id", order.id);

    if (updateError) {
      console.error("Payment submission error:", updateError);

      return NextResponse.json(
        { error: updateError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      order_id: order.order_id,
      payment_status: "submitted",
      order_status: order.order_status,
    });
  } catch (error) {
    console.error("Payment submission API error:", error);

    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
