import { useEffect, useState } from "react";
import { getMe, type UserRead } from "@/lib/api";
import { getAccessToken, clearTokens } from "@/lib/auth";

export function useAuth() {
  const [user, setUser] = useState<UserRead | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      setLoading(false);
      return;
    }
    getMe(token)
      .then(setUser)
      .catch(() => clearTokens())
      .finally(() => setLoading(false));
  }, []);

  return { user, loading, isLoggedIn: !!user };
}
