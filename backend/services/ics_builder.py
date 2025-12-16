from ics import Calendar, Event
from datetime import timedelta

def build_calendar(events_data):
    cal = Calendar()

    for e in events_data:
        event = Event()
        event.name = e["title"]
        event.begin = e["start"]
        event.end = e["start"] + timedelta(minutes=e["duration"])
        cal.events.add(event)

    return str(cal)