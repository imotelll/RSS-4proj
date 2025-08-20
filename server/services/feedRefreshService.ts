import { storage } from "../storage";
import { RSSParser } from "./rssParser";

class FeedRefreshService {
  private refreshInterval: NodeJS.Timeout | null = null;
  private isRefreshing = false;

  // Démarrer le rafraîchissement automatique
  public startAutoRefresh(intervalMinutes = 60) {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }

    const intervalMs = intervalMinutes * 60 * 1000;
    console.log(`Starting auto-refresh every ${intervalMinutes} minutes`);

    this.refreshInterval = setInterval(() => {
      this.refreshAllFeeds().catch(error => {
        console.error('Error in auto-refresh:', error);
      });
    }, intervalMs);

    // Rafraîchir immédiatement au démarrage
    setTimeout(() => {
      this.refreshAllFeeds().catch(error => {
        console.error('Error in initial refresh:', error);
      });
    }, 5000); // Attendre 5 secondes après le démarrage
  }

  // Arrêter le rafraîchissement automatique
  public stopAutoRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
      console.log('Auto-refresh stopped');
    }
  }

  // Rafraîchir tous les flux publics
  public async refreshAllFeeds(): Promise<{ refreshedFeeds: number; totalNewArticles: number; totalFeeds: number }> {
    if (this.isRefreshing) {
      console.log('Refresh already in progress, skipping...');
      return { refreshedFeeds: 0, totalNewArticles: 0, totalFeeds: 0 };
    }

    this.isRefreshing = true;
    console.log('Starting automatic feed refresh...');

    try {
      const feeds = await storage.getUserFeeds(''); // Récupère tous les flux publics
      let totalNewArticles = 0;
      let refreshedFeeds = 0;

      console.log(`Refreshing ${feeds.length} public feeds`);

      for (const feed of feeds) {
        try {
          // Vérifier si le flux doit être rafraîchi
          const now = new Date();
          const lastFetched = feed.lastFetched;
          const fetchInterval = feed.fetchInterval || 3600; // Default 1 hour

          if (lastFetched) {
            const timeSinceLastFetch = (now.getTime() - lastFetched.getTime()) / 1000;
            if (timeSinceLastFetch < fetchInterval) {
              console.log(`Skipping feed ${feed.title} (last fetched ${Math.round(timeSinceLastFetch/60)} minutes ago)`);
              continue;
            }
          }

          console.log(`Refreshing feed: ${feed.title}`);
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
          
          await storage.updateFeed(feed.id, { lastFetched: now });
          totalNewArticles += newArticlesCount;
          refreshedFeeds++;
          
          if (newArticlesCount > 0) {
            console.log(`Feed ${feed.title}: ${newArticlesCount} new articles`);
          }

          // Pause courte entre les flux pour éviter la surcharge
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.error(`Error refreshing feed ${feed.title}:`, error);
        }
      }
      
      // Nettoyer les articles anciens après le rafraîchissement
      try {
        console.log('Cleaning up articles older than 7 days...');
        const cleanedCount = await storage.cleanupOldArticles();
        if (cleanedCount > 0) {
          console.log(`Cleanup complete: ${cleanedCount} old articles removed`);
        }
      } catch (error) {
        console.error('Error during article cleanup:', error);
      }

      if (totalNewArticles > 0) {
        console.log(`Auto-refresh complete: ${totalNewArticles} new articles from ${refreshedFeeds} feeds`);
      } else {
        console.log(`Auto-refresh complete: No new articles found in ${refreshedFeeds} refreshed feeds`);
      }

      return { refreshedFeeds, totalNewArticles, totalFeeds: feeds.length };
    } catch (error) {
      console.error('Error in refreshAllFeeds:', error);
      throw error;
    } finally {
      this.isRefreshing = false;
    }
  }

  // Rafraîchir un flux spécifique
  public async refreshFeed(feedId: number): Promise<{ success: boolean; newArticles: number }> {
    try {
      const feed = await storage.getFeed(feedId);
      if (!feed) {
        throw new Error('Feed not found');
      }

      console.log(`Refreshing single feed: ${feed.title}`);
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
      console.log(`Single feed refresh complete: ${newArticlesCount} new articles`);

      return { success: true, newArticles: newArticlesCount };
    } catch (error) {
      console.error('Error refreshing single feed:', error);
      throw error;
    }
  }
}

export const feedRefreshService = new FeedRefreshService();