import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 lg:px-6">
        <div className="flex h-16 items-center justify-between">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="relative">
                <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a2.999 2.999 0 0 0-2.109-2.109C19.605 3.656 12 3.656 12 3.656s-7.605 0-9.389.421A2.999 2.999 0 0 0 .502 6.186C.08 7.969.08 12.004.08 12.004s0 4.035.422 5.818a2.999 2.999 0 0 0 2.109 2.109c1.784.421 9.389.421 9.389.421s7.605 0 9.389-.421a2.999 2.999 0 0 0 2.109-2.109c.422-1.783.422-5.818.422-5.818s0-4.035-.422-5.818z"/>
                    <path d="M9.545 15.568V8.436l6.909 3.566-6.909 3.566z" fill="white"/>
                  </svg>
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full"></div>
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent dark:from-white dark:to-gray-300">
                  YTDownloader
                </span>
                <span className="text-xs text-muted-foreground leading-none">Pro</span>
              </div>
            </div>
            <Badge variant="secondary" className="hidden sm:inline-flex">
              Enterprise
            </Badge>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </a>
            <a href="#api" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              API
            </a>
            <a href="#support" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Support
            </a>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
              Sign In
            </Button>
            <Button size="sm" className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700">
              Get Started
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
} 