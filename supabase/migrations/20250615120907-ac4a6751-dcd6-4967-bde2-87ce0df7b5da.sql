
-- Create a trigger to automatically create a user when a new client is added.
-- This was missing, causing client logins to fail.
CREATE TRIGGER on_client_created
  AFTER INSERT ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION public.create_client_user_from_client();
