from datetime import datetime, timedelta

from fastapi import Body, FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware

from backend.services.astronomy import get_sun_times
from backend.services.timezone import get_timezone
from backend.services.ics_builder import build_calendar

from pathlib import Path
from fastapi.staticfiles import StaticFiles

from fastapi.responses import FileResponse


app = FastAPI(title="Sunrise/Sunset ICS Generator")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

FRONTEND_DIR = Path(__file__).resolve().parent.parent / "frontend"

app.mount("/static", StaticFiles(directory=str(FRONTEND_DIR), html=False), name="static")


@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/")
def ui():
    return FileResponse(FRONTEND_DIR / "index.html")

@app.get("/favicon.ico")
def favicon():
    return Response(status_code=204)


@app.post("/generate")
def generate_ics(payload: dict = Body(...)):
    lat = float(payload["lat"])
    lon = float(payload["lon"])

    start_date = datetime.fromisoformat(payload["start_date"]).date()
    end_date = datetime.fromisoformat(payload["end_date"]).date()

    duration = int(payload["duration"])

    include_sunrise = bool(payload["include_sunrise"])
    include_sunset = bool(payload["include_sunset"])

    sunrise_title = str(payload["sunrise_title"])
    sunset_title = str(payload["sunset_title"])

    if not include_sunrise and not include_sunset:
        # Simple validation; frontend will also enforce this.
        return Response(content="Select at least sunrise or sunset.", status_code=400)

    tz = get_timezone(lat, lon)

    events = []
    day = start_date
    while day <= end_date:
        sun_times = get_sun_times(lat, lon, tz, day)

        if include_sunrise:
            events.append(
                {"title": sunrise_title, "start": sun_times["sunrise"], "duration": duration}
            )

        if include_sunset:
            events.append(
                {"title": sunset_title, "start": sun_times["sunset"], "duration": duration}
            )

        day += timedelta(days=1)

    ics_content = build_calendar(events)

    return Response(
        content=ics_content,
        media_type="text/calendar",
        headers={"Content-Disposition": "attachment; filename=sun-events.ics"},
    )