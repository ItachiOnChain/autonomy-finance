import { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Landing } from './pages/Landing';
import { Core } from './pages/Core';
import { Asset } from './pages/Asset';
import { IPMint } from './pages/IPMint';
import RoyaltySimulator from './pages/RoyaltySimulator';
import { Layout } from './components/Layout';
import { ErrorBoundary } from './components/ErrorBoundary';
import { IPDashboard } from './components/IPDashboard';

// -------------------------------
// ⭐ Theme Context
// -------------------------------
const ThemeContext = createContext({
  theme: "dark",
  toggleTheme: () => { },
});

// export hook
export const useTheme = () => useContext(ThemeContext);

// -------------------------------
// ⭐ Main App
// -------------------------------
function App() {
  // persistent theme
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("autonomy_theme") || "dark";
  });

  // persist theme
  useEffect(() => {
    localStorage.setItem("autonomy_theme", theme);

    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <Router>
        {/* Theme wrapper */}
        <div className={theme === "dark" ? "dark" : ""}>
          <Routes>
            {/* Landing page */}
            <Route
              path="/"
              element={
                <Layout>
                  <Landing />
                </Layout>
              }
            />

            {/* Core multi-asset dashboard */}
            <Route
              path="/core"
              element={
                <Layout>
                  <ErrorBoundary>
                    <Core />
                  </ErrorBoundary>
                </Layout>
              }
            />

            {/* Per-asset page */}
            <Route
              path="/asset/:symbol"
              element={
                <Layout>
                  <ErrorBoundary>
                    <Asset />
                  </ErrorBoundary>
                </Layout>
              }
            />

            {/* Story Protocol IP Minting Routes */}
            <Route
              path="/ip-mint"
              element={
                <Layout>
                  <ErrorBoundary>
                    <IPMint />
                  </ErrorBoundary>
                </Layout>
              }
            />

            <Route
              path="/ip-dashboard"
              element={
                <Layout>
                  <ErrorBoundary>
                    <IPDashboard />
                  </ErrorBoundary>
                </Layout>
              }
            />

            {/* Royalty Simulator */}
            <Route
              path="/royalty-simulator"
              element={
                <Layout>
                  <ErrorBoundary>
                    <RoyaltySimulator />
                  </ErrorBoundary>
                </Layout>
              }
            />
          </Routes>
        </div>
      </Router>
    </ThemeContext.Provider>
  );
}

export default App;
