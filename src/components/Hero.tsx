
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
          <div className="text-center mb-16 animate-fade-in">
            <div className="inline-flex items-center gap-2 bg-gray-100 rounded-full px-6 py-3 mb-8 text-sm text-gray-700 font-medium">
              <Shield className="w-4 h-4" />
              Secure • Professional • Trusted
            </div>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-gray-900 leading-tight mb-6">
              Your Project Portal
              <span className="block bg-gradient-to-r from-gray-700 to-gray-900 bg-clip-text text-transparent mt-2">
                Reimagined
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed mb-8">
              Experience seamless project management with real-time updates, 
              secure file sharing, and direct team communication.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Button 
                variant="homepage" 
                size="lg" 
                className="bg-green-600 text-white rounded-full px-8 py-6 text-lg font-medium shadow-lg transition-all duration-300 group w-full sm:w-auto" 
                asChild
              >
                <Link to="/login" className="flex items-center gap-3">
                  🔐 Access Your Projects
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              
              <Button 
                variant="outline" 
                size="lg" 
                className="border-2 border-green-300 text-green-700 bg-white rounded-full px-8 py-6 text-lg font-medium shadow-sm transition-all duration-300 w-full sm:w-auto" 
                asChild
              >
                <Link to="/register" className="flex items-center gap-3">
                  📝 Start New Project
                </Link>
              </Button>
            </div>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-gray-200">
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mb-4">
                <span className="text-2xl">🕒</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Real-Time Updates</h3>
              <p className="text-gray-600">Stay informed with instant notifications and live project status updates.</p>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-gray-200">
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mb-4">
                <span className="text-2xl">💬</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Direct Communication</h3>
              <p className="text-gray-600">Connect directly with your team through integrated messaging and comments.</p>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-gray-200">
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mb-4">
                <span className="text-2xl">📁</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Secure File Management</h3>
              <p className="text-gray-600">Access all your project files and documents in one organized, secure location.</p>
            </div>
          </div>

          {/* Trust Indicator */}
          <div className="text-center animate-fade-in" style={{ animationDelay: '0.6s' }}>
            <div className="flex items-center justify-center gap-2 text-gray-500 mb-4">
              <Users className="w-5 h-5" />
              <span className="text-sm font-medium">Trusted by 500+ clients worldwide</span>
            </div>
            <div className="flex items-center justify-center gap-8 text-gray-400">
              <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
              <span className="text-xs uppercase tracking-widest">Enterprise Grade Security</span>
              <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
