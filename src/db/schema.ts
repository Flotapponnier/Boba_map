import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

/**
 * Users table - simple auth
 */
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  avatarUrl: text("avatar_url"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

/**
 * Posts table - user announcements on the map
 */
export const posts = sqliteTable("posts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // accommodation, food, event, activity, service, nightlife
  lat: real("lat").notNull(),
  lng: real("lng").notNull(),
  address: text("address"),
  price: real("price"), // optional price
  imageUrl: text("image_url"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

/**
 * Feedbacks table - comments on posts
 */
export const feedbacks = sqliteTable("feedbacks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  postId: integer("post_id").notNull().references(() => posts.id),
  userId: integer("user_id").notNull().references(() => users.id),
  rating: integer("rating").notNull(), // 1-5 stars
  comment: text("comment"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

/**
 * Place Reviews table - reviews for ANY place (API places, search results, etc.)
 * Uses normalized place name as key to match across sources
 */
export const placeReviews = sqliteTable("place_reviews", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  placeKey: text("place_key").notNull(), // normalized name (lowercase, trimmed)
  placeName: text("place_name").notNull(), // original display name
  placeCategory: text("place_category"), // category if known
  userId: integer("user_id").notNull().references(() => users.id),
  rating: integer("rating").notNull(), // 1-5 stars
  comment: text("comment"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// Types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
export type Feedback = typeof feedbacks.$inferSelect;
export type NewFeedback = typeof feedbacks.$inferInsert;
export type PlaceReview = typeof placeReviews.$inferSelect;
export type NewPlaceReview = typeof placeReviews.$inferInsert;

