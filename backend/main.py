from fastapi import Body, Response
from datetime import datetime, timedelta
from services.astronomy import get_sun_times
from services.timezone import get_timezone
from services.ics_builder import build_calendar

@app.post("/generate")
def generate_ics(payload: dict = Body(...)):
    lat = payload["lat"]
    lon = payload["lon"]
    start_date = datetime.fromisoformat(payload["start_date"]).date()
    end_date = datetime.fromisoformat(payload["end_date"]).date()
    duration = payload["duration"]

    include_sunrise = payload["include_sunrise"]
    include_sunset = payload["include_sunset"]

    sunrise_title = payload["sunrise_title"]
    sunset_title = payload["sunset_title"]

    tz = get_timezone(lat, lon)

    events = []
    day = start_date
    while day <= end_date:
        sun_times = get_sun_times(lat, lon, tz, day)

        if include_sunrise:
            events.append({
                "title": sunrise_title,
                "start": sun_times["sunrise"],
                "duration": duration,
            })

        if include_sunset:
            events.append({
                "title": sunset_title,
                "start": sun_times["sunset"],
                "duration": duration,
            })

        day += timedelta(days=1)

    ics_content = build_calendar(events)

    return Response(
        content=ics_content,
        media_type="text/calendar",
        headers={"Content-Disposition": "attachment; filename=sun-events.ics"},
    )