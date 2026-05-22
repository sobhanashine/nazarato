// supabase/test-integration.ts
import { supabaseAdmin } from "../lib/supabase/server";

async function runTest() {
  const supabase = supabaseAdmin();
  console.log("Starting database integration tests...");

  // 1. Create a test user
  const testPhone = "+989129999999";
  const { data: existingUser } = await supabase
    .from("users")
    .select("id")
    .eq("phone", testPhone)
    .maybeSingle();

  let testUserId = existingUser?.id;
  if (!testUserId) {
    const { data: newUser, error: userError } = await supabase
      .from("users")
      .insert({
        phone: testPhone,
        display_name: "کاربر تستی",
        avatar_color: "#FF0000",
        role: "consumer"
      })
      .select("id")
      .single();

    if (userError) {
      throw new Error(`Failed to create test user: ${userError.message}`);
    }
    testUserId = newUser.id;
    console.log(`Created test user: ${testUserId}`);
  } else {
    console.log(`Using existing test user: ${testUserId}`);
  }

  // 2. Create a test business
  const testSlug = "test-comp-123";
  const { data: existingBiz } = await supabase
    .from("businesses")
    .select("id")
    .eq("slug", testSlug)
    .maybeSingle();

  let testBizId = existingBiz?.id;
  if (!testBizId) {
    const { data: newBiz, error: bizError } = await supabase
      .from("businesses")
      .insert({
        slug: testSlug,
        name: "شرکت تست",
        category_slug: "digital",
        initial: "ت",
        color: "#00FF00"
      })
      .select("id")
      .single();

    if (bizError) {
      throw new Error(`Failed to create test business: ${bizError.message}`);
    }
    testBizId = newBiz.id;
    console.log(`Created test business: ${testBizId}`);
  } else {
    console.log(`Using existing test business: ${testBizId}`);
  }

  // 3. Clear any existing reviews for this user & business to start fresh
  await supabase
    .from("reviews")
    .delete()
    .eq("business_id", testBizId)
    .eq("author_id", testUserId);

  // 4. Retrieve initial business state
  const { data: initialBizState, error: initialError } = await supabase
    .from("businesses")
    .select("review_count, rating_sum, rating_avg")
    .eq("id", testBizId)
    .single();

  if (initialError) {
    throw new Error(`Failed to get business state: ${initialError.message}`);
  }

  console.log("Initial business state:", initialBizState);

  // 5. Insert a pending review
  console.log("Inserting a pending review (should NOT update denormalized counts)...");
  const { data: review, error: insertError } = await supabase
    .from("reviews")
    .insert({
      business_id: testBizId,
      author_id: testUserId,
      rating: 4,
      body: "این یک متن نظر تستی با طول کافی سی کاراکتر است.",
      status: "pending",
      verified: false,
      proof_status: "submitted",
      proof_url: "test-user-id/proof.png",
      proof_type: "invoice"
    })
    .select("id, status")
    .single();

  if (insertError) {
    throw new Error(`Failed to insert review: ${insertError.message}`);
  }
  console.log(`Inserted pending review: ${review.id}`);

  // Get business state after pending review
  const { data: bizStateAfterPending } = await supabase
    .from("businesses")
    .select("review_count, rating_sum")
    .eq("id", testBizId)
    .single();

  console.log("Business state after pending review:", bizStateAfterPending);
  if (
    bizStateAfterPending?.review_count !== initialBizState.review_count ||
    bizStateAfterPending?.rating_sum !== initialBizState.rating_sum
  ) {
    throw new Error("Trigger error: Pending review updated business counters!");
  }
  console.log("PASSED: Pending review did not alter counters.");

  // 6. Update review to published (Simulate Approve Review Action)
  console.log("Updating review to published (should update denormalized counts)...");
  const { error: updateError } = await supabase
    .from("reviews")
    .update({
      status: "published",
      verified: true,
      proof_status: "approved",
      proof_url: null // Proof URL should be nulled upon approval/rejection
    })
    .eq("id", review.id);

  if (updateError) {
    throw new Error(`Failed to publish review: ${updateError.message}`);
  }

  // Get business state after published review
  const { data: bizStateAfterPublish } = await supabase
    .from("businesses")
    .select("review_count, rating_sum, rating_avg")
    .eq("id", testBizId)
    .single();

  console.log("Business state after publish:", bizStateAfterPublish);
  if (
    bizStateAfterPublish?.review_count !== initialBizState.review_count + 1 ||
    Number(bizStateAfterPublish?.rating_sum) !== Number(initialBizState.rating_sum) + 4
  ) {
    throw new Error("Trigger error: Published review did not update counters correctly!");
  }
  console.log("PASSED: Published review updated counters correctly.");

  // 7. Clean up (delete review and verify counts decrement)
  console.log("Deleting review (should decrement denormalized counts back to initial)...");
  const { error: deleteError } = await supabase
    .from("reviews")
    .delete()
    .eq("id", review.id);

  if (deleteError) {
    throw new Error(`Failed to delete review: ${deleteError.message}`);
  }

  const { data: finalBizState } = await supabase
    .from("businesses")
    .select("review_count, rating_sum, rating_avg")
    .eq("id", testBizId)
    .single();

  console.log("Final business state after cleanup deletion:", finalBizState);
  if (
    finalBizState?.review_count !== initialBizState.review_count ||
    finalBizState?.rating_sum !== initialBizState.rating_sum
  ) {
    throw new Error("Trigger error: Deleting review did not decrement counters correctly!");
  }
  console.log("PASSED: Deleting review decremented counters correctly.");

  // Cleanup test business and user
  await supabase.from("businesses").delete().eq("id", testBizId);
  await supabase.from("users").delete().eq("id", testUserId);
  console.log("Cleanup complete.");
  console.log("ALL DATABASE INTEGRATION TESTS PASSED SUCCESSFULLY!");
}

runTest().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
