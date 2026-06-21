import { useState } from "react";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";

const STORAGE_KEY = "helpdeck_api_key";

export default function App() {
  const [apiKey, setApiKey] = useState<string | null>(
    () => localStorage.getItem(STORAGE_KEY)
  );

  function handleAuthed(key: string) {
    localStorage.setItem(STORAGE_KEY, key);
    setApiKey(key);
  }

  function handleLogout() {
    localStorage.removeItem(STORAGE_KEY);
    setApiKey(null);
  }

  return apiKey ? (
    <Dashboard apiKey={apiKey} onLogout={handleLogout} />
  ) : (
    <Login onAuthed={handleAuthed} />
  );
}
