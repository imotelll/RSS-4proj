import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { sql, eq } from "drizzle-orm";
import { articles, userArticles, feeds } from "@shared/schema";
import { setupAuth, isAuthenticated } from "./replitAuth";
import passport from "./auth"; // Import passport configuration
import { registerUserSchema } from "@shared/schema";
import { RSSParser } from "./services/rssParser";
import { WebSocketService } from "./services/websocket";
import { insertFeedSchema, insertCollectionSchema, insertCommentSchema } from "@shared/schema";
import { z } from "zod";

let wsService: WebSocketService;

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint for Docker
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Auth middleware
  await setupAuth(app);

  const httpServer = createServer(app);
  
  // Initialize WebSocket service
  wsService = new WebSocketService(httpServer);

  // Initialize passport middleware
  app.use(passport.initialize());
  app.use(passport.session());

  // Registration route
  app.post('/api/auth/register', async (req, res) => {
    try {
      const userData = registerUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }

      // Create new user
      const newUser = await storage.createUser({
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        password: userData.password,
        authProvider: 'email',
      });

      res.status(201).json({ 
        message: "Account created successfully",
        user: {
          id: newUser.id,
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
        }
      });
    } catch (error: any) {
      console.error("Registration error:", error);
      res.status(400).json({ message: error.message || "Registration failed" });
    }
  });

  // Local login route
  app.post('/api/auth/login', async (req, res, next) => {
    passport.authenticate('local', (err: any, user: any, info: any) => {
      if (err) {
        return res.status(500).json({ message: "Authentication error" });
      }
      if (!user) {
        return res.status(401).json({ message: info?.message || "Invalid credentials" });
      }
      
      req.logIn(user, (err) => {
        if (err) {
          return res.status(500).json({ message: "Login failed" });
        }
        return res.json({ 
          message: "Login successful",
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
          }
        });
      });
    })(req, res, next);
  });

  // Google authentication routes (only if Google OAuth is configured)
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    app.get('/api/auth/google', 
      passport.authenticate('google', { scope: ['profile', 'email'] })
    );

    app.get('/api/auth/google/callback',
      passport.authenticate('google', { failureRedirect: '/' }),
      (req, res) => {
        // Successful authentication, redirect to home
        console.log('Google auth successful, user:', req.user);
        res.redirect('/');
      }
    );
  } else {
    // Fallback route if Google OAuth is not configured
    app.get('/api/auth/google', (req, res) => {
      res.status(501).json({ message: "Google authentication not configured" });
    });
  }


  // Middleware to handle both Replit and local authentication
  const isAuthenticatedMixed = async (req: any, res: any, next: any) => {
    // Check if user is authenticated via Replit Auth
    if (req.user?.claims?.sub) {
      return next();
    }
    
    // Check if user is authenticated via local/Google auth
    if (req.user?.id && req.isAuthenticated()) {
      return next();
    }
    
    // If neither, try Replit auth middleware but handle strategy errors gracefully
    try {
      return isAuthenticated(req, res, (err?: any) => {
        if (err) {
          return res.status(401).json({ message: "Unauthorized" });
        }
        next();
      });
    } catch (error: any) {
      // If Replit auth strategy fails (e.g., unknown domain), treat as unauthorized
      if (error.message && error.message.includes('Unknown authentication strategy')) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      return res.status(401).json({ message: "Unauthorized" });
    }
  };

  // Auth routes
  app.get('/api/auth/user', isAuthenticatedMixed, async (req: any, res) => {
    try {
      const userId = req.user.claims?.sub || req.user.id;
      console.log('Fetching user with ID:', userId);
      
      const user = await storage.getUser(userId);
      if (!user) {
        console.log('User not found in database:', userId);
        return res.status(404).json({ message: "User not found" });
      }
      
      console.log('User found:', user.email);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Feed routes
  app.post('/api/feeds', isAuthenticatedMixed, async (req: any, res) => {
    try {
      const userId = req.user.claims?.sub || req.user.id;
      const feedData = insertFeedSchema.parse({ ...req.body, ownerId: userId, isPublic: true });
      
      // Validate RSS feed
      const isValid = await RSSParser.validateFeedUrl(feedData.url);
      if (!isValid) {
        return res.status(400).json({ message: "Invalid RSS feed URL" });
      }

      const feed = await storage.createFeed(feedData);
      
      // Fetch initial articles
      try {
        const parsedFeed = await RSSParser.parseFeed(feedData.url);
        for (const item of parsedFeed.items) {
          await storage.createArticle({
            feedId: feed.id,
            title: item.title,
            link: item.link,
            description: item.description,
            author: item.author,
            publishedAt: item.publishedAt,
            guid: item.guid,
            content: item.content,
          });
        }
        
        await storage.updateFeed(feed.id, { lastFetched: new Date() });
      } catch (error) {
        console.error('Error fetching initial articles:', error);
      }

      res.json(feed);
    } catch (error) {
      console.error("Error creating feed:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid feed data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create feed" });
    }
  });

  app.get('/api/feeds', isAuthenticatedMixed, async (req: any, res) => {
    try {
      const userId = req.user.claims?.sub || req.user.id;
      const feeds = await storage.getUserFeeds(userId);
      res.json(feeds);
    } catch (error) {
      console.error("Error fetching feeds:", error);
      res.status(500).json({ message: "Failed to fetch feeds" });
    }
  });

  // Route pour les statistiques par flux - DOIT être AVANT /api/feeds/:id
  app.get('/api/feeds/stats', isAuthenticatedMixed, async (req: any, res) => {
    try {
      const userId = req.user.claims?.sub || req.user.id;
      console.log(`[FEEDS/STATS] User ID: ${userId}, User object:`, req.user);
      
      if (!userId) {
        console.error('[FEEDS/STATS] No user ID found');
        return res.status(400).json({ message: "Invalid user ID" });
      }

      const feeds = await storage.getUserFeeds(userId);
      console.log(`[FEEDS/STATS] Getting stats for ${feeds.length} feeds for user ${userId}`);
      
      if (feeds.length === 0) {
        console.log('[FEEDS/STATS] No feeds found for user, returning empty array');
        return res.json([]);
      }

      const feedStats = await Promise.all(feeds.map(async (feed) => {
        try {
          console.log(`[FEEDS/STATS] Processing feed ${feed.id} (${feed.title})`);
          // Utiliser la nouvelle méthode optimisée
          const stats = await storage.getFeedStats(userId, feed.id);
          console.log(`[FEEDS/STATS] Feed ${feed.title}: ${stats.total} total, ${stats.unread} unread, ${stats.favorites} favorites, ${stats.read} read`);
          
          return stats;
        } catch (feedError) {
          console.error(`[FEEDS/STATS] Error getting stats for feed ${feed.id}:`, feedError);
          return {
            feedId: feed.id,
            title: feed.title,
            total: 0,
            unread: 0,
            favorites: 0,
            read: 0
          };
        }
      }));
      
      console.log(`[FEEDS/STATS] Returning stats for ${feedStats.length} feeds`);
      res.json(feedStats);
    } catch (error) {
      console.error("[FEEDS/STATS] Error fetching feed stats:", error);
      res.status(500).json({ message: "Failed to fetch feed stats" });
    }
  });

  app.get('/api/feeds/:id', isAuthenticatedMixed, async (req: any, res) => {
    try {
      const userId = req.user.claims?.sub || req.user.id;
      const feedId = parseInt(req.params.id);
      
      if (isNaN(feedId)) {
        return res.status(400).json({ message: "Invalid feed ID" });
      }
      
      const feed = await storage.getFeed(feedId);
      if (!feed) {
        return res.status(404).json({ message: "Feed not found" });
      }
      
      // Permettre l'accès aux flux publics pour tous les utilisateurs
      if (!feed.isPublic && feed.ownerId !== userId) {
        return res.status(403).json({ message: "Unauthorized access to feed" });
      }
      
      res.json(feed);
    } catch (error) {
      console.error("Error fetching feed:", error);
      res.status(500).json({ message: "Failed to fetch feed" });
    }
  });

  app.get('/api/feeds/:id/articles', isAuthenticatedMixed, async (req: any, res) => {
    try {
      const userId = req.user.claims?.sub || req.user.id;
      const feedId = parseInt(req.params.id);
      
      if (isNaN(feedId)) {
        return res.status(400).json({ message: "Invalid feed ID" });
      }
      
      const feed = await storage.getFeed(feedId);
      if (!feed) {
        return res.status(404).json({ message: "Feed not found" });
      }
      
      // Permettre l'accès aux articles des flux publics pour tous les utilisateurs
      if (!feed.isPublic && feed.ownerId !== userId) {
        return res.status(403).json({ message: "Unauthorized access to feed" });
      }
      
      const articles = await storage.getArticlesByFeed(feedId);
      
      // Add feed info and user article data to each article
      const articlesWithFeedAndUserData = await Promise.all(
        articles.map(async (article) => {
          const userArticle = await storage.getUserArticleData(userId, article.id);
          return {
            ...article,
            feed: { id: feed.id, title: feed.title },
            userArticle
          };
        })
      );
      
      res.json(articlesWithFeedAndUserData);
    } catch (error) {
      console.error("Error fetching feed articles:", error);
      res.status(500).json({ message: "Failed to fetch feed articles" });
    }
  });

  app.delete('/api/feeds/:id', isAuthenticatedMixed, async (req: any, res) => {
    try {
      const userId = req.user.claims?.sub || req.user.id;
      const feedId = parseInt(req.params.id);
      
      const feed = await storage.getFeed(feedId);
      if (!feed) {
        return res.status(404).json({ message: "Feed not found" });
      }
      
      // Permettre à tout utilisateur connecté de supprimer des flux publics
      // puisque tous les flux sont partagés entre utilisateurs
      if (!feed.isPublic && feed.ownerId !== userId) {
        return res.status(403).json({ message: "Unauthorized: Only the owner can delete private feeds" });
      }

      await storage.deleteFeed(feedId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting feed:", error);
      res.status(500).json({ message: "Failed to delete feed" });
    }
  });

  // Article routes
  app.get('/api/articles', isAuthenticatedMixed, async (req: any, res) => {
    try {
      const userId = req.user.claims?.sub || req.user.id;
      const limit = parseInt(req.query.limit as string) || 100; // Augmenter la limite pour avoir plus d'articles
      const offset = parseInt(req.query.offset as string) || 0;
      const filter = req.query.filter as string || 'all';
      
      let articles = await storage.getUserArticles(userId, limit, offset);
      
      // Enrichir avec les données read/favorite AVANT de filtrer
      const enrichedArticles = articles.map(article => ({
        ...article,
        read: article.userArticle?.read || false,
        favorite: article.userArticle?.favorite || false,
      }));
      
      // Appliquer le filtre APRÈS enrichissement
      let filteredArticles = enrichedArticles;
      if (filter === 'unread') {
        filteredArticles = enrichedArticles.filter(article => !article.read);
      } else if (filter === 'read') {
        filteredArticles = enrichedArticles.filter(article => article.read);
      }
      
      console.log(`Filter: ${filter}, Total articles: ${enrichedArticles.length}, Filtered: ${filteredArticles.length}`);
      
      res.json(filteredArticles);
    } catch (error) {
      console.error("Error fetching articles:", error);
      res.status(500).json({ message: "Failed to fetch articles" });
    }
  });

  // Route spécifique pour les favoris
  app.get('/api/articles/favorites', isAuthenticatedMixed, async (req: any, res) => {
    try {
      const userId = req.user.claims?.sub || req.user.id;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;
      
      const allArticles = await storage.getUserArticles(userId, limit * 10, 0); // Récupérer plus d'articles
      const favoriteArticles = allArticles.filter(article => article.userArticle?.favorite);
      
      // Paginer les favoris
      const paginatedFavorites = favoriteArticles.slice(offset, offset + limit);
      
      res.json(paginatedFavorites);
    } catch (error) {
      console.error("Error fetching favorite articles:", error);
      res.status(500).json({ message: "Failed to fetch favorite articles" });
    }
  });

  // Route pour les statistiques (compteurs)
  app.get('/api/stats', isAuthenticatedMixed, async (req: any, res) => {
    try {
      const userId = req.user.claims?.sub || req.user.id;
      console.log(`[STATS] Getting global stats for user ${userId}`);
      
      // Requête optimisée pour récupérer toutes les statistiques en une fois
      const stats = await db
        .select({
          totalArticles: sql<number>`COUNT(*)`,
          readArticles: sql<number>`COUNT(CASE WHEN ${userArticles.read} = true THEN 1 END)`,
          favoriteArticles: sql<number>`COUNT(CASE WHEN ${userArticles.favorite} = true THEN 1 END)`,
        })
        .from(articles)
        .leftJoin(userArticles, 
          sql`${articles.id} = ${userArticles.articleId} AND ${userArticles.userId} = ${userId}`
        );

      const result = stats[0];
      const totalArticles = result.totalArticles || 0;
      const readArticles = result.readArticles || 0;
      const favoriteArticles = result.favoriteArticles || 0;
      const unreadArticles = totalArticles - readArticles;

      console.log(`[STATS] Global stats: ${totalArticles} total, ${unreadArticles} unread, ${favoriteArticles} favorites`);
      
      res.json({
        totalArticles,
        unreadArticles,
        favoriteArticles,
        readArticles
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });


  app.get('/api/articles/search', isAuthenticatedMixed, async (req: any, res) => {
    try {
      const userId = req.user.claims?.sub || req.user.id;
      const query = req.query.q as string;
      
      if (!query) {
        return res.status(400).json({ message: "Search query required" });
      }

      const articles = await storage.searchArticles(userId, query);
      res.json(articles);
    } catch (error) {
      console.error("Error searching articles:", error);
      res.status(500).json({ message: "Failed to search articles" });
    }
  });

  app.post('/api/articles/:id/read', isAuthenticatedMixed, async (req: any, res) => {
    try {
      const userId = req.user.claims?.sub || req.user.id;
      const articleId = parseInt(req.params.id);
      const { read } = req.body;
      
      await storage.markArticleRead(userId, articleId, read);
      
      wsService.broadcastArticleUpdate(articleId, { read, userId });
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking article as read:", error);
      res.status(500).json({ message: "Failed to update article" });
    }
  });

  app.post('/api/articles/:id/favorite', isAuthenticatedMixed, async (req: any, res) => {
    try {
      const userId = req.user.claims?.sub || req.user.id;
      const articleId = parseInt(req.params.id);
      
      await storage.toggleArticleFavorite(userId, articleId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error toggling favorite:", error);
      res.status(500).json({ message: "Failed to update favorite" });
    }
  });

  // Collection routes
  app.post('/api/collections', isAuthenticatedMixed, async (req: any, res) => {
    try {
      const userId = req.user.claims?.sub || req.user.id;
      const collectionData = insertCollectionSchema.parse({ ...req.body, ownerId: userId });
      
      const collection = await storage.createCollection(collectionData);
      res.json(collection);
    } catch (error) {
      console.error("Error creating collection:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid collection data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create collection" });
    }
  });

  app.get('/api/collections', isAuthenticatedMixed, async (req: any, res) => {
    try {
      const userId = req.user.claims?.sub || req.user.id;
      const collections = await storage.getUserCollections(userId);
      res.json(collections);
    } catch (error) {
      console.error("Error fetching collections:", error);
      res.status(500).json({ message: "Failed to fetch collections" });
    }
  });

  app.get('/api/collections/:id', isAuthenticatedMixed, async (req: any, res) => {
    try {
      const collectionId = parseInt(req.params.id);
      const collection = await storage.getCollection(collectionId);
      
      if (!collection) {
        return res.status(404).json({ message: "Collection not found" });
      }

      const members = await storage.getCollectionMembers(collectionId);
      const feeds = await storage.getCollectionFeeds(collectionId);
      
      res.json({ ...collection, members, feeds });
    } catch (error) {
      console.error("Error fetching collection:", error);
      res.status(500).json({ message: "Failed to fetch collection" });
    }
  });

  app.post('/api/collections/:id/members', isAuthenticatedMixed, async (req: any, res) => {
    try {
      const collectionId = parseInt(req.params.id);
      const { userId, role } = req.body;
      
      await storage.addCollectionMember(collectionId, userId, role || 'member');
      res.json({ success: true });
    } catch (error) {
      console.error("Error adding collection member:", error);
      res.status(500).json({ message: "Failed to add member" });
    }
  });

  // Delete collection
  app.delete('/api/collections/:id', isAuthenticatedMixed, async (req: any, res) => {
    try {
      const userId = req.user.claims?.sub || req.user.id;
      const collectionId = parseInt(req.params.id);
      
      const collection = await storage.getCollection(collectionId);
      if (!collection) {
        return res.status(404).json({ message: "Collection not found" });
      }
      
      // Seul le propriétaire peut supprimer une collection
      if (collection.ownerId !== userId) {
        return res.status(403).json({ message: "Unauthorized: Only the owner can delete this collection" });
      }

      await storage.deleteCollection(collectionId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting collection:", error);
      res.status(500).json({ message: "Failed to delete collection" });
    }
  });

  // Comment routes
  app.post('/api/comments', isAuthenticatedMixed, async (req: any, res) => {
    try {
      const userId = req.user.claims?.sub || req.user.id;
      const commentData = insertCommentSchema.parse({ ...req.body, userId });
      
      const comment = await storage.createComment(commentData);
      const user = await storage.getUser(userId);
      
      res.json({ ...comment, user });
    } catch (error) {
      console.error("Error creating comment:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid comment data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create comment" });
    }
  });

  app.get('/api/articles/:id/comments', isAuthenticatedMixed, async (req: any, res) => {
    try {
      const articleId = parseInt(req.params.id);
      const collectionId = req.query.collectionId ? parseInt(req.query.collectionId as string) : undefined;
      
      const comments = await storage.getArticleComments(articleId, collectionId);
      res.json(comments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  // RSS refresh endpoint - accessible à tous pour les flux publics
  app.post('/api/feeds/:id/refresh', isAuthenticatedMixed, async (req: any, res) => {
    try {
      const userId = req.user.claims?.sub || req.user.id;
      const feedId = parseInt(req.params.id);
      
      const feed = await storage.getFeed(feedId);
      if (!feed) {
        return res.status(404).json({ message: "Feed not found" });
      }

      // Permettre le rafraîchissement des flux publics par tous les utilisateurs
      if (!feed.isPublic && feed.ownerId !== userId) {
        return res.status(403).json({ message: "Unauthorized to refresh this feed" });
      }

      console.log(`Refreshing feed: ${feed.title} (${feed.url})`);
      const parsedFeed = await RSSParser.parseFeed(feed.url);
      let newArticlesCount = 0;

      for (const item of parsedFeed.items) {
        try {
          await storage.createArticle({
            feedId: feed.id,
            title: item.title,
            link: item.link,
            description: item.description,
            author: item.author,
            publishedAt: item.publishedAt,
            guid: item.guid,
            content: item.content,
          });
          newArticlesCount++;
        } catch (error) {
          // Article might already exist (duplicate guid), skip
          console.log(`Skipping duplicate article: ${item.title}`);
        }
      }
      
      await storage.updateFeed(feed.id, { lastFetched: new Date() });
      console.log(`Feed refreshed: ${newArticlesCount} new articles added`);
      
      res.json({ success: true, newArticles: newArticlesCount });
    } catch (error) {
      console.error("Error refreshing feed:", error);
      res.status(500).json({ message: "Failed to refresh feed" });
    }
  });

  // Endpoint pour rafraîchir tous les flux publics
  app.post('/api/feeds/refresh-all', isAuthenticatedMixed, async (req: any, res) => {
    try {
      const { feedRefreshService } = await import("./services/feedRefreshService");
      const result = await feedRefreshService.refreshAllFeeds();
      
      res.json({ 
        success: true, 
        refreshedFeeds: result.refreshedFeeds, 
        totalNewArticles: result.totalNewArticles,
        totalFeeds: result.totalFeeds 
      });
    } catch (error) {
      console.error("Error refreshing all feeds:", error);
      res.status(500).json({ message: "Failed to refresh feeds" });
    }
  });

  // Health check endpoint pour Docker
  app.get('/api/health', async (req, res) => {
    try {
      // Vérifier la connexion à la base de données
      await storage.checkDatabaseConnection();
      
      res.status(200).json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        database: 'connected'
      });
    } catch (error: any) {
      console.error('Health check failed:', error);
      res.status(503).json({ 
        status: 'error', 
        timestamp: new Date().toISOString(),
        database: 'disconnected',
        error: error.message
      });
    }
  });

  return httpServer;
}
