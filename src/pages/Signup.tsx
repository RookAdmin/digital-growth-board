
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const SignupPage = () => {
  const navigate = useNavigate();
  const { session, loading } = useAuth();

  useEffect(() => {
    if (!loading && session) {
      navigate('/dashboard/leads');
    } else if (!loading) {
      // Redirect to login since signup is disabled
      navigate('/login');
    }
  }, [session, loading, navigate]);

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return null;
};

export default SignupPage;
