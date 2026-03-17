"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { clearAuthData, getToken } from "@/lib/auth";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
}

export default function ProtectedRoute({
  children,
  requiredRoles,
}: ProtectedRouteProps) {
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    const verifyAccess = async () => {
      try {
        const token = getToken();

        if (!token) {
          router.replace("/institute-login");
          setIsCheckingAuth(false);
          return;
        }

        if (requiredRoles?.length) {
          const userRole = (sessionStorage.getItem("user_role") || localStorage.getItem("user_role") || "").toLowerCase();
          const allowed = requiredRoles.map((r) => r.toLowerCase());

          if (!userRole || !allowed.includes(userRole)) {
            router.replace("/institute-login");
            setIsCheckingAuth(false);
            return;
          }
        }

        // User is authenticated and has required role
        setHasAccess(true);
        setIsCheckingAuth(false);
      } catch (error) {
        console.error("Authentication check failed:", error);
        router.replace("/institute-login");
        setIsCheckingAuth(false);
      }
    };

    verifyAccess();
  }, [router, requiredRoles]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      clearAuthData();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  // Show loading state while checking authentication
  if (isCheckingAuth || !hasAccess) {
    return (
      <div className="flex items-center justify-center h-screen w-screen bg-white dark:bg-slate-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 dark:border-white mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-300">Verifying access...</p>
        </div>
      </div>
    );
  }

  // Render children only if authenticated
  return <>{children}</>;
}
