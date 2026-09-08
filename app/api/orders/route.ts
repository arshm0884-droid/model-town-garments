import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { Resend } from "resend";

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function generateOrderId() {
  const now = new Date();
  const date = now
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, "");

  const random = Math.floor(1000 + Math.random() * 9000);

  return `MTG-${date}-${random}`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      customer,
      orderId,
      items,
      subtotal = 0,
      offerDiscount = 0,
      couponDiscount = 0,
      deliveryCharge = 0,
      total = 0,
      couponCode,
      paymentMethod = "whatsapp",
    } = body;

    if (!customer?.name || !customer?.phone || !customer?.address) {
      return NextResponse.json(
        { error: "Customer details are required." },
        { status: 400 }
      );
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Cart is empty." },
        { status: 400 }
      );
    }

    if (Number(total) <= 0) {
      return NextResponse.json(
        { error: "Invalid order total." },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get currently logged-in customer.
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Customer can still place an order if guest checkout is enabled.
    // When logged in, attach the authenticated identity.
    const authenticatedCustomer = {
      ...customer,
      id: user?.id || customer.id || null,
      email: user?.email || customer.email || null,
    };

    const finalOrderId = orderId || generateOrderId();

    // Validate stock before creating the order.
    const { error: stockError } = await supabase.rpc(
      "validate_product_stock",
      {
        p_items: items,
      }
    );

    if (stockError) {
      console.error("Stock validation error:", stockError);

      return NextResponse.json(
        { error: stockError.message },
        { status: 400 }
      );
    }

    const { data, error } = await supabase.rpc(
      "create_store_order",
      {
        p_order_id: finalOrderId,
        p_customer: authenticatedCustomer,
        p_items: items,
        p_subtotal: Number(subtotal),
        p_offer_discount: Number(offerDiscount),
        p_coupon_discount: Number(couponDiscount),
        p_delivery_charge: Number(deliveryCharge),
        p_total: Number(total),
        p_coupon_code: couponCode || null,
        p_payment_method: paymentMethod || "whatsapp",
      }
    );

    if (error) {
      console.error("Create order RPC error:", error);

      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    /*
     * Keep payment and order status separate.
     *
     * New order:
     * payment_status = pending
     * order_status   = pending
     *
     * Admin verification will later move:
     * payment_status -> verified
     * order_status   -> confirmed
     */

    return NextResponse.json({
      success: true,
      order_id: finalOrderId,
      payment_status: "pending",
      order_status: "pending",
      order: data,
    });
  } catch (error) {
    console.error("Order API error:", error);

    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
