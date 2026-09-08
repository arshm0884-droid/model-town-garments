import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get("orderId");

  if (!orderId) {
    return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
  }

  const { data: order, error } = await supabase
    .from("orders")
    .select(`
      *,
      customers (
        name,
        email,
        phone,
        address,
        city,
        state,
        pincode
      )
    `)
    .eq("order_id", orderId)
    .maybeSingle();

  if (error || !order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (order.payment_status !== "verified") {
    return NextResponse.json(
      { error: "Invoice is available only after payment is verified." },
      { status: 403 }
    );
  }

  const customer = Array.isArray(order.customers)
    ? order.customers[0]
    : order.customers;

  if (!customer?.email || customer.email.toLowerCase() !== user.email?.toLowerCase()) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: items } = await supabase
    .from("order_items")
    .select("*")
    .eq("order_id", order.id)
    .order("created_at", { ascending: true });

  return NextResponse.json({
    order,
    customer,
    items: items || [],
  });
}
