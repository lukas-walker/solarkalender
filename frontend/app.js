// ---------- Helpers ----------
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

// Close when clicking outside the modal
modalBackdrop.addEventListener("click", (e) => {
    if (e.target === modalBackdrop) closeModal();
});

// Close on Escape
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modalBackdrop.classList.contains("hidden")) closeModal();
});

// ---------- Nominatim Search ----------
const searchBtn = $("searchBtn");
const qInput = $("q");
const resultsDiv = $("results");

async function nominatimSearch(query) {
    // Public Nominatim endpoint. Respect rate limiting: keep requests user-initiated.
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("q", query);
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("limit", "5");
    url.searchParams.set("addressdetails", "1");

    const res = await fetch(url.toString(), {
        headers: {
            // Nominatim strongly prefers an identifying UA; browsers restrict UA header,
            // but Referer + default headers are typically accepted for small usage.
            "Accept": "application/json"
        }
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
            $("lat").value = item.lat;
            $("lon").value = item.lon;
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

    const lat = $("lat").value.trim();
    const lon = $("lon").value.trim();
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

    // Basic date sanity check (frontend)
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