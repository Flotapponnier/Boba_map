import { Database } from "bun:sqlite";
import path from "path";
import fs from "fs";

const dbPath = path.join(process.cwd(), "boba.db");
const dataPath = path.join(process.cwd(), "scripts/data/places.json");

console.log("🧋 Seeding database...\n");

// Read places data
const placesData = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
console.log(`📁 Loaded ${placesData.length} places from places.json`);

// Connect to database
const db = new Database(dbPath);
db.exec("PRAGMA journal_mode = WAL");

// Ensure places table exists
db.exec(`
  CREATE TABLE IF NOT EXISTS places (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    lat REAL NOT NULL,
    lng REAL NOT NULL,
    price REAL,
    rating REAL,
    address TEXT,
    tags TEXT
  )
`);

// Clear existing places
db.exec("DELETE FROM places");
console.log("🗑️  Cleared existing places");

// Insert places
const insert = db.prepare(`
  INSERT INTO places (name, description, category, lat, lng, price, rating, address, tags)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

let count = 0;
for (const place of placesData) {
  insert.run(
    place.name,
    place.description,
    place.category,
    place.lat,
    place.lng,
    place.price,
    place.rating,
    place.address,
    JSON.stringify(place.tags)
  );
  count++;
}

console.log(`✅ Inserted ${count} places\n`);

// Show summary by category
const summary = db.query(`
  SELECT category, COUNT(*) as count
  FROM places
  GROUP BY category
  ORDER BY count DESC
`).all();

console.log("📊 Summary:");
for (const row of summary as { category: string; count: number }[]) {
  console.log(`   ${row.category}: ${row.count}`);
}

db.close();
console.log("\n🎉 Done!");
