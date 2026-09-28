import React, { useEffect, useState } from "react";

import Dashboard from "./pages/Dashboard";
import Cameras from "./pages/Cameras";
import Events from "./pages/Events";
import Alerts from "./pages/Alerts";
import VehicleTracking from "./pages/VehicleTracking";
import Watchlist from "./pages/Watchlist";

const BACKEND_URL = "http://127.0.0.1:8000";

function App() {
  const [page, setPage] = useState("Dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [backendOnline, setBackendOnline] = useState(false);
  const [alertCount, setAlertCount] = useState(0);

  const [currentTime, setCurrentTime] = useState(new Date());

  // Latest watchlist alert
  const [notification, setNotification] = useState(null);

  // Store already displayed alert IDs
  const [seenAlertIds, setSeenAlertIds] = useState(() => {
    try {
      const saved = sessionStorage.getItem("sentinel_seen_alerts");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const navItems = [
    {
      name: "Dashboard",
      icon: "⌂",
    },
    {
      name: "Cameras",
      icon: "◉",
    },
    {
      name: "Vehicle Tracking",
      icon: "▣",
    },
    {
      name: "Alerts",
      icon: "!",
    },
    {
      name: "Watchlist",
      icon: "★",
    },
    {
      name: "Event History",
      icon: "≡",
    },
  ];

  // =========================================================
  // LIVE CLOCK
  // =========================================================

  useEffect(() => {
    const clock = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(clock);
  }, []);

  // =========================================================
  // CLOSE NOTIFICATION
  // =========================================================

  const closeNotification = () => {
    setNotification(null);
  };

  // =========================================================
  // CHECK BACKEND + EVENTS
  // =========================================================

  const loadSystemStatus = async () => {
    try {
      // -------------------------------------------------------
      // HEALTH CHECK
      // -------------------------------------------------------

      const healthResponse = await fetch(
        `${BACKEND_URL}/api/health`,
        {
          cache: "no-store",
        }
      );

      if (!healthResponse.ok) {
        throw new Error("Backend offline");
      }

      setBackendOnline(true);

      // -------------------------------------------------------
      // EVENTS
      // -------------------------------------------------------

      const eventsResponse = await fetch(
        `${BACKEND_URL}/api/events`,
        {
          cache: "no-store",
        }
      );

      if (!eventsResponse.ok) {
        return;
      }

      const data = await eventsResponse.json();

      const events = Array.isArray(data)
        ? data
        : Array.isArray(data.events)
        ? data.events
        : [];

      // -------------------------------------------------------
      // ALERT COUNT
      // -------------------------------------------------------

      const alerts = events.filter((event) => {
        return (
          event?.status === "Alert" ||
          event?.watchlist_alert === true ||
          event?.type === "WATCHLIST MATCH"
        );
      });

      setAlertCount(alerts.length);

      // -------------------------------------------------------
      // FIND NEW WATCHLIST ALERT
      // -------------------------------------------------------

      const watchlistAlerts = events.filter((event) => {
        return (
          event?.watchlist_alert === true ||
          event?.type === "WATCHLIST MATCH"
        );
      });

      if (watchlistAlerts.length > 0) {
        const latestAlert = watchlistAlerts[0];

        const alertId = String(
          latestAlert.id ??
            `${latestAlert.object}-${latestAlert.track_id}-${latestAlert.time}`
        );

        if (!seenAlertIds.includes(alertId)) {
          // Show notification
          setNotification(latestAlert);

          // Save as seen
          const updatedSeenIds = [
            ...seenAlertIds,
            alertId,
          ].slice(-100);

          setSeenAlertIds(updatedSeenIds);

          try {
            sessionStorage.setItem(
              "sentinel_seen_alerts",
              JSON.stringify(updatedSeenIds)
            );
          } catch {
            // Ignore storage errors
          }

          // Automatically hide after 7 seconds
          setTimeout(() => {
            setNotification((current) => {
              if (
                current &&
                String(current.id) === alertId
              ) {
                return null;
              }

              return current;
            });
          }, 7000);
        }
      }
    } catch (error) {
      console.log("System status error:", error);

      setBackendOnline(false);
      setAlertCount(0);
    }
  };

  // =========================================================
  // START STATUS POLLING
  // =========================================================

  useEffect(() => {
    loadSystemStatus();

    const interval = setInterval(() => {
      loadSystemStatus();
    }, 2000);

    return () => clearInterval(interval);
  }, [seenAlertIds]);

  // =========================================================
  // PAGE NAVIGATION
  // =========================================================

  const handleNavigation = (pageName) => {
    setPage(pageName);
    setSidebarOpen(false);
  };

  // =========================================================
  // RENDER PAGE
  // =========================================================

  const renderPage = () => {
    switch (page) {
      case "Dashboard":
        return <Dashboard />;

      case "Cameras":
        return <Cameras />;

      case "Vehicle Tracking":
        return <VehicleTracking />;

      case "Alerts":
        return <Alerts />;

      case "Watchlist":
        return <Watchlist />;

      case "Event History":
        return <Events />;

      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="app-shell">

      {/* =====================================================
          ALERT NOTIFICATION
      ===================================================== */}

      {notification && (
        <div className="sentinel-alert-notification">

          <div className="notification-icon">
            🚨
          </div>

          <div className="notification-content">

            <div className="notification-title">
              WATCHLIST MATCH
            </div>

            <div className="notification-message">
              Watchlist target detected
            </div>

            <div className="notification-details">
              <span>
                {notification.object || "Unknown Object"}
              </span>

              {notification.track_id !== undefined && (
                <span>
                  ID: {notification.track_id}
                </span>
              )}

              <span>
                {notification.camera || "CAM-001"}
              </span>
            </div>

            <div className="notification-time">
              {notification.time || "Just now"}
            </div>

          </div>

          <button
            type="button"
            className="notification-close"
            onClick={closeNotification}
            aria-label="Close alert"
          >
            ×
          </button>

        </div>
      )}

      {/* =====================================================
          MOBILE OVERLAY
      ===================================================== */}

      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside
        className={`sidebar ${
          sidebarOpen ? "sidebar-open" : ""
        }`}
      >

        {/* BRAND */}

        <div className="brand">

          <div className="brand-mark">
            S
          </div>

          <div className="brand-text">

            <h1>
              Sentinel AI
            </h1>

            <span>
              CCTV Intelligence
            </span>

          </div>

        </div>

        {/* NAVIGATION TITLE */}

        <div className="nav-title">
          MONITORING
        </div>

        {/* NAVIGATION */}

        <nav className="sidebar-nav">

          {navItems.map((item) => (

            <button
              key={item.name}
              type="button"
              className={`nav-item ${
                page === item.name
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                handleNavigation(item.name)
              }
            >

              <span className="nav-icon">
                {item.icon}
              </span>

              <span className="nav-label">
                {item.name}
              </span>

              {item.name === "Alerts" &&
                alertCount > 0 && (

                  <span className="nav-badge">

                    {alertCount > 99
                      ? "99+"
                      : alertCount}

                  </span>

                )}

            </button>

          ))}

        </nav>

        {/* ===================================================
            SIDEBAR BOTTOM
        =================================================== */}

        <div className="sidebar-bottom">

          {/* SYSTEM CARD */}

          <div
            className={`system-card ${
              backendOnline
                ? "online"
                : "offline"
            }`}
          >

            <div className="system-row">

              <span
                className={`pulse ${
                  backendOnline
                    ? "online"
                    : "offline"
                }`}
              />

              <span>
                {backendOnline
                  ? "System Online"
                  : "System Offline"}
              </span>

            </div>

            <small>
              {backendOnline
                ? "AI services ready"
                : "Start Sentinel AI backend"}
            </small>

          </div>

          {/* USER */}

          <div className="user-mini">

            <div className="avatar">
              A
            </div>

            <div className="user-info">

              <strong>
                Admin
              </strong>

              <span>
                Command Center
              </span>

            </div>

          </div>

        </div>

      </aside>

      {/* =====================================================
          MAIN
      ===================================================== */}

      <main className="main">

        {/* TOPBAR */}

        <header className="topbar">

          <div className="topbar-left">

            {/* MOBILE MENU */}

            <button
              type="button"
              className="mobile-menu-btn"
              onClick={() =>
                setSidebarOpen(
                  (value) => !value
                )
              }
              aria-label="Toggle navigation"
            >
              ☰
            </button>

            <div>

              <div className="breadcrumb">
                COMMAND CENTER /{" "}
                {page.toUpperCase()}
              </div>

              <h2>

                {page === "Dashboard"
                  ? "CCTV Intelligence Dashboard"
                  : page}

              </h2>

            </div>

          </div>

          {/* TOP ACTIONS */}

          <div className="top-actions">

            <div className="live-clock">

              <span>
                ●
              </span>

              LIVE

            </div>

            <div className="current-time">

              {currentTime.toLocaleTimeString()}

            </div>

          </div>

        </header>

        {/* PAGE */}

        <section className="page-content">

          {renderPage()}

        </section>

      </main>

    </div>
  );
}

export default App;