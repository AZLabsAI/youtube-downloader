import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface HeroSectionProps {
  onGetStarted?: () => void;
}

export function HeroSection({ onGetStarted }: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-red-50 via-white to-blue-50 dark:from-red-950/20 dark:via-gray-950 dark:to-blue-950/20" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgb(15_23_42_/_0.15)_1px,transparent_0)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
      
      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-red-500/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-gradient-to-r from-purple-500/5 via-pink-500/5 to-red-500/5 rounded-full blur-3xl" />

      <div className="relative container mx-auto px-4 py-20 lg:py-32">
        <div className="text-center max-w-5xl mx-auto">
          {/* Announcement Badge */}
          <div className="flex justify-center mb-8">
            <Badge variant="outline" className="px-4 py-2 text-sm font-medium bg-white/50 backdrop-blur-sm border-red-200/50">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
              New: AI-Powered Quality Detection
            </Badge>
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 tracking-tight">
            <span className="bg-gradient-to-r from-gray-900 via-red-600 to-red-800 bg-clip-text text-transparent dark:from-white dark:via-red-400 dark:to-red-600">
              Professional
            </span>
            <br />
            <span className="bg-gradient-to-r from-red-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
              YouTube Downloader
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
            Enterprise-grade video downloading solution with advanced quality selection, 
            lightning-fast processing, and enterprise-level security.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button
              size="lg"
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-8 py-6 text-lg font-medium shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              onClick={onGetStarted}
            >
              Start Downloading
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="px-8 py-6 text-lg font-medium border-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300"
            >
              View Documentation
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
            <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-white/20 shadow-sm">
              <div className="text-3xl font-bold text-red-600 mb-1">99.9%</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Uptime</div>
            </div>
            <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-white/20 shadow-sm">
              <div className="text-3xl font-bold text-blue-600 mb-1">4K</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Max Quality</div>
            </div>
            <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-white/20 shadow-sm">
              <div className="text-3xl font-bold text-purple-600 mb-1">10M+</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Downloads</div>
            </div>
            <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-white/20 shadow-sm">
              <div className="text-3xl font-bold text-green-600 mb-1">24/7</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Support</div>
            </div>
          </div>

          {/* Feature Highlights */}
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center group">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Lightning Fast</h3>
              <p className="text-gray-600 dark:text-gray-300">Download videos in seconds with our optimized infrastructure</p>
            </div>
            
            <div className="text-center group">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Enterprise Security</h3>
              <p className="text-gray-600 dark:text-gray-300">Bank-level encryption and privacy protection</p>
            </div>
            
            <div className="text-center group">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2h4a1 1 0 110 2h-1v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6H3a1 1 0 010-2h4zm2-1v1h6V3H9zm-2 4v10h10V7H7z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Multiple Formats</h3>
              <p className="text-gray-600 dark:text-gray-300">Support for all major video and audio formats</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
} 