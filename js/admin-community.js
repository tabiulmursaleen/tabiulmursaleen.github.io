import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import {
  collection, deleteDoc, doc, getDocs, serverTimestamp, setDoc, writeBatch
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";
import { auth, db } from "./firebase-config.js";

const ADMIN_UID = "wWuBEmlsaofgjAaQi7bfblsX6L62";
const peopleCollection = "directoryPeople";
const contentCollection = "classContents";
const galleryCollection = "galleryItems";
const $ = (id) => document.getElementById(id);
const galleryAddButton = $("addGalleryEntry");
const personTypes = {
  committee: { label: "কমিটি সদস্য", prefix: "committee" },
  teacher: { label: "শিক্ষক", prefix: "teacher" },
  staff: { label: "কর্মচারী", prefix: "staff" }
};
let currentType = "committee";
let currentGalleryType = "photo";
let people = [];
let contentItems = [];
let galleryItems = [];
let busy = false;

function say(id, text, error = false) {
  const node = $(id);
  node.textContent = text;
  node.classList.toggle("is-error", error);
}

function safeUrl(value, label = "লিংক") {
  const url = new URL(value.trim());
  if (url.protocol !== "https:") throw new Error(`${label} https:// দিয়ে শুরু হতে হবে।`);
  return url.href;
}

function drivePreview(value) {
  try {
    const url = new URL(value);
    const id = url.pathname.match(/\/file\/d\/([^/]+)/)?.[1] || url.searchParams.get("id");
    if (id && (url.hostname === "drive.google.com" || url.hostname === "drive.usercontent.google.com")) {
      return `https://drive.google.com/thumbnail?id=${encodeURIComponent(id)}&sz=w500`;
    }
  } catch { /* The original URL remains a valid fallback. */ }
  return value;
}

function personDefaults(type) {
  if (type === "teacher") return window.teachersData || [];
  if (type === "staff") return window.staffMembersData || [];
  return [];
}

function mergedPeople(type) {
  const base = personDefaults(type).map((item) => ({ ...item }));
  const overrides = people.filter((item) => item.personType === type);
  const map = new Map(base.map((item) => [item.id, item]));
  overrides.forEach((item) => item.deleted ? map.delete(item.id) : map.set(item.id, { ...map.get(item.id), ...item }));
  return [...map.values()].sort((a, b) => String(a.id).localeCompare(String(b.id), undefined, { numeric: true }));
}

function renderPeople() {
  const body = $("peopleManagementRows");
  body.replaceChildren();
  const list = mergedPeople(currentType);
  if (!list.length) {
    const row = body.insertRow();
    const cell = row.insertCell(); cell.colSpan = 4; cell.textContent = "এখনো কোনো তথ্য যোগ করা হয়নি।";
    return;
  }
  list.forEach((person) => {
    const row = body.insertRow();
    const photoCell = row.insertCell();
    if (person.photo) {
      const image = document.createElement("img");
      image.className = "management-thumbnail";
      image.src = person.photo.startsWith("http") ? drivePreview(person.photo) : person.photo;
      image.alt = "";
      image.onerror = () => { image.hidden = true; };
      photoCell.append(image);
    } else photoCell.textContent = "—";
    row.insertCell().textContent = person.name || "—";
    row.insertCell().textContent = person.designation || person.role || "—";
    const actions = row.insertCell(); actions.className = "table-actions-cell";
    const edit = document.createElement("button"); edit.type = "button"; edit.className = "table-action"; edit.textContent = "সম্পাদনা";
    edit.addEventListener("click", () => editPerson(person));
    const remove = document.createElement("button"); remove.type = "button"; remove.className = "table-action danger-action"; remove.textContent = "মুছুন";
    remove.addEventListener("click", () => removePerson(person));
    actions.append(edit, remove);
  });
}

function setPersonType(type) {
  currentType = type;
  document.querySelectorAll(".people-type-button").forEach((button) => {
    const selected = button.dataset.personType === type;
    button.classList.toggle("is-active", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
  const label = personTypes[type].label;
  $("personFormTitle").textContent = `নতুন ${label}`;
  $("peopleListTitle").textContent = `${label} তালিকা`;
  document.querySelectorAll(".person-teacher-field").forEach((field) => { field.hidden = type === "committee"; });
  clearPersonForm();
  renderPeople();
}

function clearPersonForm() {
  $("personForm").reset();
  $("personRecordId").value = "";
  $("personFormTitle").textContent = `নতুন ${personTypes[currentType].label}`;
}

function editPerson(person) {
  $("personRecordId").value = person.id;
  $("personName").value = person.name || "";
  $("personDesignation").value = person.designation || person.role || "";
  $("personSubject").value = person.subject || "";
  $("personIndex").value = person.index || "";
  $("personQualification").value = person.qualification || "";
  $("personJoiningDate").value = person.joiningDate || "";
  $("personDob").value = person.dob || "";
  $("personPhone").value = person.phone || "";
  $("personEmail").value = person.email || "";
  const photoUrl = person.photo
    ? new URL(person.photo, "https://tabiulmursaleen.github.io/").href
    : "";
  $("personPhoto").value = photoUrl;
  $("personFormTitle").textContent = `${personTypes[currentType].label} সম্পাদনা`;
  $("personForm").scrollIntoView({ behavior: "smooth", block: "start" });
}

function makePersonId() {
  const prefix = personTypes[currentType].prefix;
  const max = mergedPeople(currentType).reduce((value, item) => {
    const number = Number(String(item.id || "").match(/(\d+)$/)?.[1] || 0);
    return Math.max(value, number);
  }, 0);
  return `${prefix}-${String(max + 1).padStart(2, "0")}`;
}

$("personForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (busy) return;
  const id = $("personRecordId").value || makePersonId();
  let photo;
  try { photo = $("personPhoto").value.trim() ? safeUrl($("personPhoto").value, "ছবির লিংক") : ""; }
  catch (error) { say("peopleManagementMessage", error.message, true); return; }
  const old = mergedPeople(currentType).find((person) => person.id === id) || {};
  const record = {
    ...old, id, personType: currentType,
    name: $("personName").value.trim(),
    designation: $("personDesignation").value.trim(),
    role: $("personDesignation").value.trim(),
    subject: $("personSubject").value.trim(), index: $("personIndex").value.trim(),
    qualification: $("personQualification").value.trim(), joiningDate: $("personJoiningDate").value,
    dob: $("personDob").value, phone: $("personPhone").value.trim(), email: $("personEmail").value.trim(),
    photo, published: true, deleted: false, updatedAt: serverTimestamp()
  };
  busy = true;
  try {
    await setDoc(doc(db, peopleCollection, `${currentType}__${id}`), record, { merge: true });
    people = [...people.filter((item) => item.id !== id || item.personType !== currentType), { ...record, updatedAt: null }];
    clearPersonForm(); renderPeople(); say("peopleManagementMessage", "তথ্য সংরক্ষণ ও প্রকাশ করা হয়েছে।");
  } catch (error) {
    console.error("পরিচিতির তথ্য সংরক্ষণ হয়নি:", error);
    say("peopleManagementMessage", "তথ্য সংরক্ষণ হয়নি। Firestore Rules পরীক্ষা করুন।", true);
  } finally { busy = false; }
});

async function removePerson(person) {
  if (!window.confirm(`${person.name} — এই তথ্যটি ওয়েবসাইট থেকে সরাবেন?`)) return;
  try {
    const record = { ...person, personType: currentType, deleted: true, published: true, updatedAt: serverTimestamp() };
    await setDoc(doc(db, peopleCollection, `${currentType}__${person.id}`), record, { merge: true });
    people = [...people.filter((item) => item.id !== person.id || item.personType !== currentType), { ...record, updatedAt: null }];
    renderPeople(); say("peopleManagementMessage", "তথ্যটি ওয়েবসাইট থেকে সরানো হয়েছে।");
  } catch (error) { console.error(error); say("peopleManagementMessage", "তথ্য সরানো যায়নি। Firestore Rules পরীক্ষা করুন।", true); }
}

document.querySelectorAll(".people-type-button").forEach((button) => button.addEventListener("click", () => setPersonType(button.dataset.personType)));
$("personFormReset").addEventListener("click", clearPersonForm);

function renderContents() {
  const body = $("classContentRows"); body.replaceChildren();
  const sorted = [...contentItems].sort((a, b) => (b.updatedAt?.toMillis?.() || 0) - (a.updatedAt?.toMillis?.() || 0));
  if (!sorted.length) { const row = body.insertRow(); const cell = row.insertCell(); cell.colSpan = 5; cell.textContent = "এখনো কোনো কন্টেন্ট নেই।"; return; }
  sorted.forEach((item) => {
    const row = body.insertRow();
    row.insertCell().textContent = `${item.branch || ""} · ${item.className || ""}`;
    row.insertCell().textContent = item.subject || "—";
    row.insertCell().textContent = item.title || "—";
    row.insertCell().textContent = item.published ? "প্রকাশিত" : "অপ্রকাশিত";
    const actions = row.insertCell(); actions.className = "table-actions-cell";
    const edit = document.createElement("button"); edit.type = "button"; edit.className = "table-action"; edit.textContent = "সম্পাদনা";
    edit.addEventListener("click", () => {
      $("classContentId").value = item.id; $("classContentBranch").value = item.branch || "School";
      $("classContentClass").value = item.className || ""; $("classContentSubject").value = item.subject || "";
      $("classContentTeacher").value = item.teacherName || ""; $("classContentTitle").value = item.title || "";
      $("classContentDescription").value = item.description || ""; $("classContentUrl").value = item.driveUrl || "";
      $("classContentPublished").checked = item.published === true;
      $("classContentForm").scrollIntoView({ behavior: "smooth", block: "start" });
    });
    const remove = document.createElement("button"); remove.type = "button"; remove.className = "table-action danger-action"; remove.textContent = "মুছুন";
    remove.addEventListener("click", async () => {
      if (!window.confirm("এই কন্টেন্টটি মুছে ফেলবেন?")) return;
      try { await deleteDoc(doc(db, contentCollection, item.id)); contentItems = contentItems.filter((entry) => entry.id !== item.id); renderContents(); }
      catch (error) { console.error(error); say("classContentMessage", "কন্টেন্ট মুছতে সমস্যা হয়েছে। Firestore Rules পরীক্ষা করুন।", true); }
    });
    actions.append(edit, remove);
  });
}

$("classContentForm").addEventListener("submit", async (event) => {
  event.preventDefault(); if (busy) return;
  let driveUrl;
  try {
    driveUrl = safeUrl($("classContentUrl").value, "Google Drive লিংক");
    if (!new URL(driveUrl).hostname.match(/(^|\.)drive\.google\.com$|(^|\.)docs\.google\.com$/)) throw new Error("Google Drive-এর শেয়ার লিংক দিন।");
  } catch (error) { say("classContentMessage", error.message, true); return; }
  const id = $("classContentId").value || doc(collection(db, contentCollection)).id;
  const record = { branch: $("classContentBranch").value, className: $("classContentClass").value,
    subject: $("classContentSubject").value.trim(), teacherName: $("classContentTeacher").value.trim(),
    title: $("classContentTitle").value.trim(), description: $("classContentDescription").value.trim(),
    driveUrl, published: $("classContentPublished").checked, updatedAt: serverTimestamp() };
  busy = true;
  try {
    await setDoc(doc(db, contentCollection, id), record, { merge: true });
    contentItems = [...contentItems.filter((item) => item.id !== id), { ...record, id, updatedAt: null }];
    $("classContentForm").reset(); $("classContentId").value = ""; $("classContentPublished").checked = true;
    renderContents(); say("classContentMessage", "ক্লাস কন্টেন্ট সংরক্ষিত হয়েছে।");
  } catch (error) { console.error(error); say("classContentMessage", "কন্টেন্ট সংরক্ষণ হয়নি। Firestore Rules পরীক্ষা করুন।", true); }
  finally { busy = false; }
});
$("classContentReset").addEventListener("click", () => { $("classContentForm").reset(); $("classContentId").value = ""; $("classContentPublished").checked = true; });

function youtubeEmbed(value) {
  const url = new URL(value);
  if (url.hostname === "youtu.be") return url.pathname.slice(1);
  if (url.hostname.endsWith("youtube.com")) return url.searchParams.get("v") || url.pathname.match(/\/(?:embed|shorts|live)\/([^/]+)/)?.[1] || "";
  return "";
}

function driveFileId(value) {
  try {
    const url = new URL(value);
    return url.hostname.endsWith("drive.google.com")
      ? url.pathname.match(/\/file\/d\/([^/]+)/)?.[1] || url.searchParams.get("id") || ""
      : "";
  } catch { return ""; }
}

function directVideoUrl(value) {
  try { return /\.(?:mp4|webm|ogv|ogg|m4v)$/i.test(new URL(value).pathname); }
  catch { return false; }
}

function renderGallery() {
  const grid = $("galleryGrid"); grid.replaceChildren();
  const matching = galleryOrderForType(currentGalleryType);
  if (!matching.length) { grid.textContent = "এখনো কোনো মিডিয়া যোগ করা হয়নি।"; grid.classList.add("is-empty"); return; }
  grid.classList.remove("is-empty");
  matching.forEach((item) => {
    const card = document.createElement("article"); card.className = "gallery-admin-card"; card.draggable = true;
    card.dataset.galleryItemId = item.id;
    card.addEventListener("dragstart", (event) => {
      if (event.target.closest("button, input, textarea")) { event.preventDefault(); return; }
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", item.id);
      card.classList.add("is-dragging");
    });
    card.addEventListener("dragend", () => {
      card.classList.remove("is-dragging");
      grid.querySelectorAll(".is-drop-target").forEach((node) => node.classList.remove("is-drop-target"));
    });
    card.addEventListener("dragover", (event) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
      card.classList.add("is-drop-target");
    });
    card.addEventListener("dragleave", (event) => {
      if (!card.contains(event.relatedTarget)) card.classList.remove("is-drop-target");
    });
    card.addEventListener("drop", (event) => {
      event.preventDefault();
      card.classList.remove("is-drop-target");
      const draggedId = event.dataTransfer.getData("text/plain");
      if (!draggedId || draggedId === item.id) return;
      const draggedIndex = matching.findIndex((entry) => entry.id === draggedId);
      const targetIndex = matching.findIndex((entry) => entry.id === item.id);
      const insertAfter = event.clientY > card.getBoundingClientRect().top + card.offsetHeight / 2;
      const destination = targetIndex + (insertAfter ? 1 : 0);
      reorderGalleryItem(draggedId, destination > draggedIndex ? destination - 1 : destination);
    });
    const preview = document.createElement("div"); preview.className = "gallery-admin-card-preview";
    if (item.mediaType === "video" && directVideoUrl(item.url)) {
      const video = document.createElement("video"); video.src = item.url; video.muted = true; video.preload = "metadata"; video.playsInline = true;
      video.onerror = () => { video.hidden = true; preview.classList.add("preview-unavailable"); preview.textContent = "ভিডিও লিংক"; };
      preview.append(video);
    } else {
      const image = document.createElement("img");
      const ytId = item.mediaType === "video" ? youtubeEmbed(item.url) : "";
      const fileId = item.mediaType === "video" ? driveFileId(item.url) : "";
      const thumbnailUrl = item.mediaType === "photo" ? drivePreview(item.url) : ytId
        ? `https://img.youtube.com/vi/${encodeURIComponent(ytId)}/hqdefault.jpg`
        : fileId ? `https://drive.google.com/thumbnail?id=${encodeURIComponent(fileId)}&sz=w640` : "";
      image.alt = item.caption || (item.mediaType === "photo" ? "গ্যালারির ছবি" : "ভিডিওর থাম্বনেইল");
      image.loading = "lazy";
      image.onerror = () => { image.hidden = true; preview.classList.add("preview-unavailable"); preview.textContent = item.mediaType === "video" ? "ভিডিও লিংক" : "প্রিভিউ পাওয়া যায়নি"; };
      if (thumbnailUrl) { image.src = thumbnailUrl; preview.append(image); }
      else { preview.classList.add("preview-unavailable"); preview.textContent = "ভিডিও লিংক"; }
    }
    if (item.mediaType === "video") { const play = document.createElement("span"); play.className = "gallery-preview-play"; play.setAttribute("aria-hidden", "true"); play.textContent = "▶"; preview.append(play); }
    const captionEditor = document.createElement("div"); captionEditor.className = "gallery-admin-caption-editor";
    const caption = document.createElement("input"); caption.type = "text"; caption.maxLength = 200; caption.value = item.caption || ""; caption.placeholder = "ক্যাপশন লিখুন"; caption.setAttribute("aria-label", "ক্যাপশন");
    const saveCaption = document.createElement("button"); saveCaption.type = "button"; saveCaption.className = "table-action gallery-caption-save"; saveCaption.textContent = "সেভ"; saveCaption.title = "ক্যাপশন সংরক্ষণ"; saveCaption.hidden = true;
    caption.addEventListener("input", () => { saveCaption.hidden = caption.value.trim() === (item.caption || ""); });
    saveCaption.addEventListener("click", () => saveGalleryCaption(item.id, caption.value));
    captionEditor.append(caption, saveCaption);
    const status = document.createElement("span"); status.className = `gallery-admin-card-status${item.published ? " is-published" : ""}`; status.textContent = item.published ? "প্রকাশিত" : "অপ্রকাশিত";
    const actions = document.createElement("div"); actions.className = "gallery-admin-card-actions";
    const edit = document.createElement("button"); edit.type = "button"; edit.className = "table-action"; edit.textContent = "সম্পাদনা";
    edit.addEventListener("click", () => {
      setGalleryType(item.mediaType);
      $("galleryEntries").replaceChildren();
      addGalleryEntry(item);
      $("galleryPublished").checked = item.published === true;
      $("galleryForm").scrollIntoView({ behavior: "smooth", block: "start" });
    });
    const remove = document.createElement("button"); remove.type = "button"; remove.className = "table-action danger-action"; remove.textContent = "মুছুন";
    remove.addEventListener("click", async () => {
      if (!window.confirm("এই মিডিয়াটি গ্যালারি থেকে মুছে ফেলবেন?")) return;
      try { await deleteDoc(doc(db, galleryCollection, item.id)); galleryItems = galleryItems.filter((entry) => entry.id !== item.id); renderGallery(); }
      catch (error) { console.error(error); say("galleryMessage", "মিডিয়া মুছতে সমস্যা হয়েছে। Firestore Rules পরীক্ষা করুন।", true); }
    });
    actions.append(edit, remove, status);
    card.append(preview, captionEditor, actions);
    grid.append(card);
  });
}

async function saveGalleryCaption(itemId, value) {
  if (busy) return;
  const item = galleryItems.find((entry) => entry.id === itemId);
  if (!item) return;
  const order = galleryOrderForType(item.mediaType);
  const itemOrder = order.findIndex((entry) => entry.id === itemId);
  busy = true;
  try {
    const batch = writeBatch(db);
    order.forEach((entry, index) => {
      const data = entry.id === itemId
        ? { caption: value.trim(), sortOrder: index, updatedAt: serverTimestamp() }
        : { sortOrder: index };
      batch.set(doc(db, galleryCollection, entry.id), data, { merge: true });
    });
    await batch.commit();
    galleryItems = galleryItems.map((entry) => entry.id === itemId
      ? { ...entry, caption: value.trim(), sortOrder: itemOrder, updatedAt: null }
      : entry.mediaType === item.mediaType
        ? { ...entry, sortOrder: order.findIndex((ordered) => ordered.id === entry.id) }
        : entry);
    renderGallery();
    say("galleryMessage", "ক্যাপশন সংরক্ষিত হয়েছে।");
  } catch (error) {
    console.error(error);
    say("galleryMessage", "ক্যাপশন সংরক্ষণ হয়নি। Firestore Rules পরীক্ষা করুন।", true);
  } finally { busy = false; }
}

function galleryOrderForType(type) {
  return galleryItems.filter((item) => item.mediaType === type)
    .map((item, originalIndex) => ({ ...item, _originalIndex: originalIndex }))
    .sort((a, b) => (Number.isFinite(Number(a.sortOrder)) ? Number(a.sortOrder) : a._originalIndex)
      - (Number.isFinite(Number(b.sortOrder)) ? Number(b.sortOrder) : b._originalIndex));
}

async function reorderGalleryItem(itemId, destination) {
  if (busy) return;
  const current = galleryOrderForType(currentGalleryType);
  const from = current.findIndex((item) => item.id === itemId);
  const to = Math.max(0, Math.min(destination, current.length - 1));
  if (from < 0 || to < 0 || to >= current.length) return;
  if (from === to) return;
  const [moved] = current.splice(from, 1);
  current.splice(to, 0, moved);
  const previous = galleryItems;
  const orderMap = new Map(current.map((item, index) => [item.id, index]));
  galleryItems = galleryItems.map((item) => orderMap.has(item.id) ? { ...item, sortOrder: orderMap.get(item.id) } : item);
  renderGallery();
  busy = true;
  try {
    const batch = writeBatch(db);
    current.forEach((item, index) => batch.set(doc(db, galleryCollection, item.id), { sortOrder: index }, { merge: true }));
    await batch.commit();
    say("galleryMessage", "গ্যালারির ধারাবাহিকতা সংরক্ষিত হয়েছে।");
  } catch (error) {
    console.error(error);
    galleryItems = previous;
    renderGallery();
    say("galleryMessage", "ধারাবাহিকতা সংরক্ষণ হয়নি। Firestore Rules পরীক্ষা করুন।", true);
  } finally { busy = false; }
}

function addGalleryEntry(item = {}) {
  const entry = document.createElement("div");
  entry.className = "gallery-entry";
  entry.dataset.itemId = item.id || "";
  const number = document.createElement("span");
  number.className = "gallery-entry-number";
  number.textContent = String($("galleryEntries").children.length + 1);
  const url = document.createElement("input");
  url.type = "url"; url.required = true; url.className = "gallery-entry-url";
  url.value = item.url || "";
  url.placeholder = currentGalleryType === "photo" ? "Google Drive ছবির লিংক পেস্ট করুন" : "YouTube ভিডিওর লিংক পেস্ট করুন";
  url.setAttribute("aria-label", currentGalleryType === "photo" ? "Google Drive ছবির লিংক" : "YouTube ভিডিওর লিংক");
  const save = document.createElement("button");
  save.type = "submit"; save.className = "secondary-button gallery-save-entry";
  save.textContent = "✓"; save.title = "গ্যালারিতে সংরক্ষণ"; save.setAttribute("aria-label", "গ্যালারিতে সংরক্ষণ");
  const remove = document.createElement("button");
  remove.type = "button"; remove.className = "secondary-button gallery-remove-entry";
  remove.textContent = "×"; remove.title = "এই লিংক বাদ দিন"; remove.setAttribute("aria-label", "এই লিংক বাদ দিন");
  remove.addEventListener("click", () => {
    if ($("galleryEntries").children.length > 1) entry.remove();
    else { entry.dataset.itemId = ""; url.value = ""; }
    syncGalleryEntryControls();
  });
  const actions = document.createElement("div"); actions.className = "gallery-entry-actions"; actions.append(save, remove);
  entry.append(number, url, actions);
  $("galleryEntries").append(entry);
  syncGalleryEntryControls();
  return entry;
}

function syncGalleryEntryControls() {
  const rows = [...$("galleryEntries").querySelectorAll(".gallery-entry")];
  rows.forEach((row, index) => { row.querySelector(".gallery-entry-number").textContent = String(index + 1); });
  if (!rows.length) return;
  galleryAddButton.hidden = false;
  const typeLabel = currentGalleryType === "photo" ? "আরেকটি ছবি যোগ করুন" : "আরেকটি ভিডিও যোগ করুন";
  galleryAddButton.setAttribute("aria-label", typeLabel);
  galleryAddButton.title = typeLabel;
  rows.at(-1).querySelector(".gallery-entry-actions").append(galleryAddButton);
}

function setGalleryType(type) {
  currentGalleryType = type;
  document.querySelectorAll(".gallery-type-button").forEach((button) => {
    const selected = button.dataset.galleryType === type;
    button.classList.toggle("is-active", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
  const isPhoto = type === "photo";
  $("galleryListTitle").textContent = isPhoto ? "সংরক্ষিত ছবি" : "সংরক্ষিত ভিডিও";
  galleryAddButton.remove();
  $("galleryEntries").replaceChildren();
  addGalleryEntry();
  galleryAddButton.textContent = "+";
  renderGallery();
}
document.querySelectorAll(".gallery-type-button").forEach((button) => button.addEventListener("click", () => setGalleryType(button.dataset.galleryType)));
$("addGalleryEntry").addEventListener("click", () => addGalleryEntry());
$("galleryForm").addEventListener("submit", async (event) => {
  event.preventDefault(); if (busy) return;
  const entries = [...$("galleryEntries").querySelectorAll(".gallery-entry")];
  const records = [];
  const orderedItems = galleryOrderForType(currentGalleryType);
  try {
    for (const [index, entry] of entries.entries()) {
      const url = safeUrl(entry.querySelector(".gallery-entry-url").value, `${index + 1} নম্বর লিংক`);
      if (currentGalleryType === "photo") {
        if (!new URL(url).hostname.match(/(^|\.)drive\.google\.com$|(^|\.)drive\.usercontent\.google\.com$/)) throw new Error(`${index + 1} নম্বর সারিতে Google Drive ছবির লিংক দিন।`);
      }
      const id = entry.dataset.itemId || doc(collection(db, galleryCollection)).id;
      const existing = galleryItems.find((item) => item.id === id);
      records.push({ id, mediaType: currentGalleryType, url, caption: existing?.caption || "", published: $("galleryPublished").checked });
    }
  } catch (error) { say("galleryMessage", error.message, true); return; }
  busy = true;
  try {
    const batch = writeBatch(db);
    const recordsById = new Map(records.map((record) => [record.id, record]));
    const finalOrder = orderedItems.map((item) => recordsById.get(item.id) || item);
    finalOrder.push(...records.filter((record) => !orderedItems.some((item) => item.id === record.id)));
    const saved = records.map((record) => ({ ...record, sortOrder: finalOrder.findIndex((item) => item.id === record.id), updatedAt: serverTimestamp() }));
    saved.forEach((record) => batch.set(doc(db, galleryCollection, record.id), record, { merge: true }));
    finalOrder.forEach((item, index) => {
      if (!recordsById.has(item.id)) batch.set(doc(db, galleryCollection, item.id), { sortOrder: index }, { merge: true });
    });
    await batch.commit();
    const savedIds = new Set(saved.map((record) => record.id));
    galleryItems = [...galleryItems.filter((item) => !savedIds.has(item.id)), ...saved.map((record) => ({ ...record, updatedAt: null }))];
    $("galleryForm").reset(); galleryAddButton.remove(); $("galleryEntries").replaceChildren(); addGalleryEntry(); $("galleryPublished").checked = true;
    renderGallery(); say("galleryMessage", `${saved.length}টি মিডিয়ার তথ্য একসঙ্গে সংরক্ষিত হয়েছে।`);
  } catch (error) { console.error(error); say("galleryMessage", "গ্যালারির তথ্য সংরক্ষণ হয়নি। Firestore Rules পরীক্ষা করুন।", true); }
  finally { busy = false; }
});
setGalleryType("photo");

function refreshTeacherOptions() {
  const teachers = mergedPeople("teacher");
  $("contentTeacherOptions").replaceChildren(...teachers.map((person) => new Option(person.name, person.name)));
}

async function loadManagementData() {
  try {
    const [peopleSnapshot, contentSnapshot, gallerySnapshot] = await Promise.all([
      getDocs(collection(db, peopleCollection)), getDocs(collection(db, contentCollection)), getDocs(collection(db, galleryCollection))
    ]);
    people = peopleSnapshot.docs.map((entry) => ({ id: entry.id.split("__").slice(1).join("__"), ...entry.data() }));
    contentItems = contentSnapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() }));
    galleryItems = gallerySnapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() }));
    renderPeople(); renderContents(); renderGallery(); refreshTeacherOptions();
  } catch (error) {
    console.error("ব্যবস্থাপনা তথ্য লোড হয়নি:", error);
    say("peopleManagementMessage", "ডেটা লোড করা যায়নি। নতুন Firestore Rules প্রকাশ করুন।", true);
    say("classContentMessage", "ডেটা লোড করা যায়নি। Firestore Rules পরীক্ষা করুন।", true);
    say("galleryMessage", "ডেটা লোড করা যায়নি। Firestore Rules পরীক্ষা করুন।", true);
    renderPeople(); renderContents(); renderGallery(); refreshTeacherOptions();
  }
}

onAuthStateChanged(auth, (user) => {
  if (user?.uid === ADMIN_UID) loadManagementData();
});
