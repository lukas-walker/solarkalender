// ---------- Helpers ----------
const DEFAULT_LOCATION = {
    lat: 46.9519,
    lon: 7.4603,
    zoom: 10,
    label: "Rosengarten, Bern, Schweiz",
};


// ---------- i18n ----------
let currentLang = "de";

const I18N = {
    de: {
        title: "Wann ist nochmal Sonnenuntergang?",
        intro: "Hier kannst du deinen eigenen Sonnenaufgangs- und Sonnenuntergangs-Kalender generieren. Einfach Ort und Datumsbereich wählen und denn Kalender exportieren. Das ics-File kannst du in jedem deiner Kalender importieren.",
        intro_2: "Ein Tipp: Erstelle einen neuen, leeren Kalender und importiere dort das ics-File. So kannst du bequem alle Sonnenauf- und -untergänge ein- und ausblenden (und den ganzen Kalender löschen, wenn etwas schiefgeht :)).",
        search_label: "Ortssuche",
        search_btn: "Suchen",
        map_label: "Karte (antippen, um Marker zu setzen)",
        map_hint: "Tipp: Tippe auf die Karte, um den Ort zu setzen, oder nutze die Suchergebnisse oben.",
        lat: "Breitengrad",
        lon: "Längengrad",
        start_date: "Startdatum",
        end_date: "Enddatum",
        duration: "Dauer des Ereignisses im Kalender (Minuten)",
        include: "Ereignisse einbeziehen",
        sunrise: "Sonnenaufgang",
        sunrise_title: "Titel der Kalendereinträge für Sonnenaufgang",
        sunset: "Sonnenuntergang",
        sunset_title: "Titel der Kalendereinträge für Sonnenuntergang",
        download: "ICS herunterladen",
        howto: "Anleitung",
        howto_1: "Suche nach einem Ort oder gib Koordinaten manuell ein.",
        howto_2: "Wähle einen Datumsbereich und eine Ereignisdauer.",
        howto_3: "Wähle Sonnenaufgang, Sonnenuntergang oder beides.",
        howto_4: "Klicke auf „ICS herunterladen“ und importiere die Datei in deinen Kalender.",
        howto_disclaimer: "Zeiten werden lokal berechnet (kein API-Key). Die Ortssuche verwendet OpenStreetMap Nominatim."
    },
    en: {
        title: "When is sunset again?",
        intro: "Here you can generate your own sunrise and sunset calendar. Simply choose a location and a date range, then export the calendar. You can import the ICS file into any of your calendars.",
        intro_2: "Tip: Create a new, empty calendar and import the ICS file there. This way you can easily show or hide all sunrise and sunset events (and delete the entire calendar if something goes wrong :).",
        search_label: "Location search",
        search_btn: "Search",
        map_label: "Map (tap to set marker)",
        map_hint: "Tip: Tap the map to set the location, or use the search results above.",
        lat: "Latitude",
        lon: "Longitude",
        start_date: "Start date",
        end_date: "End date",
        duration: "Event duration in calendar (minutes)",
        include: "Include events",
        sunrise: "Sunrise",
        sunrise_title: "Calendar event title for sunrise",
        sunset: "Sunset",
        sunset_title: "Calendar event title for sunset",
        download: "Download ICS",
        howto: "How it works",
        howto_1: "Search for a location or enter coordinates manually.",
        howto_2: "Select a date range and an event duration.",
        howto_3: "Choose sunrise, sunset, or both.",
        howto_4: "Click “Download ICS” and import the file into your calendar.",
        howto_disclaimer: "Times are calculated locally (No API-key). The location search is using OpenStreetMap Nominatim."
    }
};

function applyLanguage(lang) {
    currentLang = lang;
    document.documentElement.lang = lang;

    document.querySelectorAll("[data-i18n]").forEach(el => {
        const key = el.getAttribute("data-i18n");
        if (I18N[lang][key]) {
            el.textContent = I18N[lang][key];
        }
    });

    $("langToggleBtn").textContent = lang === "de" ? "EN" : "DE";
}

function $(id) {
    return document.getElementById(id);
}

function setText(id, text) {
    const el = $(id);
    if (el) el.textContent = text || "";
}

function clamp(str, maxLen = 160) {
    if (!str) return "";
    return str.length > maxLen ? str.slice(0, maxLen - 1) + "…" : str;
}

$("langToggleBtn").addEventListener("click", () => {
    applyLanguage(currentLang === "de" ? "en" : "de");
});

// default language
applyLanguage("de");

// ---------- Modal ----------
const howtoBtn = $("howtoBtn");
const closeModalBtn = $("closeModalBtn");
const modalBackdrop = $("modalBackdrop");

function openModal() {
    modalBackdrop.classList.remove("hidden");
}
function closeModal() {
    modalBackdrop.classList.add("hidden");
}

howtoBtn.addEventListener("click", openModal);
closeModalBtn.addEventListener("click", closeModal);
modalBackdrop.addEventListener("click", (e) => {
    if (e.target === modalBackdrop) closeModal();
});
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modalBackdrop.classList.contains("hidden")) closeModal();
});

// ---------- Map (Leaflet) ----------
const latInput = $("lat");
const lonInput = $("lon");

let map = null;
let marker = null;

function setLatLon(lat, lon, { pan = true } = {}) {
    latInput.value = String(lat);
    lonInput.value = String(lon);

    if (map) {
        if (!marker) {
            marker = L.marker([lat, lon]).addTo(map);
        } else {
            marker.setLatLng([lat, lon]);
        }
        if (pan) map.setView([lat, lon], Math.max(map.getZoom(), 10));
    }
}

function initMap() {
    // Leaflet must be loaded (window.L available)
    if (!window.L) {
        console.error("Leaflet (L) not found. Check Leaflet script tag in index.html.");
        return;
    }

    map = L.map("map", {
        zoomControl: true,
        scrollWheelZoom: true,
    });

    // OpenStreetMap tiles
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    // Default view
    map.setView([DEFAULT_LOCATION.lat, DEFAULT_LOCATION.lon], DEFAULT_LOCATION.zoom);
    setLatLon(
        DEFAULT_LOCATION.lat.toFixed(6),
        DEFAULT_LOCATION.lon.toFixed(6),
        { pan: false }
    );
    setText("searchStatus", `Default location: ${DEFAULT_LOCATION.label}`);

    // Click to place marker + fill coordinates
    map.on("click", (e) => {
        const lat = e.latlng.lat.toFixed(6);
        const lon = e.latlng.lng.toFixed(6);
        setLatLon(lat, lon, { pan: false });
        setText("searchStatus", `Selected on map: lat ${lat} • lon ${lon}`);
    });

    // If lat/lon already filled, place marker there
    const lat = parseFloat(latInput.value);
    const lon = parseFloat(lonInput.value);
    if (!Number.isNaN(lat) && !Number.isNaN(lon)) {
        setLatLon(lat, lon);
    }
}

initMap();

// ---------- Nominatim Search ----------
const searchBtn = $("searchBtn");
const qInput = $("q");
const resultsDiv = $("results");

async function nominatimSearch(query) {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("q", query);
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("limit", "5");
    url.searchParams.set("addressdetails", "1");

    const res = await fetch(url.toString(), {
        headers: { "Accept": "application/json" },
    });

    if (!res.ok) {
        throw new Error(`Nominatim error: HTTP ${res.status}`);
    }
    return await res.json();
}

function clearResults() {
    resultsDiv.innerHTML = "";
}

function renderResults(items) {
    clearResults();

    if (!items || items.length === 0) {
        resultsDiv.innerHTML = `<div class="result muted">No results.</div>`;
        return;
    }

    for (const item of items) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "result";

        const display = item.display_name || "Unnamed result";
        btn.innerHTML = `
      <div class="result-title">${clamp(display, 120)}</div>
      <div class="result-meta">lat ${item.lat} • lon ${item.lon}</div>
    `;

        btn.addEventListener("click", () => {
            const lat = parseFloat(item.lat);
            const lon = parseFloat(item.lon);

            setLatLon(lat.toFixed(6), lon.toFixed(6));
            setText("searchStatus", `Selected: ${clamp(display, 90)}`);
            clearResults();
        });

        resultsDiv.appendChild(btn);
    }
}

searchBtn.addEventListener("click", async () => {
    const query = (qInput.value || "").trim();
    setText("searchStatus", "");
    setText("formStatus", "");
    clearResults();

    if (!query) {
        setText("searchStatus", "Enter a search query.");
        return;
    }

    try {
        setText("searchStatus", "Searching…");
        const items = await nominatimSearch(query);
        setText("searchStatus", `Found ${items.length} result(s). Tap one to fill coordinates.`);
        renderResults(items);
    } catch (err) {
        setText("searchStatus", `Search failed: ${err.message}`);
    }
});

// ---------- Form submission + validation + download ----------
const form = $("form");
const includeSunrise = $("include_sunrise");
const includeSunset = $("include_sunset");

function validateInclude() {
    const ok = includeSunrise.checked || includeSunset.checked;
    setText("includeError", ok ? "" : "Select at least one: sunrise and/or sunset.");
    return ok;
}

includeSunrise.addEventListener("change", validateInclude);
includeSunset.addEventListener("change", validateInclude);

async function downloadIcs(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    setText("formStatus", "");
    setText("includeError", "");

    if (!validateInclude()) return;

    const lat = latInput.value.trim();
    const lon = lonInput.value.trim();
    const start_date = $("start_date").value;
    const end_date = $("end_date").value;

    if (!lat || !lon || !start_date || !end_date) {
        setText("formStatus", "Please fill latitude, longitude, start date, and end date.");
        return;
    }

    const payload = {
        lat: parseFloat(lat),
        lon: parseFloat(lon),
        start_date,
        end_date,
        duration: parseInt($("duration").value, 10),
        include_sunrise: includeSunrise.checked,
        include_sunset: includeSunset.checked,
        sunrise_title: $("sunrise_title").value || "Sunrise",
        sunset_title: $("sunset_title").value || "Sunset",
    };

    if (new Date(payload.end_date) < new Date(payload.start_date)) {
        setText("formStatus", "End date must be on or after start date.");
        return;
    }

    try {
        setText("formStatus", "Generating…");

        const res = await fetch("/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        if (!res.ok) {
            const text = await res.text();
            throw new Error(text || `HTTP ${res.status}`);
        }

        const blob = await res.blob();
        await downloadIcs(blob, "sun-events.ics");
        setText("formStatus", "Downloaded.");
    } catch (err) {
        setText("formStatus", `Failed: ${err.message}`);
    }
});
