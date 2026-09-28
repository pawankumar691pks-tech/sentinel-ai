import React, { useEffect, useMemo, useState } from "react";

const BACKEND_URL = "http://127.0.0.1:8000";

const VEHICLE_TYPES = [
  "Car",
  "Motorcycle",
  "Bus",
  "Truck",
];

function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");

  // =========================================================
  // FETCH ALERTS
  // =========================================================

  const fetchAlerts = async () => {
    try {
      const response = await fetch(
        `${BACKEND_URL}/api/events`,
        {
          cache: "no-store",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch alerts");
      }

      const data = await response.json();

      const eventList = data.events || [];

      const formattedAlerts = eventList.map((event) => {
        const isWatchlistAlert =
          event.watchlist_alert === true ||
          event.type === "WATCHLIST MATCH";

        let severity = "Medium";

        let message = `${
          event.object || "Object"
        } detected by AI surveillance system`;

        // WATCHLIST
        if (isWatchlistAlert) {
          severity = "Critical";

          message =
            event.description ||
            `Watchlist target ${event.object} with Tracking ID #${event.track_id} detected`;
        }

        // PERSON
        else if (event.object === "Person") {
          severity = "High";

          message =
            "Person detected by AI surveillance system";
        }

        // VEHICLE
        else if (
          VEHICLE_TYPES.includes(event.object)
        ) {
          severity = "Medium";

          message =
            `${event.object} detected by AI surveillance system`;
        }

        return {
          ...event,
          severity,
          message,
          isWatchlistAlert,
        };
      });

      setAlerts(formattedAlerts);
    } catch (error) {
      console.log(
        "Alerts API Error:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // AUTO REFRESH
  // =========================================================

  useEffect(() => {
    fetchAlerts();

    const interval = setInterval(
      fetchAlerts,
      2000
    );

    return () =>
      clearInterval(interval);
  }, []);

  // =========================================================
  // CLEAR ALERTS
  // =========================================================

  const clearAlerts = async () => {
    try {
      const response = await fetch(
        `${BACKEND_URL}/api/events`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to clear alerts"
        );
      }

      setAlerts([]);
    } catch (error) {
      console.log(
        "Clear alerts error:",
        error
      );
    }
  };

  // =========================================================
  // ICON
  // =========================================================

  const getIcon = (object) => {
    if (object === "Person") return "👤";
    if (object === "Car") return "🚗";
    if (object === "Motorcycle") return "🏍️";
    if (object === "Bus") return "🚌";
    if (object === "Truck") return "🚚";

    return "⚠️";
  };

  // =========================================================
  // STATS
  // =========================================================

  const totalAlerts = alerts.length;

  const criticalAlerts = alerts.filter(
    (alert) =>
      alert.severity === "Critical"
  ).length;

  const highAlerts = alerts.filter(
    (alert) =>
      alert.severity === "High"
  ).length;

  const vehicleAlerts = alerts.filter(
    (alert) =>
      VEHICLE_TYPES.includes(
        alert.object
      )
  ).length;

  // =========================================================
  // FILTERED ALERTS
  // =========================================================

  const filteredAlerts = useMemo(() => {
    if (filter === "All") {
      return alerts;
    }

    if (filter === "Critical") {
      return alerts.filter(
        (alert) =>
          alert.severity === "Critical"
      );
    }

    if (filter === "High") {
      return alerts.filter(
        (alert) =>
          alert.severity === "High"
      );
    }

    if (filter === "Vehicle") {
      return alerts.filter(
        (alert) =>
          VEHICLE_TYPES.includes(
            alert.object
          )
      );
    }

    return alerts;
  }, [alerts, filter]);

  // =========================================================
  // SEVERITY CLASS
  // =========================================================

  const getSeverityClass = (severity) => {
    if (severity === "Critical") {
      return "alert-critical";
    }

    if (severity === "High") {
      return "alert-high";
    }

    return "alert-medium";
  };

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="events-page">

      {/* ================= HEADER ================= */}

      <div className="events-header">

        <div>

          <div className="breadcrumb">
            COMMAND CENTER / SECURITY ALERTS
          </div>

          <h1>
            Security Alerts
          </h1>

          <p>
            Real-time alerts generated by
            Sentinel AI
          </p>

        </div>

        <div className="events-header-actions">

          <div className="live-indicator">

            <span className="live-dot"></span>

            AI MONITORING

          </div>

          <button
            className="clear-events-btn"
            onClick={clearAlerts}
            disabled={alerts.length === 0}
          >
            Clear Alerts
          </button>

        </div>

      </div>

      {/* ================= STATS ================= */}

      <div className="event-stats">

        {/* TOTAL */}

        <div className="event-stat-card">

          <div className="stat-icon">
            🚨
          </div>

          <div>

            <span>
              Total Alerts
            </span>

            <strong>
              {totalAlerts}
            </strong>

          </div>

        </div>

        {/* CRITICAL */}

        <div className="event-stat-card">

          <div className="stat-icon">
            🔥
          </div>

          <div>

            <span>
              Critical
            </span>

            <strong>
              {criticalAlerts}
            </strong>

          </div>

        </div>

        {/* HIGH */}

        <div className="event-stat-card">

          <div className="stat-icon">
            🔴
          </div>

          <div>

            <span>
              High Priority
            </span>

            <strong>
              {highAlerts}
            </strong>

          </div>

        </div>

        {/* VEHICLES */}

        <div className="event-stat-card">

          <div className="stat-icon">
            🚗
          </div>

          <div>

            <span>
              Vehicle Alerts
            </span>

            <strong>
              {vehicleAlerts}
            </strong>

          </div>

        </div>

      </div>

      {/* ================= ALERT CONTAINER ================= */}

      <div className="events-container">

        <div className="events-container-header">

          <div>

            <h2>
              Live Security Alerts
            </h2>

            <p>
              Automatically generated from AI
              camera detection
            </p>

          </div>

          <div className="ai-status">

            <span></span>

            AI ACTIVE

          </div>

        </div>

        {/* ================= FILTERS ================= */}

        <div className="vehicle-filters">

          <button
            className={
              filter === "All"
                ? "vehicle-filter active"
                : "vehicle-filter"
            }
            onClick={() =>
              setFilter("All")
            }
          >
            All
            <span>
              {totalAlerts}
            </span>
          </button>

          <button
            className={
              filter === "Critical"
                ? "vehicle-filter active"
                : "vehicle-filter"
            }
            onClick={() =>
              setFilter("Critical")
            }
          >
            🚨 Critical
            <span>
              {criticalAlerts}
            </span>
          </button>

          <button
            className={
              filter === "High"
                ? "vehicle-filter active"
                : "vehicle-filter"
            }
            onClick={() =>
              setFilter("High")
            }
          >
            🔴 High
            <span>
              {highAlerts}
            </span>
          </button>

          <button
            className={
              filter === "Vehicle"
                ? "vehicle-filter active"
                : "vehicle-filter"
            }
            onClick={() =>
              setFilter("Vehicle")
            }
          >
            🚗 Vehicles
            <span>
              {vehicleAlerts}
            </span>
          </button>

        </div>

        {/* ================= LOADING ================= */}

        {loading ? (

          <div className="events-empty">

            <div className="loading-spinner"></div>

            <h3>
              Loading alerts...
            </h3>

            <p>
              Connecting to Sentinel AI
              detection system
            </p>

          </div>

        ) : filteredAlerts.length === 0 ? (

          /* ================= EMPTY ================= */

          <div className="events-empty">

            <div className="empty-event-icon">
              🛡️
            </div>

            <h3>
              No security alerts
            </h3>

            <p>
              {filter === "All"
                ? "Sentinel AI is actively monitoring the camera network."
                : `No ${filter.toLowerCase()} alerts detected.`}
            </p>

          </div>

        ) : (

          /* ================= ALERT LIST ================= */

          <div className="events-list">

            {filteredAlerts.map(
              (alert) => (

                <div
                  className={`event-row ${getSeverityClass(
                    alert.severity
                  )}`}
                  key={alert.id}
                >

                  {/* ICON */}

                  <div className="event-object-icon">

                    {alert.isWatchlistAlert
                      ? "🚨"
                      : getIcon(
                          alert.object
                        )}

                  </div>

                  {/* MAIN INFO */}

                  <div className="event-main-info">

                    <h3>

                      {alert.isWatchlistAlert
                        ? "WATCHLIST MATCH"
                        : alert.type ||
                          `${alert.object} DETECTED`}

                    </h3>

                    <p>
                      {alert.message}
                    </p>

                    {alert.isWatchlistAlert && (
                      <p
                        style={{
                          marginTop: "5px",
                          fontWeight: "700",
                        }}
                      >
                        🎯 Watchlist target
                        detected
                      </p>
                    )}

                  </div>

                  {/* PRIORITY */}

                  <div className="event-column">

                    <span className="event-label">
                      PRIORITY
                    </span>

                    <strong>
                      {alert.severity}
                    </strong>

                  </div>

                  {/* TRACK ID */}

                  <div className="event-column">

                    <span className="event-label">
                      TRACK ID
                    </span>

                    <strong>
                      {alert.track_id ??
                        "N/A"}
                    </strong>

                  </div>

                  {/* CAMERA */}

                  <div className="event-column">

                    <span className="event-label">
                      CAMERA
                    </span>

                    <strong>
                      {alert.camera ||
                        "CAM-001"}
                    </strong>

                  </div>

                  {/* TIME */}

                  <div className="event-column">

                    <span className="event-label">
                      TIME
                    </span>

                    <strong>
                      {alert.time ||
                        "N/A"}
                    </strong>

                  </div>

                  {/* STATUS */}

                  <div
                    className={`event-status-badge ${
                      alert.isWatchlistAlert
                        ? "watchlist-status"
                        : ""
                    }`}
                  >

                    {alert.isWatchlistAlert
                      ? "WATCHLIST"
                      : alert.severity}

                  </div>

                </div>

              )
            )}

          </div>

        )}

      </div>

      {/* ================= NETWORK STATUS ================= */}

      <div className="dashboard-network">

        <div>

          <span className="pulse"></span>

          <div>

            <strong>
              Sentinel AI Security Network
            </strong>

            <span>
              {totalAlerts > 0
                ? `${totalAlerts} security event${
                    totalAlerts > 1
                      ? "s"
                      : ""
                  } detected`
                : "No active security threats detected"}
            </span>

          </div>

        </div>

        <div className="network-right">

          <span>
            AI MONITORING
          </span>

          <span>
            YOLO11n
          </span>

          <span>
            ALERT ENGINE
          </span>

        </div>

      </div>

    </div>
  );
}

export default Alerts;