import React, { useEffect, useMemo, useState } from "react";

const BACKEND_URL = "http://127.0.0.1:8000";

const VEHICLE_TYPES = ["Car", "Motorcycle", "Bus", "Truck"];

function Dashboard() {
  const [events, setEvents] = useState([]);
  const [watchlist, setWatchlist] = useState([]);
  const [cameraOnline, setCameraOnline] = useState(false);
  const [backendOnline, setBackendOnline] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadDashboard = async () => {
    try {
      // -----------------------------
      // CAMERA + BACKEND HEALTH
      // -----------------------------

      const healthResponse = await fetch(
        `${BACKEND_URL}/api/health`,
        {
          cache: "no-store",
        }
      );

      if (healthResponse.ok) {
        const healthData = await healthResponse.json();

        setBackendOnline(true);
        setCameraOnline(
          healthData.camera === "connected"
        );
      } else {
        setBackendOnline(false);
        setCameraOnline(false);
      }

      // -----------------------------
      // EVENTS
      // -----------------------------

      const eventResponse = await fetch(
        `${BACKEND_URL}/api/events`,
        {
          cache: "no-store",
        }
      );

      if (eventResponse.ok) {
        const data = await eventResponse.json();

        setEvents(data.events || []);
      }

      // -----------------------------
      // WATCHLIST
      // -----------------------------

      const watchlistResponse = await fetch(
        `${BACKEND_URL}/api/watchlist`,
        {
          cache: "no-store",
        }
      );

      if (watchlistResponse.ok) {
        const watchlistData =
          await watchlistResponse.json();

        setWatchlist(
          watchlistData.watchlist || []
        );
      }

      setLastUpdated(new Date());

    } catch (error) {
      console.log(
        "Dashboard connection error:",
        error
      );

      setBackendOnline(false);
      setCameraOnline(false);
    }
  };

  useEffect(() => {
    loadDashboard();

    const interval = setInterval(
      loadDashboard,
      2000
    );

    return () => clearInterval(interval);
  }, []);

  // -----------------------------
  // REAL-TIME STATS
  // -----------------------------

  const persons = events.filter(
    (event) =>
      event.object === "Person"
  ).length;

  const vehicles = events.filter(
    (event) =>
      VEHICLE_TYPES.includes(event.object)
  ).length;

  const watchlistAlerts = events.filter(
    (event) =>
      event.watchlist_alert === true ||
      event.type === "WATCHLIST MATCH"
  ).length;

  const totalAlerts = events.filter(
    (event) =>
      event.status === "Alert" ||
      event.watchlist_alert === true ||
      event.type === "WATCHLIST MATCH"
  ).length;

  const activeWatchlist =
    watchlist.filter(
      (item) =>
        item.status === "Active"
    ).length;

  // -----------------------------
  // RECENT EVENTS
  // -----------------------------

  const recentEvents = useMemo(() => {
    return [...events]
      .reverse()
      .slice(0, 6);
  }, [events]);

  // -----------------------------
  // EVENT ICON
  // -----------------------------

  const getEventIcon = (event) => {
    if (
      event.watchlist_alert === true ||
      event.type === "WATCHLIST MATCH"
    ) {
      return "🚨";
    }

    switch (event.object) {
      case "Person":
        return "👤";

      case "Car":
        return "🚗";

      case "Motorcycle":
        return "🏍️";

      case "Bus":
        return "🚌";

      case "Truck":
        return "🚚";

      default:
        return "◉";
    }
  };

  const formatUpdatedTime = () => {
    if (!lastUpdated) {
      return "Connecting...";
    }

    return lastUpdated.toLocaleTimeString();
  };

  return (
    <div className="dashboard-page">

      {/* =========================================
          HEADER
      ========================================= */}

      <div className="dashboard-header">

        <div>
          <div className="breadcrumb">
            COMMAND CENTER / DASHBOARD
          </div>

          <h1>
            CCTV Intelligence Dashboard
          </h1>

          <p>
            Real-time AI surveillance and
            monitoring
          </p>
        </div>

        <div className="dashboard-live-status">

          <span
            className={`status-dot ${
              cameraOnline
                ? "online"
                : "offline"
            }`}
          ></span>

          {cameraOnline
            ? "SYSTEM ONLINE"
            : "SYSTEM OFFLINE"}

        </div>

      </div>

      {/* =========================================
          STATS
      ========================================= */}

      <div className="dashboard-stats">

        {/* CAMERAS */}

        <div className="dashboard-stat-card">

          <div className="dashboard-stat-icon">
            📹
          </div>

          <div>
            <span>
              Total Cameras
            </span>

            <strong>
              4
            </strong>

            <small>
              1 active stream
            </small>
          </div>

        </div>

        {/* ONLINE */}

        <div className="dashboard-stat-card">

          <div className="dashboard-stat-icon">
            🟢
          </div>

          <div>
            <span>
              Online Cameras
            </span>

            <strong>
              {cameraOnline ? 1 : 0}
            </strong>

            <small>
              CAM-001
            </small>
          </div>

        </div>

        {/* PERSONS */}

        <div className="dashboard-stat-card">

          <div className="dashboard-stat-icon">
            👤
          </div>

          <div>
            <span>
              Persons Detected
            </span>

            <strong>
              {persons}
            </strong>

            <small>
              AI tracking events
            </small>
          </div>

        </div>

        {/* VEHICLES */}

        <div className="dashboard-stat-card">

          <div className="dashboard-stat-icon">
            🚗
          </div>

          <div>
            <span>
              Vehicles Detected
            </span>

            <strong>
              {vehicles}
            </strong>

            <small>
              Cars & vehicles
            </small>
          </div>

        </div>

        {/* ALERTS */}

        <div className="dashboard-stat-card">

          <div className="dashboard-stat-icon">
            ⚠️
          </div>

          <div>
            <span>
              Total Alerts
            </span>

            <strong>
              {totalAlerts}
            </strong>

            <small>
              {watchlistAlerts} watchlist match
              {watchlistAlerts !== 1
                ? "es"
                : ""}
            </small>
          </div>

        </div>

        {/* WATCHLIST */}

        <div className="dashboard-stat-card">

          <div className="dashboard-stat-icon">
            🎯
          </div>

          <div>
            <span>
              Active Watchlist
            </span>

            <strong>
              {activeWatchlist}
            </strong>

            <small>
              {watchlist.length} total targets
            </small>
          </div>

        </div>

      </div>

      {/* =========================================
          MAIN GRID
      ========================================= */}

      <div className="dashboard-main-grid">

        {/* =======================================
            LIVE CAMERA
        ======================================= */}

        <div className="dashboard-card dashboard-camera-card">

          <div className="dashboard-card-header">

            <div>
              <h2>
                Live Camera
              </h2>

              <p>
                Main Entrance • CAM-001
              </p>
            </div>

            <div className="live-badge">

              <span></span>

              LIVE

            </div>

          </div>

          <div className="dashboard-camera">

            {cameraOnline ? (
              <>

                <img
                  src={`${BACKEND_URL}/api/camera/live`}
                  alt="Sentinel AI Live CCTV"
                  className="dashboard-live-feed"
                />

                <div className="dashboard-camera-overlay">

                  <span>
                    CAM-001
                  </span>

                  <span>
                    YOLO11n AI
                  </span>

                  <span>
                    TRACKING
                  </span>

                </div>

              </>
            ) : (

              <div className="dashboard-camera-offline">

                <div>
                  📹
                </div>

                <strong>
                  Camera Offline
                </strong>

                <span>
                  Start the Sentinel AI
                  backend to activate
                  live monitoring.
                </span>

              </div>

            )}

          </div>

        </div>

        {/* =======================================
            AI SYSTEM STATUS
        ======================================= */}

        <div className="dashboard-card">

          <div className="dashboard-card-header">

            <div>
              <h2>
                AI System Status
              </h2>

              <p>
                Sentinel detection engine
              </p>
            </div>

          </div>

          <div className="ai-system-status">

            {/* YOLO */}

            <div className="ai-status-row">

              <div className="ai-status-left">

                <span className="ai-status-icon">
                  🤖
                </span>

                <div>

                  <strong>
                    YOLO11n
                  </strong>

                  <span>
                    Object Detection
                  </span>

                </div>

              </div>

              <span className="status-active">
                ACTIVE
              </span>

            </div>

            {/* TRACKING */}

            <div className="ai-status-row">

              <div className="ai-status-left">

                <span className="ai-status-icon">
                  🎯
                </span>

                <div>

                  <strong>
                    Object Tracking
                  </strong>

                  <span>
                    Real-time tracking
                  </span>

                </div>

              </div>

              <span className="status-active">
                ACTIVE
              </span>

            </div>

            {/* WATCHLIST */}

            <div className="ai-status-row">

              <div className="ai-status-left">

                <span className="ai-status-icon">
                  🚨
                </span>

                <div>

                  <strong>
                    Watchlist Detection
                  </strong>

                  <span>
                    Target matching
                  </span>

                </div>

              </div>

              <span
                className={
                  activeWatchlist > 0
                    ? "status-active"
                    : "status-inactive"
                }
              >
                {activeWatchlist > 0
                  ? "ACTIVE"
                  : "IDLE"}
              </span>

            </div>

            {/* CAMERA */}

            <div className="ai-status-row">

              <div className="ai-status-left">

                <span className="ai-status-icon">
                  📡
                </span>

                <div>

                  <strong>
                    Camera Stream
                  </strong>

                  <span>
                    CAM-001 connection
                  </span>

                </div>

              </div>

              <span
                className={
                  cameraOnline
                    ? "status-active"
                    : "status-inactive"
                }
              >
                {cameraOnline
                  ? "ONLINE"
                  : "OFFLINE"}
              </span>

            </div>

            {/* BACKEND */}

            <div className="ai-status-row">

              <div className="ai-status-left">

                <span className="ai-status-icon">
                  ⚙️
                </span>

                <div>

                  <strong>
                    Backend API
                  </strong>

                  <span>
                    FastAPI server
                  </span>

                </div>

              </div>

              <span
                className={
                  backendOnline
                    ? "status-active"
                    : "status-inactive"
                }
              >
                {backendOnline
                  ? "ONLINE"
                  : "OFFLINE"}
              </span>

            </div>

          </div>

        </div>

      </div>

      {/* =========================================
          WATCHLIST ALERT
      ========================================= */}

      {watchlistAlerts > 0 && (

        <div className="dashboard-watchlist-alert">

          <div>

            <strong>
              🚨 Watchlist Match Detected
            </strong>

            <span>
              {watchlistAlerts} watchlist alert
              {watchlistAlerts > 1
                ? "s"
                : ""} detected by Sentinel AI
            </span>

          </div>

          <span className="watchlist-alert-count">
            {watchlistAlerts}
          </span>

        </div>

      )}

      {/* =========================================
          RECENT EVENTS
      ========================================= */}

      <div className="dashboard-card dashboard-events-card">

        <div className="dashboard-card-header">

          <div>

            <h2>
              Recent Detection Activity
            </h2>

            <p>
              Latest AI detected objects
            </p>

          </div>

          <div className="event-count">
            {events.length} Events
          </div>

        </div>

        {recentEvents.length === 0 ? (

          <div className="dashboard-empty">

            <div>
              📡
            </div>

            <strong>
              No detection events yet
            </strong>

            <span>
              Start the camera to generate
              AI detection events.
            </span>

          </div>

        ) : (

          <div className="dashboard-event-list">

            {recentEvents.map((event) => {

              const isWatchlist =
                event.watchlist_alert === true ||
                event.type === "WATCHLIST MATCH";

              return (

                <div
                  className={`dashboard-event-row ${
                    isWatchlist
                      ? "watchlist-event"
                      : ""
                  }`}
                  key={event.id}
                >

                  {/* EVENT ICON */}

                  <div className="dashboard-event-icon">

                    {getEventIcon(event)}

                  </div>

                  {/* EVENT INFO */}

                  <div className="dashboard-event-info">

                    <strong>
                      {event.type ||
                        "Detection Event"}
                    </strong>

                    <span>

                      {event.object ||
                        "Unknown"}

                      {" • Track ID: #"}

                      {event.track_id ??
                        "N/A"}

                      {" • "}

                      {event.camera ||
                        "CAM-001"}

                    </span>

                  </div>

                  {/* TIME */}

                  <div className="dashboard-event-time">

                    {event.time ||
                      "Unknown time"}

                  </div>

                  {/* STATUS */}

                  <div
                    className={`dashboard-event-status ${
                      isWatchlist
                        ? "event-alert"
                        : ""
                    }`}
                  >

                    {isWatchlist
                      ? "WATCHLIST"
                      : event.status ||
                        "NEW"}

                  </div>

                </div>

              );
            })}

          </div>

        )}

      </div>

      {/* =========================================
          NETWORK STATUS
      ========================================= */}

      <div className="dashboard-network">

        <div>

          <span className="pulse"></span>

          <div>

            <strong>
              Sentinel AI Network
            </strong>

            <span>
              {cameraOnline
                ? "All AI services are running normally"
                : "Waiting for camera connection"}
            </span>

          </div>

        </div>

        <div className="network-right">

          <span>
            {backendOnline
              ? "API ONLINE"
              : "API OFFLINE"}
          </span>

          <span>
            {cameraOnline
              ? "CAM-001 ONLINE"
              : "CAM-001 OFFLINE"}
          </span>

          <span>
            YOLO11n
          </span>

          <span>
            TRACKING
          </span>

          <span>
            WATCHLIST
          </span>

        </div>

      </div>

      {/* =========================================
          LAST UPDATED
      ========================================= */}

      <div
        style={{
          textAlign: "right",
          marginTop: "10px",
          fontSize: "12px",
          opacity: 0.55,
        }}
      >
        Last updated: {formatUpdatedTime()}
      </div>

    </div>
  );
}

export default Dashboard;