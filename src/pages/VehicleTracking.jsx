import React, { useEffect, useState } from "react";

const BACKEND_URL = "http://127.0.0.1:8000";

function VehicleTracking() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  const vehicleTypes = ["Car", "Motorcycle", "Bus", "Truck"];

  const fetchVehicles = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/events`);

      if (!response.ok) {
        throw new Error("Failed to fetch vehicle data");
      }

      const data = await response.json();

      const vehicleEvents = (data.events || []).filter((event) =>
        vehicleTypes.includes(event.object)
      );

      setVehicles(vehicleEvents);
    } catch (error) {
      console.log("Vehicle Tracking API Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();

    const interval = setInterval(() => {
      fetchVehicles();
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const getVehicleIcon = (type) => {
    switch (type) {
      case "Car":
        return "🚗";
      case "Motorcycle":
        return "🏍️";
      case "Bus":
        return "🚌";
      case "Truck":
        return "🚚";
      default:
        return "🚘";
    }
  };

  const getVehicleCount = (type) => {
    return vehicles.filter((vehicle) => vehicle.object === type).length;
  };

  return (
    <div className="events-page">

      {/* HEADER */}
      <div className="events-header">
        <div>
          <h1>Vehicle Tracking</h1>
          <p>
            Real-time AI vehicle detection and tracking
          </p>
        </div>

        <div className="events-header-actions">
          <div className="live-indicator">
            <span className="live-dot"></span>
            LIVE TRACKING
          </div>
        </div>
      </div>

      {/* VEHICLE STATS */}
      <div className="event-stats">

        <div className="event-stat-card">
          <div className="stat-icon">🚘</div>
          <div>
            <span>Total Vehicles</span>
            <strong>{vehicles.length}</strong>
          </div>
        </div>

        <div className="event-stat-card">
          <div className="stat-icon">🚗</div>
          <div>
            <span>Cars</span>
            <strong>{getVehicleCount("Car")}</strong>
          </div>
        </div>

        <div className="event-stat-card">
          <div className="stat-icon">🏍️</div>
          <div>
            <span>Motorcycles</span>
            <strong>{getVehicleCount("Motorcycle")}</strong>
          </div>
        </div>

        <div className="event-stat-card">
          <div className="stat-icon">🚛</div>
          <div>
            <span>Heavy Vehicles</span>
            <strong>
              {getVehicleCount("Bus") + getVehicleCount("Truck")}
            </strong>
          </div>
        </div>

      </div>

      {/* TRACKING PANEL */}
      <div className="events-container">

        <div className="events-container-header">
          <div>
            <h2>Live Vehicle Tracking</h2>
            <p>
              Vehicles detected by Sentinel AI camera network
            </p>
          </div>

          <div className="ai-status">
            <span></span>
            YOLO AI ACTIVE
          </div>
        </div>

        {/* LOADING */}
        {loading ? (
          <div className="events-empty">
            <div className="loading-spinner"></div>

            <h3>Loading vehicle tracking...</h3>

            <p>
              Connecting to Sentinel AI detection system
            </p>
          </div>
        ) : vehicles.length === 0 ? (
          /* EMPTY */
          <div className="events-empty">

            <div className="empty-event-icon">
              🚘
            </div>

            <h3>No vehicles detected</h3>

            <p>
              Start the CCTV camera to detect and track vehicles
              automatically.
            </p>

          </div>
        ) : (
          /* VEHICLE LIST */
          <div className="events-list">

            {vehicles.map((vehicle) => (
              <div
                className="event-row"
                key={`${vehicle.id}-${vehicle.track_id}`}
              >

                <div className="event-object-icon">
                  {getVehicleIcon(vehicle.object)}
                </div>

                <div className="event-main-info">
                  <h3>
                    {vehicle.object} Detected
                  </h3>

                  <p>
                    AI vehicle tracking active
                  </p>
                </div>

                <div className="event-column">
                  <span className="event-label">
                    TRACKING ID
                  </span>

                  <strong>
                    #{vehicle.track_id ?? "N/A"}
                  </strong>
                </div>

                <div className="event-column">
                  <span className="event-label">
                    CAMERA
                  </span>

                  <strong>
                    {vehicle.camera || "CAM-001"}
                  </strong>
                </div>

                <div className="event-column">
                  <span className="event-label">
                    TIME
                  </span>

                  <strong>
                    {vehicle.time || "--:--:--"}
                  </strong>
                </div>

                <div className="event-status-badge">
                  TRACKING
                </div>

              </div>
            ))}

          </div>
        )}

      </div>

    </div>
  );
}

export default VehicleTracking;