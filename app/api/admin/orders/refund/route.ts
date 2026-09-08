import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin-auth";

const refundStatuses = [
  "pending",
  "initiated",
  "processing",
  "completed",
  "failed",
];

const returnStatuses = [
  "requested",
  "approved",
  "processing",
  "completed",
  "rejected",
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

    const supabase = await createClient();
    const body = await request.json();

    const orderId = String(body.order_id || "").trim();
    const amount = Number(body.amount);
    const reference = String(body.reference || "").trim();
    const reason = String(body.reason || "").trim();
    const note = String(body.note || "").trim();
    const refundStatus = String(body.status || "").trim();
    const returnStatus = String(body.return_status || "").trim();

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required." },
        { status: 400 }
      );
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { error: "Invalid refund amount." },
        { status: 400 }
      );
    }

    if (!refundStatuses.includes(refundStatus)) {
      return NextResponse.json(
        { error: "Invalid refund status." },
        { status: 400 }
      );
    }

    if (!reason) {
      return NextResponse.json(
        { error: "Refund reason is required." },
        { status: 400 }
      );
    }

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(
        "id, order_id, total, payment_status, refund_status, refund_initiated_at, refund_completed_at, refunded_at"
      )
      .eq("id", orderId)
      .maybeSingle();

    if (orderError || !order) {
      return NextResponse.json(
        { error: "Order not found." },
        { status: 404 }
      );
    }

    if (amount > Number(order.total || 0)) {
      return NextResponse.json(
        { error: "Refund amount cannot be greater than order total." },
        { status: 400 }
      );
    }

    if (order.payment_status !== "verified") {
      return NextResponse.json(
        { error: "Only verified payments can be refunded." },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    const refundData: Record<string, unknown> = {
      refund_amount: amount,
      refund_reference: reference || null,
      refund_reason: reason,
      refund_note: note || null,
      refund_status: refundStatus,
      refund_processed_at: now,
      refund_initiated_at:
        refundStatus === "initiated" ||
        refundStatus === "processing" ||
        refundStatus === "completed"
          ? order.refund_initiated_at || now
          : order.refund_initiated_at || null,
      refund_completed_at:
        refundStatus === "completed"
          ? order.refund_completed_at || now
          : null,
      refunded_at:
        refundStatus === "completed"
          ? order.refunded_at || now
          : null,
      payment_status:
        refundStatus === "completed"
          ? "refunded"
          : order.payment_status,
    };

    if (returnStatuses.includes(returnStatus)) {
      refundData.return_status = returnStatus;

      if (returnStatus === "completed" || returnStatus === "rejected") {
        refundData.return_processed_at = now;
      }

      if (note) {
        refundData.return_note = note;
      }
    }

    const { error: updateError } = await supabase
      .from("orders")
      .update(refundData)
      .eq("id", order.id);

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message:
        refundStatus === "completed"
          ? "Refund completed and payment marked as refunded."
          : "Refund details saved.",
      refund: refundData,
    });
  } catch (error) {
    console.error("Admin refund error:", error);

    return NextResponse.json(
      { error: "Unable to save refund." },
      { status: 500 }
    );
  }
}
