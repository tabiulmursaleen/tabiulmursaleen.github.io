import {
  collection,
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

import { db } from "./firebase-config.js";

const rows = document.getElementById("studentDirectory");
const status = document.getElementById("studentDirectoryStatus");
const toolbar = document.getElementById("studentDirectoryToolbar");
const filterForm = document.getElementById("studentDirectoryFilters");
const yearFilter = document.getElementById("studentFilterYear");
const branchFilter = document.getElementById("studentFilterBranch");
const classFilter = document.getElementById("studentFilterClass");
const tradeFilter = document.getElementById("studentFilterTrade");
const searchFilter = document.getElementById("studentFilterSearch");
const sortFilter = document.getElementById("studentFilterSort");
const count = document.getElementById("studentDirectoryCount");

let publishedStudents = [];

const publicValueTranslations = new Map([
  ["স্কুল", "School"],
  ["কলেজ", "College"],
  ["ষষ্ঠ", "6"], ["সপ্তম", "7"], ["অষ্টম", "8"],
  ["নবম", "9"], ["দশম", "10"], ["একাদশ", "11"], ["দ্বাদশ", "12"],
  ["আইটি সাপোর্ট এন্ড আইওটি বেসিকস", "IT Support and IoT Basics"],
  ["অ্যাপারেল ম্যানুফ্যাকচারিং বেসিকস", "Apparel Manufacturing Basics"],
  ["জেনারেল মেকানিক্স", "General Mechanics"],
  ["জেনারেল ইলেক্ট্রনিক্স", "General Electronics"],
  ["এগ্রো বেসড ফুড", "Agro-Based Food"],
  ["কম্পিউটারাইজড একাউন্টিং সিস্টেম", "Computerized Accounting System"],
  ["ডিজিটাল টেকনোলজি ইন বিজনেস", "Digital Technology in Business"]
]);

function displayValue(value) {
  const text = String(value || "").trim();
  return publicValueTranslations.get(text) || text;
}

function sentenceCaseName(value) {
  return String(value || "").trim().toLocaleLowerCase().replace(/(^|\s)(\S)/gu,
    (_, spacing, character) => spacing + character.toLocaleUpperCase());
}

function uniqueSorted(values, locale = "bn") {
  return [...new Set(values.map((value) => String(value || "").trim()).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, locale, { numeric: true }));
}

function fillSelect(select, defaultLabel, values, translate = false) {
  const currentValue = select.value;
  select.replaceChildren(new Option(defaultLabel, ""));
  values.forEach((value) => select.add(new Option(translate ? displayValue(value) : value, value)));
  if (values.includes(currentValue)) select.value = currentValue;
}

function populateFilters() {
  const years = uniqueSorted(publishedStudents.map((student) => student.academicYear || student.session))
    .sort((a, b) => Number(b) - Number(a));
  fillSelect(yearFilter, "All Academic Years", years);
  fillSelect(branchFilter, "All Branches", uniqueSorted(publishedStudents.map((student) => student.branch)), true);
  fillSelect(classFilter, "All Classes", uniqueSorted(publishedStudents.map((student) => student.className)), true);
  fillSelect(tradeFilter, "All Trades", uniqueSorted(publishedStudents.map((student) => student.trade)), true);
}

function compareStudents(a, b) {
  const nameOrder = (a.name || "").localeCompare(b.name || "", "bn");
  if (sortFilter.value === "id") {
    return (a.studentCode || a.directoryId || "").localeCompare(b.studentCode || b.directoryId || "", "en", { numeric: true }) || nameOrder;
  }
  if (sortFilter.value === "roll") {
    const rollOrder = Number(a.roll || 0) - Number(b.roll || 0);
    return rollOrder || nameOrder;
  }
  return nameOrder;
}

function studentMatchesFilters(student) {
  const academicYear = String(student.academicYear || student.session || "");
  if (yearFilter.value && academicYear !== yearFilter.value) return false;
  if (branchFilter.value && student.branch !== branchFilter.value) return false;
  if (classFilter.value && student.className !== classFilter.value) return false;
  if (tradeFilter.value && student.trade !== tradeFilter.value) return false;

  const search = searchFilter.value.trim().toLocaleLowerCase();
  if (search) {
    const searchable = `${student.name || ""} ${student.studentCode || ""}`.toLocaleLowerCase();
    if (!searchable.includes(search)) return false;
  }
  return true;
}

function getDrivePhotoUrls(photoUrl) {
  try {
    const source = new URL(photoUrl);
    const fileId = source.pathname.match(/\/file\/d\/([^/]+)/)?.[1]
      || source.searchParams.get("id");
    if (!fileId) return [photoUrl];

    const resourceKey = source.searchParams.get("resourcekey");
    const makeUrl = (path, params) => {
      const url = new URL(path, "https://drive.google.com");
      Object.entries({ id: fileId, ...params }).forEach(([key, value]) => url.searchParams.set(key, value));
      if (resourceKey) url.searchParams.set("resourcekey", resourceKey);
      return url.href;
    };

    return [
      makeUrl("/uc", { export: "view" }),
      makeUrl("/thumbnail", { sz: "w1000" }),
      makeUrl("/uc", { export: "download" })
    ];
  } catch {
    return [photoUrl];
  }
}

function getDriveViewerUrl(photoUrl) {
  try {
    const source = new URL(photoUrl);
    const fileId = source.pathname.match(/\/file\/d\/([^/]+)/)?.[1]
      || source.searchParams.get("id");
    if (!fileId) return photoUrl;
    const viewer = new URL(`https://drive.google.com/file/d/${encodeURIComponent(fileId)}/view`);
    const resourceKey = source.searchParams.get("resourcekey");
    if (resourceKey) viewer.searchParams.set("resourcekey", resourceKey);
    return viewer.href;
  } catch {
    return photoUrl;
  }
}

function renderStudent(student) {
  const row = document.createElement("tr");
  const photoCell = document.createElement("td");
  photoCell.className = "student-photo-cell";
  const photoUrls = getDrivePhotoUrls(student.photoUrl || "");
  const image = document.createElement("img");
  let photoUrlIndex = 0;
  image.alt = `${sentenceCaseName(student.name) || "Student"} — Photo`;
  image.loading = "lazy";
  if (!student.photoUrl) {
    image.alt = "ছবি দেওয়া নেই";
    image.className = "student-photo-missing";
  } else {
    image.src = photoUrls[photoUrlIndex];
  }
  image.addEventListener("error", () => {
    photoUrlIndex += 1;
    if (photoUrlIndex < photoUrls.length) {
      image.src = photoUrls[photoUrlIndex];
      return;
    }
    if (!student.photoUrl) return;
    const link = document.createElement("a");
    link.className = "student-photo-link";
    link.href = getDriveViewerUrl(student.photoUrl);
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "দেখুন";
    image.replaceWith(link);
  });
  photoCell.append(image);
  row.append(photoCell);

  const nameCell = document.createElement("td");
  nameCell.className = "student-name-cell";
  nameCell.textContent = sentenceCaseName(student.name) || "Name unavailable";
  row.append(nameCell);

  const academicYear = student.academicYear || student.session || "—";
  [student.studentCode || "—", academicYear, displayValue(student.branch) || "—", displayValue(student.className) || "—", displayValue(student.trade) || "—", student.roll || "—"]
    .forEach((value) => {
      const cell = document.createElement("td");
      cell.textContent = String(value);
      row.append(cell);
    });

  const actionCell = document.createElement("td");
  const detailsLink = document.createElement("a");
  detailsLink.className = "student-directory-details-link";
  detailsLink.href = `student-profile.html?id=${encodeURIComponent(student.directoryId)}`;
  detailsLink.textContent = "Details";
  actionCell.append(detailsLink);
  row.append(actionCell);
  return row;
}

function renderDirectory() {
  const matchingStudents = publishedStudents
    .filter(studentMatchesFilters)
    .sort(compareStudents);

  rows.replaceChildren(...matchingStudents.map(renderStudent));
  count.textContent = `${new Intl.NumberFormat("en").format(matchingStudents.length)} students found.`;
  status.hidden = true;
  if (!matchingStudents.length) {
    status.textContent = "No published students match these filters.";
    status.hidden = false;
  }
}

async function loadDirectory() {
  try {
    const snapshot = await getDocs(query(
      collection(db, "studentDirectory"),
      where("published", "==", true)
    ));
    publishedStudents = snapshot.docs.map((item) => ({
      directoryId: item.id,
      ...item.data()
    }));

    if (!publishedStudents.length) {
      status.textContent = "No student records have been published yet.";
      status.hidden = false;
      toolbar.hidden = true;
      return;
    }

    toolbar.hidden = false;
    populateFilters();
    renderDirectory();
  } catch (error) {
    console.error("শিক্ষার্থী তালিকা লোডের সমস্যা:", error);
    status.textContent = "Could not load the student directory. Check Firestore access rules.";
    status.hidden = false;
    toolbar.hidden = true;
  }
}

filterForm.addEventListener("submit", (event) => {
  event.preventDefault();
  renderDirectory();
});

filterForm.addEventListener("reset", () => {
  window.setTimeout(renderDirectory, 0);
});

for (const select of [yearFilter, branchFilter, classFilter, tradeFilter, sortFilter]) {
  select.addEventListener("change", renderDirectory);
}

searchFilter.addEventListener("input", renderDirectory);

loadDirectory();
