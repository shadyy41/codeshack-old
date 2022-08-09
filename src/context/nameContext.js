import { createContext, useContext } from 'react';
import { useState } from "react"

const Context = createContext()

export function NameWrapper({ children }) {
  const NameHook = useState('')

  return (
    <Context.Provider value={NameHook}>
      {children}
    </Context.Provider>
  )
}

export function useNameContext() {
  return useContext(Context);
}