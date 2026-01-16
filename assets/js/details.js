"use strict";

const titleEl = document.getElementById("title");
const locationEl = document.getElementById("location");
const priceEl = document.getElementById("price");
const typeEl = document.getElementById("type");
const errorBoxEl = document.getElementById("errorBox");

const mainImageWrapEl = document.getElementById("mainImageWrap");
const thumbsEl = document.getElementById("thumbs");

const overviewEl = document.getElementById("overview");
const petPolicyEl = document.getElementById("petPolicy");
const amenitiesEl = document.getElementById("amenities");
const descriptionEl = document.getElementById("description");

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function showError(message) {
  errorBoxEl.textContent = message;
  errorBoxEl.classList.remove("d-none");
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

function petRow(label, value) {
  return `
    <div class="d-flex justify-content-between border-bottom py-2">
      <span class="text-muted">${escapeHtml(label)}</span>
      <span class="fw-semibold">${escapeHtml(value)}</span>
    </div>
  `;
}

function yesNo(val) {
  return val ? "Yes" : "No";
}

function renderImages(images, title) {
  const safeTitle = escapeHtml(title);

  if (!Array.isArray(images) || images.length === 0) {
    mainImageWrapEl.innerHTML = `
      <div class="d-flex w-100 h-100 align-items-center justify-content-center">
        <span class="text-muted">No image available</span>
      </div>
    `;
    thumbsEl.innerHTML = "";
    return;
  }

  // main image
  const first = images[0];
  mainImageWrapEl.innerHTML = `<img src="${escapeHtml(first)}" alt="${safeTitle}" class="w-100 h-100 object-fit-cover">`;

  // thumbnails
  thumbsEl.innerHTML = images.map((src, idx) => {
    return `
      <button type="button" class="btn btn-outline-secondary p-0" style="width:72px;height:48px;overflow:hidden"
        data-src="${escapeHtml(src)}" aria-label="View image ${idx + 1}">
        <img src="${escapeHtml(src)}" alt="${safeTitle} thumbnail ${idx + 1}" class="w-100 h-100 object-fit-cover">
      </button>
    `;
  }).join("");

  // click behavior
  thumbsEl.querySelectorAll("button[data-src]").forEach(btn => {
    btn.addEventListener("click", () => {
      const src = btn.getAttribute("data-src");
      mainImageWrapEl.innerHTML = `<img src="${src}" alt="${safeTitle}" class="w-100 h-100 object-fit-cover">`;
    });
  });
}

function renderListing(listing) {
  const title = listing.title || "Untitled listing";
  const city = listing.city || "";
  const state = listing.state || "";

  titleEl.textContent = title;
  locationEl.textContent = `${city}${city && state ? ", " : ""}${state}`;

  priceEl.textContent = formatPricing(listing.pricing);
  typeEl.textContent = (listing.type || "").toUpperCase();

  const beds = Number.isFinite(listing.bedrooms) ? `${listing.bedrooms} bedrooms` : "— bedrooms";
  const baths = Number.isFinite(listing.bathrooms) ? `${listing.bathrooms} bathrooms` : "— bathrooms";
  const sqft = Number.isFinite(listing.sqft) ? `${listing.sqft.toLocaleString()} sq ft` : "— sq ft";
  overviewEl.textContent = `${beds} • ${baths} • ${sqft}`;

  // pet policy
  const p = listing.petPolicy || {};
  const dogSizes = Array.isArray(p.dogSizesAllowed) ? p.dogSizesAllowed.join(", ") : "—";
  const dogMax = (p.dogMaxWeight === null) ? "No limit" :
                 (typeof p.dogMaxWeight === "number") ? `${p.dogMaxWeight} lbs` : "—";

  const exoticsTypes = Array.isArray(p.exoticsTypesAllowed) && p.exoticsTypesAllowed.length > 0
    ? p.exoticsTypesAllowed.join(", ")
    : "—";

  const deposit = (typeof p.petDeposit === "number") ? `$${p.petDeposit}` : "—";
  const petRent = (typeof p.monthlyPetRent === "number") ? `$${p.monthlyPetRent}/mo` : "—";

  petPolicyEl.innerHTML = `
    ${petRow("Dogs allowed", yesNo(!!p.dogsAllowed))}
    ${petRow("Dog sizes", p.dogsAllowed ? dogSizes : "N/A")}
    ${petRow("Dog max weight", p.dogsAllowed ? dogMax : "N/A")}
    ${petRow("Cats allowed", yesNo(!!p.catsAllowed))}
    ${petRow("Exotics allowed", yesNo(!!p.exoticsAllowed))}
    ${petRow("Exotics types", p.exoticsAllowed ? exoticsTypes : "N/A")}
    ${petRow("Barn animals allowed", yesNo(!!p.barnAnimalsAllowed))}
    ${petRow("Pet deposit", deposit)}
    ${petRow("Monthly pet rent", petRent)}
  `;

  // amenities
  if (Array.isArray(listing.amenities) && listing.amenities.length > 0) {
    amenitiesEl.innerHTML = listing.amenities
      .map(a => `<li>${escapeHtml(a)}</li>`)
      .join("");
  } else {
    amenitiesEl.innerHTML = `<li class="text-muted">No amenities listed.</li>`;
  }

  descriptionEl.textContent = listing.description || "No description provided.";

  renderImages(listing.images, title);
}

function getIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const idStr = params.get("id");
  if (!idStr) return null;

  const idNum = Number(idStr);
  return Number.isFinite(idNum) ? idNum : null;
}

async function loadDetails() {
  try {
    const id = getIdFromUrl();
    if (id === null) throw new Error("Missing or invalid listing id in URL. Example: details.html?id=1");

    const res = await fetch("data/listings.json", { cache: "no-store" });
    if (!res.ok) throw new Error(`Could not load data/listings.json (HTTP ${res.status})`);

    const listings = await res.json();
    if (!Array.isArray(listings)) throw new Error("listings.json must be an array.");

    const listing = listings.find(x => x.id === id);
    if (!listing) throw new Error(`No listing found with id=${id}`);

    renderListing(listing);
  } catch (err) {
    showError(
      `Could not load listing details.\n` +
      `Common causes: Live Server not running, wrong paths, JSON error.\n\n` +
      `Details: ${err.message}`
    );
    console.error(err);
    titleEl.textContent = "Listing not found";
  }
}

loadDetails();
