import React, { useEffect, useMemo, useState } from "react";

const BACKEND_URL = "http://127.0.0.1:8000";

const VEHICLE_TYPES = ["Car", "Motorcycle", "Bus", "Truck"];

function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  const fetchEvents = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/events`);

      if (!response.ok) {
        throw new Error("Failed to fetch events");
      }

      const data = await response.json();

      setEvents(data.events || []);
    } catch (error) {
      console.log("Event API Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();

    const interval = setInterval(() => {
      fetchEvents();
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const clearEvents = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to clear all event history?"
    );

    if (!confirmed) return;

    try {
      const response = await fetch(`${BACKEND_URL}/api/events`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to clear events");
      }

      setEvents([]);
    } catch (error) {
      console.log("Clear events error:", error);
    }
  };

  const isVehicle = (objectType) => {
    return VEHICLE_TYPES.includes(objectType);
  };

  const filteredEvents = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    return [...events]
      .reverse()
      .filter((event) => {
        if (filter === "Person" && event.object !== "Person") {
          return false;
        }

        if (filter === "Vehicle" && !isVehicle(event.object)) {
          return false;
        }

        if (
          filter === "Watchlist" &&
          !(
            event.watchlist_alert === true ||
            event.type === "WATCHLIST MATCH"
          )
        ) {
          return false;
        }

        if (!searchText) {
          return true;
        }

        const searchableText = `
          ${event.type || ""}
          ${event.object || ""}
          ${event.track_id || ""}
          ${event.camera || ""}
          ${event.status || ""}
          ${event.time || ""}
          ${event.description || ""}
        `.toLowerCase();

        return searchableText.includes(searchText);
      });
  }, [events, search, filter]);

  const totalEvents = events.length;

  const personEvents = events.filter(
    (event) => event.object === "Person"
  ).length;

  const vehicleEvents = events.filter((event) =>
    isVehicle(event.object)
  ).length;

  const watchlistEvents = events.filter(
    (event) =>
      event.watchlist_alert === true ||
      event.type === "WATCHLIST MATCH"
  ).length;

  const getEventIcon = (objectType) => {
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
        return "◉";
    }
  };

  const getEventClass = (event) => {
    if (
      event.watchlist_alert === true ||
      event.type === "WATCHLIST MATCH"
    ) {
      return "watchlist";
    }

    if (event.object === "Person") {
      return "person";
    }

    if (isVehicle(event.object)) {
      return "vehicle";
    }

    return "";
  };

  return (
    <div className="events-page">

      {/* HEADER */}
      <div className="events-header">
        <div>
          <h1>Event History</h1>

          <p>
            AI detected activity from your CCTV network
          </p>
        </div>

        <div className="events-header-actions">

          <div className="live-indicator">
            <span className="live-dot"></span>
            LIVE
          </div>

          <button
            className="clear-events-btn"
            onClick={clearEvents}
            disabled={events.length === 0}
          >
            Clear Events
          </button>

        </div>
      </div>

      {/* STAT CARDS */}
      <div className="event-stats">

        <div className="event-stat-card">
          <div className="stat-icon">
            ◉
          </div>

          <div>
            <span>Total Events</span>
            <strong>{totalEvents}</strong>
          </div>
        </div>

        <div className="event-stat-card">
          <div className="stat-icon">
            👤
          </div>

          <div>
            <span>Persons Detected</span>
            <strong>{personEvents}</strong>
          </div>
        </div>

        <div className="event-stat-card">
          <div className="stat-icon">
            🚗
          </div>

          <div>
            <span>Vehicles Detected</span>
            <strong>{vehicleEvents}</strong>
          </div>
        </div>

        <div className="event-stat-card">
          <div className="stat-icon">
            ⚠️
          </div>

          <div>
            <span>Watchlist Alerts</span>
            <strong>{watchlistEvents}</strong>
          </div>
        </div>

      </div>

      {/* EVENT CONTAINER */}
      <div className="events-container">

        {/* TOP */}
        <div className="events-container-header">

          <div>
            <h2>Detection History</h2>

            <p>
              Automatically generated by Sentinel AI
            </p>
          </div>

          <div className="ai-status">
            <span></span>
            AI ACTIVE
          </div>

        </div>

        {/* SEARCH + FILTERS */}
        <div className="events-controls">

          <div className="event-search">

            <span>🔍</span>

            <input
              type="text"
              placeholder="Search events, camera, tracking ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

          </div>

          <div className="event-filters">

            <button
              className={filter === "All" ? "active" : ""}
              onClick={() => setFilter("All")}
            >
              All
            </button>

            <button
              className={filter === "Person" ? "active" : ""}
              onClick={() => setFilter("Person")}
            >
              Persons
            </button>

            <button
              className={filter === "Vehicle" ? "active" : ""}
              onClick={() => setFilter("Vehicle")}
            >
              Vehicles
            </button>

            <button
              className={filter === "Watchlist" ? "active" : ""}
              onClick={() => setFilter("Watchlist")}
            >
              Watchlist
            </button>

          </div>

        </div>

        {/* RESULT COUNT */}
        {!loading && events.length > 0 && (
          <div className="events-result-info">
            Showing{" "}
            <strong>{filteredEvents.length}</strong>{" "}
            of{" "}
            <strong>{events.length}</strong>{" "}
            events
          </div>
        )}

        {/* LOADING */}
        {loading ? (
          <div className="events-empty">

            <div className="loading-spinner"></div>

            <h3>Loading events...</h3>

            <p>
              Connecting to Sentinel AI detection system
            </p>

          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="events-empty">

            <div className="empty-event-icon">
              🔍
            </div>

            <h3>
              {events.length === 0
                ? "No events detected"
                : "No matching events"}
            </h3>

            <p>
              {events.length === 0
                ? "Keep the camera running. AI detection events will appear here automatically."
                : "Try changing the search text or filter."}
            </p>

          </div>
        ) : (
          <div className="events-list">

            {filteredEvents.map((event) => {

              const watchlistAlert =
                event.watchlist_alert === true ||
                event.type === "WATCHLIST MATCH";

              return (
                <div
                  className={`event-row ${getEventClass(event)}`}
                  key={event.id}
                >

                  {/* ICON */}
                  <div className="event-object-icon">
                    {getEventIcon(event.object)}
                  </div>

                  {/* EVENT INFO */}
                  <div className="event-main-info">

                    <h3>
                      {event.type || "Detection Event"}
                    </h3>

                    <p>
                      Object:{" "}
                      <strong>
                        {event.object || "Unknown"}
                      </strong>
                    </p>

                    {watchlistAlert && (
                      <span className="event-watchlist-tag">
                        ⚠ WATCHLIST MATCH
                      </span>
                    )}

                  </div>

                  {/* TRACKING */}
                  <div className="event-column">

                    <span className="event-label">
                      TRACKING ID
                    </span>

                    <strong>
                      {event.track_id ?? "N/A"}
                    </strong>

                  </div>

                  {/* CAMERA */}
                  <div className="event-column">

                    <span className="event-label">
                      CAMERA
                    </span>

                    <strong>
                      {event.camera || "CAM-001"}
                    </strong>

                  </div>

                  {/* TIME */}
                  <div className="event-column">

                    <span className="event-label">
                      TIME
                    </span>

                    <strong>
                      {event.time || "N/A"}
                    </strong>

                  </div>

                  {/* STATUS */}
                  <div className="event-status-badge">
                    {event.status || "New"}
                  </div>

                </div>
              );
            })}

          </div>
        )}

      </div>

    </div>
  );
}

export default Events;