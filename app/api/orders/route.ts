import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      customer,
      orderId,
      items,
      subtotal,
      offerDiscount,
      couponDiscount,
      deliveryCharge,
      total,
      couponCode,
      paymentMethod,
    } = body;

    if (
      !customer?.name ||
      !customer?.phone ||
      !customer?.address
    ) {
      return NextResponse.json(
        { error: "Customer details are required." },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data, error } = await supabase.rpc(
      "create_store_order",
      {
        p_order_id: orderId,
        p_customer: customer,
        p_items: items,
        p_subtotal: subtotal,
        p_offer_discount: offerDiscount,
        p_coupon_discount: couponDiscount,
        p_delivery_charge: deliveryCharge,
        p_total: total,
        p_coupon_code: couponCode || null,
        p_payment_method: paymentMethod || "UPI",
      }
    );

    if (error) {
      console.error("Create order RPC error:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Order API error:", error);

    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
