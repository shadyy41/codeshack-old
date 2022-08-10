import { createContext, useContext } from 'react';
import { useState } from "react"

const Context = createContext()

export function NavWrapper({ children }) {
  const NavHook = useState(true)

  return (
    <Context.Provider value={NavHook}>
      {children}
    </Context.Provider>
  )
}

export function useNavContext() {
  return useContext(Context);
}