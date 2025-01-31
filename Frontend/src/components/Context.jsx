import React, { createContext, useContext, useEffect, useState } from "react";

const Context = createContext();

export const ContextProvider = ({ children }) => {
  // Safely parse stored user data
  const getStoredUser = () => {
    try {
      const userData = localStorage.getItem("user");
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error("Error parsing user data:", error);
      return null;
    }
  };

  const [user, setUser] = useState(getStoredUser());

  // Update localStorage when user state changes
  useEffect(() => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      localStorage.removeItem("user");
    }
  }, [user]);

  return <Context.Provider value={{ user, setUser }}>{children}</Context.Provider>;
};

// Custom hook to use context
const myHook = () => {
  const context = useContext(Context);
  if (!context) {
    throw new Error("myHook must be used within a ContextProvider");
  }
  return context;
};

export default myHook;
