import React, { useEffect, useState } from "react";

const API = "http://127.0.0.1:8000";

function Watchlist() {
  const [watchlist, setWatchlist] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  const [type, setType] = useState("Person");
  const [trackingId, setTrackingId] = useState("");
  const [camera, setCamera] = useState("CAM-001");
  const [description, setDescription] = useState("");

  // =========================
  // LOAD WATCHLIST FROM BACKEND
  // =========================
  const loadWatchlist = async () => {
    try {
      const response = await fetch(`${API}/api/watchlist`);

      if (!response.ok) {
        throw new Error("Failed to load watchlist");
      }

      const data = await response.json();
      setWatchlist(data);
    } catch (error) {
      console.error("Watchlist loading error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWatchlist();
  }, []);

  // =========================
  // ICON
  // =========================
  const getIcon = (objectType) => {
    switch (objectType) {
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
        return "🎯";
    }
  };

  // =========================
  // ADD TARGET
  // =========================
  const addToWatchlist = async () => {
    if (!trackingId.trim()) {
      alert("Please enter Tracking ID");
      return;
    }

    const newTarget = {
      type: type,
      trackingId: trackingId.trim(),
      camera: camera,
      description:
        description.trim() || "No additional information",
      status: "Active",
    };

    try {
      const response = await fetch(`${API}/api/watchlist`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newTarget),
      });

      if (!response.ok) {
        throw new Error("Failed to add target");
      }

      await loadWatchlist();

      setTrackingId("");
      setDescription("");
      setCamera("CAM-001");
      setType("Person");
      setShowForm(false);

      alert("Target added successfully!");
    } catch (error) {
      console.error("Add watchlist error:", error);
      alert("Failed to add target");
    }
  };

  // =========================
  // REMOVE TARGET
  // =========================
  const removeFromWatchlist = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to remove this target?"
    );

    if (!confirmDelete) {
      return;
    }

    try {
      const response = await fetch(
        `${API}/api/watchlist/${id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to remove target");
      }

      await loadWatchlist();
    } catch (error) {
      console.error("Remove watchlist error:", error);
      alert("Failed to remove target");
    }
  };

  // =========================
  // TOGGLE ACTIVE / PAUSED
  // =========================
  const toggleStatus = async (item) => {
    const newStatus =
      item.status === "Active" ? "Paused" : "Active";

    try {
      const response = await fetch(
        `${API}/api/watchlist/${item.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...item,
            status: newStatus,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update status");
      }

      await loadWatchlist();
    } catch (error) {
      console.error("Status update error:", error);
      alert("Failed to update status");
    }
  };

  // =========================
  // STATS
  // =========================
  const activeCount = watchlist.filter(
    (item) => item.status === "Active"
  ).length;

  const personCount = watchlist.filter(
    (item) => item.type === "Person"
  ).length;

  const vehicleCount = watchlist.filter((item) =>
    ["Car", "Motorcycle", "Bus", "Truck"].includes(item.type)
  ).length;

  // =========================
  // UI
  // =========================
  return (
    <div className="events-page">

      {/* HEADER */}
      <div className="events-header">

        <div>
          <h1>Watchlist</h1>

          <p>
            Monitor selected persons and vehicles
            across the CCTV network
          </p>
        </div>

        <div className="events-header-actions">

          <div className="live-indicator">
            <span className="live-dot"></span>
            WATCHLIST ACTIVE
          </div>

          <button
            className="primary-btn"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm
              ? "Close Form"
              : "+ Add to Watchlist"}
          </button>

        </div>
      </div>

      {/* STATS */}
      <div className="event-stats">

        <div className="event-stat-card">
          <div className="stat-icon">🎯</div>

          <div>
            <span>Total Watchlist</span>
            <strong>{watchlist.length}</strong>
          </div>
        </div>

        <div className="event-stat-card">
          <div className="stat-icon">🟢</div>

          <div>
            <span>Active Monitoring</span>
            <strong>{activeCount}</strong>
          </div>
        </div>

        <div className="event-stat-card">
          <div className="stat-icon">👤</div>

          <div>
            <span>Persons</span>
            <strong>{personCount}</strong>
          </div>
        </div>

        <div className="event-stat-card">
          <div className="stat-icon">🚗</div>

          <div>
            <span>Vehicles</span>
            <strong>{vehicleCount}</strong>
          </div>
        </div>

      </div>

      {/* ADD FORM */}
      {showForm && (
        <div className="events-container">

          <div className="events-container-header">

            <div>
              <h2>Add Watchlist Target</h2>

              <p>
                Create a new monitoring target
              </p>
            </div>

            <div className="ai-status">
              <span></span>
              AI READY
            </div>

          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "18px",
              padding: "25px",
            }}
          >

            {/* TYPE */}
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: "600",
                }}
              >
                Object Type
              </label>

              <select
                value={type}
                onChange={(e) =>
                  setType(e.target.value)
                }
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "8px",
                  border: "1px solid #334155",
                  background: "#0f172a",
                  color: "#fff",
                }}
              >
                <option>Person</option>
                <option>Car</option>
                <option>Motorcycle</option>
                <option>Bus</option>
                <option>Truck</option>
              </select>
            </div>

            {/* TRACKING ID */}
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: "600",
                }}
              >
                Tracking ID
              </label>

              <input
                type="text"
                value={trackingId}
                onChange={(e) =>
                  setTrackingId(e.target.value)
                }
                placeholder="Example: 24"
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "8px",
                  border: "1px solid #334155",
                  background: "#0f172a",
                  color: "#fff",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* CAMERA */}
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: "600",
                }}
              >
                Camera
              </label>

              <select
                value={camera}
                onChange={(e) =>
                  setCamera(e.target.value)
                }
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "8px",
                  border: "1px solid #334155",
                  background: "#0f172a",
                  color: "#fff",
                }}
              >
                <option>CAM-001</option>
                <option>CAM-002</option>
                <option>CAM-003</option>
                <option>CAM-004</option>
              </select>
            </div>

            {/* DESCRIPTION */}
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: "600",
                }}
              >
                Description
              </label>

              <input
                type="text"
                value={description}
                onChange={(e) =>
                  setDescription(e.target.value)
                }
                placeholder="Optional description"
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "8px",
                  border: "1px solid #334155",
                  background: "#0f172a",
                  color: "#fff",
                  boxSizing: "border-box",
                }}
              />
            </div>

          </div>

          <div
            style={{
              padding: "0 25px 25px",
              display: "flex",
              justifyContent: "flex-end",
            }}
          >
            <button
              className="primary-btn"
              onClick={addToWatchlist}
            >
              Add Target
            </button>
          </div>

        </div>
      )}

      {/* WATCHLIST */}
      <div className="events-container">

        <div className="events-container-header">

          <div>
            <h2>Monitored Targets</h2>

            <p>
              Targets configured for AI surveillance
            </p>
          </div>

          <div className="ai-status">
            <span></span>
            MONITORING
          </div>

        </div>

        {loading ? (

          <div className="events-empty">
            <div className="empty-event-icon">
              ⏳
            </div>

            <h3>Loading Watchlist...</h3>

            <p>
              Connecting to Sentinel AI backend.
            </p>
          </div>

        ) : watchlist.length === 0 ? (

          <div className="events-empty">

            <div className="empty-event-icon">
              🎯
            </div>

            <h3>
              Watchlist is empty
            </h3>

            <p>
              Add a person or vehicle to start
              monitoring.
            </p>

            <button
              className="primary-btn"
              onClick={() => setShowForm(true)}
            >
              + Add First Target
            </button>

          </div>

        ) : (

          <div className="events-list">

            {watchlist.map((item) => (

              <div
                className="event-row"
                key={item.id}
              >

                <div className="event-object-icon">
                  {getIcon(item.type)}
                </div>

                <div className="event-main-info">

                  <h3>
                    {item.type} Target
                  </h3>

                  <p>
                    {item.description}
                  </p>

                </div>

                <div className="event-column">

                  <span className="event-label">
                    TRACKING ID
                  </span>

                  <strong>
                    #{item.trackingId}
                  </strong>

                </div>

                <div className="event-column">

                  <span className="event-label">
                    CAMERA
                  </span>

                  <strong>
                    {item.camera}
                  </strong>

                </div>

                <div className="event-column">

                  <span className="event-label">
                    ADDED
                  </span>

                  <strong>
                    {item.addedAt || "Recently"}
                  </strong>

                </div>

                <div
                  className="event-status-badge"
                  style={{
                    cursor: "pointer",
                  }}
                  onClick={() =>
                    toggleStatus(item)
                  }
                >
                  {item.status}
                </div>

                <button
                  className="clear-events-btn"
                  onClick={() =>
                    removeFromWatchlist(item.id)
                  }
                >
                  Remove
                </button>

              </div>

            ))}

          </div>

        )}

      </div>

    </div>
  );
}

export default Watchlist;