import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Rss, Users, Search, Globe } from "lucide-react";
import SignUpForm from "@/components/SignUpForm";
import LoginForm from "@/components/LoginForm";

type ViewMode = 'landing' | 'signup' | 'login';

export default function Landing() {
  const [viewMode, setViewMode] = useState<ViewMode>('landing');

  if (viewMode === 'signup') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <SignUpForm 
            onSuccess={() => setViewMode('landing')} 
            onSwitchToLogin={() => setViewMode('login')}
          />
        </div>
      </div>
    );
  }

  if (viewMode === 'login') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <LoginForm 
            onSuccess={() => setViewMode('landing')} 
            onSwitchToSignUp={() => setViewMode('signup')}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex justify-center items-center mb-6">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center">
              <Rss className="text-primary-foreground text-2xl" size={32} />
            </div>
          </div>
          <h1 className="text-5xl font-bold text-foreground mb-6">
            Welcome to SUPRSS
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            A modern, collaborative RSS reader that brings teams together around the content that matters most.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              size="lg" 
              className="text-lg px-8 py-4"
              onClick={() => setViewMode('signup')}
            >
              Create Account
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="text-lg px-8 py-4"
              onClick={() => setViewMode('login')}
            >
              Sign In
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card>
            <CardHeader>
              <Rss className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Smart Feed Management</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Organize and manage all your RSS feeds in one place with intelligent categorization and filtering.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Users className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Team Collaboration</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Create shared collections, invite team members, and collaborate on content discovery.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Search className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Powerful Search</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Find exactly what you're looking for with full-text search across all your articles and feeds.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Globe className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Import & Export</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Easily migrate your existing feeds with OPML support and export your collections anytime.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl">Ready to transform your RSS experience?</CardTitle>
              <CardDescription className="text-lg">
                Join thousands of teams already using SUPRSS to stay informed and collaborate effectively.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  className="text-lg px-8 py-4"
                  onClick={() => setViewMode('signup')}
                >
                  Get Started for Free
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="text-lg px-8 py-4"
                  onClick={() => setViewMode('login')}
                >
                  Sign In
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
