import {
  users,
  feeds,
  articles,
  userArticles,
  collections,
  collectionMembers,
  collectionFeeds,
  comments,
  messages,
  type User,
  type UpsertUser,
  type InsertFeed,
  type Feed,
  type InsertArticle,
  type Article,
  type UserArticle,
  type InsertCollection,
  type Collection,
  type CollectionMember,
  type InsertComment,
  type Comment,
  type InsertMessage,
  type Message,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, sql, ilike } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Feed operations
  createFeed(feed: InsertFeed): Promise<Feed>;
  getUserFeeds(userId: string): Promise<Feed[]>;
  getFeed(id: number): Promise<Feed | undefined>;
  updateFeed(id: number, updates: Partial<InsertFeed>): Promise<Feed>;
  deleteFeed(id: number): Promise<void>;
  
  // Article operations
  createArticle(article: InsertArticle): Promise<Article>;
  getArticlesByFeed(feedId: number): Promise<Article[]>;
  getUserArticles(userId: string, limit?: number, offset?: number): Promise<(Article & { feed: Feed; userArticle?: UserArticle })[]>;
  searchArticles(userId: string, query: string): Promise<(Article & { feed: Feed })[]>;
  markArticleRead(userId: string, articleId: number, read: boolean): Promise<void>;
  toggleArticleFavorite(userId: string, articleId: number): Promise<void>;
  
  // Collection operations
  createCollection(collection: InsertCollection): Promise<Collection>;
  getUserCollections(userId: string): Promise<Collection[]>;
  getCollection(id: number): Promise<Collection | undefined>;
  addCollectionMember(collectionId: number, userId: string, role: string): Promise<void>;
  getCollectionMembers(collectionId: number): Promise<(CollectionMember & { user: User })[]>;
  addFeedToCollection(collectionId: number, feedId: number, addedById: string): Promise<void>;
  getCollectionFeeds(collectionId: number): Promise<Feed[]>;
  
  // Comment operations
  createComment(comment: InsertComment): Promise<Comment>;
  getArticleComments(articleId: number, collectionId?: number): Promise<(Comment & { user: User })[]>;
  
  // Message operations
  createMessage(message: InsertMessage): Promise<Message>;
  getCollectionMessages(collectionId: number, limit?: number): Promise<(Message & { user: User })[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Feed operations
  async createFeed(feed: InsertFeed): Promise<Feed> {
    const [newFeed] = await db.insert(feeds).values(feed).returning();
    return newFeed;
  }

  async getUserFeeds(userId: string): Promise<Feed[]> {
    return await db.select().from(feeds).where(eq(feeds.ownerId, userId));
  }

  async getFeed(id: number): Promise<Feed | undefined> {
    const [feed] = await db.select().from(feeds).where(eq(feeds.id, id));
    return feed;
  }

  async updateFeed(id: number, updates: Partial<InsertFeed>): Promise<Feed> {
    const [updatedFeed] = await db
      .update(feeds)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(feeds.id, id))
      .returning();
    return updatedFeed;
  }

  async deleteFeed(id: number): Promise<void> {
    // First delete all articles associated with this feed
    await db.delete(articles).where(eq(articles.feedId, id));
    
    // Then delete the feed itself
    await db.delete(feeds).where(eq(feeds.id, id));
  }

  // Article operations
  async createArticle(article: InsertArticle): Promise<Article> {
    const [newArticle] = await db.insert(articles).values(article).returning();
    return newArticle;
  }

  async getArticlesByFeed(feedId: number): Promise<Article[]> {
    return await db
      .select()
      .from(articles)
      .where(eq(articles.feedId, feedId))
      .orderBy(desc(articles.publishedAt));
  }

  async getUserArticles(
    userId: string,
    limit = 20,
    offset = 0
  ): Promise<(Article & { feed: Feed; userArticle?: UserArticle })[]> {
    const userFeedIds = db
      .select({ id: feeds.id })
      .from(feeds)
      .where(eq(feeds.ownerId, userId));

    const result = await db
      .select({
        id: articles.id,
        feedId: articles.feedId,
        title: articles.title,
        link: articles.link,
        description: articles.description,
        author: articles.author,
        publishedAt: articles.publishedAt,
        guid: articles.guid,
        content: articles.content,
        thumbnail: articles.thumbnail,
        createdAt: articles.createdAt,
        feed: feeds,
        userArticle: userArticles,
      })
      .from(articles)
      .innerJoin(feeds, eq(articles.feedId, feeds.id))
      .leftJoin(
        userArticles,
        and(eq(userArticles.articleId, articles.id), eq(userArticles.userId, userId))
      )
      .where(sql`${feeds.id} IN ${userFeedIds}`)
      .orderBy(desc(articles.publishedAt))
      .limit(limit)
      .offset(offset);

    return result as any;
  }

  async searchArticles(userId: string, query: string): Promise<(Article & { feed: Feed })[]> {
    const userFeedIds = db
      .select({ id: feeds.id })
      .from(feeds)
      .where(eq(feeds.ownerId, userId));

    const result = await db
      .select({
        id: articles.id,
        feedId: articles.feedId,
        title: articles.title,
        link: articles.link,
        description: articles.description,
        author: articles.author,
        publishedAt: articles.publishedAt,
        guid: articles.guid,
        content: articles.content,
        thumbnail: articles.thumbnail,
        createdAt: articles.createdAt,
        feed: feeds,
      })
      .from(articles)
      .innerJoin(feeds, eq(articles.feedId, feeds.id))
      .where(
        and(
          sql`${feeds.id} IN ${userFeedIds}`,
          or(
            ilike(articles.title, `%${query}%`),
            ilike(articles.description, `%${query}%`),
            ilike(articles.content, `%${query}%`)
          )
        )
      )
      .orderBy(desc(articles.publishedAt));

    return result as any;
  }

  async markArticleRead(userId: string, articleId: number, read: boolean): Promise<void> {
    await db
      .insert(userArticles)
      .values({
        userId,
        articleId,
        read,
        readAt: read ? new Date() : null,
      })
      .onConflictDoUpdate({
        target: [userArticles.userId, userArticles.articleId],
        set: {
          read,
          readAt: read ? new Date() : null,
        },
      });
  }

  async toggleArticleFavorite(userId: string, articleId: number): Promise<void> {
    const existing = await db
      .select()
      .from(userArticles)
      .where(and(eq(userArticles.userId, userId), eq(userArticles.articleId, articleId)));

    const isFavorite = existing[0]?.favorite || false;

    await db
      .insert(userArticles)
      .values({
        userId,
        articleId,
        favorite: !isFavorite,
        favoriteAt: !isFavorite ? new Date() : null,
      })
      .onConflictDoUpdate({
        target: [userArticles.userId, userArticles.articleId],
        set: {
          favorite: !isFavorite,
          favoriteAt: !isFavorite ? new Date() : null,
        },
      });
  }

  // Collection operations
  async createCollection(collection: InsertCollection): Promise<Collection> {
    const [newCollection] = await db.insert(collections).values(collection).returning();
    
    // Add owner as admin member
    await db.insert(collectionMembers).values({
      collectionId: newCollection.id,
      userId: collection.ownerId,
      role: "owner",
      canAddFeeds: true,
      canComment: true,
    });

    return newCollection;
  }

  async getUserCollections(userId: string): Promise<Collection[]> {
    const result = await db
      .select({
        id: collections.id,
        name: collections.name,
        description: collections.description,
        privacy: collections.privacy,
        ownerId: collections.ownerId,
        createdAt: collections.createdAt,
        updatedAt: collections.updatedAt,
      })
      .from(collections)
      .innerJoin(collectionMembers, eq(collections.id, collectionMembers.collectionId))
      .where(eq(collectionMembers.userId, userId));

    return result;
  }

  async getCollection(id: number): Promise<Collection | undefined> {
    const [collection] = await db.select().from(collections).where(eq(collections.id, id));
    return collection;
  }

  async addCollectionMember(collectionId: number, userId: string, role: string): Promise<void> {
    await db.insert(collectionMembers).values({
      collectionId,
      userId,
      role,
      canAddFeeds: role === "admin" || role === "owner",
      canComment: true,
    });
  }

  async getCollectionMembers(collectionId: number): Promise<(CollectionMember & { user: User })[]> {
    const result = await db
      .select({
        id: collectionMembers.id,
        collectionId: collectionMembers.collectionId,
        userId: collectionMembers.userId,
        role: collectionMembers.role,
        canAddFeeds: collectionMembers.canAddFeeds,
        canComment: collectionMembers.canComment,
        joinedAt: collectionMembers.joinedAt,
        user: users,
      })
      .from(collectionMembers)
      .innerJoin(users, eq(collectionMembers.userId, users.id))
      .where(eq(collectionMembers.collectionId, collectionId));

    return result as any;
  }

  async addFeedToCollection(collectionId: number, feedId: number, addedById: string): Promise<void> {
    await db.insert(collectionFeeds).values({
      collectionId,
      feedId,
      addedById,
    });
  }

  async getCollectionFeeds(collectionId: number): Promise<Feed[]> {
    const result = await db
      .select({
        id: feeds.id,
        title: feeds.title,
        url: feeds.url,
        description: feeds.description,
        tags: feeds.tags,
        active: feeds.active,
        lastFetched: feeds.lastFetched,
        fetchInterval: feeds.fetchInterval,
        ownerId: feeds.ownerId,
        createdAt: feeds.createdAt,
        updatedAt: feeds.updatedAt,
      })
      .from(feeds)
      .innerJoin(collectionFeeds, eq(feeds.id, collectionFeeds.feedId))
      .where(eq(collectionFeeds.collectionId, collectionId));

    return result;
  }

  // Comment operations
  async createComment(comment: InsertComment): Promise<Comment> {
    const [newComment] = await db.insert(comments).values(comment).returning();
    return newComment;
  }

  async getArticleComments(articleId: number, collectionId?: number): Promise<(Comment & { user: User })[]> {
    let query = db
      .select({
        id: comments.id,
        articleId: comments.articleId,
        userId: comments.userId,
        collectionId: comments.collectionId,
        content: comments.content,
        createdAt: comments.createdAt,
        updatedAt: comments.updatedAt,
        user: users,
      })
      .from(comments)
      .innerJoin(users, eq(comments.userId, users.id))
      .where(eq(comments.articleId, articleId));

    if (collectionId) {
      query = query.where(eq(comments.collectionId, collectionId));
    }

    const result = await query.orderBy(desc(comments.createdAt));
    return result as any;
  }

  // Message operations
  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db.insert(messages).values(message).returning();
    return newMessage;
  }

  async getCollectionMessages(collectionId: number, limit = 50): Promise<(Message & { user: User })[]> {
    const result = await db
      .select({
        id: messages.id,
        collectionId: messages.collectionId,
        userId: messages.userId,
        content: messages.content,
        createdAt: messages.createdAt,
        user: users,
      })
      .from(messages)
      .innerJoin(users, eq(messages.userId, users.id))
      .where(eq(messages.collectionId, collectionId))
      .orderBy(desc(messages.createdAt))
      .limit(limit);

    return result as any;
  }
}

export const storage = new DatabaseStorage();
