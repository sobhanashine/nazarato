// supabase/seed.ts
import { supabaseAdmin } from "../lib/supabase/server";
import { businessDetails } from "../lib/data/businesses";
import { instagramShops } from "../lib/data/instagram-shops";

// Mapping category names in static data to category_slugs
const CATEGORY_MAP: Record<string, string> = {
  "فروشگاه اینترنتی": "digital",
  "سفارش آنلاین غذا": "food",
  "کافه و رستوران": "food",
  "بیمه": "health",
  "خودرو": "sports",
  "داروخانه": "health"
};

async function main() {
  const supabase = supabaseAdmin();
  console.log("Seeding businesses into database...");

  // Seed companies
  for (const b of businessDetails) {
    const categorySlug = CATEGORY_MAP[b.category] || "digital";
    const { data: existing, error: checkError } = await supabase
      .from("businesses")
      .select("id")
      .eq("slug", b.slug)
      .maybeSingle();

    if (checkError) {
      console.error(`Error checking business ${b.name}:`, checkError.message);
      continue;
    }

    if (!existing) {
      // Prepare contact
      const contact: Record<string, string> = {};
      if (b.contact.website) contact.website = b.contact.website;
      if (b.contact.phone) contact.phone = b.contact.phone;
      if (b.contact.instagram) contact.instagram = b.contact.instagram;

      const { data, error } = await supabase
        .from("businesses")
        .insert({
          slug: b.slug,
          type: "company",
          name: b.name,
          category_slug: categorySlug,
          city: b.city,
          description: b.description,
          initial: b.initial,
          color: b.color,
          contact,
          hours: b.hours || null,
          info: b.info,
          claimed: b.claimed,
          verified: b.verified,
          status: "active"
        })
        .select()
        .single();

      if (error) {
        console.error(`Error inserting business ${b.name}:`, error.message);
      } else {
        console.log(`Seeded business: ${b.name} (${data.id})`);
        
        // Seed reviews for this business if they exist in static reviews
        if (b.reviews && b.reviews.length > 0) {
          for (const r of b.reviews) {
            // Find or create mock user
            const phone = `+989120000${Math.floor(100 + Math.random() * 900)}`;
            const displayName = r.user.name;
            const color = r.user.color;

            let userId: string;
            const { data: userRow, error: uError } = await supabase
              .from("users")
              .select("id")
              .eq("display_name", displayName)
              .maybeSingle();
            
            if (uError) {
              console.error("User check error:", uError.message);
              continue;
            }

            if (!userRow) {
              const { data: newUser, error: createUError } = await supabase
                .from("users")
                .insert({
                  phone,
                  display_name: displayName,
                  avatar_color: color,
                  role: "consumer"
                })
                .select("id")
                .single();
              
              if (createUError) {
                console.error("User create error:", createUError.message);
                continue;
              }
              userId = newUser.id;
            } else {
              userId = userRow.id;
            }

            // Create review with status='published' to trigger the denormalization counter updates
            const bodyText = r.text.length < 30 ? r.text.padEnd(30, ".") : r.text;
            const { error: reviewError } = await supabase
              .from("reviews")
              .insert({
                business_id: data.id,
                author_id: userId,
                rating: r.rating,
                body: bodyText,
                status: "published",
                verified: false,
                proof_status: "none"
              });

            if (reviewError) {
              if (reviewError.code !== "23505") {
                console.error(`Review insert error for ${b.name}:`, reviewError.message);
              }
            } else {
              console.log(`  Seeded review by ${displayName} for ${b.name}`);
            }
          }
        }
      }
    } else {
      console.log(`Business ${b.name} already exists in DB.`);
    }
  }

  // Seed Instagram shops
  for (const s of instagramShops) {
    const slug = s.handle.replace("@", "");
    const { data: existing, error: checkError } = await supabase
      .from("businesses")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (checkError) {
      console.error(`Error checking shop ${s.name}:`, checkError.message);
      continue;
    }

    if (!existing) {
      const { data, error } = await supabase
        .from("businesses")
        .insert({
          slug: slug,
          type: "ig_shop",
          name: s.name,
          category_slug: s.niche,
          initial: s.initial,
          color: s.color,
          contact: { instagram: slug },
          info: [],
          status: "active"
        })
        .select()
        .single();

      if (error) {
        console.error(`Error inserting shop ${s.name}:`, error.message);
      } else {
        console.log(`Seeded IG shop: ${s.name} (${data.id})`);
      }
    } else {
      console.log(`Shop ${s.name} already exists in DB.`);
    }
  }

  console.log("Seeding complete!");
}

main().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
