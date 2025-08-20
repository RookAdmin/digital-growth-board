
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useSecureAuth } from "@/hooks/useSecureAuth";
import { Header } from "@/components/Header";
import { SecureInput } from "@/components/SecureInput";
import { SecureForm } from "@/components/SecureForm";
import { validateEmail, validatePassword, auditLog } from "@/utils/security";
import { Shield, Lock, AlertTriangle } from "lucide-react";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { session, loading, signIn, loginAttempts, isLocked } = useSecureAuth();

  useEffect(() => {
    document.title = "Secure Login - Rook";
  }, []);

  useEffect(() => {
    if (!loading && session) {
      navigate('/dashboard');
    }
  }, [session, loading, navigate]);

  const handleSecureSubmit = async (data: Record<string, string>) => {
    const { email: formEmail, password: formPassword } = data;
    
    if (!formEmail || !formPassword) {
      toast.error("Please fill in all fields");
      return;
    }

    if (!validateEmail(formEmail)) {
      auditLog('INVALID_EMAIL_FORMAT', undefined, { email: formEmail });
      toast.error("Please enter a valid email address");
      return;
    }

    const passwordValidation = validatePassword(formPassword);
    if (!passwordValidation.isValid) {
      auditLog('WEAK_PASSWORD_ATTEMPT', undefined, { email: formEmail });
      toast.error("Password does not meet security requirements");
      return;
    }

    if (isLocked) {
      toast.error("Account temporarily locked due to multiple failed attempts. Please try again later.");
      return;
    }

    setIsLoading(true);
    try {
      await signIn(formEmail, formPassword);
      toast.success("Logged in successfully");
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 animate-spin text-blue-600" />
          <span>Securing connection...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100">
      <Header isAuthenticated={false} />
      <div className="flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md bg-white shadow-xl border-0">
          <CardHeader className="space-y-1 text-center pb-8">
            <div className="flex justify-center mb-6">
              <div className="flex items-center gap-2">
                <img 
                  src="/lovable-uploads/0adac0fd-b58d-4f5f-959a-b8d6a57c5c8c.png" 
                  alt="Rook Logo" 
                  className="h-12 object-contain"
                />
                <Shield className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold text-gray-900">Secure Access</CardTitle>
            <CardDescription className="text-gray-600 text-lg flex items-center justify-center gap-2">
              <Lock className="h-4 w-4" />
              Enterprise-grade security enabled
            </CardDescription>
            {loginAttempts > 0 && (
              <div className="flex items-center gap-2 text-amber-600 text-sm">
                <AlertTriangle className="h-4 w-4" />
                {loginAttempts} failed attempt{loginAttempts > 1 ? 's' : ''} detected
              </div>
            )}
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <SecureForm onSubmit={handleSecureSubmit} className="space-y-6">
              <SecureInput
                name="email"
                type="email"
                label="Email Address"
                placeholder="Enter your email"
                value={email}
                onSecureChange={setEmail}
                showSecurityIndicator
                required
                autoComplete="email"
                className="h-12"
              />
              
              <SecureInput
                name="password"
                type="password"
                label="Password"
                placeholder="Enter your password"
                value={password}
                onSecureChange={setPassword}
                showSecurityIndicator
                required
                autoComplete="current-password"
                className="h-12"
              />
              
              <Button 
                type="submit" 
                className="w-full h-12 bg-black hover:bg-gray-800 text-white font-medium text-lg transition-colors flex items-center gap-2" 
                disabled={isLoading || isLocked}
              >
                {isLoading ? (
                  <>
                    <Shield className="h-4 w-4 animate-spin" />
                    Authenticating...
                  </>
                ) : isLocked ? (
                  <>
                    <Lock className="h-4 w-4" />
                    Account Locked
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4" />
                    Secure Sign In
                  </>
                )}
              </Button>
            </SecureForm>
            
            <div className="mt-6 text-center">
              <div className="text-xs text-gray-500 flex items-center justify-center gap-1">
                <Shield className="h-3 w-3" />
                Protected by enterprise security measures
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
