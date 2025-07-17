import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import passport from "./auth";
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

  // Google authentication routes
  app.get('/api/auth/google', 
    passport.authenticate('google', { scope: ['profile', 'email'] })
  );

  app.get('/api/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/' }),
    (req, res) => {
      // Successful authentication, redirect to home
      res.redirect('/');
    }
  );

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims?.sub || req.user.id;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Feed routes
  app.post('/api/feeds', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const feedData = insertFeedSchema.parse({ ...req.body, ownerId: userId });
      
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

  app.get('/api/feeds', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const feeds = await storage.getUserFeeds(userId);
      res.json(feeds);
    } catch (error) {
      console.error("Error fetching feeds:", error);
      res.status(500).json({ message: "Failed to fetch feeds" });
    }
  });

  app.get('/api/feeds/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const feedId = parseInt(req.params.id);
      
      const feed = await storage.getFeed(feedId);
      if (!feed) {
        return res.status(404).json({ message: "Feed not found" });
      }
      
      if (feed.ownerId !== userId) {
        return res.status(403).json({ message: "Unauthorized access to feed" });
      }
      
      res.json(feed);
    } catch (error) {
      console.error("Error fetching feed:", error);
      res.status(500).json({ message: "Failed to fetch feed" });
    }
  });

  app.get('/api/feeds/:id/articles', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const feedId = parseInt(req.params.id);
      
      const feed = await storage.getFeed(feedId);
      if (!feed) {
        return res.status(404).json({ message: "Feed not found" });
      }
      
      if (feed.ownerId !== userId) {
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

  app.delete('/api/feeds/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const feedId = parseInt(req.params.id);
      
      const feed = await storage.getFeed(feedId);
      if (!feed || feed.ownerId !== userId) {
        return res.status(404).json({ message: "Feed not found" });
      }

      await storage.deleteFeed(feedId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting feed:", error);
      res.status(500).json({ message: "Failed to delete feed" });
    }
  });

  // Article routes
  app.get('/api/articles', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;
      
      const articles = await storage.getUserArticles(userId, limit, offset);
      res.json(articles);
    } catch (error) {
      console.error("Error fetching articles:", error);
      res.status(500).json({ message: "Failed to fetch articles" });
    }
  });

  app.get('/api/articles/search', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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

  app.post('/api/articles/:id/read', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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

  app.post('/api/articles/:id/favorite', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const articleId = parseInt(req.params.id);
      
      await storage.toggleArticleFavorite(userId, articleId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error toggling favorite:", error);
      res.status(500).json({ message: "Failed to update favorite" });
    }
  });

  // Collection routes
  app.post('/api/collections', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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

  app.get('/api/collections', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const collections = await storage.getUserCollections(userId);
      res.json(collections);
    } catch (error) {
      console.error("Error fetching collections:", error);
      res.status(500).json({ message: "Failed to fetch collections" });
    }
  });

  app.get('/api/collections/:id', isAuthenticated, async (req: any, res) => {
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

  app.post('/api/collections/:id/members', isAuthenticated, async (req: any, res) => {
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

  // Comment routes
  app.post('/api/comments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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

  app.get('/api/articles/:id/comments', isAuthenticated, async (req: any, res) => {
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

  // RSS refresh endpoint
  app.post('/api/feeds/:id/refresh', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const feedId = parseInt(req.params.id);
      
      const feed = await storage.getFeed(feedId);
      if (!feed || feed.ownerId !== userId) {
        return res.status(404).json({ message: "Feed not found" });
      }

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
        }
      }
      
      await storage.updateFeed(feed.id, { lastFetched: new Date() });
      
      res.json({ success: true, newArticles: newArticlesCount });
    } catch (error) {
      console.error("Error refreshing feed:", error);
      res.status(500).json({ message: "Failed to refresh feed" });
    }
  });

  return httpServer;
}
