
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, CheckCircle, XCircle, Loader2 } from "lucide-react";

const signupFormSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(20, "First name must be 20 characters or less"),
  lastName: z.string().min(1, "Last name is required").max(20, "Last name must be 20 characters or less"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignupFormValues = z.infer<typeof signupFormSchema>;

interface PasswordStrength {
  hasMinLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
  score: number;
}

const SignupPage = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [emailExists, setEmailExists] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({
    hasMinLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSpecialChar: false,
    score: 0,
  });
  const [firstNameError, setFirstNameError] = useState("");
  const [lastNameError, setLastNameError] = useState("");

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const checkEmailExists = async (email: string) => {
    if (!email || !email.includes('@')) return;
    
    setIsCheckingEmail(true);
    try {
      const { data, error } = await supabase.rpc('check_email_exists', {
        email_to_check: email
      });
      
      if (error) {
        console.error('Error checking email:', error);
        return;
      }
      
      setEmailExists(data);
    } catch (error) {
      console.error('Error checking email:', error);
    } finally {
      setIsCheckingEmail(false);
    }
  };

  const calculatePasswordStrength = (password: string): PasswordStrength => {
    const hasMinLength = password.length >= 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    const score = [hasMinLength, hasUppercase, hasLowercase, hasNumber, hasSpecialChar].filter(Boolean).length;
    
    return {
      hasMinLength,
      hasUppercase,
      hasLowercase,
      hasNumber,
      hasSpecialChar,
      score,
    };
  };

  const handleFirstNameChange = (value: string) => {
    if (value.length > 20) {
      setFirstNameError("Character length is too long");
    } else {
      setFirstNameError("");
    }
  };

  const handleLastNameChange = (value: string) => {
    if (value.length > 20) {
      setLastNameError("Character length is too long");
    } else {
      setLastNameError("");
    }
  };

  const onSubmit = async (values: SignupFormValues) => {
    if (emailExists) {
      toast.error("Email already exists. Please use a different email.");
      return;
    }

    if (passwordStrength.score < 4) {
      toast.error("Please use a stronger password that meets all requirements.");
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            first_name: values.firstName,
            last_name: values.lastName,
          },
        },
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      if (data.user) {
        toast.success("Account created successfully! Please check your email to verify your account.");
        navigate('/login');
      }
    } catch (error) {
      toast.error("An unexpected error occurred. Please try again.");
    }
  };

  useEffect(() => {
    const email = form.watch('email');
    const delayedEmailCheck = setTimeout(() => {
      if (email) {
        checkEmailExists(email);
      } else {
        setEmailExists(false);
      }
    }, 500);

    return () => clearTimeout(delayedEmailCheck);
  }, [form.watch('email')]);

  useEffect(() => {
    const password = form.watch('password');
    setPasswordStrength(calculatePasswordStrength(password));
  }, [form.watch('password')]);

  useEffect(() => {
    document.title = "Sign Up - Rook";
  }, []);

  const getPasswordStrengthColor = (score: number) => {
    if (score < 2) return "bg-red-500";
    if (score < 4) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getPasswordStrengthText = (score: number) => {
    if (score < 2) return "Weak";
    if (score < 4) return "Medium";
    return "Strong";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Create Account</CardTitle>
          <CardDescription className="text-center">
            Enter your information to create your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="John"
                          {...field}
                          onChange={(e) => {
                            const value = e.target.value.slice(0, 20);
                            field.onChange(value);
                            handleFirstNameChange(e.target.value);
                          }}
                          className={firstNameError ? "border-red-500" : ""}
                        />
                      </FormControl>
                      {firstNameError && (
                        <p className="text-sm text-red-500">{firstNameError}</p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Doe"
                          {...field}
                          onChange={(e) => {
                            const value = e.target.value.slice(0, 20);
                            field.onChange(value);
                            handleLastNameChange(e.target.value);
                          }}
                          className={lastNameError ? "border-red-500" : ""}
                        />
                      </FormControl>
                      {lastNameError && (
                        <p className="text-sm text-red-500">{lastNameError}</p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type="email"
                          placeholder="john.doe@example.com"
                          {...field}
                          className={emailExists ? "border-red-500" : ""}
                        />
                        {isCheckingEmail && (
                          <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin" />
                        )}
                        {!isCheckingEmail && field.value && (
                          emailExists ? (
                            <XCircle className="absolute right-3 top-3 h-4 w-4 text-red-500" />
                          ) : (
                            <CheckCircle className="absolute right-3 top-3 h-4 w-4 text-green-500" />
                          )
                        )}
                      </div>
                    </FormControl>
                    {emailExists && (
                      <p className="text-sm text-red-500">Email already exists</p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-3 h-4 w-4 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <EyeOff /> : <Eye />}
                        </button>
                      </div>
                    </FormControl>
                    {field.value && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all ${getPasswordStrengthColor(passwordStrength.score)}`}
                              style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-600">
                            {getPasswordStrengthText(passwordStrength.score)}
                          </span>
                        </div>
                        <div className="text-xs space-y-1">
                          <div className={`flex items-center gap-1 ${passwordStrength.hasMinLength ? 'text-green-600' : 'text-red-600'}`}>
                            {passwordStrength.hasMinLength ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                            At least 8 characters
                          </div>
                          <div className={`flex items-center gap-1 ${passwordStrength.hasUppercase ? 'text-green-600' : 'text-red-600'}`}>
                            {passwordStrength.hasUppercase ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                            One uppercase letter
                          </div>
                          <div className={`flex items-center gap-1 ${passwordStrength.hasLowercase ? 'text-green-600' : 'text-red-600'}`}>
                            {passwordStrength.hasLowercase ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                            One lowercase letter
                          </div>
                          <div className={`flex items-center gap-1 ${passwordStrength.hasNumber ? 'text-green-600' : 'text-red-600'}`}>
                            {passwordStrength.hasNumber ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                            One number
                          </div>
                          <div className={`flex items-center gap-1 ${passwordStrength.hasSpecialChar ? 'text-green-600' : 'text-red-600'}`}>
                            {passwordStrength.hasSpecialChar ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                            One special character
                          </div>
                        </div>
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Confirm your password"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-3 h-4 w-4 text-gray-400 hover:text-gray-600"
                        >
                          {showConfirmPassword ? <EyeOff /> : <Eye />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full"
                disabled={emailExists || passwordStrength.score < 4 || firstNameError !== "" || lastNameError !== ""}
              >
                Create Account
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default SignupPage;
