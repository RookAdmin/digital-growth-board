
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Shield, Users } from "lucide-react";

export const Hero = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-gray-50 via-white to-gray-50 py-20 md:py-32">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-96 h-96 bg-gray-900 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-gray-700 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-96 h-96 bg-gray-600 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-6xl mx-auto">
          {/* Main Hero Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center animate-fade-in">
            {/* Left Side - Text Content */}
            <div className="text-left">
              <div className="inline-flex items-center gap-2 bg-white/60 backdrop-blur-lg border border-white/20 rounded-full px-6 py-3 mb-8 text-sm text-gray-700 font-medium shadow-lg">
                <Shield className="w-4 h-4" />
                Secure • Professional • Trusted
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
                Your Project Portal
                <span className="block bg-gradient-to-r from-gray-700 to-gray-900 bg-clip-text text-transparent mt-2">
                  Reimagined
                </span>
              </h1>
              
              <p className="text-lg md:text-xl text-gray-600 leading-relaxed mb-8">
                Experience seamless project management with real-time updates, 
                secure file sharing, and direct team communication.
              </p>
              
              <div className="flex flex-col sm:flex-row items-start gap-4 mb-8">
                <Button 
                  variant="homepage" 
                  size="lg" 
                  className="bg-green-600 hover:bg-green-700 text-white rounded-full px-8 py-6 text-lg font-medium shadow-lg backdrop-blur-sm border border-green-500/20 transition-all duration-300 group w-full sm:w-auto" 
                  asChild
                >
                  <Link to="/login" className="flex items-center gap-3">
                    Access Your Projects
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
                
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="border border-green-300/50 bg-white/80 backdrop-blur-sm text-green-700 hover:bg-white/90 rounded-full px-8 py-6 text-lg font-medium shadow-lg transition-all duration-300 w-full sm:w-auto" 
                  asChild
                >
                  <Link to="/register" className="flex items-center gap-3">
                    Start New Project
                  </Link>
                </Button>
              </div>

              {/* Trust Indicator */}
              <div className="flex items-center gap-2 text-gray-500 mb-4">
                <Users className="w-5 h-5" />
                <span className="text-sm font-medium">Trusted by 500+ clients worldwide</span>
              </div>
            </div>

            {/* Right Side - Animated Image */}
            <div className="relative lg:ml-8">
              <div className="relative w-full h-96 lg:h-[500px]">
                {/* Animated Geometric Shapes */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative w-80 h-80 lg:w-96 lg:h-96">
                    {/* Main Circle */}
                    <div className="absolute inset-0 border-2 border-green-200/50 rounded-full animate-spin" style={{ animationDuration: '20s' }}></div>
                    
                    {/* Floating Elements */}
                    <div className="absolute top-8 left-8 w-16 h-16 bg-white/80 backdrop-blur-md border border-white/30 rounded-2xl shadow-lg animate-bounce flex items-center justify-center" style={{ animationDelay: '0s', animationDuration: '3s' }}>
                      <div className="w-8 h-8 bg-green-100 rounded-lg"></div>
                    </div>
                    
                    <div className="absolute top-16 right-8 w-20 h-20 bg-white/80 backdrop-blur-md border border-white/30 rounded-full shadow-lg animate-bounce flex items-center justify-center" style={{ animationDelay: '1s', animationDuration: '2.5s' }}>
                      <div className="w-10 h-10 bg-blue-100 rounded-full"></div>
                    </div>
                    
                    <div className="absolute bottom-16 left-12 w-14 h-14 bg-white/80 backdrop-blur-md border border-white/30 rounded-xl shadow-lg animate-bounce flex items-center justify-center" style={{ animationDelay: '2s', animationDuration: '3.5s' }}>
                      <div className="w-6 h-6 bg-purple-100 rounded-lg"></div>
                    </div>
                    
                    <div className="absolute bottom-8 right-16 w-18 h-18 bg-white/80 backdrop-blur-md border border-white/30 rounded-3xl shadow-lg animate-bounce flex items-center justify-center" style={{ animationDelay: '0.5s', animationDuration: '2.8s' }}>
                      <div className="w-8 h-8 bg-yellow-100 rounded-2xl"></div>
                    </div>
                    
                    {/* Center Dashboard Mockup */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-48 h-32 bg-white/90 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/30 p-4 animate-pulse">
                        <div className="space-y-2">
                          <div className="h-2 bg-green-200 rounded-full w-3/4"></div>
                          <div className="h-2 bg-gray-200 rounded-full w-1/2"></div>
                          <div className="h-2 bg-blue-200 rounded-full w-5/6"></div>
                          <div className="flex gap-2 mt-3">
                            <div className="w-6 h-6 bg-green-100 rounded-full"></div>
                            <div className="w-6 h-6 bg-blue-100 rounded-full"></div>
                            <div className="w-6 h-6 bg-purple-100 rounded-full"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Background Gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-green-50/50 to-blue-50/50 rounded-full filter blur-3xl"></div>
              </div>
            </div>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <div className="bg-white/70 backdrop-blur-lg rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 border border-white/20 hover:border-white/30">
              <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mb-4 shadow-inner">
                <div className="w-6 h-6 bg-green-500 rounded-lg"></div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Real-Time Updates</h3>
              <p className="text-gray-600">Stay informed with instant notifications and live project status updates.</p>
            </div>
            
            <div className="bg-white/70 backdrop-blur-lg rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 border border-white/20 hover:border-white/30">
              <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mb-4 shadow-inner">
                <div className="w-6 h-6 bg-blue-500 rounded-lg"></div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Direct Communication</h3>
              <p className="text-gray-600">Connect directly with your team through integrated messaging and comments.</p>
            </div>
            
            <div className="bg-white/70 backdrop-blur-lg rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 border border-white/20 hover:border-white/30">
              <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mb-4 shadow-inner">
                <div className="w-6 h-6 bg-purple-500 rounded-lg"></div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Secure File Management</h3>
              <p className="text-gray-600">Access all your project files and documents in one organized, secure location.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
