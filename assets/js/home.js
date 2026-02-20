"use strict";

const featuredGridEl = document.getElementById("featuredGrid");
const featuredCountEl = document.getElementById("featuredCount");
const featuredErrorEl = document.getElementById("featuredError");

const searchFormEl = document.getElementById("searchForm");
const navbarSearchFormEl = document.getElementById("navbarSearchForm");

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function showError(message) {
  featuredErrorEl.textContent = message;
  featuredErrorEl.classList.remove("d-none");
}

function formatPricing(pricing) {
  if (!pricing || typeof pricing.amount !== "number" || !pricing.type) return "Price unavailable";

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

function petBadges(p) {
  p = p || {};
  const badges = [];
  if (p.dogsAllowed) badges.push(`<span class="badge text-bg-success me-1">Dogs</span>`);
  if (p.catsAllowed) badges.push(`<span class="badge text-bg-success me-1">Cats</span>`);
  if (p.exoticsAllowed) badges.push(`<span class="badge text-bg-success me-1">Exotics</span>`);
  if (p.barnAnimalsAllowed) badges.push(`<span class="badge text-bg-success me-1">Barn</span>`);
  return badges.length ? badges.join("") : `<span class="badge text-bg-secondary">No pets</span>`;
}

function card(listing) {
  const title = escapeHtml(listing.title || "Untitled listing");
  const city = escapeHtml(listing.city || "");
  const state = escapeHtml(listing.state || "");
  const type = escapeHtml(listing.type || "");
  const pricingText = formatPricing(listing.pricing);

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
            <h3 class="h6 mb-1">${title}</h3>
            <span class="badge text-bg-light border">${type}</span>
          </div>
          <div class="text-muted small mb-2">${city}${city && state ? ", " : ""}${state}</div>
          <div class="fw-semibold mb-2">${pricingText}</div>
          <div class="mb-2">${petBadges(listing.petPolicy)}</div>
          <a class="btn btn-sm btn-outline-primary" href="details.html?id=${encodeURIComponent(listing.id)}">View details</a>
        </div>
      </div>
    </div>
  `;
}

async function loadFeatured() {
  try {
    featuredCountEl.textContent = "Loading…";
    const res = await fetch("data/listings.json", { cache: "no-store" });
    if (!res.ok) throw new Error(`Could not load data/listings.json (HTTP ${res.status})`);

    const listings = await res.json();
    if (!Array.isArray(listings)) throw new Error("listings.json must be an array.");

    const featured = listings.slice(0, 3);

    featuredGridEl.innerHTML = featured.map(card).join("");
    featuredCountEl.textContent = `Showing ${featured.length} featured`;
  } catch (err) {
    featuredCountEl.textContent = "";
    showError(
      `Could not load featured listings.\n` +
      `Common causes: Live Server not running, wrong file paths, JSON error.\n\n` +
      `Details: ${err.message}`
    );
    console.error(err);
  }
}

loadFeatured();

/* =========================
   UPDATED: Handle hero search form
========================= */
function getCheckedAmenityValues() {
  return ["aFencedYard", "aWasherDryer", "aGarage", "aGym", "aPool"]
    .map(id => document.getElementById(id))
    .filter(el => el && el.checked)
    .map(el => el.value);
}

if (searchFormEl) {
  searchFormEl.addEventListener("submit", (e) => {
    e.preventDefault();

    const location = document.getElementById("location").value.trim();
    const distance = document.getElementById("distance").value;

    const listingType =
      document.querySelector('input[name="listingType"]:checked')?.value || "both";

    const petType = document.getElementById("petType").value;
    const petWeight = document.getElementById("petWeight").value.trim();
    const amenities = getCheckedAmenityValues();

    if (!location) return;

    const params = new URLSearchParams();
    params.set("location", location);
    params.set("distance", distance);
    params.set("listingType", listingType);

    if (petType && petType !== "any") params.set("petType", petType);
    if (petWeight) params.set("petWeight", petWeight);
    if (amenities.length) params.set("amenities", amenities.join(","));

    window.location.href = `listings.html?${params.toString()}`;
  });
}

// Handle navbar search form
if (navbarSearchFormEl) {
  navbarSearchFormEl.addEventListener("submit", (e) => {
    e.preventDefault();
    const query = document.getElementById("navbarSearch").value.trim();
    if (query) {
      window.location.href = `listings.html?location=${encodeURIComponent(query)}`;
    }
  });
}