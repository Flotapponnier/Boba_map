import { createClient } from "@libsql/client";
import fs from "fs";
import path from "path";

// Load env from .env.local if running locally
const envPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const [key, ...valueParts] = line.split("=");
    if (key && valueParts.length > 0) {
      process.env[key.trim()] = valueParts.join("=").trim();
    }
  }
}

const url = process.env.TURSO_DATABASE_URL || "file:local.db";
const authToken = process.env.TURSO_AUTH_TOKEN;

console.log(`🧋 Seeding database: ${url}\n`);

const client = createClient({ url, authToken });

async function seed() {
  // Read places data
  const dataPath = path.join(process.cwd(), "scripts/data/places.json");
  const placesData = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
  console.log(`📁 Loaded ${placesData.length} places from places.json`);

  // Clear existing places
  await client.execute("DELETE FROM places");
  console.log("🗑️  Cleared existing places");

  // Insert places one by one (avoids batch migration tracking)
  let count = 0;
  for (const place of placesData) {
    await client.execute({
      sql: `INSERT INTO places (name, description, category, lat, lng, price, rating, address, tags)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        place.name,
        place.description,
        place.category,
        place.lat,
        place.lng,
        place.price ?? null,
        place.rating ?? null,
        place.address ?? null,
        JSON.stringify(place.tags),
      ],
    });
    count++;
  }
  console.log(`✅ Inserted ${count} places\n`);

  // Show summary
  const result = await client.execute(`
    SELECT category, COUNT(*) as count
    FROM places
    GROUP BY category
    ORDER BY count DESC
  `);

  console.log("📊 Summary:");
  for (const row of result.rows) {
    console.log(`   ${row.category}: ${row.count}`);
  }

  console.log("\n🎉 Done!");
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
