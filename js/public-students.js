import {
  collection,
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

import { db } from "./firebase-config.js";
import { studentPlaceholderForName } from "./student-placeholder.js?v=20261022-silhouette2";

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
const pageSizeFilter = document.getElementById("studentPageSize");
const pagination = document.getElementById("studentDirectoryPagination");
const pageInfo = document.getElementById("studentPageInfo");
const previousPageButton = document.getElementById("studentPreviousPage");
const nextPageButton = document.getElementById("studentNextPage");
const printButton = document.getElementById("studentPrintButton");
const printOptionToggles = document.querySelectorAll("[data-print-toggle]");
const printMeta = document.getElementById("studentDirectoryPrintMeta");
const accessGate = document.getElementById("studentAccessGate");
const accessForm = document.getElementById("studentAccessForm");
const accessPassword = document.getElementById("studentAccessPassword");
const accessMessage = document.getElementById("studentAccessMessage");
const protectedContent = document.getElementById("studentDirectoryProtected");
const STUDENT_LIST_PASSWORD = "136065";
const STUDENT_LIST_UNLOCK_KEY = "studentDirectoryUnlocked";

let publishedStudents = [];
let currentPage = 1;
let printAllFilteredRows = false;

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

function bengaliDigits(value) {
  return String(value).replace(/\d/g, (digit) => "০১২৩৪৫৬৭৮৯"[digit]);
}

const branchLabels = new Map([["school", "স্কুল"], ["college", "কলেজ"]]);
const tradeLabels = new Map([
  ["it support and iot basics", "আইটি সাপোর্ট এন্ড আইওটি বেসিকস"],
  ["apparel manufacturing basics", "অ্যাপারেল ম্যানুফ্যাকচারিং বেসিকস"],
  ["general mechanics", "জেনারেল মেকানিক্স"],
  ["general electronics", "জেনারেল ইলেক্ট্রনিক্স"],
  ["agro-based food", "এগ্রো বেসড ফুড"],
  ["computerized accounting system", "কম্পিউটারাইজড একাউন্টিং সিস্টেম"],
  ["digital technology in business", "ডিজিটাল টেকনোলজি ইন বিজনেস"]
]);
const classLabels = new Map([
  ["6", "ষষ্ঠ শ্রেণি"], ["7", "সপ্তম শ্রেণি"], ["8", "অষ্টম শ্রেণি"],
  ["9", "নবম শ্রেণি"], ["10", "দশম শ্রেণি"], ["11", "একাদশ শ্রেণি"], ["12", "দ্বাদশ শ্রেণি"]
]);

function filterLabel(value, type) {
  const text = String(value || "").trim();
  const lower = text.toLocaleLowerCase();
  if (type === "year") return bengaliDigits(text);
  if (type === "branch") return branchLabels.get(lower) || text;
  if (type === "trade") return tradeLabels.get(lower) || text;
  if (type === "class") {
    const ascii = text.replace(/[০-৯]/g, (digit) => "০১২৩৪৫৬৭৮৯".indexOf(digit));
    const number = ascii.match(/(?:class|grade)?\s*(6|7|8|9|10|11|12)(?:\s|$)/i)?.[1];
    if (number && classLabels.has(number)) return classLabels.get(number);
    if (/শ্রেণি$/.test(text)) return text;
    if (["ষষ্ঠ", "সপ্তম", "অষ্টম", "নবম", "দশম", "একাদশ", "দ্বাদশ"].includes(text)) return `${text} শ্রেণি`;
  }
  return text;
}

function fillSelect(select, defaultLabel, values, type) {
  const currentValue = select.value;
  select.replaceChildren(new Option(defaultLabel, ""));
  values.forEach((value) => select.add(new Option(filterLabel(value, type), value)));
  if (values.includes(currentValue)) select.value = currentValue;
}

function populateFilters() {
  const years = uniqueSorted(publishedStudents.map((student) => student.academicYear || student.session))
    .sort((a, b) => Number(b) - Number(a));
  fillSelect(yearFilter, "শিক্ষাবর্ষ নির্বাচন করুন", years, "year");
  fillSelect(branchFilter, "সব শাখা", uniqueSorted(publishedStudents.map((student) => student.branch)), "branch");
  fillSelect(classFilter, "সব শ্রেণি", uniqueSorted(publishedStudents.map((student) => student.className)), "class");
  fillSelect(tradeFilter, "সব ট্রেড", uniqueSorted(publishedStudents.map((student) => student.trade)), "trade");
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

function classNumber(value) {
  const text = String(value || "").trim();
  if (/একাদশ/.test(text)) return "11";
  if (/দ্বাদশ/.test(text)) return "12";
  const ascii = String(value || "").replace(/[০-৯]/g, (digit) => "০১২৩৪৫৬৭৮৯".indexOf(digit));
  return ascii.match(/(?:class|grade)?\s*(6|7|8|9|10|11|12)(?:\s|$)/i)?.[1] || "";
}

function syncBranchWithClass() {
  const number = classNumber(classFilter.value);
  if (number === "11" || number === "12") {
    const collegeOption = [...branchFilter.options].find((option) => {
      const value = option.value.toLocaleLowerCase();
      return value === "college" || value === "কলেজ";
    });
    branchFilter.value = collegeOption?.value || "";
  }
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
  photoCell.dataset.printColumn = "photo";
  const photoUrls = getDrivePhotoUrls(student.photoUrl || "");
  const placeholderPhoto = studentPlaceholderForName(student.name);
  const image = document.createElement("img");
  let photoUrlIndex = 0;
  image.alt = `${sentenceCaseName(student.name) || "শিক্ষার্থী"} — ছবি`;
  image.loading = "lazy";
  if (!student.photoUrl) {
    image.alt = "শিক্ষার্থীর প্রতীকী ছবি";
    image.className = "student-photo-missing";
    image.src = placeholderPhoto;
  } else {
    image.src = photoUrls[photoUrlIndex];
  }
  image.addEventListener("error", () => {
    if (!student.photoUrl) return;
    photoUrlIndex += 1;
    if (photoUrlIndex < photoUrls.length) {
      image.src = photoUrls[photoUrlIndex];
      return;
    }
    if (image.dataset.placeholder !== "true") {
      image.dataset.placeholder = "true";
      image.classList.add("student-photo-missing");
      image.alt = "শিক্ষার্থীর প্রতীকী ছবি";
      image.src = placeholderPhoto;
    }
  });
  photoCell.append(image);
  row.append(photoCell);

  const nameCell = document.createElement("td");
  nameCell.className = "student-name-cell";
  nameCell.dataset.printColumn = "name";
  nameCell.textContent = sentenceCaseName(student.name) || "নাম পাওয়া যায়নি";
  row.append(nameCell);

  const academicYear = student.academicYear || student.session || "—";
  [
    [student.roll || "—", "roll"],
    [student.boardRoll || "—", "board-roll"],
    [student.studentCode || "—", "id"],
    [academicYear, "year"],
    [displayValue(student.branch) || "—", "branch"],
    [displayValue(student.className) || "—", "class"],
    [displayValue(student.trade) || "—", "trade"]
  ]
    .forEach(([value, column]) => {
      const cell = document.createElement("td");
      cell.dataset.printColumn = column;
      cell.textContent = String(value);
      row.append(cell);
    });

  const actionCell = document.createElement("td");
  actionCell.dataset.printColumn = "details";
  const detailsLink = document.createElement("a");
  detailsLink.className = "student-directory-details-link";
  detailsLink.href = `student-profile.html?id=${encodeURIComponent(student.directoryId)}`;
  detailsLink.textContent = "বিস্তারিত";
  actionCell.append(detailsLink);
  row.append(actionCell);

  const commentCell = document.createElement("td");
  commentCell.dataset.printColumn = "comment";
  commentCell.setAttribute("aria-label", "মন্তব্য লেখার জায়গা");
  row.append(commentCell);
  return row;
}

function renderDirectory() {
  const matchingStudents = publishedStudents
    .filter(studentMatchesFilters)
    .sort(compareStudents);
  const pageSize = pageSizeFilter.value;
  const pageCount = pageSize === "all" ? 1 : Math.max(1, Math.ceil(matchingStudents.length / Number(pageSize)));
  currentPage = Math.min(currentPage, pageCount);
  const visibleStudents = printAllFilteredRows || pageSize === "all"
    ? matchingStudents
    : matchingStudents.slice((currentPage - 1) * Number(pageSize), currentPage * Number(pageSize));

  rows.replaceChildren(...visibleStudents.map(renderStudent));
  count.textContent = `${new Intl.NumberFormat("bn-BD").format(matchingStudents.length)} জন শিক্ষার্থী পাওয়া গেছে।`;
  const printDetails = [
    ["শিক্ষাবর্ষ", yearFilter.value ? bengaliDigits(yearFilter.value) : "সকল শিক্ষাবর্ষ"],
    ["শাখা", branchFilter.value ? filterLabel(branchFilter.value, "branch") : "সকল শাখা"],
    ["শ্রেণি", classFilter.value ? filterLabel(classFilter.value, "class") : "সকল শ্রেণি"],
    ["ট্রেড", tradeFilter.value ? filterLabel(tradeFilter.value, "trade") : "সকল ট্রেড"]
  ];
  printMeta.textContent = printDetails.map(([label, value]) => `${label}: ${value}`).join("  ·  ");
  pagination.hidden = printAllFilteredRows || pageSize === "all" || pageCount <= 1;
  pageInfo.textContent = `পৃষ্ঠা ${bengaliDigits(currentPage)} / ${bengaliDigits(pageCount)}`;
  previousPageButton.disabled = currentPage <= 1;
  nextPageButton.disabled = currentPage >= pageCount;
  status.hidden = true;
  if (!matchingStudents.length) {
    status.textContent = "এই ফিল্টারে কোনো প্রকাশিত শিক্ষার্থী পাওয়া যায়নি।";
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
      status.textContent = "এখনো কোনো শিক্ষার্থীর তথ্য প্রকাশ করা হয়নি।";
      status.hidden = false;
      toolbar.hidden = true;
      return;
    }

    toolbar.hidden = false;
    populateFilters();
    renderDirectory();
  } catch (error) {
    console.error("শিক্ষার্থী তালিকা লোডের সমস্যা:", error);
    status.textContent = "শিক্ষার্থীদের তথ্য লোড করা যায়নি। ডাটাবেজ সংযোগ পরীক্ষা করুন।";
    status.hidden = false;
    toolbar.hidden = true;
  }
}

filterForm.addEventListener("submit", (event) => {
  event.preventDefault();
  currentPage = 1;
  renderDirectory();
});

filterForm.addEventListener("reset", () => {
  window.setTimeout(() => { currentPage = 1; renderDirectory(); }, 0);
});

for (const select of [yearFilter, branchFilter, tradeFilter, sortFilter]) {
  select.addEventListener("change", () => { currentPage = 1; renderDirectory(); });
}
classFilter.addEventListener("change", () => {
  syncBranchWithClass();
  currentPage = 1;
  renderDirectory();
});

searchFilter.addEventListener("input", () => { currentPage = 1; renderDirectory(); });
pageSizeFilter.addEventListener("change", () => { currentPage = 1; renderDirectory(); });
previousPageButton.addEventListener("click", () => { currentPage--; renderDirectory(); });
nextPageButton.addEventListener("click", () => { currentPage++; renderDirectory(); });
printButton.addEventListener("click", () => {
  if (!yearFilter.value) {
    yearFilter.reportValidity();
    yearFilter.focus();
    return;
  }
  if (!branchFilter.value) {
    branchFilter.reportValidity();
    branchFilter.focus();
    return;
  }
  window.print();
});
printOptionToggles.forEach((toggle) => {
  toggle.addEventListener("change", () => {
    document.body.classList.toggle(`print-hide-${toggle.dataset.printToggle}`, !toggle.checked);
  });
});
window.addEventListener("beforeprint", () => { printAllFilteredRows = true; renderDirectory(); });
window.addEventListener("afterprint", () => { printAllFilteredRows = false; renderDirectory(); });

function unlockStudentDirectory() {
  accessGate.hidden = true;
  protectedContent.hidden = false;
  loadDirectory();
}

accessForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (accessPassword.value.trim() !== STUDENT_LIST_PASSWORD) {
    accessMessage.textContent = "পাসওয়ার্ড সঠিক নয়। আবার চেষ্টা করুন।";
    accessPassword.value = "";
    accessPassword.focus();
    return;
  }
  sessionStorage.setItem(STUDENT_LIST_UNLOCK_KEY, "true");
  unlockStudentDirectory();
});

if (sessionStorage.getItem(STUDENT_LIST_UNLOCK_KEY) === "true") unlockStudentDirectory();
