
import {
  onAuthStateChanged,
  signOut,
  updateProfile
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

import { auth } from "./firebase-config.js";

const ADMIN_UID = "wWuBEmlsaofgjAaQi7bfblsX6L62";

const adminAvatar = document.getElementById("adminAvatar");
const adminAvatarFallback = document.getElementById("adminAvatarFallback");
const adminAccountToggle = document.getElementById("adminAccountToggle");
const adminAccountMenu = document.getElementById("adminAccountMenu");
const adminProfileDialog = document.getElementById("adminProfileDialog");
const adminProfileForm = document.getElementById("adminProfileForm");
const adminProfileMessage = document.getElementById("adminProfileMessage");
const editAdminProfileButton = document.getElementById("editAdminProfileButton");
const saveAdminProfileButton = document.getElementById("saveAdminProfileButton");
const dashboardMessage = document.getElementById("dashboardMessage");
const logoutButton = document.getElementById("logoutButton");
const welcomeCard = document.querySelector(".welcome-card");
const dashboardGrid = document.querySelector(".dashboard-grid");
const dashboardSidebarToggle = document.getElementById("dashboardSidebarToggle");
const dashboardContainer = document.querySelector(".dashboard-container");
const dashboardSections = [...document.querySelectorAll(".dashboard-section")];
let currentAdmin = null;
const displayNameInput = document.getElementById("adminDisplayNameInput");
const photoUrlInput = document.getElementById("adminPhotoUrlInput");

function renderAdminProfile(user) {
  const profileLabel = user.displayName || user.email || "অ্যাডমিন";
  adminAvatarFallback.textContent = Array.from(profileLabel.trim())[0]?.toLocaleUpperCase() || "অ";
  adminAvatar.hidden = true;
  adminAvatarFallback.hidden = false;

  if (!user.photoURL) {
    adminAvatar.removeAttribute("src");
    return;
  }

  adminAvatar.onload = () => {
    adminAvatar.hidden = false;
    adminAvatarFallback.hidden = true;
  };
  adminAvatar.onerror = () => {
    adminAvatar.hidden = true;
    adminAvatarFallback.hidden = false;
  };
  adminAvatar.src = user.photoURL;
}

function closeAdminAccountMenu() {
  adminAccountMenu.hidden = true;
  adminAccountToggle.setAttribute("aria-expanded", "false");
}

adminAccountToggle.addEventListener("click", () => {
  const isOpening = adminAccountMenu.hidden;
  adminAccountMenu.hidden = !isOpening;
  adminAccountToggle.setAttribute("aria-expanded", String(isOpening));
});

document.addEventListener("click", (event) => {
  if (!event.target.closest(".admin-account")) closeAdminAccountMenu();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeAdminAccountMenu();
});

function normalizePhotoUrl(value) {
  const raw = value.trim();
  if (!raw) return "";
  const parsed = new URL(raw);
  if (parsed.protocol !== "https:") {
    throw new Error("ছবির লিংক https:// দিয়ে শুরু হতে হবে।");
  }
  const driveId = parsed.pathname.match(/\/file\/d\/([^/]+)/)?.[1]
    || parsed.searchParams.get("id");
  if (parsed.hostname.endsWith("google.com") && driveId) {
    return `https://drive.google.com/uc?export=view&id=${encodeURIComponent(driveId)}`;
  }
  return parsed.href;
}

editAdminProfileButton.addEventListener("click", () => {
  if (!currentAdmin) return;
  closeAdminAccountMenu();
  displayNameInput.value = currentAdmin.displayName || "";
  photoUrlInput.value = currentAdmin.photoURL || "";
  adminProfileMessage.textContent = "";
  adminProfileMessage.classList.remove("is-error");
  adminProfileDialog.showModal();
});

document.getElementById("closeAdminProfileButton").addEventListener("click", () => {
  adminProfileDialog.close();
});

adminProfileDialog.addEventListener("click", (event) => {
  if (event.target === adminProfileDialog) adminProfileDialog.close();
});

adminProfileForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!currentAdmin) return;
  const displayName = displayNameInput.value.trim();
  let photoURL;
  try {
    photoURL = normalizePhotoUrl(photoUrlInput.value);
  } catch (error) {
    adminProfileMessage.textContent = error.message.toUpperCase();
    adminProfileMessage.classList.add("is-error");
    return;
  }
  if (!displayName) {
    adminProfileMessage.textContent = "নাম লিখুন।";
    adminProfileMessage.classList.add("is-error");
    return;
  }

  saveAdminProfileButton.disabled = true;
  adminProfileMessage.classList.remove("is-error");
  adminProfileMessage.textContent = "প্রোফাইল সংরক্ষণ হচ্ছে...";
  try {
    await updateProfile(currentAdmin, { displayName, photoURL: photoURL || null });
    renderAdminProfile(currentAdmin);
    adminProfileMessage.textContent = "প্রোফাইল হালনাগাদ হয়েছে।";
    window.setTimeout(() => adminProfileDialog.close(), 500);
  } catch (error) {
    console.error("অ্যাডমিন প্রোফাইল হালনাগাদের সমস্যা:", error);
    adminProfileMessage.textContent = "প্রোফাইল সংরক্ষণ করা যায়নি। আবার চেষ্টা করুন।";
    adminProfileMessage.classList.add("is-error");
  } finally {
    saveAdminProfileButton.disabled = false;
  }
});

function showDashboardHome() {
  welcomeCard.hidden = false;
  dashboardGrid.hidden = false;
  dashboardMessage.hidden = false;
  dashboardSections.forEach((section) => { section.hidden = true; });
  dashboardGrid.querySelectorAll(".dashboard-card").forEach((card) => {
    card.removeAttribute("aria-current");
  });
  history.replaceState(null, "", `${location.pathname}${location.search}`);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function showDashboardSection(sectionId) {
  const selectedSection = dashboardSections.find((section) => section.id === sectionId);
  if (!selectedSection) return;
  const selectedCard = [...dashboardGrid.querySelectorAll(".dashboard-card")]
    .find((card) => card.hash === `#${sectionId}`);

  welcomeCard.hidden = true;
  dashboardGrid.hidden = false;
  dashboardMessage.hidden = true;
  dashboardSections.forEach((section) => {
    section.hidden = section !== selectedSection;
  });
  dashboardGrid.querySelectorAll(".dashboard-card").forEach((card) => {
    if (card.hash === `#${sectionId}`) card.setAttribute("aria-current", "page");
    else card.removeAttribute("aria-current");
  });

  const heading = selectedSection.querySelector("h2");
  heading.classList.add("module-title");
  if (selectedCard && !heading.querySelector(".module-title-icon")) {
    const icon = document.createElement("span");
    icon.className = "module-title-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = selectedCard.querySelector(".card-icon")?.textContent.trim() || "";
    heading.prepend(icon);
  }

  if (!selectedSection.querySelector(".module-back-button")) {
    const backButton = document.createElement("button");
    backButton.type = "button";
    backButton.className = "module-back-button";
    backButton.textContent = "← ড্যাশবোর্ডে ফিরুন";
    backButton.addEventListener("click", showDashboardHome);
    selectedSection.prepend(backButton);
  }

  history.replaceState(null, "", `#${sectionId}`);
  selectedSection.scrollIntoView({ behavior: "smooth", block: "start" });
}

dashboardGrid.addEventListener("click", (event) => {
  const card = event.target.closest(".dashboard-card");
  if (!card) return;
  event.preventDefault();
  showDashboardSection(card.hash.slice(1));
});

dashboardGrid.querySelectorAll(".dashboard-card").forEach((item) => {
  item.title = item.querySelector("h3")?.textContent.trim() || "";
});

dashboardSidebarToggle.addEventListener("click", () => {
  const isCollapsed = dashboardGrid.classList.toggle("is-collapsed");
  dashboardContainer.classList.toggle("is-sidebar-collapsed", isCollapsed);
  const label = isCollapsed ? "মেনু খুলুন" : "মেনু গুটান";
  dashboardSidebarToggle.setAttribute("aria-expanded", String(!isCollapsed));
  dashboardSidebarToggle.setAttribute("aria-label", `সাইড মেনু ${label}`);
  dashboardSidebarToggle.title = `সাইড মেনু ${label}`;
});

const initialSectionId = location.hash.slice(1);
if (initialSectionId) showDashboardSection(initialSectionId);

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.replace("admin.html");
    return;
  }

  if (user.uid !== ADMIN_UID) {
    await signOut(auth);
    window.location.replace("admin.html");
    return;
  }

  currentAdmin = user;
  renderAdminProfile(user);
  dashboardMessage.textContent = "অ্যাডমিন হিসেবে যাচাই সম্পন্ন হয়েছে।";
});

logoutButton.addEventListener("click", async () => {
  logoutButton.disabled = true;
  closeAdminAccountMenu();

  try {
    await signOut(auth);
    window.location.replace("admin.html");
  } catch (error) {
    dashboardMessage.textContent = "লগআউট করা যায়নি। আবার চেষ্টা করুন।";
    logoutButton.disabled = false;
  }
});
