import React, { createContext, useContext, useEffect, useState } from "react";

const Context = createContext();

export const ContextProvider = ({ children }) => {
  // Safely parse stored user data
  const getStoredUser = () => {
    try {
      const userData = localStorage.getItem("user");
      if (!userData) return null;
      const user = JSON.parse(userData);
      // ensure compatibility with older stored objects
      if (!user.studentId && user.collegeId) {
        user.studentId = String(user.collegeId);
      }
      return user;
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

  // Logout function
  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("wardenToken");
    localStorage.removeItem("authToken");
  };

  // Check if current user is admin
  const isAdmin = () => {
    return user && (user.role === 'admin' || user.isAdmin === true);
  };

  return (
    <Context.Provider value={{ user, setUser, logout, isAdmin }}>
      {children}
    </Context.Provider>
  );
};

// Custom hook to use context
const useAppContext = () => {
  const context = useContext(Context);
  if (!context) {
    throw new Error("useAppContext must be used within a ContextProvider");
  }
  return context;
};

export default useAppContext;
