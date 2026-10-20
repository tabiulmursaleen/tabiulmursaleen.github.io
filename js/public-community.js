import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";
import { db } from "./firebase-config.js";

const driveImage = (value) => {
  try {
    const url = new URL(value);
    const id = url.pathname.match(/\/file\/d\/([^/]+)/)?.[1] || url.searchParams.get("id");
    if (id && (url.hostname.endsWith("google.com") || url.hostname === "drive.usercontent.google.com")) return `https://drive.google.com/thumbnail?id=${encodeURIComponent(id)}&sz=w700`;
  } catch { /* Preserve legacy relative image paths. */ }
  return value || "";
};
const escape = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character]);

async function publishedFrom(name, extra = []) {
  const snapshot = await getDocs(query(collection(db, name), where("published", "==", true)));
  return [...snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() })), ...extra];
}

async function syncDirectory() {
  if (!document.getElementById("teacherGrid") && !document.getElementById("teacherProfile")
    && !document.getElementById("teacherPreviewGrid") && !document.getElementById("staffGrid")
    && !document.getElementById("staffProfile") && !document.getElementById("committeeGrid")) return;
  const response = await getDocs(query(collection(db, "directoryPeople"), where("published", "==", true)));
  const records = response.docs.map((entry) => ({ id: entry.id.split("__").slice(1).join("__"), ...entry.data() }));
  for (const [type, property] of [["teacher", "teachersData"], ["staff", "staffMembersData"]]) {
    const list = window[property];
    if (!Array.isArray(list)) continue;
    const map = new Map(list.map((person) => [person.id, { ...person }]));
    records.filter((person) => person.personType === type).forEach((person) => {
      if (person.deleted) map.delete(person.id);
      else map.set(person.id, { ...map.get(person.id), ...person, photo: driveImage(person.photo) });
    });
    list.splice(0, list.length, ...[...map.values()].sort((a, b) => String(a.id).localeCompare(String(b.id), undefined, { numeric: true })));
    if (type === "teacher") { window.renderTeacherList?.(); window.renderTeacherProfile?.(); window.renderHomeTeacherPreview?.(); }
    else { window.renderStaffList?.(); window.renderStaffProfile?.(); }
  }

  const host = document.getElementById("committeeGrid");
  if (host) {
    const members = records.filter((person) => person.personType === "committee" && !person.deleted)
      .sort((a, b) => String(a.order || a.id).localeCompare(String(b.order || b.id), undefined, { numeric: true }));
    if (!members.length) host.innerHTML = '<p class="community-status">কমিটির তথ্য শিগগিরই প্রকাশ করা হবে।</p>';
    else host.innerHTML = members.map((person, index) => `<article class="teacher-card${index === 0 ? " principal-card" : ""}">${person.photo ? `<img src="${escape(driveImage(person.photo))}" alt="${escape(person.name)}" loading="lazy">` : '<div class="committee-photo-placeholder" aria-hidden="true">👤</div>'}<div class="teacher-card-content"><h2>${escape(person.name)}</h2><p>${escape(person.designation || person.role || (index === 0 ? "সভাপতি" : ""))}</p>${person.phone ? `<a class="committee-phone" href="tel:${escape(String(person.phone).replace(/[^\d+]/g, ""))}"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.24 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1 11.4 11.4 0 0 0 .57 3.6 1 1 0 0 1-.24 1z"/></svg><span>${escape(person.phone)}</span></a>` : ""}</div></article>`).join("");
  }
}

async function renderClassContent() {
  const host = document.getElementById("classContentGrid");
  if (!host) return;
  const items = await publishedFrom("classContents");
  if (!items.length) { host.innerHTML = '<p class="community-status">এখনো কোনো ক্লাস কন্টেন্ট প্রকাশ করা হয়নি।</p>'; return; }
  const teacher = (window.teachersData || []).find((person) => person.id === "teacher-09");
  const teacherName = teacher?.name || "জামিল হোসেন";
  const teacherPhoto = teacher?.photo || "images/teachers/teacher-09.jpg";
  const timestamp = (value) => value?.toMillis?.() || (value ? new Date(value).getTime() : 0);
  const displayTeacher = (item) => item.teacherName || teacherName;
  const branchLabel = (item) => item.branch === "College" ? "কলেজ" : "স্কুল";
  const uniqueValues = (getValue) => [...new Set(items.map(getValue).filter(Boolean))]
    .sort((a, b) => String(a).localeCompare(String(b), "bn", { numeric: true }));
  const selectMarkup = (key, label, options) => `<label>${label}<select data-content-filter="${key}"><option value="">সব ${label}</option>${options.map((value) => `<option value="${escape(value)}">${escape(value)}</option>`).join("")}</select></label>`;
  const branches = uniqueValues(branchLabel);
  const classes = uniqueValues((item) => item.className);
  const subjects = uniqueValues((item) => item.subject);
  const teachers = uniqueValues(displayTeacher);
  const filters = { branch: "", className: "", subject: "", teacherName: "" };
  host.innerHTML = `<div class="class-content-filters">${selectMarkup("branch", "শাখা", branches)}${selectMarkup("className", "ক্লাস", classes)}${selectMarkup("subject", "সাবজেক্ট", subjects)}${selectMarkup("teacherName", "শিক্ষক", teachers)}<button type="button" class="class-content-reset">সব ফিল্টার মুছে দাও</button></div><div class="class-content-table-wrap"><table class="class-content-table"><thead><tr><th scope="col">শাখা</th><th scope="col">ক্লাস</th><th scope="col">সাবজেক্ট</th><th scope="col">শিক্ষক</th><th scope="col">তারিখ</th><th scope="col">শিরোনাম</th><th scope="col">ফাইল</th></tr></thead><tbody></tbody></table></div><p class="class-content-empty" hidden>এই খোঁজে কোনো কনটেন্ট পাওয়া যায়নি।</p>`;
  const renderRows = () => {
    const matching = [...items].sort((a, b) => timestamp(b.updatedAt) - timestamp(a.updatedAt)).filter((item) => {
      if (filters.branch && branchLabel(item) !== filters.branch) return false;
      if (filters.className && item.className !== filters.className) return false;
      if (filters.subject && item.subject !== filters.subject) return false;
      if (filters.teacherName && displayTeacher(item) !== filters.teacherName) return false;
      return true;
    });
    const rows = matching.map((item) => {
      const name = displayTeacher(item);
      const photo = name === teacherName ? teacherPhoto : "";
      const dateValue = timestamp(item.updatedAt);
      const date = dateValue ? new Intl.DateTimeFormat("bn-BD", { day: "numeric", month: "short", year: "numeric" }).format(new Date(dateValue)) : "—";
      return `<tr><td>${escape(branchLabel(item))}</td><td>${escape(item.className)}</td><td>${escape(item.subject)}</td><td><span class="class-content-teacher">${photo ? `<img src="${escape(driveImage(photo))}" alt="" loading="lazy">` : ""}<span>${escape(name)}</span></span></td><td>${escape(date)}</td><td>${escape(item.title)}</td><td><a class="content-open-link" href="${escape(item.driveUrl)}" target="_blank" rel="noopener noreferrer">ফাইল দেখো</a></td></tr>`;
    }).join("");
    host.querySelector("tbody").innerHTML = rows;
    host.querySelector(".class-content-empty").hidden = Boolean(rows);
  };
  host.querySelectorAll("[data-content-filter]").forEach((select) => select.addEventListener("change", () => {
    filters[select.dataset.contentFilter] = select.value;
    renderRows();
  }));
  host.querySelector(".class-content-reset").addEventListener("click", () => {
    Object.keys(filters).forEach((key) => { filters[key] = ""; });
    host.querySelectorAll("[data-content-filter]").forEach((select) => { select.value = ""; });
    renderRows();
  });
  renderRows();
}

function youtubeId(value) {
  try {
    const url = new URL(value);
    if (url.hostname === "youtu.be") return url.pathname.slice(1);
    if (url.hostname.endsWith("youtube.com")) return url.searchParams.get("v") || url.pathname.match(/\/(?:embed|shorts|live)\/([^/]+)/)?.[1] || "";
  } catch { /* invalid URL is filtered out below */ }
  return "";
}

async function renderGallery(type, hostId) {
  const host = document.getElementById(hostId);
  if (!host) return;
  const items = (await publishedFrom("galleryItems")).filter((item) => item.mediaType === type);
  items.sort((a, b) => (b.updatedAt?.toMillis?.() || 0) - (a.updatedAt?.toMillis?.() || 0));
  if (!items.length) { host.innerHTML = `<p class="community-status">এখনো কোনো ${type === "photo" ? "ছবি" : "ভিডিও"} প্রকাশ করা হয়নি।</p>`; return; }
  host.innerHTML = items.map((item) => type === "photo"
    ? `<article class="media-gallery-card"><a href="${escape(item.url)}" target="_blank" rel="noopener noreferrer"><img src="${escape(driveImage(item.url))}" alt="${escape(item.caption || "প্রতিষ্ঠানের ছবি")}" loading="lazy"></a><p>${escape(item.caption || "")}</p></article>`
    : `<article class="media-gallery-card video-gallery-card"><div class="video-frame"><iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(youtubeId(item.url))}" title="${escape(item.caption || "প্রতিষ্ঠানের ভিডিও")}" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div><p>${escape(item.caption || "")}</p></article>`).join("");
}

async function renderPage() {
  try {
    await syncDirectory();
    await Promise.all([renderClassContent(), renderGallery("photo", "photoGalleryGrid"), renderGallery("video", "videoGalleryGrid")]);
  } catch (error) {
    console.error("প্রকাশিত প্রাতিষ্ঠানিক তথ্য লোড হয়নি:", error);
    document.querySelectorAll(".community-status").forEach((node) => { node.textContent = "তথ্য লোড করা যায়নি। পরে আবার চেষ্টা করুন।"; });
  }
}

renderPage();
