"use client"

import { UserDetailContext } from "@/context/UserDetailContext";
import React, { useEffect } from "react";

function Provider({ children }: { children: React.ReactNode }) {

    const [userDetails, setUserDetails] = React.useState<any>(null);
    useEffect(() => {
    createNewUser();
    }, []);




  const createNewUser = async () => {
    try {
      const response = await fetch("/api", {
        method: "POST",
      });

      if (!response.ok) {
        console.error("Failed to create user", await response.text());
        return;
      }

      const result = await response.json();
      console.log(result);
    } catch (error) {
      console.error("User creation failed:", error);
    }
  };

  return (
    <UserDetailContext.Provider value={{ userDetails, setUserDetails }}>
      <div>{children}</div>
    </UserDetailContext.Provider>
  );
}

export default Provider;

