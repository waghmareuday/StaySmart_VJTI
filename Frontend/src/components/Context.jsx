import React, { createContext, useContext, useEffect, useState } from "react";
const Context = createContext();

export const ContextProvider = ({ children }) => {
    let userDataLocal =localStorage.getItem('user') ? localStorage.getItem('user'):null;
    const [user,setUser]=useState(JSON.parse(userDataLocal) || null);

    const value = {
      user,
      setUser
    };

  useEffect(() => {}, []);

  return <Context.Provider value={value}>{children}</Context.Provider>;
};

const myHook = () => {
  const context = useContext(Context);
  return context;
};

export default myHook;