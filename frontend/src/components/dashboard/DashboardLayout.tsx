import { useEffect, useState, useCallback, createContext, useContext } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import { getMe, getSubscription } from "@/lib/api";
import type { UserRead, SubscriptionRead } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";

// Context for subscription refresh
interface SubscriptionContextType {
  subscription: SubscriptionRead | null;
  refreshSubscription: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | null>(null);

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error("useSubscription must be used within DashboardLayout");
  }
  return context;
};

export default function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<UserRead | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionRead | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshSubscription = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;
    try {
      const sub = await getSubscription(token);
      setSubscription(sub);
    } catch (error) {
      console.error("Failed to refresh subscription:", error);
    }
  }, []);

  const fetchSubscription = useCallback((token: string) => {
    getSubscription(token)
      .then(setSubscription)
      .catch(() => null);
  }, []);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      navigate("/login");
      return;
    }

    getMe(token)
      .then((u) => {
        setUser(u);
        getSubscription(token)
          .then(setSubscription)
          .catch(() => null);
      })
      .catch(() => navigate("/login"))
      .finally(() => setLoading(false));
  }, [navigate]);

  // Re-fetch subscription whenever the user navigates to the billing success page
  // so the sidebar plan badge updates immediately after a successful payment
  useEffect(() => {
    if (location.pathname.includes("billing/success")) {
      const token = getAccessToken();
      if (token) fetchSubscription(token);
    }
  }, [location.pathname, fetchSubscription]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F8FAFC]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#3159E8] border-t-transparent" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <SubscriptionContext.Provider value={{ subscription, refreshSubscription }}>
      <div className="flex h-screen overflow-hidden bg-[#F8FAFC]">
        <Sidebar user={user} subscription={subscription} />
        <div className="flex flex-1 flex-col overflow-hidden">
          <TopBar user={user} />
          <main className="flex-1 overflow-y-auto p-6">
            <Outlet context={{ user, subscription } as { user: UserRead; subscription: typeof subscription }} />
          </main>
        </div>
      </div>
    </SubscriptionContext.Provider>
  );
}
