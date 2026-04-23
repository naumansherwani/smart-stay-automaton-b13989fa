import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type Mode = "dark" | "light";
const Ctx = createContext<{ mode: Mode; toggle: () => void }>({ mode: "dark", toggle: () => {} });

export const FounderThemeProvider = ({ children }: { children: ReactNode }) => {
  const [mode, setMode] = useState<Mode>(() => (localStorage.getItem("founder-theme") as Mode) || "dark");
  useEffect(() => {
    localStorage.setItem("founder-theme", mode);
  }, [mode]);
  return (
    <Ctx.Provider value={{ mode, toggle: () => setMode((m) => (m === "dark" ? "light" : "dark")) }}>
      <div data-founder-theme={mode} className="founder-os">
        {children}
      </div>
    </Ctx.Provider>
  );
};

export const useFounderTheme = () => useContext(Ctx);
