import { supabase } from "@/lib/supabase";

export const signInWithGoogle = async () => {
  return await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: window.location.origin + "/home",
    },
  });
};