import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useUnifiedAuth } from '@/hooks/useUnifiedAuth';
import { Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const UnifiedLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { signIn, user, userType, loading } = useUnifiedAuth();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Login - Rook";
  }, []);

  useEffect(() => {
    if (!loading && user && userType) {
      switch (userType) {
        case 'client':
          navigate('/client-portal', { replace: true });
          break;
        case 'partner':
          navigate('/partner-dashboard', { replace: true });
          break;
        case 'admin':
          navigate('/dashboard', { replace: true });
          break;
      }
    }
  }, [user, userType, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      // Check if account is locked
      const { data: isLockedData, error: lockCheckError } = await supabase
        .rpc('is_account_locked', { user_email: email });

      if (lockCheckError) {
        console.error('Lock check error:', lockCheckError);
      }

      if (isLockedData === true) {
        toast.error('Account temporarily locked due to multiple failed login attempts. Please try again in 30 minutes.');
        
        // Log failed attempt
        await supabase.from('login_audit').insert({
          email: email,
          attempt_type: 'login_failed',
          failure_reason: 'Account locked',
          user_agent: navigator.userAgent
        });
        
        setIsLoading(false);
        return;
      }

      const { error, userType } = await signIn(email, password);
      
      if (error) {
        // Record failed login attempt
        await supabase.rpc('record_failed_login', { user_email: email });
        
        // Log failed attempt
        await supabase.from('login_audit').insert({
          email: email,
          attempt_type: 'login_failed',
          failure_reason: error.message,
          user_agent: navigator.userAgent
        });
        
        toast.error('Unable to sign in. Please check your credentials.');
      } else {
        // Reset failed attempts on successful login
        await supabase.rpc('reset_failed_login', { user_email: email });
        
        // Log successful login
        await supabase.from('login_audit').insert({
          email: email,
          attempt_type: 'login_success',
          user_agent: navigator.userAgent
        });
        
        toast.success('Logged in successfully');
        // Navigation handled by useEffect
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FAF9F6] to-[#F1F1F1] px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <img 
              src="/clogo.png" 
              alt="Rook Logo" 
              className="h-10 object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome to Rook</h1>
          <p className="text-gray-600 mt-2">Sign in to access your portal</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>
              Enter your credentials to continue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    maxLength={18}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-500" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-500" />
                    )}
                  </Button>
                </div>
              </div>
              <Button 
                type="submit" 
                className="w-full bg-black hover:bg-gray-800 text-white" 
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
            
            <div className="mt-4 space-y-3 text-center">
              <Button
                type="button"
                variant="link"
                className="text-sm text-gray-600 hover:text-primary p-0"
                onClick={() => navigate('/forgot-password')}
              >
                Forgot your password?
              </Button>
              
              <p className="text-sm text-gray-600">
                Are you a partner?{' '}
                <a 
                  href="/partner/signup" 
                  className="text-primary font-medium hover:underline"
                >
                  Register here
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UnifiedLogin;
