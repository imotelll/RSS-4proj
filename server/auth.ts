import dotenv from "dotenv";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as FacebookStrategy } from "passport-facebook";
import { storage } from "./storage";
import type { User } from "@shared/schema";

// Load environment variables
dotenv.config();

// Configure local strategy for email/password
passport.use(new LocalStrategy(
  {
    usernameField: 'email',
    passwordField: 'password'
  },
  async (email: string, password: string, done) => {
    try {
      const user = await storage.verifyPassword(email, password);
      if (user) {
        return done(null, user);
      } else {
        return done(null, false, { message: 'Invalid email or password' });
      }
    } catch (error) {
      return done(error);
    }
  }
));

// Configure Google strategy only if credentials are available
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || `https://4proj.lpasr.fr/api/auth/google/callback`
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log('Google OAuth callback - Profile ID:', profile.id);
        
        // Check if user exists by Google ID first, then by email
        let user = await storage.getUserByGoogleId(profile.id);
        
        if (!user) {
          // Check by email if no Google ID match
          user = await storage.getUserByEmail(profile.emails?.[0]?.value || '');
          
          if (user) {
            // Update existing user with Google info
            console.log('Updating existing user with Google ID:', profile.id);
            user = await storage.upsertUser({
              ...user,
              authProvider: 'google',
              googleId: profile.id,
              profileImageUrl: profile.photos?.[0]?.value,
              emailVerified: true,
            });
          }
        }
        
        if (!user) {
          // Create new user from Google profile
          console.log('Creating new Google user with ID:', profile.id);
          user = await storage.createUser({
            email: profile.emails?.[0]?.value || '',
            firstName: profile.name?.givenName || '',
            lastName: profile.name?.familyName || '',
            profileImageUrl: profile.photos?.[0]?.value,
            authProvider: 'google',
            googleId: profile.id,
            emailVerified: true,
          });
          console.log('Created new Google user:', user.id);
        } else {
          console.log('Found existing Google user:', user.id);
        }
        
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  ));
}

// Configure Facebook strategy only if credentials are available
if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
  passport.use(new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      callbackURL: process.env.FACEBOOK_CALLBACK_URL || `${process.env.NODE_ENV === 'production' ? 'https' : 'http'}://localhost:5000/api/auth/facebook/callback`,
      profileFields: ['id', 'first_name', 'last_name', 'email', 'picture']
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log('Facebook OAuth callback - Profile ID:', profile.id);
        
        // Check if user exists by Facebook ID first, then by email
        let user = await storage.getUserByFacebookId(profile.id);
        
        if (!user) {
          // Check by email if no Facebook ID match
          user = await storage.getUserByEmail(profile.emails?.[0]?.value || '');
          
          if (user) {
            // Update existing user with Facebook info
            console.log('Updating existing user with Facebook ID:', profile.id);
            user = await storage.upsertUser({
              ...user,
              authProvider: 'facebook',
              facebookId: profile.id,
              profileImageUrl: profile.photos?.[0]?.value,
              emailVerified: true,
            });
          }
        }
        
        if (!user) {
          // Create new user from Facebook profile
          console.log('Creating new Facebook user with ID:', profile.id);
          user = await storage.createUser({
            email: profile.emails?.[0]?.value || '',
            firstName: profile.name?.givenName || '',
            lastName: profile.name?.familyName || '',
            profileImageUrl: profile.photos?.[0]?.value,
            authProvider: 'facebook',
            facebookId: profile.id,
            emailVerified: true,
          });
          console.log('Created new Facebook user:', user.id);
        } else {
          console.log('Found existing Facebook user:', user.id);
        }
        
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  ));
}

// Serialize/deserialize user for session
passport.serializeUser((user: any, done) => {
  // Sérialiser l'ID utilisateur pour la session
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    // Récupérer l'utilisateur complet depuis la base de données
    const user = await storage.getUser(id);
    if (!user) {
      console.log('User not found during deserialization, ID:', id);
      return done(null, false); // Ne pas générer d'erreur, juste retourner false
    }
    done(null, user);
  } catch (error) {
    console.error('Error deserializing user:', error);
    done(null, false); // Ne pas générer d'erreur, juste retourner false
  }
});

export default passport;