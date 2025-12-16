from astral import LocationInfo
from astral.sun import sun
from datetime import date

def get_sun_times(lat: float, lon: float, tz: str, day: date):
    location = LocationInfo(latitude=lat, longitude=lon, timezone=tz)
    s = sun(location.observer, date=day, tzinfo=location.timezone)

    return {
        "sunrise": s["sunrise"],
        "sunset": s["sunset"],
    }