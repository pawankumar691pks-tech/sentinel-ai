from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, StreamingResponse
from pydantic import BaseModel
from typing import Optional
from ultralytics import YOLO
import cv2
import time
import threading


# =========================================================
# SENTINEL AI BACKEND
# =========================================================

app = FastAPI(title="Sentinel AI Backend")


# =========================================================
# CORS
# =========================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# YOLO MODEL
# =========================================================

print("Loading YOLO model...")

try:
    model = YOLO("yolo11n.pt")
    print("YOLO model loaded successfully!")
except Exception as e:
    model = None
    print("YOLO model loading error:", e)


# =========================================================
# CAMERA
# =========================================================

print("Opening camera...")

camera = cv2.VideoCapture(0, cv2.CAP_DSHOW)

camera.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
camera.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
camera.set(cv2.CAP_PROP_FPS, 20)

if camera.isOpened():
    print("Camera connected successfully!")
else:
    print("Camera connection failed!")


# =========================================================
# OBJECT CLASSES
# =========================================================

OBJECT_CLASSES = {
    0: "Person",
    2: "Car",
    3: "Motorcycle",
    5: "Bus",
    7: "Truck",
}


# =========================================================
# EVENTS STORAGE
# =========================================================

events = []

event_lock = threading.Lock()
camera_lock = threading.Lock()

latest_frame = None
latest_frame_lock = threading.Lock()

background_thread = None
background_running = False


# =========================================================
# WATCHLIST STORAGE
# =========================================================

watchlist = []

watchlist_lock = threading.Lock()

watchlist_counter = 1


# =========================================================
# WATCHLIST MODEL
# =========================================================

class WatchlistItem(BaseModel):
    type: str
    trackingId: str
    camera: str = "CAM-001"
    description: str = "No additional information"
    status: str = "Active"


# =========================================================
# ADD EVENT
# =========================================================

def create_event(object_name, track_id):

    with event_lock:

        # Avoid duplicate event for same object + tracking ID
        for event in events:

            if (
                event["object"] == object_name
                and event["track_id"] == track_id
            ):
                return

        new_event = {
            "id": int(time.time() * 1000),
            "type": f"{object_name} Detected",
            "object": object_name,
            "track_id": track_id,
            "camera": "CAM-001",
            "time": time.strftime("%H:%M:%S"),
            "status": "New"
        }

        events.insert(0, new_event)

        # Keep latest 50 events
        if len(events) > 50:
            events.pop()


# =========================================================
# PROCESS FRAME
# =========================================================

def process_frame(frame):

    if model is None:
        return frame

    try:

        results = model.track(
            source=frame,
            persist=True,
            conf=0.35,
            verbose=False
        )

        object_count = 0

        for result in results:

            if result.boxes is None:
                continue

            for box in result.boxes:

                class_id = int(box.cls[0])

                if class_id not in OBJECT_CLASSES:
                    continue

                object_name = OBJECT_CLASSES[class_id]

                confidence = float(box.conf[0])

                x1, y1, x2, y2 = map(
                    int,
                    box.xyxy[0]
                )

                object_count += 1

                # =================================================
                # TRACKING ID
                # =================================================

                track_id = None

                if box.id is not None:
                    track_id = int(box.id[0])

                # =================================================
                # CREATE EVENT
                # =================================================

                if track_id is not None:

                    create_event(
                        object_name,
                        track_id
                    )

                # =================================================
                # WATCHLIST MATCHING
                # =================================================

                if track_id is not None:

                    check_watchlist_match(
                        object_name,
                        track_id
                    )

                # =================================================
                # DRAW BOUNDING BOX
                # =================================================

                cv2.rectangle(
                    frame,
                    (x1, y1),
                    (x2, y2),
                    (0, 255, 0),
                    2
                )

                # =================================================
                # LABEL
                # =================================================

                if track_id is not None:

                    label = (
                        f"{object_name} "
                        f"ID:{track_id} "
                        f"{confidence:.0%}"
                    )

                else:

                    label = (
                        f"{object_name} "
                        f"{confidence:.0%}"
                    )

                cv2.putText(
                    frame,
                    label,
                    (x1, max(y1 - 10, 20)),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.55,
                    (0, 255, 0),
                    2
                )

        # =========================================================
        # SENTINEL HEADER
        # =========================================================

        cv2.rectangle(
            frame,
            (0, 0),
            (640, 60),
            (5, 8, 12),
            -1
        )

        cv2.putText(
            frame,
            "SENTINEL AI - LIVE CCTV",
            (15, 26),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.65,
            (0, 255, 0),
            2
        )

        cv2.putText(
            frame,
            "CAM-001 | AI ACTIVE",
            (15, 48),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.45,
            (255, 255, 255),
            1
        )

        # =========================================================
        # OBJECT COUNT
        # =========================================================

        cv2.putText(
            frame,
            f"OBJECTS: {object_count}",
            (510, 30),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.5,
            (0, 255, 0),
            2
        )

    except Exception as e:

        print("YOLO processing error:", e)

        cv2.putText(
            frame,
            "AI PROCESSING ERROR",
            (15, 90),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.7,
            (0, 0, 255),
            2
        )

    return frame


# =========================================================
# WATCHLIST MATCHING
# =========================================================

def check_watchlist_match(object_name, track_id):

    with watchlist_lock:

        current_watchlist = list(watchlist)

    for target in current_watchlist:

        if target["status"] != "Active":
            continue

        target_type = target["type"]
        target_tracking_id = str(target["trackingId"])

        detected_tracking_id = str(track_id)

        if (
            target_type == object_name
            and target_tracking_id == detected_tracking_id
        ):

            create_watchlist_alert(
                object_name,
                track_id,
                target
            )


# =========================================================
# WATCHLIST ALERT
# =========================================================

def create_watchlist_alert(
    object_name,
    track_id,
    target
):

    with event_lock:

        # Prevent duplicate watchlist alerts
        for event in events:

            if (
                event.get("watchlist_alert") is True
                and event.get("object") == object_name
                and event.get("track_id") == track_id
            ):
                return

        alert_event = {
            "id": int(time.time() * 1000),
            "type": "WATCHLIST MATCH",
            "object": object_name,
            "track_id": track_id,
            "camera": target.get("camera", "CAM-001"),
            "time": time.strftime("%H:%M:%S"),
            "status": "Alert",
            "watchlist_alert": True,
            "description": target.get(
                "description",
                "Watchlist target detected"
            )
        }

        events.insert(0, alert_event)

        if len(events) > 50:
            events.pop()

        print(
            f"WATCHLIST ALERT: "
            f"{object_name} ID:{track_id}"
        )


# =========================================================
# BACKGROUND CAMERA PROCESSOR
# =========================================================

def background_camera_loop():

    global latest_frame
    global background_running

    print("Starting background AI detection...")

    while background_running:

        try:

            if not camera.isOpened():

                time.sleep(0.5)
                continue

            # Camera access lock
            with camera_lock:

                success, frame = camera.read()

            if not success:

                time.sleep(0.05)
                continue

            # YOLO processing
            processed_frame = process_frame(frame)

            # Store latest processed frame
            with latest_frame_lock:

                latest_frame = processed_frame.copy()

            time.sleep(0.01)

        except Exception as e:

            print(
                "Background camera error:",
                e
            )

            time.sleep(0.5)

    print("Background AI detection stopped.")


# =========================================================
# START BACKGROUND PROCESSOR
# =========================================================

def start_background_processor():

    global background_thread
    global background_running

    if background_running:
        return

    background_running = True

    background_thread = threading.Thread(
        target=background_camera_loop,
        daemon=True
    )

    background_thread.start()

    print(
        "Background AI processor started!"
    )


# =========================================================
# ROOT API
# =========================================================

@app.get("/")
def root():

    return {
        "project": "Sentinel AI",
        "status": "online",
        "message": "Backend is running successfully"
    }


# =========================================================
# HEALTH API
# =========================================================

@app.get("/api/health")
def health():

    return {
        "status": "online",
        "camera": (
            "connected"
            if camera.isOpened()
            else "disconnected"
        ),
        "ai": (
            "active"
            if model is not None
            else "inactive"
        ),
        "background_detection": (
            "running"
            if background_running
            else "stopped"
        )
    }


# =========================================================
# EVENTS API
# =========================================================

@app.get("/api/events")
def get_events():

    with event_lock:

        current_events = list(events)

    return {
        "total": len(current_events),
        "events": current_events
    }


# =========================================================
# CLEAR EVENTS
# =========================================================

@app.delete("/api/events")
def clear_events():

    with event_lock:

        events.clear()

    return {
        "message": "All events cleared",
        "total": 0
    }


# =========================================================
# WATCHLIST - GET
# =========================================================

@app.get("/api/watchlist")
def get_watchlist():

    with watchlist_lock:

        current_watchlist = list(watchlist)

    return current_watchlist


# =========================================================
# WATCHLIST - POST
# =========================================================

@app.post("/api/watchlist")
def add_watchlist(item: WatchlistItem):

    global watchlist_counter

    with watchlist_lock:

        new_item = {
            "id": watchlist_counter,
            "type": item.type,
            "trackingId": item.trackingId,
            "camera": item.camera,
            "description": item.description,
            "status": item.status,
            "addedAt": time.strftime("%H:%M:%S")
        }

        watchlist.append(new_item)

        watchlist_counter += 1

    print(
        "Watchlist target added:",
        new_item
    )

    return {
        "message": "Target added successfully",
        "target": new_item
    }


# =========================================================
# WATCHLIST - PUT
# =========================================================

@app.put("/api/watchlist/{watchlist_id}")
def update_watchlist(
    watchlist_id: int,
    item: WatchlistItem
):

    with watchlist_lock:

        for index, target in enumerate(watchlist):

            if target["id"] == watchlist_id:

                updated_item = {
                    "id": watchlist_id,
                    "type": item.type,
                    "trackingId": item.trackingId,
                    "camera": item.camera,
                    "description": item.description,
                    "status": item.status,
                    "addedAt": target.get(
                        "addedAt",
                        time.strftime("%H:%M:%S")
                    )
                }

                watchlist[index] = updated_item

                return {
                    "message": "Target updated successfully",
                    "target": updated_item
                }

    return {
        "message": "Watchlist target not found"
    }


# =========================================================
# WATCHLIST - DELETE
# =========================================================

@app.delete("/api/watchlist/{watchlist_id}")
def delete_watchlist(watchlist_id: int):

    with watchlist_lock:

        for index, target in enumerate(watchlist):

            if target["id"] == watchlist_id:

                deleted_target = watchlist.pop(index)

                return {
                    "message": "Target removed successfully",
                    "target": deleted_target
                }

    return {
        "message": "Watchlist target not found"
    }


# =========================================================
# SINGLE CAMERA FRAME
# =========================================================

@app.get("/api/camera/frame")
def get_camera_frame():

    with latest_frame_lock:

        if latest_frame is None:

            return Response(
                content=b"Camera frame not ready",
                status_code=503,
                media_type="text/plain"
            )

        frame = latest_frame.copy()

    success, encoded = cv2.imencode(
        ".jpg",
        frame
    )

    if not success:

        return Response(
            content=b"Unable to encode image",
            status_code=500,
            media_type="text/plain"
        )

    return Response(
        content=encoded.tobytes(),
        media_type="image/jpeg",
        headers={
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache",
            "Expires": "0"
        }
    )


# =========================================================
# LIVE CAMERA STREAM
# =========================================================

def generate_camera_frames():

    while True:

        with latest_frame_lock:

            if latest_frame is None:
                frame = None

            else:
                frame = latest_frame.copy()

        if frame is None:

            time.sleep(0.05)
            continue

        success, encoded = cv2.imencode(
            ".jpg",
            frame
        )

        if not success:
            continue

        frame_bytes = encoded.tobytes()

        yield (
            b"--frame\r\n"
            b"Content-Type: image/jpeg\r\n"
            b"Content-Length: "
            + str(len(frame_bytes)).encode()
            + b"\r\n\r\n"
            + frame_bytes
            + b"\r\n"
        )

        time.sleep(0.03)


@app.get("/api/camera/live")
def live_camera():

    return StreamingResponse(
        generate_camera_frames(),
        media_type="multipart/x-mixed-replace; boundary=frame",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Pragma": "no-cache"
        }
    )


# =========================================================
# STARTUP
# =========================================================

@app.on_event("startup")
def startup():

    print("Starting Sentinel AI backend...")

    start_background_processor()


# =========================================================
# SHUTDOWN
# =========================================================

@app.on_event("shutdown")
def shutdown():

    global background_running

    print("Shutting down Sentinel AI...")

    background_running = False

    if background_thread is not None:

        background_thread.join(timeout=2)

    if camera.isOpened():

        camera.release()

    print("Camera released.")


# =========================================================
# RUN
# =========================================================

if __name__ == "__main__":

    import uvicorn

    uvicorn.run(
        app,
        host="127.0.0.1",
        port=8000
    )