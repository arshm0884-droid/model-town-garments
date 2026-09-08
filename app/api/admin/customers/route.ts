import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";

export async function POST(request: Request) {
  try {
    const { authorized, supabase } = await requireAdmin();

    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const ids = Array.isArray(body?.ids)
      ? body.ids.filter((id: unknown): id is string => typeof id === "string")
      : [];

    if (ids.length === 0) {
      return NextResponse.json({ customers: [] });
    }

    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .in("id", ids);

    if (error) {
      console.error("Admin customer fetch error:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ customers: data ?? [] });
  } catch (error) {
    console.error("Admin customer API error:", error);

    return NextResponse.json(
      { error: "Unable to load customer data." },
      { status: 500 }
    );
  }
}
