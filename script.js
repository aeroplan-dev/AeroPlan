/* SECTION SWITCHING */
function showSection(id) {
  document.querySelectorAll(".page").forEach(sec =>
    sec.classList.add("hidden")
  );
  document.getElementById(id).classList.remove("hidden");

  if (id === "livemap" && !window.mapLoaded) {
    initLiveMap();
    window.mapLoaded = true;
  }
}

/* ===== GALLERY ===== */
const galleryImages = [
  { src: "images/A400M Landing.jpg", caption: "A400M Takeoff" },
  { src: "images/Miltary Helicopter Rescue.jpg", caption: "Military Rescue Helicopter" },
  { src: "images/NOZ B737 Landing ENGM.jpg", caption: "NOZ B737 Landing ENGM" },
  { src: "images/Silkway B747 Landing ENGM.jpg", caption: "Silkway B747 Landing ENGM" }
];

function loadGallery() {
  const grid = document.getElementById("galleryGrid");
  if (!grid) return;
  grid.innerHTML = "";

  galleryImages.forEach(img => {
    const item = document.createElement("div");
    item.className = "gallery-item";
    item.innerHTML = `<span>${img.caption}</span>`;
    item.onclick = () => openImage(img.src, img.caption);
    grid.appendChild(item);
  });
}

loadGallery();

function openImage(src, caption) {
  document.getElementById("modalImage").src = src;
  document.getElementById("modalCaption").innerText = caption;
  document.getElementById("imageModal").classList.remove("hidden");
}

function closeImage() {
  document.getElementById("imageModal").classList.add("hidden");
}

/* ===== FLIGHT PLANNER ===== */
const shortFlights = ["EGLL", "LFPG", "EDDF", "EHAM", "EKCH"];
const mediumFlights = ["ENGM", "ESSA", "LSZH", "LOWW"];
const longFlights = ["LEMD", "LIRF", "EFHK"];

const ultraFlights = [
  { dep: "EGLL", arr: "KJFK" },
  { dep: "EDDF", arr: "KORD" },
  { dep: "LFPG", arr: "CYUL" },
  { dep: "EHAM", arr: "KBOS" }
];

function rand(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateFlight() {
  const length = document.getElementById("length").value;
  let dep, arr;

  if (length === "ultra") {
    const f = rand(ultraFlights);
    dep = f.dep;
    arr = f.arr;
  } else {
    const pools = {
      short: shortFlights,
      medium: mediumFlights,
      long: longFlights
    };
    dep = rand(pools[length]);
    arr = rand(pools[length]);
    while (dep === arr) arr = rand(pools[length]);
  }

  const simbrief =
    `https://dispatch.simbrief.com/options/custom?orig=${dep}&dest=${arr}`;

  document.getElementById("result").innerHTML = `
    <strong>✈️ Flight Generated</strong><br><br>
    <strong>Departure:</strong> ${dep}<br>
    <strong>Arrival:</strong> ${arr}<br><br>
    <a href="${simbrief}" target="_blank"
      style="display:inline-block;padding:10px 18px;
      background:#2ecc71;color:#021b10;
      border-radius:20px;text-decoration:none;font-weight:600;">
      Open in SimBrief
    </a>
  `;
}

/* ===== LIVE VATSIM MAP ===== */
function initLiveMap() {
  const map = L.map("map").setView([56, 12], 4);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap • VATSIM"
  }).addTo(map);

  function planeColor(p) {
    if (p.groundspeed < 40) return "#e74c3c";   // Ground
    if (p.altitude <= 11000) return "#2ecc71"; // FL110 or below
    return "#3498db";                          // Above
  }

  function planeIcon(color, heading) {
    const rotation = (heading ?? 0) - 90; // FIXED HEADING

    return L.divIcon({
      html: `
        <svg width="26" height="26" viewBox="0 0 24 24"
          style="transform: rotate(${rotation}deg); transform-origin: center;">
          <path fill="${color}"
            d="M2 16l20-4-20-4v3l14 1-14 1z"/>
        </svg>
      `,
      className: "",
      iconSize: [26, 26],
      iconAnchor: [13, 13]
    });
  }

  async function loadTraffic() {
    const res = await fetch("https://data.vatsim.net/v3/vatsim-data.json");
    const data = await res.json();

    map.eachLayer(layer => {
      if (layer instanceof L.Marker) map.removeLayer(layer);
    });

    data.pilots.forEach(p => {
      if (!p.latitude || !p.longitude) return;

      if (
        p.latitude > 35 && p.latitude < 72 &&
        p.longitude > -25 && p.longitude < 40
      ) {
        L.marker(
          [p.latitude, p.longitude],
          {
            icon: planeIcon(planeColor(p), p.heading),
            zIndexOffset: 1000
          }
        )
        .addTo(map)
        .bindPopup(`
          <strong>${p.callsign}</strong><br>
          ${p.flight_plan?.departure || "----"} →
          ${p.flight_plan?.arrival || "----"}<br>
          FL${Math.round(p.altitude / 100)}
        `);
      }
    });
  }

  loadTraffic();
  setInterval(loadTraffic, 8000);
}
// ===== THEME TOGGLE =====
const themeToggle = document.getElementById("themeToggle");

// Load saved theme
if (localStorage.getItem("theme") === "light") {
  document.body.classList.add("light");
  themeToggle.textContent = "🌙";
}

themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("light");

  if (document.body.classList.contains("light")) {
    localStorage.setItem("theme", "light");
    themeToggle.textContent = "🌙";
  } else {
    localStorage.setItem("theme", "dark");
    themeToggle.textContent = "☀️";
  }
});
