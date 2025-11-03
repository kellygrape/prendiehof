import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { authAPI } from "./utils/api";
import theme from "./theme";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Ballot from "./pages/Ballot";
import AdminPanel from "./pages/AdminPanel";
import Results from "./pages/Results";
import "./App.css";
import ResponsiveAppBar from "./components/AppBar";
import type { User } from "./types";

function App() {
  const [user, setUser] = useState<User | null>(authAPI.getCurrentUser());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated on mount
    const currentUser = authAPI.getCurrentUser();
    setUser(currentUser);
    setLoading(false);
  }, []);

  const handleLogin = (userData: User) => {
    setUser(userData);
  };

  const handleLogout = () => {
    authAPI.logout();
    setUser(null);
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <div className="app">
          <ResponsiveAppBar user={user} logout={handleLogout} />
          <div className="main-content">
            <Routes>
              <Route
                path="/login"
                element={user ? <Navigate to="/dashboard" /> : <Login onLogin={handleLogin} />}
              />
              <Route
                path="/dashboard"
                element={user ? <Dashboard user={user} /> : <Navigate to="/login" />}
              />
              <Route
                path="/ballot"
                element={user ? <Ballot user={user} /> : <Navigate to="/login" />}
              />
              <Route
                path="/admin"
                element={
                  user && user.role === "admin" ? <AdminPanel /> : <Navigate to="/dashboard" />
                }
              />
              <Route
                path="/results"
                element={user ? <Results user={user} /> : <Navigate to="/login" />}
              />
              <Route path="/" element={<Navigate to="/dashboard" />} />
            </Routes>
          </div>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
