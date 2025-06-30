import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
  serial,
  boolean,
  integer,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  preferences: jsonb("preferences").$type<{
    darkMode?: boolean;
    fontSize?: string;
    autoMarkRead?: boolean;
  }>().default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// RSS Feeds
export const feeds = pgTable("feeds", {
  id: serial("id").primaryKey(),
  title: varchar("title").notNull(),
  url: varchar("url").notNull().unique(),
  description: text("description"),
  tags: jsonb("tags").$type<string[]>().default([]),
  active: boolean("active").default(true),
  lastFetched: timestamp("last_fetched"),
  fetchInterval: integer("fetch_interval").default(3600), // seconds
  ownerId: varchar("owner_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Articles from RSS feeds
export const articles = pgTable("articles", {
  id: serial("id").primaryKey(),
  feedId: integer("feed_id").references(() => feeds.id).notNull(),
  title: varchar("title").notNull(),
  link: varchar("link").notNull(),
  description: text("description"),
  author: varchar("author"),
  publishedAt: timestamp("published_at"),
  guid: varchar("guid").notNull(),
  content: text("content"),
  thumbnail: varchar("thumbnail"),
  createdAt: timestamp("created_at").defaultNow(),
});

// User article interactions
export const userArticles = pgTable("user_articles", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  articleId: integer("article_id").references(() => articles.id).notNull(),
  read: boolean("read").default(false),
  favorite: boolean("favorite").default(false),
  readAt: timestamp("read_at"),
  favoriteAt: timestamp("favorite_at"),
});

// Collections for shared feeds
export const collections = pgTable("collections", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  description: text("description"),
  privacy: varchar("privacy").notNull().default("private"), // private, public, invite_only
  ownerId: varchar("owner_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Collection members
export const collectionMembers = pgTable("collection_members", {
  id: serial("id").primaryKey(),
  collectionId: integer("collection_id").references(() => collections.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  role: varchar("role").notNull().default("member"), // owner, admin, member, viewer
  canAddFeeds: boolean("can_add_feeds").default(false),
  canComment: boolean("can_comment").default(true),
  joinedAt: timestamp("joined_at").defaultNow(),
});

// Collection feeds
export const collectionFeeds = pgTable("collection_feeds", {
  id: serial("id").primaryKey(),
  collectionId: integer("collection_id").references(() => collections.id).notNull(),
  feedId: integer("feed_id").references(() => feeds.id).notNull(),
  addedById: varchar("added_by_id").references(() => users.id).notNull(),
  addedAt: timestamp("added_at").defaultNow(),
});

// Comments on articles
export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  articleId: integer("article_id").references(() => articles.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  collectionId: integer("collection_id").references(() => collections.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Chat messages for collections
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  collectionId: integer("collection_id").references(() => collections.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  feeds: many(feeds),
  userArticles: many(userArticles),
  collections: many(collections),
  collectionMembers: many(collectionMembers),
  comments: many(comments),
  messages: many(messages),
}));

export const feedsRelations = relations(feeds, ({ one, many }) => ({
  owner: one(users, { fields: [feeds.ownerId], references: [users.id] }),
  articles: many(articles),
  collectionFeeds: many(collectionFeeds),
}));

export const articlesRelations = relations(articles, ({ one, many }) => ({
  feed: one(feeds, { fields: [articles.feedId], references: [feeds.id] }),
  userArticles: many(userArticles),
  comments: many(comments),
}));

export const userArticlesRelations = relations(userArticles, ({ one }) => ({
  user: one(users, { fields: [userArticles.userId], references: [users.id] }),
  article: one(articles, { fields: [userArticles.articleId], references: [articles.id] }),
}));

export const collectionsRelations = relations(collections, ({ one, many }) => ({
  owner: one(users, { fields: [collections.ownerId], references: [users.id] }),
  members: many(collectionMembers),
  feeds: many(collectionFeeds),
  comments: many(comments),
  messages: many(messages),
}));

export const collectionMembersRelations = relations(collectionMembers, ({ one }) => ({
  collection: one(collections, { fields: [collectionMembers.collectionId], references: [collections.id] }),
  user: one(users, { fields: [collectionMembers.userId], references: [users.id] }),
}));

export const collectionFeedsRelations = relations(collectionFeeds, ({ one }) => ({
  collection: one(collections, { fields: [collectionFeeds.collectionId], references: [collections.id] }),
  feed: one(feeds, { fields: [collectionFeeds.feedId], references: [feeds.id] }),
  addedBy: one(users, { fields: [collectionFeeds.addedById], references: [users.id] }),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  article: one(articles, { fields: [comments.articleId], references: [articles.id] }),
  user: one(users, { fields: [comments.userId], references: [users.id] }),
  collection: one(collections, { fields: [comments.collectionId], references: [collections.id] }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  collection: one(collections, { fields: [messages.collectionId], references: [collections.id] }),
  user: one(users, { fields: [messages.userId], references: [users.id] }),
}));

// Insert schemas
export const insertFeedSchema = createInsertSchema(feeds).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertArticleSchema = createInsertSchema(articles).omit({
  id: true,
  createdAt: true,
});

export const insertCollectionSchema = createInsertSchema(collections).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCommentSchema = createInsertSchema(comments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertFeed = z.infer<typeof insertFeedSchema>;
export type Feed = typeof feeds.$inferSelect;
export type InsertArticle = z.infer<typeof insertArticleSchema>;
export type Article = typeof articles.$inferSelect;
export type UserArticle = typeof userArticles.$inferSelect;
export type InsertCollection = z.infer<typeof insertCollectionSchema>;
export type Collection = typeof collections.$inferSelect;
export type CollectionMember = typeof collectionMembers.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Comment = typeof comments.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;
