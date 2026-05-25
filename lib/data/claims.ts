/**
 * Business-claim data layer (#27). Owners submit a claim against an unclaimed
 * `businesses` row; admins approve (the trigger then sets owner_id + claimed
 * on the business) or reject. All writes go through the service-role client.
 */

import { supabaseAdmin } from "@/lib/supabase/server";

export type ClaimProofType = "domain_email" | "document" | "other";
export type ClaimStatus = "pending" | "approved" | "rejected";

export type BusinessClaim = {
  id: string;
  business_id: string;
  user_id: string;
  proof_type: ClaimProofType;
  proof_email: string | null;
  proof_url: string | null;
  contact_phone: string;
  notes: string | null;
  status: ClaimStatus;
  rejection_reason: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type PendingClaim = BusinessClaim & {
  business_name: string;
  business_slug: string;
  business_type: "company" | "ig_shop";
  user_display_name: string;
  user_phone: string;
};

/** Look up the current user's pending or most-recent claim for a given business. */
export async function getClaimForUserAndBusiness(
  userId: string,
  businessId: string,
): Promise<BusinessClaim | null> {
  const { data, error } = await supabaseAdmin()
    .from("business_claims")
    .select("*")
    .eq("user_id", userId)
    .eq("business_id", businessId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[claims] getClaimForUserAndBusiness failed", {
      userId,
      businessId,
      error: error.message,
    });
    return null;
  }
  return (data ?? null) as BusinessClaim | null;
}

/** Admin queue — every pending claim with the joined business + user labels. */
export async function listPendingClaims(): Promise<PendingClaim[]> {
  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("business_claims")
    .select(`
      *,
      businesses ( name, slug, type ),
      users ( display_name, phone )
    `)
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[claims] listPendingClaims failed", { error: error.message });
    return [];
  }

  type Row = BusinessClaim & {
    businesses: { name: string; slug: string; type: string } | null;
    users: { display_name: string; phone: string } | null;
  };

  return ((data ?? []) as unknown as Row[]).map((row) => ({
    id: row.id,
    business_id: row.business_id,
    user_id: row.user_id,
    proof_type: row.proof_type,
    proof_email: row.proof_email,
    proof_url: row.proof_url,
    contact_phone: row.contact_phone,
    notes: row.notes,
    status: row.status,
    rejection_reason: row.rejection_reason,
    reviewed_by: row.reviewed_by,
    reviewed_at: row.reviewed_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
    business_name: row.businesses?.name ?? "نامشخص",
    business_slug: row.businesses?.slug ?? "",
    business_type: (row.businesses?.type as "company" | "ig_shop") ?? "company",
    user_display_name: row.users?.display_name ?? "کاربر ناشناس",
    user_phone: row.users?.phone ?? "—",
  }));
}
