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
import bcrypt from "bcryptjs";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  createUser(user: Omit<UpsertUser, 'id'> & { password?: string }): Promise<User>;
  verifyPassword(email: string, password: string): Promise<User | null>;
  
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
  getUserArticleData(userId: string, articleId: number): Promise<UserArticle | undefined>;
  
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

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.googleId, googleId));
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

  async createUser(userData: Omit<UpsertUser, 'id'> & { password?: string }): Promise<User> {
    // Generate unique ID for new user
    const userId = `user_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    
    // Hash password if provided
    let hashedPassword = null;
    if (userData.password) {
      hashedPassword = await bcrypt.hash(userData.password, 12);
    }

    const newUser = {
      ...userData,
      id: userId,
      password: hashedPassword,
      emailVerified: userData.authProvider === 'google', // Google users are auto-verified
    };

    const [user] = await db.insert(users).values(newUser).returning();
    return user;
  }

  async verifyPassword(email: string, password: string): Promise<User | null> {
    const user = await this.getUserByEmail(email);
    if (!user || !user.password) {
      return null;
    }

    const isValid = await bcrypt.compare(password, user.password);
    return isValid ? user : null;
  }

  // Feed operations
  async createFeed(feed: InsertFeed): Promise<Feed> {
    const [newFeed] = await db.insert(feeds).values(feed).returning();
    return newFeed;
  }

  async getUserFeeds(userId: string): Promise<Feed[]> {
    if (userId === '') {
      // Retourner tous les flux publics (pour le rafraîchissement automatique)
      return await db.select().from(feeds).where(eq(feeds.isPublic, true));
    }
    
    // Retourner tous les flux publics car ils sont partagés entre tous les utilisateurs
    // Mais on garde la logique pour pouvoir distinguer plus tard si nécessaire
    return await db.select().from(feeds).where(eq(feeds.isPublic, true));
  }

  async getFeed(id: number): Promise<Feed | undefined> {
    const [feed] = await db.select().from(feeds).where(eq(feeds.id, id));
    return feed;
  }

  async updateFeed(id: number, updates: Partial<InsertFeed>): Promise<Feed> {
    const updateData: any = { updatedAt: new Date() };
    
    // Only add defined fields to avoid type errors
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.url !== undefined) updateData.url = updates.url;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.tags !== undefined) updateData.tags = updates.tags;
    if (updates.active !== undefined) updateData.active = updates.active;
    if (updates.fetchInterval !== undefined) updateData.fetchInterval = updates.fetchInterval;
    if (updates.lastFetched !== undefined) updateData.lastFetched = updates.lastFetched;
    if (updates.isPublic !== undefined) updateData.isPublic = updates.isPublic;
    
    const [updatedFeed] = await db
      .update(feeds)
      .set(updateData)
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
    // Retourner tous les articles des flux publics partagés
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
      .where(eq(feeds.isPublic, true)) // Tous les flux publics
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
    // Check if record exists
    const existing = await db
      .select()
      .from(userArticles)
      .where(and(eq(userArticles.userId, userId), eq(userArticles.articleId, articleId)));

    if (existing.length > 0) {
      // Update existing record
      await db
        .update(userArticles)
        .set({
          read,
          readAt: read ? new Date() : null,
        })
        .where(and(eq(userArticles.userId, userId), eq(userArticles.articleId, articleId)));
    } else {
      // Insert new record
      await db
        .insert(userArticles)
        .values({
          userId,
          articleId,
          read,
          readAt: read ? new Date() : null,
        });
    }
  }

  async toggleArticleFavorite(userId: string, articleId: number): Promise<void> {
    const existing = await db
      .select()
      .from(userArticles)
      .where(and(eq(userArticles.userId, userId), eq(userArticles.articleId, articleId)));

    const isFavorite = existing[0]?.favorite || false;

    if (existing.length > 0) {
      // Update existing record
      await db
        .update(userArticles)
        .set({
          favorite: !isFavorite,
          favoriteAt: !isFavorite ? new Date() : null,
        })
        .where(and(eq(userArticles.userId, userId), eq(userArticles.articleId, articleId)));
    } else {
      // Insert new record
      await db
        .insert(userArticles)
        .values({
          userId,
          articleId,
          favorite: !isFavorite,
          favoriteAt: !isFavorite ? new Date() : null,
        });
    }
  }

  async getUserArticleData(userId: string, articleId: number): Promise<UserArticle | undefined> {
    const [userArticle] = await db
      .select()
      .from(userArticles)
      .where(and(eq(userArticles.userId, userId), eq(userArticles.articleId, articleId)));
    
    return userArticle;
  }

  async checkDatabaseConnection(): Promise<void> {
    // Simple query to check database connectivity
    await db.select().from(users).limit(1);
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
        isPublic: feeds.isPublic,
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
    let whereCondition = eq(comments.articleId, articleId);
    
    if (collectionId) {
      whereCondition = and(whereCondition, eq(comments.collectionId, collectionId)) as any;
    }

    const result = await db
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
      .where(whereCondition)
      .orderBy(desc(comments.createdAt));
      
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

  async deleteCollection(id: number): Promise<void> {
    // First delete all collection feeds
    await db.delete(collectionFeeds).where(eq(collectionFeeds.collectionId, id));
    
    // Then delete all collection members
    await db.delete(collectionMembers).where(eq(collectionMembers.collectionId, id));
    
    // Delete all messages in the collection
    await db.delete(messages).where(eq(messages.collectionId, id));
    
    // Finally delete the collection itself
    await db.delete(collections).where(eq(collections.id, id));
  }

  // Supprimer les articles de plus d'une semaine
  async cleanupOldArticles(): Promise<number> {
    try {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      // D'abord, supprimer les données utilisateur liées aux articles anciens
      await db.delete(userArticles)
        .where(
          sql`article_id IN (SELECT id FROM articles WHERE published_at < ${oneWeekAgo.toISOString()})`
        );

      // Ensuite, supprimer les articles anciens
      const result = await db.delete(articles)
        .where(sql`published_at < ${oneWeekAgo.toISOString()}`);

      const deletedCount = result.rowCount || 0;
      console.log(`Cleaned up ${deletedCount} articles older than ${oneWeekAgo.toISOString()}`);
      return deletedCount;
    } catch (error) {
      console.error('Error cleaning up old articles:', error);
      throw error;
    }
  }
}

export const storage = new DatabaseStorage();
