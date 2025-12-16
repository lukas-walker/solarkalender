from timezonefinder import TimezoneFinder

_tf = TimezoneFinder()

def get_timezone(lat: float, lon: float) -> str:
    tz = _tf.timezone_at(lat=lat, lng=lon)
    if not tz:
        raise ValueError("Timezone not found for coordinates")
    return tz