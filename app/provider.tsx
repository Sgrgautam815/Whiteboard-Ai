"use client"

import { UserDetailContext } from "@/context/UserDetailContext";
import { useAuth } from "@clerk/nextjs";
import { ThemeProvider } from "next-themes";
import React, { useEffect } from "react";

function Provider({ children }: { children: React.ReactNode }) {
  const { isSignedIn } = useAuth();
  const [userDetails, setUserDetails] = React.useState<any>(null);

  const createNewUser = async () => {
    if (!isSignedIn) {
      return;
    }

    try {
      const response = await fetch("/api", {
        method: "POST",
      });

      if (!response.ok) {
        console.error("Failed to create user", await response.text());
        return;
      }

      const result = await response.json();
      setUserDetails(result);
      console.log(result);
    } catch (error) {
      console.error("User creation failed:", error);
    }
  };

  useEffect(() => {
    createNewUser();
  }, [isSignedIn]);

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      storageKey="app_theme"
      disableTransitionOnChange={false}
    >
      <UserDetailContext.Provider value={{ userDetails, setUserDetails }}>
        <div className="min-h-screen bg-background text-foreground transition-colors duration-200">
          {children}
        </div>
      </UserDetailContext.Provider>
    </ThemeProvider>
  );
}

export default Provider;

