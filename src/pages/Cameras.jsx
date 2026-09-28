import React, { useEffect, useState } from "react";

const BACKEND_URL = "http://127.0.0.1:8000";

function Cameras() {
  const [cameraOnline, setCameraOnline] = useState(false);
  const [showFeed, setShowFeed] = useState(false);
  const [error, setError] = useState("");

  const cameras = [
    {
      id: "CAM-001",
      name: "Main Entrance",
      location: "Building Entrance",
      ai: true,
    },
    {
      id: "CAM-002",
      name: "Parking Area",
      location: "North Parking",
      ai: false,
    },
    {
      id: "CAM-003",
      name: "Back Gate",
      location: "Building Back Gate",
      ai: false,
    },
    {
      id: "CAM-004",
      name: "Main Corridor",
      location: "Building Corridor",
      ai: false,
    },
  ];

  // Check backend + camera status
  useEffect(() => {
    let interval;

    const checkCamera = async () => {
      try {
        const response = await fetch(
          `${BACKEND_URL}/api/health`,
          {
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error("Backend not responding");
        }

        const data = await response.json();

        if (data.camera === "connected") {
          setCameraOnline(true);
          setError("");
        } else {
          setCameraOnline(false);
          setError("Camera is not connected");
        }
      } catch (err) {
        console.log("Camera status error:", err);

        setCameraOnline(false);
        setError("Cannot connect to Sentinel AI server");
      }
    };

    checkCamera();

    interval = setInterval(checkCamera, 3000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  // Open live feed
  const openFeed = () => {
    if (!cameraOnline) {
      alert("Camera is offline. Please start the backend.");
      return;
    }

    setShowFeed(true);
  };

  // Close live feed
  const closeFeed = () => {
    setShowFeed(false);
  };

  const onlineCameras = cameraOnline ? 1 : 0;
  const offlineCameras = cameras.length - onlineCameras;

  return (
    <div className="cameras-page">

      {/* ================= HEADER ================= */}

      <div className="cameras-header">

        <div>
          <div className="breadcrumb">
            COMMAND CENTER / CAMERAS
          </div>

          <h1>Camera Network</h1>

          <p>
            Manage and monitor your CCTV camera network
          </p>
        </div>

        <div className="camera-header-status">

          <span
            className={`status-dot ${
              cameraOnline ? "online" : "offline"
            }`}
          ></span>

          <span>
            {cameraOnline
              ? "SYSTEM ONLINE"
              : "SYSTEM OFFLINE"}
          </span>

        </div>

      </div>

      {/* ================= STATS ================= */}

      <div className="camera-stats">

        <div className="camera-stat-card">

          <div className="camera-stat-icon">
            📹
          </div>

          <div>
            <span>Total Cameras</span>
            <strong>{cameras.length}</strong>
          </div>

        </div>

        <div className="camera-stat-card">

          <div className="camera-stat-icon">
            🟢
          </div>

          <div>
            <span>Online</span>
            <strong>{onlineCameras}</strong>
          </div>

        </div>

        <div className="camera-stat-card">

          <div className="camera-stat-icon">
            🔴
          </div>

          <div>
            <span>Offline</span>
            <strong>{offlineCameras}</strong>
          </div>

        </div>

        <div className="camera-stat-card">

          <div className="camera-stat-icon">
            🤖
          </div>

          <div>
            <span>AI Enabled</span>
            <strong>1</strong>
          </div>

        </div>

      </div>

      {/* ================= CAMERA NETWORK ================= */}

      <div className="camera-section">

        <div className="camera-section-header">

          <div>
            <h2>CCTV Network</h2>

            <p>
              Connected surveillance cameras
            </p>
          </div>

          <div className="ai-active-badge">
            <span></span>
            AI ACTIVE
          </div>

        </div>

        {/* CAMERA GRID */}

        <div className="camera-grid">

          {cameras.map((camera) => {

            const isOnline =
              camera.id === "CAM-001"
                ? cameraOnline
                : false;

            return (
              <div
                className={`camera-card ${
                  isOnline
                    ? "camera-online"
                    : "camera-offline"
                }`}
                key={camera.id}
              >

                {/* CARD HEADER */}

                <div className="camera-card-top">

                  <div>
                    <div className="camera-name">
                      {camera.name}
                    </div>

                    <div className="camera-id">
                      {camera.id}
                    </div>
                  </div>

                  <div
                    className={`camera-status ${
                      isOnline
                        ? "online"
                        : "offline"
                    }`}
                  >
                    <span></span>

                    {isOnline
                      ? "ONLINE"
                      : "OFFLINE"}
                  </div>

                </div>

                {/* ================= PREVIEW ================= */}

                <div className="camera-preview">

                  {isOnline ? (

                    <>
                      <img
                        src={`${BACKEND_URL}/api/camera/live`}
                        alt="Sentinel AI Live CCTV"
                        className="live-camera-feed"
                      />

                      <div className="camera-live-label">
                        <span></span>
                        LIVE
                      </div>

                      <div className="camera-ai-label">
                        YOLO11n AI
                      </div>
                    </>

                  ) : (

                    <div className="camera-offline-view">

                      <div className="offline-icon">
                        📹
                      </div>

                      <strong>
                        Camera Offline
                      </strong>

                      <span>
                        {camera.id === "CAM-001"
                          ? error || "No live feed available"
                          : "No camera connected"}
                      </span>

                    </div>

                  )}

                </div>

                {/* CAMERA DETAILS */}

                <div className="camera-info">

                  <div className="camera-info-row">

                    <span>Camera ID</span>

                    <strong>
                      {camera.id}
                    </strong>

                  </div>

                  <div className="camera-info-row">

                    <span>Location</span>

                    <strong>
                      {camera.location}
                    </strong>

                  </div>

                  <div className="camera-info-row">

                    <span>AI Detection</span>

                    <strong>
                      {camera.ai && isOnline
                        ? "Active"
                        : "Unavailable"}
                    </strong>

                  </div>

                </div>

                {/* ACTION */}

                <div className="camera-actions">

                  <button
                    type="button"
                    className="camera-open-btn"
                    disabled={!isOnline}
                    onClick={openFeed}
                  >
                    {isOnline
                      ? "Open Live Feed"
                      : "Camera Offline"}
                  </button>

                </div>

              </div>
            );
          })}

        </div>

      </div>

      {/* ================= AI INFO ================= */}

      <div className="camera-ai-panel">

        <div className="camera-ai-panel-icon">
          🤖
        </div>

        <div className="camera-ai-panel-content">

          <h3>
            Sentinel AI Detection Engine
          </h3>

          <p>
            YOLO11n object detection and tracking
            is active on the connected camera.
            Detected objects are automatically sent
            to Event History and Alerts.
          </p>

        </div>

        <div className="camera-ai-status">

          <span></span>

          {cameraOnline
            ? "AI ACTIVE"
            : "AI WAITING"}

        </div>

      </div>

      {/* ================= LIVE FEED MODAL ================= */}

      {showFeed && (
        <div
          className="camera-modal-overlay"
          onClick={closeFeed}
        >

          <div
            className="camera-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            {/* MODAL HEADER */}

            <div className="camera-modal-header">

              <div>

                <div className="camera-modal-title">
                  Main Entrance
                </div>

                <div className="camera-modal-subtitle">
                  CAM-001 • Building Entrance
                </div>

              </div>

              <button
                type="button"
                className="camera-modal-close"
                onClick={closeFeed}
              >
                ✕
              </button>

            </div>

            {/* LIVE VIDEO */}

            <div className="camera-modal-feed">

              {cameraOnline ? (

                <>
                  <img
                    src={`${BACKEND_URL}/api/camera/live`}
                    alt="Sentinel AI Live Camera"
                    className="live-camera-feed"
                  />

                  <div className="camera-modal-live">
                    <span></span>
                    LIVE
                  </div>
                </>

              ) : (

                <div className="camera-offline-view">

                  <div className="offline-icon">
                    📹
                  </div>

                  <strong>
                    Camera Disconnected
                  </strong>

                  <span>
                    Please check the backend and
                    camera connection.
                  </span>

                </div>

              )}

            </div>

            {/* MODAL FOOTER */}

            <div className="camera-modal-footer">

              <div className="modal-status">

                <span className="status-dot online"></span>

                <span>
                  AI Detection Active
                </span>

              </div>

              <div className="modal-engine">
                YOLO11n • Object Tracking
              </div>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}

export default Cameras;