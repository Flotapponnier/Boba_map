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
  communityId: integer("community_id").references(() => communities.id), // optional link to a community
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // accommodation, food, event, activity, service, nightlife
  lat: real("lat").notNull(),
  lng: real("lng").notNull(),
  address: text("address"),
  price: real("price"), // optional price
  imageUrl: text("image_url"),
  // Event-specific fields
  eventDate: text("event_date"), // YYYY-MM-DD format
  eventTime: text("event_time"), // HH:MM format
  eventRecurrence: text("event_recurrence"), // "once", "daily", "weekly", "monthly"
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

/**
 * Places table - all places data (from JSON seed)
 */
export const places = sqliteTable("places", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  lat: real("lat").notNull(),
  lng: real("lng").notNull(),
  price: real("price"),
  rating: real("rating"),
  address: text("address"),
  tags: text("tags"), // JSON array as string
});

export type Place = typeof places.$inferSelect;
export type NewPlace = typeof places.$inferInsert;

/**
 * Communities table - groups users can create and join
 */
export const communities = sqliteTable("communities", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  isPublic: integer("is_public", { mode: "boolean" }).notNull().default(true),
  creatorId: integer("creator_id").notNull().references(() => users.id),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

/**
 * Community Members table - tracks who belongs to which community
 */
export const communityMembers = sqliteTable("community_members", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  communityId: integer("community_id").notNull().references(() => communities.id),
  userId: integer("user_id").notNull().references(() => users.id),
  role: text("role").notNull().default("member"), // "admin" or "member"
  joinedAt: integer("joined_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

/**
 * Join Requests table - pending requests to join private communities
 */
export const joinRequests = sqliteTable("join_requests", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  communityId: integer("community_id").notNull().references(() => communities.id),
  userId: integer("user_id").notNull().references(() => users.id),
  status: text("status").notNull().default("pending"), // "pending", "accepted", "rejected"
  message: text("message"), // optional message from requester
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  respondedAt: integer("responded_at", { mode: "timestamp" }),
  respondedBy: integer("responded_by").references(() => users.id),
});

export type Community = typeof communities.$inferSelect;
export type NewCommunity = typeof communities.$inferInsert;
export type CommunityMember = typeof communityMembers.$inferSelect;
export type NewCommunityMember = typeof communityMembers.$inferInsert;
export type JoinRequest = typeof joinRequests.$inferSelect;
export type NewJoinRequest = typeof joinRequests.$inferInsert;

