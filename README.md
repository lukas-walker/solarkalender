# Solarkalender

Solarkalender ist eine kleine, selbst-gehostete Web-App, die automatisch 
Sonnenauf- und Sonnenuntergänge als Kalenderereignisse (ICS) erzeugt.

Du wählst einen Ort und einen Datumsbereich – Solarkalender erstellt eine 
standardkonforme `.ics`-Datei, die in alle gängigen Kalender importiert werden kann.

**Features**
- Sonnenauf- und Sonnenuntergang als Kalendereinträge
- Frei wählbarer Datumsbereich und Ereignisdauer
- Kartenbasierte Ortsauswahl (OpenStreetMap / Leaflet)
- Keine API-Keys, keine Anmeldung
- Vollständig Open Source, selbst hostbar
- Deutsch / Englisch umschaltbar

---

## Tech Stack

- **Backend:** Python, FastAPI
- **Astronomie:** astral (lokale Berechnung)
- **Zeitzonen:** timezonefinder
- **ICS:** ics
- **Frontend:** HTML, CSS, Vanilla JS
- **Karte:** Leaflet + OpenStreetMap
- **Deployment:** Docker (ideal für Coolify)

---

## Lokales Setup (ohne Docker)

### Voraussetzungen
- Python 3.11+
- pip

### Installation

```bash
pip install -r backend/requirements.txt
```

### Installation
```bash
python -m uvicorn backend.main:app --reload
```

Dann im Browser öffnen:
```
http://127.0.0.1:8000/
```

## Lokales Setup (mit Docker)
### Build & Run

```bash
docker build -t solarkalender .
docker run --rm -p 8000:8000 solarkalender
```
Dann im Browser öffnen:
```
http://127.0.0.1:8000/
```


## Deployment mit Coolify

1. Neues Application-Projekt in Coolify anlegen
2. GitHub-Repository via GitHub App verbinden 
3. Build-Typ: Dockerfile
4. Exposed Port: 8000
5. Deploy

Nach dem Deploy ist die App direkt über die konfigurierte Domain erreichbar.

## Nutzung

1. Ort über Suche oder Karte auswählen
2. Datumsbereich und Dauer festlegen
3. Sonnenaufgang, Sonnenuntergang oder beides auswählen
4. ICS herunterladen
5. Datei in den Kalender importieren
   

## Lizenz

MIT License

🎁 Entstanden als persönliches Geschenk – gedacht zum Teilen.