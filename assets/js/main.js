"use strict";

/* =========================
   Element references
========================= */
const gridEl = document.getElementById("listingsGrid");
const resultsCountEl = document.getElementById("resultsCount");
const errorBoxEl = document.getElementById("errorBox");

// Filter UI (must exist on listings.html)
const filtersFormEl = document.getElementById("filtersForm");
const applyFiltersBtnEl = document.getElementById("applyFiltersBtn");
const clearFiltersBtnEl = document.getElementById("clearFiltersBtn");

const petsDogsEl = document.getElementById("petsDogs");
const petsCatsEl = document.getElementById("petsCats");
const petsExoticsEl = document.getElementById("petsExotics");
const petsBarnEl = document.getElementById("petsBarn");

const dogSmallEl = document.getElementById("dogSmall");
const dogMediumEl = document.getElementById("dogMedium");
const dogLargeEl = document.getElementById("dogLarge");
const dogWeightEl = document.getElementById("dogWeight");

const exoticsTypesBoxEl = document.getElementById("exoticsTypesBox");
const exBirdsEl = document.getElementById("exBirds");
const exFerretsEl = document.getElementById("exFerrets");
const exRabbitsEl = document.getElementById("exRabbits");
const exReptilesEl = document.getElementById("exReptiles");
const exInsectsEl = document.getElementById("exInsects");

const amenityFencedYardEl = document.getElementById("amenityFencedYard");
const amenityWasherDryerEl = document.getElementById("amenityWasherDryer");
const amenityGarageEl = document.getElementById("amenityGarage");
const amenityGymEl = document.getElementById("amenityGym");
const amenityPoolEl = document.getElementById("amenityPool");

const hoaYesEl = document.getElementById("hoaYes");
const hoaNoEl = document.getElementById("hoaNo");

const petFeeMaxEl = document.getElementById("petFeeMax");


/* =========================
   App state
========================= */
let allListings = [];

/* =========================
   Helpers
========================= */
function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function showError(message) {
  if (!errorBoxEl) return;
  errorBoxEl.textContent = message;
  errorBoxEl.classList.remove("d-none");
}

function clearError() {
  if (!errorBoxEl) return;
  errorBoxEl.textContent = "";
  errorBoxEl.classList.add("d-none");
}

function textIncludes(haystack, needle) {
  return String(haystack || "")
    .toLowerCase()
    .includes(String(needle || "").toLowerCase());
}

function formatPricing(pricing) {
  if (!pricing || typeof pricing.amount !== "number" || !pricing.type) {
    return "Price unavailable";
  }

  const amount = pricing.amount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  });

  const label =
    pricing.type === "monthly" ? "month" :
    pricing.type === "nightly" ? "night" :
    pricing.type;

  return `${amount} / ${label}`;
}

function petBadges(petPolicy) {
  const p = petPolicy || {};
  const badges = [];

  if (p.dogsAllowed) badges.push(`<span class="badge text-bg-success me-1">Dogs</span>`);
  if (p.catsAllowed) badges.push(`<span class="badge text-bg-success me-1">Cats</span>`);
  if (p.exoticsAllowed) badges.push(`<span class="badge text-bg-success me-1">Exotics</span>`);
  if (p.barnAnimalsAllowed) badges.push(`<span class="badge text-bg-success me-1">Barn</span>`);

  if (badges.length === 0) {
    return `<span class="badge text-bg-secondary">No pets</span>`;
  }

  return badges.join("");
}

function listingCard(listing) {
  const title = escapeHtml(listing.title || "Untitled listing");
  const city = escapeHtml(listing.city || "");
  const state = escapeHtml(listing.state || "");
  const type = escapeHtml(listing.type || "");

  const beds = Number.isFinite(listing.bedrooms) ? `${listing.bedrooms} bd` : "";
  const baths = Number.isFinite(listing.bathrooms) ? `${listing.bathrooms} ba` : "";
  const meta = [beds, baths].filter(Boolean).join(" • ");

  const pricingText = formatPricing(listing.pricing);
  const badgesHtml = petBadges(listing.petPolicy);

  const imgSrc = (Array.isArray(listing.images) && listing.images.length > 0)
    ? listing.images[0]
    : "";

  const imgTag = imgSrc
    ? `<img src="${escapeHtml(imgSrc)}" class="card-img-top" alt="${title}">`
    : `<div class="bg-light d-flex align-items-center justify-content-center" style="height:180px;">
         <span class="text-muted">No image</span>
       </div>`;

  return `
    <div class="col-12 col-md-6 col-xl-4">
      <div class="card h-100">
        ${imgTag}
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-start gap-2">
            <h2 class="h6 mb-1">${title}</h2>
            <span class="badge text-bg-light border">${type}</span>
          </div>

          <div class="text-muted small mb-2">
            ${city}${city && state ? ", " : ""}${state}${meta ? ` • ${meta}` : ""}
          </div>

          <div class="fw-semibold mb-2">${pricingText}</div>

          <div class="mb-2">${badgesHtml}</div>

          <a class="btn btn-sm btn-outline-primary" href="details.html?id=${encodeURIComponent(listing.id)}">
            View details
          </a>
        </div>
      </div>
    </div>
  `;
}

function renderListings(listings) {
  if (!gridEl || !resultsCountEl) return;

  gridEl.innerHTML = listings.map(listingCard).join("");
  resultsCountEl.textContent = `Showing ${listings.length} result${listings.length === 1 ? "" : "s"}`;
}

function getCheckedValues(selector) {
  return Array.from(document.querySelectorAll(selector))
    .filter(el => el.checked)
    .map(el => el.value);
}

/* =========================
   Filters
========================= */
function readFilters() {
  const urlParams = new URLSearchParams(window.location.search);
  const locationQuery = (urlParams.get("location") || "").trim();

  const types = getCheckedValues('input[name="type"]');

  const dogSizes = [];
  if (dogSmallEl?.checked) dogSizes.push("small");
  if (dogMediumEl?.checked) dogSizes.push("medium");
  if (dogLargeEl?.checked) dogSizes.push("large");

  const weightVal = dogWeightEl ? Number(dogWeightEl.value) : NaN;
  const dogWeight = Number.isFinite(weightVal) && weightVal > 0 ? weightVal : null;

  const exoticsTypes = [];
  if (exBirdsEl?.checked) exoticsTypes.push("birds");
  if (exFerretsEl?.checked) exoticsTypes.push("ferrets");
  if (exRabbitsEl?.checked) exoticsTypes.push("rabbits");
  if (exReptilesEl?.checked) exoticsTypes.push("reptiles");
  if (exInsectsEl?.checked) exoticsTypes.push("insects");

  const amenities = [];
  if (amenityFencedYardEl?.checked) amenities.push("Fenced Yard");
  if (amenityWasherDryerEl?.checked) amenities.push("Washer/Dryer");
  if (amenityGarageEl?.checked) amenities.push("Garage");
  if (amenityGymEl?.checked) amenities.push("Gym");
  if (amenityPoolEl?.checked) amenities.push("Pool");

  const hoa = [];
  if (hoaYesEl?.checked) hoa.push(true);
  if (hoaNoEl?.checked) hoa.push(false);

  const petFeeMaxVal = petFeeMaxEl ? Number(petFeeMaxEl.value) : NaN;
  const petFeeMax = Number.isFinite(petFeeMaxVal) && petFeeMaxVal >= 0 ? petFeeMaxVal : null;

  return {
    locationQuery,
    types,
    dogsAllowed: !!petsDogsEl?.checked,
    catsAllowed: !!petsCatsEl?.checked,
    exoticsAllowed: !!petsExoticsEl?.checked,
    barnAllowed: !!petsBarnEl?.checked,
    dogSizes,
    dogWeight,
    exoticsTypes,
    amenities,
    hoa,
    petFeeMax
  };
}

function passesFilters(listing, f) {
  // Location query (from URL/home/nav)
  if (f.locationQuery) {
    const hay = `${listing.title || ""} ${listing.city || ""} ${listing.state || ""}`;
    if (!textIncludes(hay, f.locationQuery)) return false;
  }

  // Property type
  if (f.types.length > 0 && !f.types.includes(listing.type)) return false;

  const p = listing.petPolicy || {};

  // Pet toggles
  if (f.dogsAllowed && !p.dogsAllowed) return false;
  if (f.catsAllowed && !p.catsAllowed) return false;
  if (f.exoticsAllowed && !p.exoticsAllowed) return false;
  if (f.barnAllowed && !p.barnAnimalsAllowed) return false;

  // Dog sizes: listing must allow at least one selected size
  if (f.dogSizes.length > 0) {
    const allowedSizes = Array.isArray(p.dogSizesAllowed) ? p.dogSizesAllowed : [];
    const matchesAny = f.dogSizes.some(size => allowedSizes.includes(size));
    if (!matchesAny) return false;
  }

  // Exotics types: listing must allow at least one selected type
  if (f.exoticsTypes.length > 0) {
    const allowedTypes = Array.isArray(p.exoticsTypesAllowed) ? p.exoticsTypesAllowed : [];
    const matchesAny = f.exoticsTypes.some(type => allowedTypes.includes(type));
    if (!matchesAny) return false;
  }

  // Dog weight: listing must allow at least requested weight (or no limit)
  if (f.dogWeight !== null) {
    const maxW = p.dogMaxWeight;

    // if maxW is null => no limit => pass
    if (maxW === null) return true;

    // if maxW is a number => must be >= requested
    if (typeof maxW === "number") {
      if (maxW < f.dogWeight) return false;
    } else {
      return false;
    }
  }

  // Amenities: listing must have all selected amenities
  if (f.amenities.length > 0) {
    const listingAmenities = Array.isArray(listing.amenities) ? listing.amenities : [];
    const hasAll = f.amenities.every(amenity => listingAmenities.includes(amenity));
    if (!hasAll) return false;
  }

  // HOA
  if (f.hoa.length > 0) {
    const listingHoa = listing.hoa;
    if (!f.hoa.includes(listingHoa)) return false;
  }

  // Pet fee max
  if (f.petFeeMax !== null) {
    const fee = p.monthlyPetRent;
    if (typeof fee === "number" && fee > f.petFeeMax) return false;
  }

  return true;
}

function applyFilters() {
  clearError();
  const f = readFilters();
  const filtered = allListings.filter(listing => passesFilters(listing, f));
  renderListings(filtered);
}

function clearFilters() {
  clearError();
  if (filtersFormEl) filtersFormEl.reset();

  // Keep location filter from URL active even when clearing the UI
  applyUrlFiltersToUI();
  applyFilters();
}

function wireUpFilters() {
  if (applyFiltersBtnEl) applyFiltersBtnEl.addEventListener("click", applyFilters);
  if (clearFiltersBtnEl) clearFiltersBtnEl.addEventListener("click", clearFilters);

  function syncExoticsTypesVisibility() {
    const show = !!petsExoticsEl?.checked;
    if (!exoticsTypesBoxEl) return;

    exoticsTypesBoxEl.classList.toggle("d-none", !show);

    if (!show) {
      [exBirdsEl, exFerretsEl, exRabbitsEl, exReptilesEl, exInsectsEl].forEach(el => {
        if (el) el.checked = false;
      });
    }
  }

  petsExoticsEl?.addEventListener("change", syncExoticsTypesVisibility);
  syncExoticsTypesVisibility();

  // Optional auto-apply:
  // filtersFormEl?.addEventListener("change", applyFilters);
}

/* =========================
   NEW: Apply URL filters to sidebar UI
========================= */
function applyUrlFiltersToUI() {
  const params = new URLSearchParams(window.location.search);

  // listingType: rental / vacation / both
  const listingType = params.get("listingType");
  if (listingType === "vacation") {
    const vacationCb = document.getElementById("typeVacation");
    if (vacationCb) vacationCb.checked = true;

    ["typeApartment", "typeHouse", "typeTownhome"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.checked = false;
    });
  } else if (listingType === "rental") {
    const vacationCb = document.getElementById("typeVacation");
    if (vacationCb) vacationCb.checked = false;
  }

  // petType
  const petType = params.get("petType");
  if (petType === "dog" && petsDogsEl) petsDogsEl.checked = true;
  if (petType === "cat" && petsCatsEl) petsCatsEl.checked = true;
  if (petType === "exotics" && petsExoticsEl) petsExoticsEl.checked = true;
  if (petType === "barn" && petsBarnEl) petsBarnEl.checked = true;

  // petWeight -> dogWeight input
  const petWeight = params.get("petWeight");
  if (petWeight && dogWeightEl) dogWeightEl.value = petWeight;

  // amenities
  const amenities = (params.get("amenities") || "")
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);

  if (amenities.includes("Fenced Yard") && amenityFencedYardEl) amenityFencedYardEl.checked = true;
  if (amenities.includes("Washer/Dryer") && amenityWasherDryerEl) amenityWasherDryerEl.checked = true;
  if (amenities.includes("Garage") && amenityGarageEl) amenityGarageEl.checked = true;
  if (amenities.includes("Gym") && amenityGymEl) amenityGymEl.checked = true;
  if (amenities.includes("Pool") && amenityPoolEl) amenityPoolEl.checked = true;

  // show exotics sub-box if needed
  const showExotics = !!petsExoticsEl?.checked;
  if (exoticsTypesBoxEl) exoticsTypesBoxEl.classList.toggle("d-none", !showExotics);
}

// Handle navbar search form
const navbarSearchFormEl = document.getElementById("navbarSearchForm");
if (navbarSearchFormEl) {
  navbarSearchFormEl.addEventListener("submit", (e) => {
    e.preventDefault();
    const query = document.getElementById("navbarSearch").value.trim();
    if (query) {
      window.location.href = `listings.html?location=${encodeURIComponent(query)}`;
    }
  });
}

/* =========================
   Load JSON + init
========================= */
async function loadListings() {
  try {
    clearError();
    if (resultsCountEl) resultsCountEl.textContent = "Loading…";

    const res = await fetch("data/listings.json", { cache: "no-store" });
    if (!res.ok) throw new Error(`Could not load data/listings.json (HTTP ${res.status})`);

    const data = await res.json();
    if (!Array.isArray(data)) throw new Error("listings.json must be an array: [ { ... }, { ... } ]");

    allListings = data;
    renderListings(allListings);
    wireUpFilters();

    // NEW: Pre-apply URL filters and auto-filter results
    applyUrlFiltersToUI();
    applyFilters();
  } catch (err) {
    if (resultsCountEl) resultsCountEl.textContent = "";
    showError(
      `Error loading listings.\n` +
      `Common causes:\n` +
      `• You opened the HTML file directly (use Live Server)\n` +
      `• Wrong path to data/listings.json\n` +
      `• JSON syntax error\n\n` +
      `Details: ${err.message}`
    );
    console.error(err);
  }
}

loadListings();