import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import {
  collection, deleteDoc, doc, getDocs, serverTimestamp, setDoc
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";
import { auth, db } from "./firebase-config.js";

const ADMIN_UID = "wWuBEmlsaofgjAaQi7bfblsX6L62";
const peopleCollection = "directoryPeople";
const contentCollection = "classContents";
const galleryCollection = "galleryItems";
const $ = (id) => document.getElementById(id);
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
  $("personPhoto").value = person.photo || "";
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

function renderGallery() {
  const body = $("galleryRows"); body.replaceChildren();
  const matching = galleryItems.filter((item) => item.mediaType === currentGalleryType)
    .sort((a, b) => (b.updatedAt?.toMillis?.() || 0) - (a.updatedAt?.toMillis?.() || 0));
  if (!matching.length) { const row = body.insertRow(); const cell = row.insertCell(); cell.colSpan = 4; cell.textContent = "এখনো কোনো মিডিয়া যোগ করা হয়নি।"; return; }
  matching.forEach((item) => {
    const row = body.insertRow(); const preview = row.insertCell();
    if (item.mediaType === "photo") {
      const image = document.createElement("img"); image.className = "management-thumbnail"; image.src = drivePreview(item.url); image.alt = ""; image.onerror = () => { image.hidden = true; }; preview.append(image);
    } else preview.textContent = "ভিডিও";
    row.insertCell().textContent = item.caption || "—";
    row.insertCell().textContent = item.published ? "প্রকাশিত" : "অপ্রকাশিত";
    const actions = row.insertCell(); actions.className = "table-actions-cell";
    const edit = document.createElement("button"); edit.type = "button"; edit.className = "table-action"; edit.textContent = "সম্পাদনা";
    edit.addEventListener("click", () => { $("galleryItemId").value = item.id; $("galleryUrl").value = item.url; $("galleryCaption").value = item.caption || ""; $("galleryPublished").checked = item.published === true; $("galleryForm").scrollIntoView({ behavior: "smooth", block: "start" }); });
    const remove = document.createElement("button"); remove.type = "button"; remove.className = "table-action danger-action"; remove.textContent = "মুছুন";
    remove.addEventListener("click", async () => {
      if (!window.confirm("এই মিডিয়াটি গ্যালারি থেকে মুছে ফেলবেন?")) return;
      try { await deleteDoc(doc(db, galleryCollection, item.id)); galleryItems = galleryItems.filter((entry) => entry.id !== item.id); renderGallery(); }
      catch (error) { console.error(error); say("galleryMessage", "মিডিয়া মুছতে সমস্যা হয়েছে। Firestore Rules পরীক্ষা করুন।", true); }
    });
    actions.append(edit, remove);
  });
}

function setGalleryType(type) {
  currentGalleryType = type;
  document.querySelectorAll(".gallery-type-button").forEach((button) => {
    const selected = button.dataset.galleryType === type;
    button.classList.toggle("is-active", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
  const isPhoto = type === "photo";
  $("galleryUrlLabel").firstChild.textContent = isPhoto ? "Google Drive ছবির লিংক " : "YouTube ভিডিও লিংক ";
  $("galleryUrl").placeholder = isPhoto ? "https://drive.google.com/file/d/..." : "https://www.youtube.com/watch?v=...";
  $("galleryListTitle").textContent = isPhoto ? "সংরক্ষিত ছবি" : "সংরক্ষিত ভিডিও";
  $("galleryCaption").placeholder = isPhoto ? "ছবির সংক্ষিপ্ত বিবরণ" : "ভিডিওর সংক্ষিপ্ত বিবরণ";
  $("galleryItemId").value = ""; $("galleryUrl").value = ""; $("galleryCaption").value = "";
  renderGallery();
}
document.querySelectorAll(".gallery-type-button").forEach((button) => button.addEventListener("click", () => setGalleryType(button.dataset.galleryType)));
$("galleryReset").addEventListener("click", () => { $("galleryForm").reset(); $("galleryItemId").value = ""; $("galleryPublished").checked = true; });
$("galleryForm").addEventListener("submit", async (event) => {
  event.preventDefault(); if (busy) return;
  let url;
  try {
    url = safeUrl($("galleryUrl").value, currentGalleryType === "photo" ? "ছবির লিংক" : "ভিডিও লিংক");
    if (currentGalleryType === "photo") {
      if (!new URL(url).hostname.match(/(^|\.)drive\.google\.com$|(^|\.)drive\.usercontent\.google\.com$/)) throw new Error("ছবির Google Drive লিংক দিন।");
    } else if (!youtubeEmbed(url)) throw new Error("সঠিক YouTube ভিডিও লিংক দিন।");
  } catch (error) { say("galleryMessage", error.message, true); return; }
  const id = $("galleryItemId").value || doc(collection(db, galleryCollection)).id;
  const record = { mediaType: currentGalleryType, url, caption: $("galleryCaption").value.trim(), published: $("galleryPublished").checked, updatedAt: serverTimestamp() };
  busy = true;
  try {
    await setDoc(doc(db, galleryCollection, id), record, { merge: true });
    galleryItems = [...galleryItems.filter((item) => item.id !== id), { ...record, id, updatedAt: null }];
    $("galleryForm").reset(); $("galleryItemId").value = ""; $("galleryPublished").checked = true;
    renderGallery(); say("galleryMessage", "গ্যালারির তথ্য সংরক্ষিত হয়েছে।");
  } catch (error) { console.error(error); say("galleryMessage", "গ্যালারির তথ্য সংরক্ষণ হয়নি। Firestore Rules পরীক্ষা করুন।", true); }
  finally { busy = false; }
});

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
