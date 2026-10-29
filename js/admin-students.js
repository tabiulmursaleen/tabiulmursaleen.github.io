import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  where,
  writeBatch
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

import { auth, db } from "./firebase-config.js";
import { getAcademicSubjects } from "./academic-subjects.js?v=20261022-subject-catalog2";
import { studentPlaceholderForName } from "./student-placeholder.js?v=20261022-silhouette2";

const ADMIN_UID = "wWuBEmlsaofgjAaQi7bfblsX6L62";
const studentsCollection = "students";
const publicStudentsCollection = "studentDirectory";
const feesCollection = "studentFees";
const resultsCollection = "studentResults";
const resultDraftsCollection = "studentResultDrafts";
const publicResultsCollection = "publicStudentResults";

const studentForm = document.getElementById("studentForm");
const feeForm = document.getElementById("feeForm");
const resultForm = document.getElementById("resultForm");
const studentRows = document.getElementById("studentRows");
const studentAdminBranch = document.getElementById("studentAdminBranch");
const studentAdminClass = document.getElementById("studentAdminClass");
const studentAdminTrade = document.getElementById("studentAdminTrade");
const studentAdminSearch = document.getElementById("studentAdminSearch");
const selectVisibleStudents = document.getElementById("selectVisibleStudents");
const selectedStudentCount = document.getElementById("selectedStudentCount");
const deleteSelectedStudentsButton = document.getElementById("deleteSelectedStudentsButton");
const studentImportFile = document.getElementById("studentImportFile");
const studentImportButton = document.getElementById("studentImportButton");
const studentImportMessage = document.getElementById("studentImportMessage");
const studentPublishImportedButton = document.getElementById("studentPublishImportedButton");
const studentPublishImportedMessage = document.getElementById("studentPublishImportedMessage");
const feeRows = document.getElementById("feeRows");
const resultRows = document.getElementById("resultRows");
const feeClassSelect = document.getElementById("feeClass");
const feeTradeSelect = document.getElementById("feeTrade");
const feeStudentList = document.getElementById("feeStudentList");
const feeSelectionCount = document.getElementById("feeSelectionCount");
const resultSubjectRows = document.getElementById("resultSubjectRows");
const resultMatrix = document.getElementById("resultMatrix");

let currentAdmin = null;
let students = [];
const selectedStudentIds = new Set();
let feeRecords = [];
let admitCandidates = new Map();
let admitPrintMode = "";
let editingStudentCode = null;
let editingResultId = null;
let resultRecords = [];
let resultDraftRecords = [];
let editingResultGroup = null;
let busy = false;

const byId = (id) => document.getElementById(id);
const uiLocale = () => document.documentElement.lang === "en" ? "en-US" : "bn-BD";
const bn = (value) => new Intl.NumberFormat(uiLocale()).format(value);
const feeText = (bnText, enText) => document.documentElement.lang === "en" ? enText : bnText;
const feeMonthNamesBn = ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"];
const feeMonthNamesEn = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const feeDisplayNames = new Map([
  ["ষষ্ঠ", "Class 6"], ["সপ্তম", "Class 7"], ["অষ্টম", "Class 8"], ["নবম", "Class 9"], ["দশম", "Class 10"], ["একাদশ", "Class 11"], ["দ্বাদশ", "Class 12"],
  ["মাসিক বেতন", "Monthly Tuition"], ["পরীক্ষার ফি", "Exam Fee"], ["ভর্তি ফি", "Admission Fee"], ["বোর্ড রেজিস্ট্রেশন ফি", "Board Registration Fee"], ["অন্যান্য", "Other"],
  ["নগদ", "Cash"], ["মোবাইল ব্যাংকিং", "Mobile Banking"], ["ব্যাংক", "Bank"],
  ["অ্যাগ্রো বেসড ফুড প্রসেসিং", "Agro-Based Food Processing"], ["এগ্রো বেসড ফুড", "Agro-Based Food"],
  ["অ্যাপারেল ম্যানুফ্যাকচারিং বেসিকস", "Apparel Manufacturing Basics"], ["এপারেল", "Apparel"],
  ["জেনারেল মেকানিক্স", "General Mechanics"], ["জেনারেল ইলেকট্রনিক্স", "General Electronics"],
  ["আইটি সাপোর্ট এন্ড আইওটি বেসিকস", "IT Support and IoT Basics"], ["আইটি সাপোর্ট", "IT Support"],
  ["কম্পিউটারাইজড একাউন্টিং সিস্টেম", "Computerized Accounting System"], ["কম্পিউটার অ্যাপ্লিকেশন", "Computer Application"], ["কম্পিউটার অপারেশন", "Computer Operation"]
]);
function feeDisplay(value) {
  const text = String(value || "—");
  if (document.documentElement.lang !== "en") return text;
  for (const [bnName, enName] of feeDisplayNames) {
    if (text === bnName) return enName;
    if (text.startsWith(`${bnName} `)) return `${enName} ${text.slice(bnName.length + 1)}`;
  }
  return text;
}
const schoolTradeNames = [
  "আইটি সাপোর্ট এন্ড আইওটি বেসিকস", "অ্যাপারেল ম্যানুফ্যাকচারিং বেসিকস", "জেনারেল মেকানিক্স",
  "জেনারেল ইলেক্ট্রনিক্স", "এগ্রো বেসড ফুড"
];
const collegeTradeNames = ["কম্পিউটারাইজড একাউন্টিং সিস্টেম", "ডিজিটাল টেকনোলজি ইন বিজনেস"];
const institutionTradeNames = [...schoolTradeNames, ...collegeTradeNames];
function normalizeTradeName(value) {
  const normalized = String(value || "")
    .normalize("NFKC")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/[০-৯]/g, (digit) => "০১২৩৪৫৬৭৮৯".indexOf(digit))
    .replace(/[٠-٩]/g, (digit) => "٠١٢٣٤٥٦٧٨٩".indexOf(digit))
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase();
  const withoutLevel = normalized.replace(/[\s-]*\(?[1-4]\)?$/, "").trim();
  if (["general mechanics", "general mechanic", "জেনারেল মেকানিক্স", "জেনারেল মেকানিকস", "জেনারেল মেকানিক"].includes(withoutLevel)
    || withoutLevel.startsWith("জেনারেল মেকানিক্স ")
    || withoutLevel.startsWith("জেনারেল মেকানিকস ")) return "জেনারেল মেকানিক্স";
  if (withoutLevel.startsWith("general mechanics ") || withoutLevel.startsWith("general mechanic ")) return "জেনারেল মেকানিক্স";
  return withoutLevel;
}
function tradeMatches(studentTrade, selectedTrade) {
  return !selectedTrade || normalizeTradeName(studentTrade) === normalizeTradeName(selectedTrade);
}
function institutionTradesForClass(className) {
  const classCode = getClassCode(String(className || ""));
  if (classCode && Number(classCode) >= 6 && Number(classCode) <= 10) return schoolTradeNames;
  if (classCode && Number(classCode) >= 11 && Number(classCode) <= 12) return collegeTradeNames;
  return institutionTradeNames;
}
function updateStudentTradeOptions() {
  const branch = byId("studentBranch").value;
  const allowedTrades = branch === "স্কুল" ? schoolTradeNames
    : branch === "কলেজ" ? collegeTradeNames
      : institutionTradeNames;
  const tradeOptions = byId("studentTradeOptions");
  tradeOptions.replaceChildren(...allowedTrades.map((trade) => {
    const option = document.createElement("option");
    option.value = trade;
    return option;
  }));
}
function formatFeeMonths(record) {
  const isEnglish = document.documentElement.lang === "en";
  const monthNames = isEnglish ? feeMonthNamesEn : feeMonthNamesBn;
  const values = Array.isArray(record.months) && record.months.length ? record.months : [record.month];
  return values.filter(Boolean).map((value) => {
    const monthValue = normalizeDigits(String(value));
    const match = monthValue.match(/^(\d{4})-(\d{1,2})$/);
    return match && Number(match[2]) >= 1 && Number(match[2]) <= 12
      ? `${monthNames[Number(match[2]) - 1]} ${match[1]}`
      : monthValue.replace("-", " / ");
  }).join(" · ") || "—";
}

function message(id, text, isError = false) {
  const target = byId(id);
  target.textContent = text;
  target.classList.toggle("is-error", isError);
}

function cell(row, text) {
  const td = document.createElement("td");
  td.textContent = text == null || text === "" ? "—" : String(text);
  row.append(td);
  return td;
}

function actionButton(label, action, id, className = "") {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = label;
  button.dataset.action = action;
  button.dataset.id = id;
  button.className = `table-action ${className}`.trim();
  return button;
}

function localDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDate(value) {
  if (!value) return "—";
  const [year, month, day] = String(value).split("-").map(Number);
  if (!year || !month || !day) return String(value);
  return new Intl.DateTimeFormat(uiLocale(), {
    day: "numeric", month: "short", year: "numeric"
  }).format(new Date(year, month - 1, day));
}

function formatAttendanceDate(value) {
  if (!value) return "—";
  const [year, month, day] = String(value).split("-").map(Number);
  if (!year || !month || !day) return String(value);
  const date = new Date(year, month - 1, day);
  const dateText = new Intl.DateTimeFormat(uiLocale(), {
    day: "numeric", month: "long", year: "numeric"
  }).format(date);
  const weekday = new Intl.DateTimeFormat(uiLocale(), { weekday: "long" }).format(date);
  return `${dateText}\n${weekday}`;
}

function normalizeStudentPhotoUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) throw new Error("শিক্ষার্থীর ছবির Google Drive লিংক দিন।");

  let url;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("সঠিক Google Drive শেয়ার লিংক দিন।");
  }

  if (url.protocol !== "https:") {
    throw new Error("ছবির লিংক https:// দিয়ে শুরু হতে হবে।");
  }

  const isDrive = url.hostname === "drive.google.com" || url.hostname === "drive.usercontent.google.com";
  if (!isDrive) throw new Error("Google Drive-এর শেয়ার লিংক ব্যবহার করুন।");

  const fileId = url.pathname.match(/\/file\/d\/([^/]+)/)?.[1]
    || url.searchParams.get("id");
  if (!fileId) throw new Error("Drive লিংকটি থেকে ছবির আইডি পাওয়া যায়নি। Copy link দিয়ে আবার চেষ্টা করুন।");

  const resourceKey = url.searchParams.get("resourcekey");
  const viewUrl = new URL("https://drive.google.com/uc");
  viewUrl.searchParams.set("export", "view");
  viewUrl.searchParams.set("id", fileId);
  if (resourceKey) viewUrl.searchParams.set("resourcekey", resourceKey);
  return viewUrl.href;
}

function refreshStudentSelects() {
  const compareClasses = (a, b) =>
    Number(getClassCode(a) || 99) - Number(getClassCode(b) || 99)
      || a.localeCompare(b, "bn");
  const previousClass = feeClassSelect.value;
  const classes = [...new Set(students.map((student) => student.className).filter(Boolean))]
    .sort(compareClasses);
  feeClassSelect.replaceChildren(new Option(feeText("শ্রেণি নির্বাচন করুন", "Select a class"), ""));
  classes.forEach((className) => feeClassSelect.add(new Option(feeDisplay(className), className)));
  if (classes.includes(previousClass)) feeClassSelect.value = previousClass;
  updateFeeTradeOptions();
  const sheetClass = byId("feeSheetClass");
  if (sheetClass) {
    const previousSheetClass = sheetClass.value;
    sheetClass.replaceChildren(new Option(feeText("সব শ্রেণি", "All Classes"), ""));
    classes.forEach((className) => sheetClass.add(new Option(feeDisplay(className), className)));
    if (classes.includes(previousSheetClass)) sheetClass.value = previousSheetClass;
    updateFeeSheetTradeOptions();
  }
  const admitSheetClass = byId("admitFeeSheetClass");
  if (admitSheetClass) {
    const previousAdmitClass = admitSheetClass.value;
    admitSheetClass.replaceChildren(new Option(feeText("সব শ্রেণি", "All Classes"), ""));
    classes.forEach((className) => admitSheetClass.add(new Option(feeDisplay(className), className)));
    if (classes.includes(previousAdmitClass)) admitSheetClass.value = previousAdmitClass;
    updateFeeSheetTradeOptions("admitFeeSheetTrade", "admitFeeSheetClass", renderAdmitFeeSpreadsheet);
  }
  const accountClass = byId("accountIncomeClass");
  if (accountClass) {
    const previousAccountClass = accountClass.value;
    accountClass.replaceChildren(new Option(feeText("সব শ্রেণি", "All Classes"), ""));
    const receiptClasses = [...new Set([...classes, ...feeRecords.map((record) => record.className).filter(Boolean)])]
      .sort(compareClasses);
    receiptClasses.forEach((className) => accountClass.add(new Option(feeDisplay(className), className)));
    if (receiptClasses.includes(previousAccountClass)) accountClass.value = previousAccountClass;
    updateAccountIncomeTradeOptions();
  }
  refreshFeeRecordFilterOptions();
}

function updateAccountIncomeTradeOptions() {
  const className = byId("accountIncomeClass").value;
  const select = byId("accountIncomeTrade");
  const previous = select.value;
  const trades = [...new Set(feeRecords
    .filter((record) => !className || record.className === className)
    .map((record) => record.trade).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, "bn"));
  select.replaceChildren(new Option(feeText("সব ট্রেড", "All Trades"), ""));
  trades.forEach((trade) => select.add(new Option(feeDisplay(trade), trade)));
  select.disabled = !className;
  if (trades.includes(previous)) select.value = previous;
}

function updateFeeSheetTradeOptions(tradeId = "feeSheetTrade", classId = "feeSheetClass", renderer = renderFeeSpreadsheet) {
  const className = byId(classId).value;
  const tradeSelect = byId(tradeId);
  const previousTrade = tradeSelect.value;
  const allowedTrades = institutionTradesForClass(className);
  const observedTrades = students.filter((student) => !className || student.className === className)
    .map((student) => String(student.trade || "").trim())
    .filter((trade) => trade && allowedTrades.some((allowed) => normalizeTradeName(allowed) === normalizeTradeName(trade)));
  const trades = [...new Map([...allowedTrades, ...observedTrades]
    .map((trade) => [normalizeTradeName(trade), normalizeTradeName(trade) === "জেনারেল মেকানিক্স" ? "জেনারেল মেকানিক্স" : trade])).values()]
    .sort((a, b) => a.localeCompare(b, "bn"));
  tradeSelect.replaceChildren(new Option(feeText("সব ট্রেড", "All Trades"), ""));
  trades.forEach((trade) => tradeSelect.add(new Option(feeDisplay(trade), trade)));
  tradeSelect.disabled = false;
  if (previousTrade && trades.some((trade) => normalizeTradeName(trade) === normalizeTradeName(previousTrade))) {
    tradeSelect.value = trades.find((trade) => normalizeTradeName(trade) === normalizeTradeName(previousTrade));
  }
  renderer();
}

function rollNumber(student) {
  const number = Number(normalizeDigits(String(student.roll || "")));
  return Number.isFinite(number) ? number : Number.MAX_SAFE_INTEGER;
}

function updateFeeTradeOptions() {
  const className = feeClassSelect.value;
  const previousTrade = feeTradeSelect.value;
  const trades = [...new Set(students
    .filter((student) => student.className === className)
    .map((student) => student.trade).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, "bn"));
  feeTradeSelect.replaceChildren(new Option(
    className ? feeText("ট্রেড নির্বাচন করুন", "Select a trade") : feeText("আগে শ্রেণি নির্বাচন করুন", "Select a class first"), ""
  ));
  trades.forEach((trade) => feeTradeSelect.add(new Option(feeDisplay(trade), trade)));
  feeTradeSelect.disabled = !className;
  if (trades.includes(previousTrade)) feeTradeSelect.value = previousTrade;
  renderFeeStudentChoices();
}

function selectedFeeStudentCodes() {
  return new Set([...feeStudentList.querySelectorAll('input[type="checkbox"]:checked')]
    .map((input) => input.value));
}

function renderFeeStudentChoices() {
  const selected = selectedFeeStudentCodes();
  feeStudentList.replaceChildren();
  const className = feeClassSelect.value;
  const trade = feeTradeSelect.value;
  if (!className || !trade) {
    const empty = document.createElement("p");
    empty.className = "fee-empty-state";
    empty.textContent = feeText("শ্রেণি ও ট্রেড নির্বাচন করুন।", "Choose a class and trade.");
    feeStudentList.append(empty);
    feeSelectionCount.textContent = feeText(`${bn(0)} জন নির্বাচিত`, `${bn(0)} selected`);
    byId("feeSelectAll").checked = false;
    return;
  }
  const matchingStudents = students.filter((student) => student.className === className && student.trade === trade)
    .sort((a, b) => rollNumber(a) - rollNumber(b) || (a.name || "").localeCompare(b.name || "", "bn"));
  if (!matchingStudents.length) {
    const empty = document.createElement("p");
    empty.className = "fee-empty-state";
    empty.textContent = feeText("এই শ্রেণি ও ট্রেডে কোনো শিক্ষার্থী পাওয়া যায়নি।", "No students found for this class and trade.");
    feeStudentList.append(empty);
  }
  matchingStudents.forEach((student) => {
    const label = document.createElement("label");
    label.className = "fee-student-option";
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = student.studentCode;
    checkbox.checked = selected.has(student.studentCode);
    checkbox.addEventListener("change", updateFeeSelectionCount);
    const text = document.createElement("span");
    text.textContent = `${student.roll || "—"} · ${student.name || ""} · ${student.studentCode}`;
    label.append(checkbox, text);
    feeStudentList.append(label);
  });
  updateFeeSelectionCount();
}

function updateFeeSelectionCount() {
  const checkboxes = [...feeStudentList.querySelectorAll('input[type="checkbox"]')];
  const selectedCount = checkboxes.filter((input) => input.checked).length;
  const isEnglish = document.documentElement.lang === "en";
  feeSelectionCount.textContent = isEnglish
    ? `${bn(selectedCount)} selected`
    : `${bn(selectedCount)} জন নির্বাচিত`;
  byId("feeSelectAll").checked = checkboxes.length > 0 && selectedCount === checkboxes.length;
}

feeClassSelect.addEventListener("change", () => {
  feeTradeSelect.value = "";
  updateFeeTradeOptions();
});
feeTradeSelect.addEventListener("change", renderFeeStudentChoices);
byId("feeSelectAll").addEventListener("change", (event) => {
  feeStudentList.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
    checkbox.checked = event.target.checked;
  });
  updateFeeSelectionCount();
});

function getVisibleStudents() {
  const branchFilter = studentAdminBranch?.value || "";
  const classFilter = studentAdminClass?.value || "";
  const tradeFilter = studentAdminTrade?.value || "";
  const search = (studentAdminSearch?.value || "").trim().toLocaleLowerCase();
  return students.filter((student) => {
    const branch = String(student.branch || "").toLocaleLowerCase();
    const branchMatches = !branchFilter
      || (branchFilter === "স্কুল" && ["স্কুল", "school"].includes(branch))
      || (branchFilter === "কলেজ" && ["কলেজ", "college"].includes(branch));
    const classMatches = !classFilter || getClassCode(student.className || "") === getClassCode(classFilter);
    const tradeMatches = !tradeFilter || String(student.trade || "") === tradeFilter;
    const searchable = [student.name, student.nameBn, student.studentCode, student.roll, student.boardRoll]
      .filter(Boolean).join(" ").toLocaleLowerCase();
    return branchMatches && classMatches && tradeMatches && (!search || searchable.includes(search));
  });
}

function refreshStudentTradeFilter() {
  if (!studentAdminTrade) return;
  const selected = studentAdminTrade.value;
  const trades = [...new Set(students.map((student) => String(student.trade || "").trim()).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, "bn"));
  studentAdminTrade.replaceChildren(new Option("সব ট্রেড", ""));
  trades.forEach((trade) => studentAdminTrade.add(new Option(trade, trade)));
  if (trades.includes(selected)) studentAdminTrade.value = selected;
}

function updateStudentSelectionControls(visibleStudents) {
  const visibleIds = visibleStudents.map((student) => student.documentId || student.studentCode);
  const selectedVisibleCount = visibleIds.filter((id) => selectedStudentIds.has(id)).length;
  selectedStudentCount.textContent = `${bn(selectedStudentIds.size)} জন নির্বাচিত`;
  deleteSelectedStudentsButton.disabled = busy || selectedStudentIds.size === 0;
  selectVisibleStudents.checked = visibleIds.length > 0 && selectedVisibleCount === visibleIds.length;
  selectVisibleStudents.indeterminate = selectedVisibleCount > 0 && selectedVisibleCount < visibleIds.length;
}

function renderStudents() {
  refreshStudentTradeFilter();
  studentRows.replaceChildren();
  const visibleStudents = getVisibleStudents();
  if (!students.length || !visibleStudents.length) {
    const row = studentRows.insertRow();
    cell(row, students.length ? "এই ফিল্টারে কোনো শিক্ষার্থী পাওয়া যায়নি।" : "এখনো কোনো শিক্ষার্থী নিবন্ধিত হয়নি।").colSpan = 7;
    updateStudentSelectionControls(visibleStudents);
    return;
  }

  visibleStudents.sort((a, b) => (a.name || "").localeCompare(b.name || "", "bn"));
  for (const student of visibleStudents) {
    const row = studentRows.insertRow();
    const selectCell = cell(row, "");
    selectCell.className = "student-row-select-cell";
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "student-row-select";
    checkbox.dataset.studentId = student.documentId || student.studentCode;
    checkbox.checked = selectedStudentIds.has(checkbox.dataset.studentId);
    checkbox.setAttribute("aria-label", `${student.name || "শিক্ষার্থী"} নির্বাচন করুন`);
    selectCell.append(checkbox);
    cell(row, student.studentCode || "—");
    cell(row, student.name);
    cell(row, `${student.branch || ""} / ${student.className || ""}`);
    cell(row, student.roll);
    cell(row, student.published ? "প্রকাশিত" : "গোপন");
    const actions = cell(row, "");
    actions.className = "table-actions-cell";
    actions.append(actionButton("এডিট", "edit-student", student.documentId || student.studentCode));
    actions.append(actionButton("মুছুন", "delete-student", student.documentId || student.studentCode, "danger-action"));
  }
  updateStudentSelectionControls(visibleStudents);
  refreshStudentSelects();
}

async function loadStudents() {
  studentRows.replaceChildren();
  const loading = studentRows.insertRow();
  cell(loading, "শিক্ষার্থীর তথ্য লোড হচ্ছে...").colSpan = 7;

  const snapshot = await getDocs(collection(db, studentsCollection));
  students = snapshot.docs.map((item) => ({
    ...item.data(),
    documentId: item.id
  }));
  renderStudents();
}

for (const filter of [studentAdminBranch, studentAdminClass, studentAdminTrade]) {
  filter.addEventListener("change", renderStudents);
}
studentAdminSearch.addEventListener("input", renderStudents);
byId("clearStudentFilters").addEventListener("click", () => {
  studentAdminBranch.value = "";
  studentAdminClass.value = "";
  studentAdminTrade.value = "";
  studentAdminSearch.value = "";
  renderStudents();
});
studentRows.addEventListener("change", (event) => {
  const checkbox = event.target.closest(".student-row-select");
  if (!checkbox) return;
  if (checkbox.checked) selectedStudentIds.add(checkbox.dataset.studentId);
  else selectedStudentIds.delete(checkbox.dataset.studentId);
  updateStudentSelectionControls(getVisibleStudents());
});
selectVisibleStudents.addEventListener("change", () => {
  getVisibleStudents().forEach((student) => {
    const id = student.documentId || student.studentCode;
    if (selectVisibleStudents.checked) selectedStudentIds.add(id);
    else selectedStudentIds.delete(id);
  });
  renderStudents();
});
deleteSelectedStudentsButton.addEventListener("click", deleteSelectedStudents);

async function deleteSelectedStudents() {
  if (!currentAdmin || busy || selectedStudentIds.size === 0) return;
  const targets = students.filter((student) => selectedStudentIds.has(student.documentId || student.studentCode));
  if (!targets.length) return;
  const approved = window.confirm(
    `${bn(targets.length)} জন নির্বাচিত শিক্ষার্থীর তথ্য, প্রকাশিত প্রোফাইল এবং সংশ্লিষ্ট ফি/ফলাফল স্থায়ীভাবে মুছে যাবে। চালিয়ে যাবেন?`
  );
  if (!approved) return;

  busy = true;
  deleteSelectedStudentsButton.disabled = true;
  const refs = new Map();
  const addRef = (reference) => refs.set(reference.path, reference);
  targets.forEach((student) => {
    addRef(doc(db, studentsCollection, student.documentId || student.studentCode));
    if (student.publicDirectoryId) addRef(doc(db, publicStudentsCollection, student.publicDirectoryId));
  });
  let removedCount = 0;
  try {
    const codes = [...new Set(targets.map((student) => student.studentCode).filter(Boolean))];
    const relatedCollections = [feesCollection, resultsCollection, resultDraftsCollection, publicResultsCollection, publicStudentsCollection];
    for (const name of relatedCollections) {
      for (let start = 0; start < codes.length; start += 30) {
        const codeChunk = codes.slice(start, start + 30);
        if (!codeChunk.length) continue;
        const related = codeChunk.length === 1
          ? await getDocs(query(collection(db, name), where("studentCode", "==", codeChunk[0])))
          : await getDocs(query(collection(db, name), where("studentCode", "in", codeChunk)));
        related.docs.forEach((item) => addRef(item.ref));
      }
    }

    const allRefs = [...refs.values()];
    for (let start = 0; start < allRefs.length; start += 450) {
      const chunk = allRefs.slice(start, start + 450);
      const batch = writeBatch(db);
      chunk.forEach((reference) => batch.delete(reference));
      await batch.commit();
      removedCount += chunk.length;
    }
    targets.forEach((student) => selectedStudentIds.delete(student.documentId || student.studentCode));
    await Promise.all([loadStudents(), loadFees(), loadResults()]);
    message("studentMessage", `${bn(targets.length)} জন নির্বাচিত শিক্ষার্থীর ${bn(removedCount)}টি সংশ্লিষ্ট রেকর্ড মুছে ফেলা হয়েছে।`);
  } catch (error) {
    console.error("নির্বাচিত শিক্ষার্থী মুছতে সমস্যা:", error);
    message("studentMessage", `${bn(removedCount)}টি রেকর্ড মুছে গেছে; বাকিগুলো সম্পন্ন হয়নি। ${error.message || "ডাটাবেজে মুছতে সমস্যা হয়েছে।"}`, true);
  } finally {
    busy = false;
    renderStudents();
  }
}

function resetStudentForm() {
  studentForm.reset();
  setStudentFormRequirements();
  byId("studentAdmissionDate").value = localDateString();
  byId("studentAcademicYear").value = String(new Date().getFullYear());
  editingStudentCode = null;
  byId("legacyParentNameNotice").hidden = true;
  byId("legacyParentNameNotice").textContent = "";
  byId("legacyAddressNotice").hidden = true;
  byId("legacyAddressNotice").textContent = "";
  byId("studentCode").readOnly = false;
  byId("studentCode").value = "";
  byId("saveStudentButton").textContent = "শিক্ষার্থী সংরক্ষণ";
  byId("cancelStudentEdit").hidden = true;
  byId("studentPhotoUrl").value = "";
  updateBoardRegistrationOptions();
  updatePreviousExamOptions();
}

function setStudentFormRequirements() {
  studentForm.querySelectorAll("[required]").forEach((field) => { field.required = false; });
  byId("studentName").required = true;
}

byId("studentAdmissionDate").value = localDateString();
byId("studentAcademicYear").value = String(new Date().getFullYear());

function normalizeDigits(value) {
  return String(value).replace(/[০-৯]/g, (digit) => "0123456789"["০১২৩৪৫৬৭৮৯".indexOf(digit)]);
}

const tradeIdCodes = new Map([
  ["আইটি সাপোর্ট এন্ড আইওটি বেসিকস", "ITS"],
  ["অ্যাপারেল ম্যানুফ্যাকচারিং বেসিকস", "AMB"],
  ["জেনারেল মেকানিক্স", "GMX"],
  ["জেনারেল ইলেক্ট্রনিক্স", "GEN"],
  ["এগ্রো বেসড ফুড", "ABF"],
  ["কম্পিউটারাইজড একাউন্টিং সিস্টেম", "CAS"],
  ["ডিজিটাল টেকনোলজি ইন বিজনেস", "DTB"]
]);

const classIdCodes = new Map([
  ["ষষ্ঠ", "06"], ["ষষ্ঠ শ্রেণি", "06"], ["সপ্তম", "07"], ["সপ্তম শ্রেণি", "07"],
  ["অষ্টম", "08"], ["অষ্টম শ্রেণি", "08"], ["নবম", "09"], ["নবম শ্রেণি", "09"],
  ["দশম", "10"], ["দশম শ্রেণি", "10"], ["একাদশ", "11"], ["একাদশ শ্রেণি", "11"],
  ["দ্বাদশ", "12"], ["দ্বাদশ শ্রেণি", "12"],
  ["class 6", "06"], ["class 7", "07"], ["class 8", "08"], ["class 9", "09"],
  ["class 10", "10"], ["class 11", "11"], ["class 12", "12"]
]);
const classCodeValues = new Map([
  ["06", "ষষ্ঠ"], ["07", "সপ্তম"], ["08", "অষ্টম"], ["09", "নবম"],
  ["10", "দশম"], ["11", "একাদশ"], ["12", "দ্বাদশ"]
]);

function getClassCode(value) {
  const normalized = normalizeDigits(value.trim()).toLowerCase().replace(/\s+/g, " ");
  const aliases = new Map([
    ["নবম শ্রেণী", "09"], ["৯ম", "09"], ["৯ম শ্রেণি", "09"], ["৯ম শ্রেণী", "09"],
    ["দশম শ্রেণী", "10"], ["১০ম", "10"], ["১০ম শ্রেণি", "10"], ["১০ম শ্রেণী", "10"],
    ["একাদশ শ্রেণী", "11"], ["১১শ", "11"], ["১১শ শ্রেণি", "11"], ["১১শ শ্রেণী", "11"],
    ["দ্বাদশ শ্রেণী", "12"], ["১২শ", "12"], ["১২শ শ্রেণি", "12"], ["১২শ শ্রেণী", "12"]
  ]);
  return classIdCodes.get(normalized) || aliases.get(normalized)
    || normalized.match(/(?:^|\D)(6|7|8|9|10|11|12)(?:$|\D)/)?.[1]?.padStart(2, "0");
}

function updateClassOptions() {
  const branch = byId("studentBranch").value;
  const schoolClasses = new Set(["ষষ্ঠ", "সপ্তম", "অষ্টম", "নবম", "দশম"]);
  const collegeClasses = new Set(["একাদশ", "দ্বাদশ"]);
  const allowedClasses = branch === "স্কুল" ? schoolClasses
    : branch === "কলেজ" ? collegeClasses
      : null;

  [...byId("studentClass").options].forEach((option) => {
    if (!option.value) return;
    const allowed = !allowedClasses || allowedClasses.has(option.value);
    option.hidden = !allowed;
    option.disabled = !allowed;
  });

  const selectedOption = byId("studentClass").selectedOptions[0];
  if (selectedOption?.value && selectedOption.disabled) byId("studentClass").value = "";
}

function updateBoardRegistrationOptions() {
  const completed = byId("boardRegistrationCompleted").checked;
  byId("boardRegistrationFields").hidden = !completed;
}

function updatePreviousExamOptions() {
  const selected = Boolean(byId("studentPreviousExam").value);
  byId("previousExamFields").hidden = !selected;
}

byId("studentBranch").addEventListener("change", () => {
  updateClassOptions();
  updateStudentTradeOptions();
  updateBoardRegistrationOptions();
});
byId("boardRegistrationCompleted").addEventListener("change", updateBoardRegistrationOptions);
byId("studentPreviousExam").addEventListener("change", updatePreviousExamOptions);
updateClassOptions();
updateStudentTradeOptions();
updateBoardRegistrationOptions();
updatePreviousExamOptions();

studentForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!currentAdmin || busy) return;

  const name = byId("studentName").value.trim();
  if (!name) {
    message("studentMessage", "শিক্ষার্থীর ইংরেজি নাম লিখুন।", true);
    byId("studentName").focus();
    return;
  }
  const branch = byId("studentBranch").value;
  const className = byId("studentClass").value.trim();
  const session = String(new Date().getFullYear());
  const trade = byId("studentTrade").value.trim();
  const editingDocumentId = editingStudentCode;
  const studentCode = byId("studentCode").value.trim();
  let roll = byId("studentRoll").value.trim();

  const existing = editingDocumentId
    ? students.find((student) => student.documentId === editingDocumentId)
    : studentCode ? students.find((student) => student.studentCode === studentCode) : null;
  const duplicateStudentCode = studentCode && students.some((student) =>
    student.studentCode === studentCode && student.documentId !== editingDocumentId
  );
  if (duplicateStudentCode || (existing && existing.documentId !== editingDocumentId)) {
    message("studentMessage", "এই শিক্ষার্থী আইডিটি আগে থেকেই আছে।", true);
    return;
  }

  const publicDirectoryId = existing?.publicDirectoryId || crypto.randomUUID();
  let photoUrl = existing?.photoUrl || "";
  const photoInput = byId("studentPhotoUrl").value.trim();
  if (photoInput) {
    try {
      photoUrl = normalizeStudentPhotoUrl(photoInput);
    } catch (error) {
      message("studentMessage", error.message, true);
      return;
    }
  }
  const data = {
    studentCode,
    session,
    publicDirectoryId,
    name,
    nameBn: byId("studentNameBn").value.trim(),
    branch,
    className,
    trade: byId("studentTrade").value.trim(),
    studentType: byId("studentType").value,
    studentSourceSession: byId("studentSourceSession").value.trim(),
    subjectCodes: byId("studentSubjectCodes").value.trim(),
    sourceTradeName: byId("studentSourceTradeName").value.trim(),
    roll,
    dob: byId("studentDob").value,
    gender: byId("studentGender").value,
    admissionDate: byId("studentAdmissionDate").value,
    academicYear: Number(byId("studentAcademicYear").value),
    fatherName: byId("studentFatherName").value.trim(),
    fatherNameBn: byId("studentFatherNameBn").value.trim(),
    motherName: byId("studentMotherName").value.trim(),
    motherNameBn: byId("studentMotherNameBn").value.trim(),
    guardianName: existing?.guardianName || "",
    guardianPhone: byId("studentGuardianPhone").value.trim(),
    emergencyPhone: byId("studentEmergencyPhone").value.trim(),
    village: byId("studentVillage").value.trim(),
    upazila: byId("studentUpazila").value.trim(),
    district: byId("studentDistrict").value.trim(),
    address: existing?.address || "",
    boardRegistrationCompleted: byId("boardRegistrationCompleted").checked,
    boardRoll: byId("boardRegistrationCompleted").checked ? byId("studentBoardRoll").value.trim() : "",
    boardRegistrationNumber: byId("boardRegistrationCompleted").checked ? byId("studentBoardRegistrationNumber").value.trim() : "",
    previousExam: byId("studentPreviousExam").value,
    previousExamRoll: byId("studentPreviousExam").value ? byId("studentPreviousExamRoll").value.trim() : "",
    previousExamGpa: byId("studentPreviousExam").value ? byId("studentPreviousExamGpa").value.trim() : "",
    previousExamRegistrationNumber: byId("studentPreviousExam").value ? byId("studentPreviousExamRegistration").value.trim() : "",
    previousExamSession: byId("studentPreviousExam").value ? byId("studentPreviousExamSession").value.trim() : "",
    previousExamPassingYear: byId("studentPreviousExam").value ? byId("studentPreviousExamPassingYear").value : "",
    photoUrl,
    published: byId("studentPublished").checked,
    updatedAt: serverTimestamp()
  };

  data.photoUrl = photoUrl;
  busy = true;
  byId("saveStudentButton").disabled = true;
  message("studentMessage", "শিক্ষার্থীর তথ্য সংরক্ষণ হচ্ছে...");
  try {
    message("studentMessage", "শিক্ষার্থীর তথ্য ডাটাবেজে সংরক্ষণ হচ্ছে...");
    const privateRef = editingDocumentId
      ? doc(db, studentsCollection, editingDocumentId)
      : doc(collection(db, studentsCollection));
    const publicRef = doc(db, publicStudentsCollection, publicDirectoryId);
    const privateData = {
      ...data,
      ...(existing ? {} : { createdAt: serverTimestamp(), createdBy: currentAdmin.uid })
    };
    const publicData = {
      name,
      studentCode: data.studentCode,
      session,
      academicYear: data.academicYear,
      branch,
      className,
      trade: data.trade,
      roll: data.roll,
      boardRoll: data.boardRoll,
      fatherName: data.fatherName,
      fatherNameBn: data.fatherNameBn,
      motherName: data.motherName,
      motherNameBn: data.motherNameBn,
      photoUrl,
      published: data.published,
      updatedAt: serverTimestamp()
    };

    if (existing) {
      const batch = writeBatch(db);
      batch.set(privateRef, privateData, { merge: true });
      batch.set(publicRef, publicData, { merge: true });
      await batch.commit();
    } else {
      await runTransaction(db, async (transaction) => {
        const existingStudent = await transaction.get(privateRef);
        if (existingStudent.exists()) {
          const duplicateIdError = new Error("এই সেশন, শ্রেণি, ট্রেড ও রোলের আইডি আগে থেকেই আছে।");
          duplicateIdError.code = "student-id-already-exists";
          throw duplicateIdError;
        }
        transaction.set(privateRef, privateData);
        transaction.set(publicRef, publicData);
      });
    }
    resetStudentForm();
    message("studentMessage", existing
      ? "শিক্ষার্থীর তথ্য হালনাগাদ হয়েছে।"
      : "নতুন শিক্ষার্থীর তথ্য সংরক্ষিত হয়েছে। রোল নম্বর ও শিক্ষার্থী আইডি শুধু হাতে দিলে সংরক্ষিত হবে।");
    await loadStudents();
  } catch (error) {
    console.error("শিক্ষার্থী সংরক্ষণের সমস্যা:", error);
    const errorMessage = error.code === "student-id-already-exists"
      ? error.message
      : `সংরক্ষণ করা যায়নি। Firebase error: ${error.code || "unknown"}`;
    message("studentMessage", errorMessage, true);
  } finally {
    busy = false;
    byId("saveStudentButton").disabled = false;
  }
});

studentImportButton.addEventListener("click", async () => {
  if (!currentAdmin || busy) return;
  const file = studentImportFile.files?.[0];
  if (!file) {
    message("studentImportMessage", "আমদানি করার JSON ফাইল নির্বাচন করুন।", true);
    return;
  }

  studentImportButton.disabled = true;
  busy = true;
  let savedCount = 0;
  try {
    const payload = JSON.parse(await file.text());
    if (payload.schemaVersion !== 1 || !Array.isArray(payload.records) || !payload.records.length) {
      throw new Error("ফাইলের ধরন সঠিক নয় বা এতে শিক্ষার্থীর তথ্য নেই।");
    }
    const importKeys = payload.records.map((record) => record.sourceImportKey);
    if (importKeys.some((key) => !key) || new Set(importKeys).size !== importKeys.length) {
      throw new Error("ফাইলে উৎস-রেফারেন্স নেই বা একই রেফারেন্স একাধিকবার আছে।");
    }

    const currentSnapshot = await getDocs(collection(db, studentsCollection));
    const currentStudents = currentSnapshot.docs.map((item) => ({ ...item.data(), documentId: item.id }));
    students = currentStudents;
    const keyedRecords = new Map(currentStudents.filter((student) => student.sourceImportKey)
      .map((student) => [student.sourceImportKey, student]));
    const boardRollRecords = new Map(currentStudents.filter((student) => student.boardRoll)
      .map((student) => [normalizeDigits(String(student.boardRoll)).replace(/\D/g, ""), student]));
    const registrationRecords = new Map(currentStudents.filter((student) => student.boardRegistrationNumber)
      .map((student) => [normalizeDigits(String(student.boardRegistrationNumber)).replace(/\D/g, ""), student]));
    const pending = payload.records.map((record) => {
      const boardRoll = normalizeDigits(String(record.boardRoll || "")).replace(/\D/g, "");
      const registration = normalizeDigits(String(record.boardRegistrationNumber || "")).replace(/\D/g, "");
      const existing = keyedRecords.get(record.sourceImportKey)
        || (boardRoll && boardRollRecords.get(boardRoll))
        || (registration && registrationRecords.get(registration));
      return { record, existing, documentId: existing?.documentId || doc(collection(db, studentsCollection)).id };
    });
    const skipped = pending.filter(({ existing }) => existing).length;
    if (!pending.length) {
      message("studentImportMessage", `এই ফাইলের সব ${bn(payload.records.length)}টি রেকর্ড আগে থেকেই ডাটাবেজে আছে।`);
      renderStudents();
      return;
    }

    const importedAt = serverTimestamp();
    const prepared = pending.map(({ record, existing, documentId }) => {
      const classCode = getClassCode(String(record.className || ""));
      const trade = String(record.trade || "").trim();
      if (!classCode || !tradeIdCodes.has(trade.toLocaleLowerCase()) || !record.name || !record.fatherName || !record.motherName) {
        throw new Error(`ফাইলে শ্রেণি, ট্রেড বা নামের তথ্য অসম্পূর্ণ আছে (উৎস: ${record.sourceImportKey})।`);
      }
      return {
        documentId,
        studentCode: existing?.studentCode || "",
        session: existing?.session || String(record.sourceSession || ""),
        publicDirectoryId: existing?.publicDirectoryId || crypto.randomUUID(),
        sourceImportKey: record.sourceImportKey,
        sourceSheet: String(record.sourceSheet || ""),
        sourceTradeName: String(record.sourceTradeName || ""),
        studentSourceSession: String(record.sourceSession || ""),
        studentType: String(record.studentType || ""),
        subjectCodes: String(record.subjectCodes || ""),
        name: String(record.name).trim(),
        nameBn: existing?.nameBn || "",
        branch: String(record.branch),
        className: String(record.className),
        trade,
        roll: existing?.roll || "",
        dob: existing?.dob || "",
        gender: existing?.gender || "",
        admissionDate: existing?.admissionDate || "",
        academicYear: existing?.academicYear || Number(new Date().getFullYear()),
        fatherName: String(record.fatherName).trim(),
        fatherNameBn: existing?.fatherNameBn || "",
        motherName: String(record.motherName).trim(),
        motherNameBn: existing?.motherNameBn || "",
        guardianName: existing?.guardianName || "",
        guardianPhone: existing?.guardianPhone || "",
        emergencyPhone: existing?.emergencyPhone || "",
        village: existing?.village || "",
        upazila: existing?.upazila || "",
        district: existing?.district || "",
        address: existing?.address || "",
        boardRegistrationCompleted: Boolean(record.boardRoll || record.boardRegistrationNumber),
        boardRoll: String(record.boardRoll || ""),
        boardRegistrationNumber: String(record.boardRegistrationNumber || ""),
        previousExam: "",
        previousExamRoll: "",
        previousExamGpa: "",
        previousExamRegistrationNumber: "",
        previousExamSession: "",
        previousExamPassingYear: "",
        photoUrl: existing?.photoUrl || "",
        published: existing?.published === true,
        ...(existing ? {} : { createdAt: importedAt, createdBy: currentAdmin.uid }),
        updatedAt: importedAt
      };
    });

    if (!window.confirm(`${bn(prepared.length - skipped)}টি নতুন এবং ${bn(skipped)}টি বিদ্যমান শিক্ষার্থী রেকর্ড ডাটাবেজে হালনাগাদ হবে। নতুন রেকর্ডে ক্লাস রোল ও শিক্ষার্থী আইডি ফাঁকা থাকবে। নতুন রেকর্ড অপ্রকাশিত থাকবে; বিদ্যমান রেকর্ডের প্রকাশ অবস্থা অপরিবর্তিত থাকবে। চালিয়ে যাবেন?`)) {
      message("studentImportMessage", "আমদানি বাতিল করা হয়েছে।");
      return;
    }

    for (let start = 0; start < prepared.length; start += 80) {
      const chunk = prepared.slice(start, start + 80);
      const batch = writeBatch(db);
      chunk.forEach((student) => {
        const { documentId, ...data } = student;
        batch.set(doc(db, studentsCollection, documentId), data, { merge: true });
      });
      await batch.commit();
      savedCount += chunk.length;
      message("studentImportMessage", `${bn(savedCount)} / ${bn(prepared.length)}টি রেকর্ড যোগ হয়েছে...`);
    }

    await loadStudents();
    message("studentImportMessage", `${bn(savedCount - skipped)}টি নতুন রেকর্ড যোগ এবং ${bn(skipped)}টি বিদ্যমান রেকর্ড হালনাগাদ হয়েছে। নতুন রেকর্ডে ক্লাস রোল ও শিক্ষার্থী আইডি ফাঁকা রাখা হয়েছে; বিদ্যমান রেকর্ডের প্রকাশ অবস্থা অপরিবর্তিত আছে।`);
  } catch (error) {
    console.error("শিক্ষার্থী আমদানির সমস্যা:", error);
    message("studentImportMessage", `${bn(savedCount)}টি রেকর্ড যোগ হয়েছে; বাকিগুলো সম্পন্ন হয়নি। ${error.message || "ডাটাবেজে সংরক্ষণ করা যায়নি।"}`, true);
  } finally {
    busy = false;
    studentImportButton.disabled = false;
  }
});

studentPublishImportedButton.addEventListener("click", async () => {
  if (!currentAdmin || busy) return;
  const importedStudents = students.filter((student) => student.sourceImportKey);
  if (!importedStudents.length) {
    message("studentPublishImportedMessage", "আমদানি করা কোনো শিক্ষার্থী পাওয়া যায়নি।", true);
    return;
  }

  const approved = window.confirm(
    `${bn(importedStudents.length)} জন আমদানি করা শিক্ষার্থীর প্রকাশিত তালিকা হালনাগাদ হবে। এতে নাম, আইডি, শিক্ষাবর্ষ, শাখা, শ্রেণি, ট্রেড, রোল, বোর্ড রোল, পিতা-মাতার নাম ও ছবির অবস্থা থাকবে। জন্মতারিখ, যোগাযোগ ও বোর্ড রেজিস্ট্রেশন নম্বর প্রকাশ হবে না। এখন প্রকাশ/হালনাগাদ করবেন?`
  );
  if (!approved) return;

  busy = true;
  studentPublishImportedButton.disabled = true;
  let publishedCount = 0;
  try {
    for (let start = 0; start < importedStudents.length; start += 200) {
      const chunk = importedStudents.slice(start, start + 200);
      const batch = writeBatch(db);
      chunk.forEach((student) => {
        if (!student.publicDirectoryId || !student.documentId) {
          throw new Error(`প্রকাশিত তালিকার আইডি নেই: ${student.studentCode}`);
        }
        const updatedAt = serverTimestamp();
        batch.set(doc(db, studentsCollection, student.documentId), { published: true, updatedAt }, { merge: true });
        batch.set(doc(db, publicStudentsCollection, student.publicDirectoryId), {
          name: student.name || "",
          studentCode: student.studentCode,
          session: student.session || "",
          academicYear: student.academicYear || student.session || "",
          branch: student.branch || "",
          className: student.className || "",
          trade: student.trade || "",
          roll: student.roll || "",
          boardRoll: student.boardRoll || "",
          fatherName: student.fatherName || "",
          fatherNameBn: student.fatherNameBn || "",
          motherName: student.motherName || "",
          motherNameBn: student.motherNameBn || "",
          photoUrl: student.photoUrl || "",
          published: true,
          updatedAt
        }, { merge: true });
      });
      await batch.commit();
      publishedCount += chunk.length;
      message("studentPublishImportedMessage", `${bn(publishedCount)} / ${bn(importedStudents.length)} জন হালনাগাদ হয়েছে...`);
    }
    await loadStudents();
    message("studentPublishImportedMessage", `${bn(publishedCount)} জন আমদানি করা শিক্ষার্থীর প্রকাশিত তথ্য হালনাগাদ হয়েছে।`);
  } catch (error) {
    console.error("আমদানি করা শিক্ষার্থীদের প্রকাশে সমস্যা:", error);
    message("studentPublishImportedMessage", `${bn(publishedCount)} জন প্রকাশিত হয়েছে; বাকিগুলো হয়নি। ${error.message || "প্রকাশ করা যায়নি।"}`, true);
  } finally {
    busy = false;
    studentPublishImportedButton.disabled = false;
  }
});

studentRows.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const student = students.find((item) => (item.documentId || item.studentCode) === button.dataset.id);
  if (!student) return;
  if (button.dataset.action === "delete-student") {
    deleteStudentAndRelatedRecords(student);
    return;
  }
  if (button.dataset.action !== "edit-student") return;

  editingStudentCode = student.documentId || student.studentCode;
  byId("studentCode").value = student.studentCode || "";
  byId("studentCode").readOnly = false;
  byId("studentName").value = student.name || "";
  byId("studentNameBn").value = student.nameBn || "";
  byId("studentBranch").value = student.branch === "স্কুল" || student.branch === "SCHOOL" ? "স্কুল"
    : student.branch === "কলেজ" || student.branch === "COLLEGE" ? "কলেজ"
      : student.branch || "";
  updateClassOptions();
  byId("studentClass").value = classCodeValues.get(getClassCode(student.className || "")) || "";
  byId("boardRegistrationCompleted").checked = student.boardRegistrationCompleted === true;
  byId("studentBoardRoll").value = student.boardRoll || "";
  byId("studentBoardRegistrationNumber").value = student.boardRegistrationNumber || "";
  updateBoardRegistrationOptions();
  byId("studentPreviousExam").value = student.previousExam || "";
  byId("studentPreviousExamRoll").value = student.previousExamRoll || "";
  byId("studentPreviousExamGpa").value = student.previousExamGpa || "";
  byId("studentPreviousExamRegistration").value = student.previousExamRegistrationNumber || "";
  byId("studentPreviousExamSession").value = student.previousExamSession || "";
  byId("studentPreviousExamPassingYear").value = student.previousExamPassingYear || "";
  updatePreviousExamOptions();
  byId("studentTrade").value = student.trade || "";
  byId("studentType").value = student.studentType || "";
  byId("studentSourceSession").value = student.studentSourceSession || "";
  byId("studentSubjectCodes").value = student.subjectCodes || "";
  byId("studentSourceTradeName").value = student.sourceTradeName || "";
  byId("studentRoll").value = student.roll || "";
  byId("studentDob").value = student.dob || "";
  byId("studentGender").value = student.gender || "";
  byId("studentAdmissionDate").value = student.admissionDate || "";
  byId("studentAcademicYear").value = student.academicYear || String(new Date().getFullYear());
  byId("studentFatherName").value = student.fatherName || "";
  byId("studentFatherNameBn").value = student.fatherNameBn || "";
  byId("studentMotherName").value = student.motherName || "";
  byId("studentMotherNameBn").value = student.motherNameBn || "";
  const legacyParentNameNotice = byId("legacyParentNameNotice");
  if (student.guardianName && !student.fatherName && !student.motherName) {
    legacyParentNameNotice.textContent = `আগের রেকর্ডে সংরক্ষিত অভিভাবকের নাম: ${student.guardianName}। যাচাই করে পিতা বা মাতার ঘরে দিন।`;
    legacyParentNameNotice.hidden = false;
  } else {
    legacyParentNameNotice.hidden = true;
    legacyParentNameNotice.textContent = "";
  }
  byId("studentGuardianPhone").value = student.guardianPhone || "";
  byId("studentEmergencyPhone").value = student.emergencyPhone || "";
  byId("studentPhotoUrl").value = student.photoUrl || "";
  byId("studentVillage").value = student.village || "";
  byId("studentUpazila").value = student.upazila || "";
  byId("studentDistrict").value = student.district || "";
  const legacyAddressNotice = byId("legacyAddressNotice");
  if (student.address && !student.village && !student.upazila && !student.district) {
    legacyAddressNotice.textContent = `আগের রেকর্ডে সংরক্ষিত ঠিকানা: ${student.address}। যাচাই করে গ্রাম, উপজেলা ও জেলা আলাদা ঘরে দিন।`;
    legacyAddressNotice.hidden = false;
  } else {
    legacyAddressNotice.hidden = true;
    legacyAddressNotice.textContent = "";
  }
  byId("studentPublished").checked = student.published === true;
  setStudentFormRequirements(student);
  byId("saveStudentButton").textContent = "পরিবর্তন সংরক্ষণ";
  byId("cancelStudentEdit").hidden = false;
  studentForm.scrollIntoView({ behavior: "smooth", block: "start" });
});

async function deleteStudentAndRelatedRecords(student) {
  if (!currentAdmin || busy) return;
  const approved = window.confirm(
    `${student.name} (${student.studentCode})-এর শিক্ষার্থী প্রোফাইল, প্রকাশিত তালিকা, ফি, ফলাফল ও সংরক্ষিত ড্রাফট স্থায়ীভাবে মুছে যাবে। চালিয়ে যাবেন?`
  );
  if (!approved) return;

  busy = true;
  try {
    message("studentMessage", `${student.name}-এর সংশ্লিষ্ট তথ্য খোঁজা হচ্ছে...`);
    const relatedCollections = [
      feesCollection,
      resultsCollection,
      resultDraftsCollection,
      publicResultsCollection,
      publicStudentsCollection
    ];
    const relatedSnapshots = student.studentCode
      ? await Promise.all(relatedCollections.map((name) =>
        getDocs(query(collection(db, name), where("studentCode", "==", student.studentCode)))
      ))
      : [];

    const refs = new Map();
    const addRef = (reference) => refs.set(reference.path, reference);
    addRef(doc(db, studentsCollection, student.documentId || student.studentCode));
    if (student.publicDirectoryId) addRef(doc(db, publicStudentsCollection, student.publicDirectoryId));
    relatedSnapshots.forEach((snapshot) => snapshot.docs.forEach((item) => addRef(item.ref)));

    const allRefs = [...refs.values()];
    let removedCount = 0;
    for (let start = 0; start < allRefs.length; start += 450) {
      const batch = writeBatch(db);
      allRefs.slice(start, start + 450).forEach((reference) => batch.delete(reference));
      await batch.commit();
      removedCount += Math.min(450, allRefs.length - start);
    }

    if (editingStudentCode === (student.documentId || student.studentCode)) resetStudentForm();
    await Promise.all([loadStudents(), loadFees(), loadResults()]);
    message("studentMessage", `${student.name} (${student.studentCode})-এর ${bn(removedCount)}টি সংশ্লিষ্ট রেকর্ড মুছে ফেলা হয়েছে।`);
  } catch (error) {
    console.error("শিক্ষার্থী ও সংশ্লিষ্ট তথ্য মুছতে সমস্যা:", error);
    message("studentMessage", error.message || "সংশ্লিষ্ট রেকর্ড মুছে ফেলা যায়নি।", true);
  } finally {
    busy = false;
  }
}

byId("cancelStudentEdit").addEventListener("click", resetStudentForm);

function updateLateFineField() {
  const isBoardRegistrationFee = byId("feeType").value === "বোর্ড রেজিস্ট্রেশন ফি";
  byId("feeLateFineField").hidden = !isBoardRegistrationFee;
  if (!isBoardRegistrationFee) byId("feeLateFine").value = "0";
  const isMonthlyTuition = ["মাসিক বেতন", "Monthly Tuition"].includes(byId("feeType").value);
  byId("feeMonthsField").hidden = !isMonthlyTuition;
  byId("feeAmountCaption").textContent = isMonthlyTuition
    ? feeText("প্রতি মাসের পরিমাণ (টাকা)", "Amount per month (BDT)")
    : feeText("পরিমাণ (টাকা)", "Amount (BDT)");
}

function selectedFeeMonths() {
  const year = String(byId("feeMonthsYear").value || "");
  return [...byId("feeMonthChoices").querySelectorAll('input[type="checkbox"]:checked')]
    .map((input) => `${year}-${input.value}`)
    .sort((a, b) => a.localeCompare(b));
}

function updateFeeMonthSelectionCount() {
  const checked = [...byId("feeMonthChoices").querySelectorAll('input[type="checkbox"]:checked')];
  const isEnglish = document.documentElement.lang === "en";
  byId("feeMonthSelectionCount").textContent = isEnglish
    ? `${checked.length} months selected`
    : checked.length ? `${bn(checked.length)} মাস নির্বাচিত` : "কোনো মাস নির্বাচিত নয়";
  byId("feeSelectAllMonths").checked = checked.length === 12;
}

byId("feeMonthChoices").addEventListener("change", updateFeeMonthSelectionCount);
byId("feeSelectAllMonths").addEventListener("change", (event) => {
  byId("feeMonthChoices").querySelectorAll('input[type="checkbox"]').forEach((input) => {
    input.checked = event.target.checked;
  });
  updateFeeMonthSelectionCount();
});

byId("feeType").addEventListener("change", updateLateFineField);
updateLateFineField();

feeForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!currentAdmin || busy) return;
  const selectedCodes = selectedFeeStudentCodes();
  const selectedStudents = students.filter((student) => selectedCodes.has(student.studentCode))
    .sort((a, b) => rollNumber(a) - rollNumber(b) || (a.name || "").localeCompare(b.name || "", "bn"));
  const isMonthlyTuition = ["মাসিক বেতন", "Monthly Tuition"].includes(byId("feeType").value);
  const monthKeys = isMonthlyTuition ? selectedFeeMonths() : [];
  const amount = Number(byId("feeAmount").value);
  const lateFine = byId("feeType").value === "বোর্ড রেজিস্ট্রেশন ফি"
    ? Number(byId("feeLateFine").value || 0)
    : 0;
  if (!selectedStudents.length || !feeClassSelect.value || !feeTradeSelect.value
      || !Number.isFinite(amount) || amount <= 0 || !Number.isFinite(lateFine) || lateFine < 0
      || !byId("feeDate").value || (isMonthlyTuition && (!monthKeys.length || !/^\d{4}$/.test(byId("feeMonthsYear").value)))) {
    message("feeMessage", feeText("শ্রেণি, ট্রেড, অন্তত একজন শিক্ষার্থী ও সঠিক জমার তথ্য দিন।", "Choose a class, trade, at least one student, and valid payment details."), true);
    return;
  }

  busy = true;
  byId("saveFeeButton").disabled = true;
  message("feeMessage", feeText("জমার তথ্য সংরক্ষণ হচ্ছে...", "Saving payments..."));
  try {
    const paymentDate = byId("feeDate").value;
    const dateKey = paymentDate.replaceAll("-", "");
    const sameDaySnapshot = await getDocs(query(
      collection(db, feesCollection),
      where("paymentDate", "==", paymentDate)
    ));
    const lastDailySerial = sameDaySnapshot.docs.reduce((latest, item) => {
      const match = String(item.data().receipt || "").match(new RegExp(`^${dateKey}-(\\d+)$`));
      return match ? Math.max(latest, Number(match[1])) : latest;
    }, 0);
    const payments = selectedStudents.map((student, index) => {
      const reference = doc(collection(db, feesCollection));
      const receiptSerial = String(lastDailySerial + index + 1).padStart(3, "0");
      const receipt = `${dateKey}-${receiptSerial}`;
      return {
        reference,
        data: {
          studentCode: student.studentCode,
          studentName: student.name,
          branch: student.branch,
          className: student.className,
          trade: student.trade,
          roll: student.roll,
          type: byId("feeType").value,
          month: monthKeys[0] || "",
          months: monthKeys,
          monthlyAmount: isMonthlyTuition ? amount : null,
          amount: isMonthlyTuition ? amount * monthKeys.length : amount,
          lateFine,
          totalAmount: (isMonthlyTuition ? amount * monthKeys.length : amount) + lateFine,
          paymentDate,
          method: byId("feeMethod").value,
          receipt,
          note: byId("feeNote").value.trim(),
          createdAt: serverTimestamp(),
          createdBy: currentAdmin.uid
        }
      };
    });
    for (let start = 0; start < payments.length; start += 450) {
      const batch = writeBatch(db);
      payments.slice(start, start + 450).forEach(({ reference, data }) => batch.set(reference, data));
      await batch.commit();
    }
    feeStudentList.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => { checkbox.checked = false; });
    byId("feeType").value = "";
    byId("feeAmount").value = "";
    byId("feeLateFine").value = "0";
    byId("feeNote").value = "";
    byId("feeMonthChoices").querySelectorAll('input[type="checkbox"]').forEach((input) => { input.checked = false; });
    byId("feeSelectAllMonths").checked = false;
    updateFeeMonthSelectionCount();
    updateLateFineField();
    updateFeeSelectionCount();
    message("feeMessage", feeText(
      `${bn(payments.length)} জন শিক্ষার্থীর জমা সংরক্ষিত হয়েছে। প্রত্যেকের রসিদ নম্বর তৈরি হয়েছে।`,
      `Payments saved for ${bn(payments.length)} students. A receipt number was generated for each student.`
    ));
    await loadFees();
  } catch (error) {
    console.error("ফি সংরক্ষণের সমস্যা:", error);
    message("feeMessage", feeText("জমার তথ্য সংরক্ষণ হয়নি। Firestore access rules পরীক্ষা করুন।", "Could not save payments. Check Firestore access rules."), true);
  } finally {
    busy = false;
    byId("saveFeeButton").disabled = false;
  }
});

async function loadFees() {
  const snapshot = await getDocs(collection(db, feesCollection));
  feeRecords = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
  refreshFeeRecordFilterOptions();
  updateAccountIncomeTradeOptions();
  renderFeeRecords();
  renderFeeSpreadsheet();
  renderAdmitFeeSpreadsheet();
  renderAccountIncome();
}

function refreshFeeRecordFilterOptions() {
  if (!byId("feeFilterClass")) return;
  const classes = [...new Set([
    ...students.map((student) => student.className),
    ...feeRecords.map((record) => record.className)
  ].filter(Boolean))].sort((a, b) => a.localeCompare(b, "bn"));
  const trades = [...new Set([
    ...students.map((student) => student.trade),
    ...feeRecords.map((record) => record.trade)
  ].filter(Boolean))].sort((a, b) => a.localeCompare(b, "bn"));
  const fill = (select, firstLabel, values) => {
    const previous = select.value;
    select.replaceChildren(new Option(firstLabel, ""));
    values.forEach((entry) => {
      const value = typeof entry === "string" ? entry : entry.value;
      const label = typeof entry === "string" ? feeDisplay(entry) : entry.label;
      select.add(new Option(label, value));
    });
    if (values.some((entry) => (typeof entry === "string" ? entry : entry.value) === previous)) select.value = previous;
  };
  fill(byId("feeFilterClass"), feeText("সব শ্রেণি", "All Classes"), classes.map((value) => ({ value, label: feeDisplay(value) })));
  fill(byId("feeFilterTrade"), feeText("সব ট্রেড", "All Trades"), trades.map((value) => ({ value, label: feeDisplay(value) })));
}

function filteredFeeRecords() {
  const from = byId("feeFilterFrom").value;
  const to = byId("feeFilterTo").value;
  const className = byId("feeFilterClass").value;
  const trade = byId("feeFilterTrade").value;
  const type = byId("feeFilterType").value;
  const createdTime = (record) => {
    if (typeof record.createdAt?.toMillis === "function") return record.createdAt.toMillis();
    const parsed = Date.parse(record.createdAt || "");
    return Number.isFinite(parsed) ? parsed : 0;
  };
  return feeRecords.filter((record) =>
    (!from || (record.paymentDate || "") >= from)
    && (!to || (record.paymentDate || "") <= to)
    && (!className || record.className === className)
    && (!trade || record.trade === trade)
    && (!type || record.type === type)
  ).sort((a, b) => (b.paymentDate || "").localeCompare(a.paymentDate || "")
    || createdTime(b) - createdTime(a)
    || String(b.receipt || "").localeCompare(String(a.receipt || ""))
    || rollNumber({ roll: a.roll }) - rollNumber({ roll: b.roll }));
}

function renderFeeRecords() {
  const records = filteredFeeRecords();
  feeRows.replaceChildren();
  if (!records.length) {
    const row = feeRows.insertRow();
    cell(row, feeRecords.length
      ? feeText("এই ফিল্টারে কোনো জমার তথ্য নেই।", "No payments match these filters.")
      : feeText("এখনো কোনো জমার তথ্য নেই।", "No payments have been recorded yet.")).colSpan = 8;
    return;
  }
  for (const record of records) {
    const row = feeRows.insertRow();
    cell(row, formatDate(record.paymentDate));
    cell(row, `${record.studentName || ""} (${record.studentCode || ""})`);
    cell(row, `${feeDisplay(record.className)} / ${feeDisplay(record.trade)}`);
    cell(row, feeDisplay(record.type));
    cell(row, formatFeeMonths(record));
    const isEnglish = document.documentElement.lang === "en";
    const fineNote = Number(record.lateFine) > 0
      ? (isEnglish ? ` (late fine BDT ${bn(record.lateFine)})` : ` (লেট ফাইন ৳${bn(record.lateFine)})`)
      : "";
    cell(row, `${isEnglish ? "BDT " : "৳"}${bn(record.totalAmount ?? record.amount ?? 0)}${fineNote}`);
    cell(row, record.receipt || "—");
    const action = cell(row, "");
    action.className = "table-actions-cell";
    action.append(actionButton(feeText("রসিদ / প্রিন্ট", "Receipt / Print"), "fee-receipt", record.id));
  }
}

const feeSheetMonthsBn = ["জানু", "ফেব্রু", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টে", "অক্টো", "নভে", "ডিসে"];
const feeSheetMonthsEn = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function monthlyPaymentEntries(record, reportYear) {
  const values = Array.isArray(record.months) && record.months.length ? record.months : [record.month];
  const validValues = values.filter(Boolean);
  const perMonthAmount = Number(record.monthlyAmount ?? ((record.totalAmount ?? record.amount ?? 0) / Math.max(validValues.length, 1)));
  return validValues.map((value) => {
    const monthValue = normalizeDigits(String(value || "").trim());
    const isoMonth = monthValue.match(/^(\d{4})-(\d{1,2})$/);
    if (isoMonth) return Number(isoMonth[1]) === reportYear ? [Number(isoMonth[2]), perMonthAmount] : null;
    const simpleMonth = monthValue.match(/^(\d{1,2})$/);
    if (simpleMonth && Number(String(record.paymentDate || "").slice(0, 4)) === reportYear) return [Number(simpleMonth[1]), perMonthAmount];
    return null;
  }).filter((entry) => entry && entry[0] >= 1 && entry[0] <= 12);
}

function feeSpreadsheetRows(reportYear, className, trade) {
  if (!Number.isInteger(reportYear)) return null;
  const roster = students.filter((student) => (!className || student.className === className)
      && tradeMatches(student.trade, trade))
    .sort((a, b) => rollNumber(a) - rollNumber(b) || (a.name || "").localeCompare(b.name || "", "bn"));
  const paymentGrid = new Map(roster.map((student) => [student.studentCode, Array(12).fill(0)]));
  feeRecords.forEach((record) => {
    if (!paymentGrid.has(record.studentCode) || !["মাসিক বেতন", "Monthly Tuition"].includes(record.type)) return;
    monthlyPaymentEntries(record, reportYear).forEach(([month, amount]) => {
      paymentGrid.get(record.studentCode)[month - 1] += amount;
    });
  });
  return roster.map((student) => {
    const months = paymentGrid.get(student.studentCode);
    return { student, months, total: months.reduce((sum, amount) => sum + amount, 0) };
  });
}

function renderFeeSpreadsheetInto(prefix) {
  const yearId = `${prefix}Year`;
  const classId = `${prefix}Class`;
  const tradeId = `${prefix}Trade`;
  const head = byId(`${prefix}Head`);
  const body = byId(`${prefix}Rows`);
  const foot = byId(`${prefix}Foot`);
  if (!head || !body) return;
  const reportYear = Number(byId(yearId).value);
  const className = byId(classId).value;
  const trade = byId(tradeId).value;
  const isEnglish = document.documentElement.lang === "en";
  const months = isEnglish ? feeSheetMonthsEn : feeSheetMonthsBn;
  const headings = [
    feeText("রোল", "Roll"), feeText("শিক্ষার্থীর নাম", "Student Name"), feeText("শিক্ষার্থী আইডি", "Student ID"),
    ...months, feeText("মোট জমা", "Annual Total")
  ];
  const headerRow = document.createElement("tr");
  headings.forEach((heading) => {
    const th = document.createElement("th");
    th.textContent = heading;
    headerRow.append(th);
  });
  head.replaceChildren(headerRow);
  body.replaceChildren();
  foot.replaceChildren();
  const rows = feeSpreadsheetRows(reportYear, className, trade);
  if (!rows) {
    byId(`${prefix}Summary`).textContent = "";
    return;
  }
  let grandTotal = 0;
  const monthlyTotals = Array(12).fill(0);
  rows.forEach(({ student, months: paidAmounts, total }) => {
    grandTotal += total;
    paidAmounts.forEach((amount, index) => { monthlyTotals[index] += amount; });
    const row = body.insertRow();
    cell(row, student.roll || "—");
    cell(row, student.name || "—");
    cell(row, student.studentCode || "—");
    paidAmounts.forEach((amount) => cell(row, amount ? `${isEnglish ? "BDT " : "৳"}${bn(amount)}` : "—"));
    cell(row, `${isEnglish ? "BDT " : "৳"}${bn(total)}`);
  });
  if (!rows.length) {
    const row = body.insertRow();
    cell(row, feeText("এই শ্রেণি ও ট্রেডে কোনো শিক্ষার্থী নেই।", "No students found for this class and trade.")).colSpan = 16;
  }
  const totalRow = foot.insertRow();
  const totalLabel = cell(totalRow, feeText("সর্বমোট গৃহীত অর্থ", "Total Amount Received"));
  totalLabel.colSpan = 3;
  monthlyTotals.forEach((amount) => cell(totalRow, amount ? `${isEnglish ? "BDT " : "৳"}${bn(amount)}` : "—"));
  cell(totalRow, `${isEnglish ? "BDT " : "৳"}${bn(grandTotal)}`);
  const selectedClass = className ? feeDisplay(className) : feeText("সব শ্রেণি", "All Classes");
  const selectedTrade = trade ? feeDisplay(trade) : feeText("সব ট্রেড", "All Trades");
  byId(`${prefix}Summary`).textContent = isEnglish
    ? `${bn(rows.length)} students · ${selectedClass} · ${selectedTrade} · ${bn(reportYear)} · Total received: BDT ${bn(grandTotal)}`
    : `${bn(rows.length)} জন শিক্ষার্থী · ${selectedClass} · ${selectedTrade} · ${bn(reportYear)} · মোট গৃহীত অর্থ: ৳${bn(grandTotal)}`;
}

function renderFeeSpreadsheet() {
  renderFeeSpreadsheetInto("feeSheet");
}

function renderAdmitFeeSpreadsheet() {
  renderFeeSpreadsheetInto("admitFeeSheet");
}

byId("feeSheetClass").addEventListener("change", () => {
  byId("feeSheetTrade").value = "";
  updateFeeSheetTradeOptions();
});
byId("feeSheetTrade").addEventListener("change", renderFeeSpreadsheet);
byId("feeSheetYear").addEventListener("input", renderFeeSpreadsheet);
byId("admitFeeSheetClass").addEventListener("change", () => {
  byId("admitFeeSheetTrade").value = "";
  updateFeeSheetTradeOptions("admitFeeSheetTrade", "admitFeeSheetClass", renderAdmitFeeSpreadsheet);
  updateAdmitExamOptions();
  resetAdmitSelection();
});
byId("admitFeeSheetTrade").addEventListener("change", () => {
  renderAdmitFeeSpreadsheet();
  resetAdmitSelection();
});
byId("admitFeeSheetYear").addEventListener("input", () => {
  renderAdmitFeeSpreadsheet();
  updateAdmitExamOptions();
  resetAdmitSelection();
});

function filteredAccountIncomeRecords() {
  const from = byId("accountIncomeFrom").value;
  const to = byId("accountIncomeTo").value;
  return feeRecords.filter((record) =>
    (!from || (record.paymentDate || "") >= from)
    && (!to || (record.paymentDate || "") <= to)
    && (!byId("accountIncomeClass").value || record.className === byId("accountIncomeClass").value)
    && (!byId("accountIncomeTrade").value || record.trade === byId("accountIncomeTrade").value)
  );
}

function renderAccountIncome() {
  const records = filteredAccountIncomeRecords();
  const groups = new Map();
  records.forEach((record) => {
    const type = record.type || feeText("অন্যান্য", "Other");
    const group = groups.get(type) || { count: 0, total: 0 };
    group.count += 1;
    group.total += Number(record.totalAmount ?? record.amount ?? 0);
    groups.set(type, group);
  });
  const rows = [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0], "bn"));
  const total = rows.reduce((sum, [, group]) => sum + group.total, 0);
  byId("accountIncomeTotal").textContent = `${feeText("মোট আদায়", "Total Received")}: ${document.documentElement.lang === "en" ? "BDT " : "৳"}${bn(total)}`;
  const body = byId("accountIncomeRows");
  body.replaceChildren();
  if (!rows.length) {
    const row = body.insertRow();
    cell(row, feeText("এই ফিল্টারে কোনো আদায়ের তথ্য নেই।", "No receipts match these filters.")).colSpan = 3;
    return;
  }
  rows.forEach(([type, group]) => {
    const row = body.insertRow();
    cell(row, feeDisplay(type));
    cell(row, bn(group.count));
    cell(row, `${document.documentElement.lang === "en" ? "BDT " : "৳"}${bn(group.total)}`);
  });
}

const expenseCategoryNames = new Map([
  ["শিক্ষক-কর্মচারীর বেতন/ভাতা", "Teacher and Staff Salary/Benefits"], ["বিদ্যুৎ ও ইউটিলিটি", "Electricity and Utilities"],
  ["শিক্ষা উপকরণ", "Educational Supplies"], ["মেরামত ও রক্ষণাবেক্ষণ", "Repairs and Maintenance"],
  ["অফিস ও প্রশাসনিক", "Office and Administration"], ["যাতায়াত", "Transportation"], ["অন্যান্য", "Other"]
]);
function expenseDisplay(value) {
  return document.documentElement.lang === "en" ? (expenseCategoryNames.get(value) || value || "—") : (value || "—");
}

async function loadExpenses() {
  const snapshot = await getDocs(collection(db, expensesCollection));
  expenseRecords = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
  const select = byId("expenseFilterCategory");
  const previous = select.value;
  select.replaceChildren(new Option(feeText("সব ধরন", "All Categories"), ""));
  [...new Set(expenseRecords.map((record) => record.category).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, "bn"))
    .forEach((category) => select.add(new Option(expenseDisplay(category), category)));
  if ([...select.options].some((option) => option.value === previous)) select.value = previous;
  renderExpenses();
}

function filteredExpenses() {
  const from = byId("expenseFilterFrom").value;
  const to = byId("expenseFilterTo").value;
  const category = byId("expenseFilterCategory").value;
  return expenseRecords.filter((record) =>
    (!from || (record.date || "") >= from)
    && (!to || (record.date || "") <= to)
    && (!category || record.category === category)
  ).sort((a, b) => (b.date || "").localeCompare(a.date || "")
    || (Number(b.createdAt?.toMillis?.()) || 0) - (Number(a.createdAt?.toMillis?.()) || 0));
}

function renderExpenses() {
  const records = filteredExpenses();
  const total = records.reduce((sum, record) => sum + Number(record.amount || 0), 0);
  byId("expenseTotal").textContent = `${feeText("মোট খরচ", "Total Expenses")}: ${document.documentElement.lang === "en" ? "BDT " : "৳"}${bn(total)}`;
  const body = byId("expenseRows");
  body.replaceChildren();
  if (!records.length) {
    const row = body.insertRow();
    cell(row, feeText("এই ফিল্টারে কোনো খরচের তথ্য নেই।", "No expenses match these filters.")).colSpan = 5;
    return;
  }
  records.forEach((record) => {
    const row = body.insertRow();
    cell(row, formatDate(record.date));
    cell(row, `${expenseDisplay(record.category)} · ${record.description || "—"}`);
    cell(row, feeDisplay(record.method));
    cell(row, `${document.documentElement.lang === "en" ? "BDT " : "৳"}${bn(record.amount)}`);
    cell(row, record.reference || "—");
  });
}

function printAccountsReport(title, total, tableId) {
  const win = window.open("", "_blank", "width=1100,height=800");
  if (!win) return;
  const isEnglish = document.documentElement.lang === "en";
  const table = byId(tableId).closest("table");
  win.document.write(`<!doctype html><html lang="${isEnglish ? "en" : "bn"}"><head><meta charset="utf-8"><title>${receiptEscape(title)}</title><style>@page{size:A4 portrait;margin:14mm}*{box-sizing:border-box}body{font-family:Arial,"Kalpurush",sans-serif;color:#183d63;margin:0}h1,h2,p{text-align:center;margin:6px 0}h1{font-size:22px}h2{font-size:18px;margin-top:15px}.total{margin:12px 0;padding:9px;border:1px solid #cbd7e3;background:#edf3f8;text-align:center;font-size:16px;font-weight:700}table{width:100%;border-collapse:collapse;font-size:13px}th,td{border:1px solid #8798aa;padding:8px;text-align:center}th{background:#eaf0f6;color:#183d63}tbody tr:nth-child(even){background:#f4f7fa}</style></head><body><h1>${isEnglish ? "Tabiul Mursaleen Nogor Karigori School & College" : "তাবিউল মুরসালীন নগর কারিগরি স্কুল এন্ড কলেজ"}</h1><h2>${receiptEscape(title)}</h2><p class="total">${receiptEscape(total)}</p>${table.outerHTML}<script>window.onload=()=>window.print()</script></body></html>`);
  win.document.close();
}

byId("expenseForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!currentAdmin || busy) return;
  busy = true;
  byId("saveExpenseButton").disabled = true;
  byId("expenseMessage").textContent = feeText("খরচের তথ্য সংরক্ষণ হচ্ছে...", "Saving expense...");
  try {
    const reference = doc(collection(db, expensesCollection));
    await setDoc(reference, {
      category: byId("expenseCategory").value,
      description: byId("expenseDescription").value.trim(),
      date: byId("expenseDate").value,
      amount: Number(byId("expenseAmount").value),
      method: byId("expenseMethod").value,
      reference: byId("expenseReference").value.trim(),
      createdAt: serverTimestamp(),
      createdBy: currentAdmin.uid
    });
    byId("expenseForm").reset();
    byId("expenseDate").value = localDateString();
    byId("expenseMessage").textContent = feeText("খরচের তথ্য সংরক্ষিত হয়েছে।", "Expense saved.");
    await loadExpenses();
  } catch (error) {
    console.error("খরচ সংরক্ষণের সমস্যা:", error);
    byId("expenseMessage").textContent = feeText("খরচ সংরক্ষণ করা যায়নি। Firestore Rules পরীক্ষা করুন।", "Could not save expense. Check Firestore Rules.");
  } finally {
    busy = false;
    byId("saveExpenseButton").disabled = false;
  }
});

for (const id of ["accountIncomeFrom", "accountIncomeTo", "accountIncomeClass"]) byId(id).addEventListener("change", () => {
  if (id === "accountIncomeClass") {
    byId("accountIncomeTrade").value = "";
    updateAccountIncomeTradeOptions();
  }
  renderAccountIncome();
});
byId("accountIncomeTrade").addEventListener("change", renderAccountIncome);
byId("clearAccountIncomeFilters").addEventListener("click", () => {
  ["accountIncomeFrom", "accountIncomeTo", "accountIncomeClass", "accountIncomeTrade"].forEach((id) => { byId(id).value = ""; });
  updateAccountIncomeTradeOptions();
  renderAccountIncome();
});
byId("printAccountIncome").addEventListener("click", () => printAccountsReport(
  feeText("ফি-এর ধরনভিত্তিক আদায়", "Receipts by Fee Type"), byId("accountIncomeTotal").textContent, "accountIncomeRows"
));
for (const id of ["expenseFilterFrom", "expenseFilterTo", "expenseFilterCategory"]) byId(id).addEventListener("change", renderExpenses);
byId("clearExpenseFilters").addEventListener("click", () => {
  ["expenseFilterFrom", "expenseFilterTo", "expenseFilterCategory"].forEach((id) => { byId(id).value = ""; });
  renderExpenses();
});
byId("printExpenseList").addEventListener("click", () => printAccountsReport(
  feeText("প্রতিষ্ঠানের খরচের বিবরণ", "Institution Expense Details"), byId("expenseTotal").textContent, "expenseRows"
));
document.querySelectorAll(".accounts-tab").forEach((tab) => tab.addEventListener("click", () => {
  document.querySelectorAll(".accounts-tab").forEach((item) => {
    const selected = item === tab;
    item.classList.toggle("is-active", selected);
    item.setAttribute("aria-selected", String(selected));
  });
  document.querySelectorAll(".accounts-panel").forEach((panel) => { panel.hidden = panel.id !== tab.dataset.accountTab; });
}));

function printFeeSpreadsheet(prefix = "feeSheet", tableId = "feeSpreadsheetTable") {
  const get = (suffix) => byId(prefix + suffix);
  const win = window.open("", "_blank", "width=1200,height=850");
  if (!win) return;
  const isEnglish = document.documentElement.lang === "en";
  const printClass = get("Class").value || feeText("সব শ্রেণি", "All Classes");
  const printTrade = get("Trade").value || feeText("সব ট্রেড", "All Trades");
  const printTotal = get("Foot").rows[0]?.lastElementChild?.textContent || (isEnglish ? "BDT 0" : "৳০");
  const printMetadata = [
    [feeText("শিক্ষাবর্ষ", "Academic Year"), get("Year").value],
    [feeText("শ্রেণি", "Class"), feeDisplay(printClass)],
    [feeText("ট্রেড", "Trade"), feeDisplay(printTrade)]
  ].map(([label, value]) => `<div><strong>${label}</strong><span>${receiptEscape(value)}</span></div>`).join("");
  const printSummary = isEnglish
    ? `${bn(get("Rows").rows.length)} students · Total received: ${receiptEscape(printTotal)}`
    : `${bn(get("Rows").rows.length)} জন শিক্ষার্থী · সর্বমোট গৃহীত অর্থ: ${receiptEscape(printTotal)}`;
  win.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${isEnglish ? "Fee Spreadsheet" : "বেতন স্প্রেডশিট"}</title><style>
    @page{size:A3 landscape;margin:8mm}
    *{box-sizing:border-box}body{font-family:Arial,"Kalpurush",sans-serif;color:#183d63;margin:0}
    h1,h2,p{text-align:center;margin:5px}h1{font-size:25px}h2{font-size:19px}.print-summary{font-size:15px;font-weight:700;margin:9px 0}
    .print-metadata{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:12px 0;padding:9px 12px;border:1px solid #8295a9;background:#f1f5f9}
    .print-metadata div{display:flex;justify-content:center;gap:8px;font-size:15px}.print-metadata strong{color:#183d63}
    table.fee-spreadsheet-table{width:100%;table-layout:fixed;border-collapse:collapse;font-size:14px}
    table.fee-spreadsheet-table th,table.fee-spreadsheet-table td{border:1px solid #899bae;padding:6px 4px;text-align:center;font-size:14px!important;line-height:1.3;white-space:normal;overflow-wrap:anywhere}
    table.fee-spreadsheet-table th:nth-child(1),table.fee-spreadsheet-table td:nth-child(1){width:5%}
    table.fee-spreadsheet-table th:nth-child(2),table.fee-spreadsheet-table td:nth-child(2){width:14%;text-align:left}
    table.fee-spreadsheet-table th:nth-child(3),table.fee-spreadsheet-table td:nth-child(3){width:10%}
    table.fee-spreadsheet-table th:nth-child(n+4):nth-child(-n+15),table.fee-spreadsheet-table td:nth-child(n+4):nth-child(-n+15){width:4.75%}
    table.fee-spreadsheet-table th:last-child,table.fee-spreadsheet-table td:last-child{width:14%}
    table.fee-spreadsheet-table th{background:#eaf0f6}table.fee-spreadsheet-table tbody tr:nth-child(even){background:#f5f8fb}
    table.fee-spreadsheet-table tfoot tr{background:#e3ecf4;font-weight:700}table.fee-spreadsheet-table tfoot td{border-top:2px solid #b99b55}
    </style></head><body><h1>${isEnglish ? "Tabiul Mursaleen Nogor Karigori School & College" : "তাবিউল মুরসালীন নগর কারিগরি স্কুল এন্ড কলেজ"}</h1><h2>${isEnglish ? "Tuition Payment Spreadsheet" : "বেতন স্প্রেডশিট"}</h2><div class="print-metadata">${printMetadata}</div><p class="print-summary">${printSummary}</p>${byId(tableId).outerHTML}<script>window.onload=()=>window.print()</script></body></html>`);
  win.document.close();
}

byId("printFeeSpreadsheet").addEventListener("click", () => printFeeSpreadsheet());
byId("printAdmitFeeSpreadsheet").addEventListener("click", () => printFeeSpreadsheet("admitFeeSheet", "admitFeeSpreadsheetTable"));
for (const id of ["feeFilterFrom", "feeFilterTo", "feeFilterClass", "feeFilterTrade", "feeFilterType"]) {
  byId(id).addEventListener("change", renderFeeRecords);
}
byId("clearFeeFilters").addEventListener("click", () => {
  ["feeFilterFrom", "feeFilterTo", "feeFilterClass", "feeFilterTrade", "feeFilterType"]
    .forEach((id) => { byId(id).value = ""; });
  renderFeeRecords();
});

function receiptEscape(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  })[char]);
}

function openFeeReceipt(record) {
  const win = window.open("", "_blank", "width=760,height=850");
  if (!win) {
    message("feeMessage", feeText("রসিদ খুলতে ব্রাউজারের পপ-আপ অনুমতি দিন।", "Allow pop-ups in your browser to open the receipt."), true);
    return;
  }
  const isEnglish = document.documentElement.lang === "en";
  const money = `${isEnglish ? "BDT " : "৳"}${bn(record.totalAmount ?? record.amount ?? 0)}`;
  const fine = Number(record.lateFine) > 0 ? `<tr><th>${isEnglish ? "Late fine" : "লেট ফাইন"}</th><td>${isEnglish ? "BDT " : "৳"}${bn(record.lateFine)}</td></tr>` : "";
  const tr = (label, value) => `<tr><th>${label}</th><td>${receiptEscape(value || "—")}</td></tr>`;
  const amountDetails = Array.isArray(record.months) && record.months.length
    ? tr(isEnglish ? "Monthly amount × months" : "প্রতি মাসের টাকা × মাসসংখ্যা", `${isEnglish ? "BDT " : "৳"}${bn(record.monthlyAmount ?? record.amount)} × ${bn(record.months.length)}`)
    : tr(isEnglish ? "Amount" : "মূল জমা", `${isEnglish ? "BDT " : "৳"}${bn(record.amount)}`);
  win.document.write(`<!doctype html><html lang="${isEnglish ? "en" : "bn"}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${isEnglish ? "Payment Receipt" : "জমার রসিদ"} · ${receiptEscape(record.receipt)}</title><style>
    *{box-sizing:border-box}body{margin:0;padding:30px;background:#eef2f6;color:#18344f;font-family:Arial,"Kalpurush",sans-serif}.receipt{max-width:680px;margin:auto;padding:34px;background:#fff;border:1px solid #d8e1eb;border-top:7px solid #183d63;box-shadow:0 12px 36px #1636531c}.school{text-align:center;border-bottom:1px solid #dbe2ea;padding-bottom:18px}.school h1{font-size:25px;margin:0 0 8px}.school p{margin:4px 0;color:#526579}.title{text-align:center;margin:22px 0 10px;font-size:22px;color:#183d63}.receipt-no{text-align:center;color:#68798a;margin-bottom:18px}table{width:100%;border-collapse:collapse}th,td{padding:11px 12px;border:1px solid #dce3eb;text-align:left}th{width:38%;background:#f2f6fa}tr.total th,tr.total td{font-size:18px;font-weight:700;background:#eaf1f7;color:#153858}.signatures{display:flex;justify-content:space-between;gap:35px;margin-top:68px}.signatures span{width:45%;padding-top:8px;border-top:1px solid #637488;text-align:center}.controls{text-align:center;margin:24px auto}.controls button{padding:10px 18px;border:0;border-radius:7px;background:#183d63;color:#fff;font-size:15px;cursor:pointer}@media print{body{padding:0;background:#fff}.receipt{max-width:none;border:1px solid #b9c7d5;border-top:5px solid #183d63;box-shadow:none}.controls{display:none}}
    </style></head><body><main class="receipt"><header class="school"><h1>${isEnglish ? "Tabiul Mursaleen Nogor Karigori School & College" : "তাবিউল মুরসালীন নগর কারিগরি স্কুল এন্ড কলেজ"}</h1><p>${isEnglish ? "Tenguri, Kendua, Netrokona · EIIN No. 136065" : "টেঙ্গুরী, কেন্দুয়া, নেত্রকোণা · EIIN No. 136065"}</p><p>${isEnglish ? "Payment Receipt" : "বেতন ও ফি জমার রসিদ"}</p></header><h2 class="title">${isEnglish ? "Payment Receipt" : "জমার রসিদ"}</h2><p class="receipt-no">${isEnglish ? "Receipt No." : "রসিদ নম্বর"}: <strong>${receiptEscape(record.receipt || "—")}</strong></p><table><tbody>${tr(isEnglish ? "Student name" : "শিক্ষার্থীর নাম", record.studentName)}${tr(isEnglish ? "Student ID" : "শিক্ষার্থী আইডি", record.studentCode)}${tr(isEnglish ? "Class / Trade" : "শ্রেণি / ট্রেড", `${feeDisplay(record.className)} / ${feeDisplay(record.trade)}`)}${tr(isEnglish ? "Roll" : "রোল", record.roll)}${tr(isEnglish ? "Fee type" : "ফি-এর ধরন", feeDisplay(record.type))}${record.month || record.months?.length ? tr(isEnglish ? "Month(s)" : "মাস", formatFeeMonths(record)) : ""}${tr(isEnglish ? "Payment date" : "জমার তারিখ", formatDate(record.paymentDate))}${tr(isEnglish ? "Payment method" : "পরিশোধের মাধ্যম", feeDisplay(record.method))}${amountDetails}${fine}<tr class="total"><th>${isEnglish ? "Total paid" : "মোট জমা"}</th><td>${money}</td></tr></tbody></table><div class="signatures"><span>${isEnglish ? "Received by" : "গ্রহণকারীর স্বাক্ষর"}</span><span>${isEnglish ? "Authorized signature" : "অনুমোদিত স্বাক্ষর"}</span></div></main><div class="controls"><button onclick="window.print()">${isEnglish ? "Print / Save as PDF" : "প্রিন্ট / PDF সংরক্ষণ"}</button></div></body></html>`);
  win.document.close();
}

feeRows.addEventListener("click", (event) => {
  const button = event.target.closest('[data-action="fee-receipt"]');
  if (!button) return;
  const record = feeRecords.find((item) => item.id === button.dataset.id);
  if (record) openFeeReceipt(record);
});

byId("printFeeRecords").addEventListener("click", () => {
  const records = filteredFeeRecords();
  const isEnglish = document.documentElement.lang === "en";
  const headers = isEnglish
    ? ["Date", "Student", "Class / Trade", "Fee", "Month", "Amount", "Receipt"]
    : ["তারিখ", "শিক্ষার্থী", "শ্রেণি / ট্রেড", "ফি", "মাস", "টাকা", "রসিদ নম্বর"];
  const rows = records.map((record) => `<tr><td>${receiptEscape(formatDate(record.paymentDate))}</td><td>${receiptEscape(record.studentName)}<br>${receiptEscape(record.studentCode)}</td><td>${receiptEscape(feeDisplay(record.className))} / ${receiptEscape(feeDisplay(record.trade))}</td><td>${receiptEscape(feeDisplay(record.type))}</td><td>${receiptEscape(record.month || record.months?.length ? formatFeeMonths(record) : "—")}</td><td>${isEnglish ? "BDT " : "৳"}${bn(record.totalAmount ?? record.amount ?? 0)}</td><td>${receiptEscape(record.receipt || "—")}</td></tr>`).join("");
  const win = window.open("", "_blank", "width=1100,height=800");
  if (!win) return;
  win.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${isEnglish ? "Payment Records" : "জমার তালিকা"}</title><style>body{font-family:Arial,"Kalpurush",sans-serif;color:#172d43;padding:20px}h1{text-align:center;font-size:22px}p{text-align:center}table{width:100%;border-collapse:collapse;font-size:12px}th,td{border:1px solid #8798aa;padding:6px;text-align:center}th{background:#eaf0f6}@media print{body{padding:0}thead{display:table-header-group}}</style></head><body><h1>তাবিউল মুরসালীন নগর কারিগরি স্কুল এন্ড কলেজ</h1><p>${isEnglish ? "Payment records" : "বেতন ও ফি জমার তালিকা"} · ${bn(records.length)} ${isEnglish ? "records" : "টি রেকর্ড"}</p><table><thead><tr>${headers.map((header) => `<th>${header}</th>`).join("")}</tr></thead><tbody>${rows || `<tr><td colspan="7">${isEnglish ? "No records" : "কোনো জমার তথ্য নেই"}</td></tr>`}</tbody></table><script>window.onload=()=>window.print()</script></body></html>`);
  win.document.close();
});

const admitMonthNames = ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"];
const admitMonthNamesEn = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const admitText = (bnText, enText) => document.documentElement.lang === "en" ? enText : bnText;

function monthlyFeeMonths(studentCode, year) {
  return new Set(feeRecords
    .filter((fee) => fee.studentCode === studentCode
      && ["মাসিক বেতন", "Monthly Tuition"].includes(fee.type))
    .flatMap((fee) => monthlyPaymentEntries(fee, year).map(([month]) => month)));
}

function evaluateAdmitEligibility(student, year, throughMonth) {
  const paidMonths = monthlyFeeMonths(student.studentCode, year);
  const admission = String(student.admissionDate || "");
  const admissionYear = Number(admission.slice(0, 4));
  const admissionMonth = Number(admission.slice(5, 7));
  const firstMonth = admissionYear === year && admissionMonth >= 1 && admissionMonth <= 12 ? admissionMonth : 1;
  const missingMonths = [];
  for (let month = firstMonth; month <= throughMonth; month++) {
    if (!paidMonths.has(month)) missingMonths.push(month);
  }
  return { eligible: missingMonths.length === 0, missingMonths, paidMonths };
}

function examFeeMatch(record, year, feeType) {
  const paymentDate = String(record.paymentDate || "");
  if (paymentDate && Number(paymentDate.slice(0, 4)) !== year) return false;
  const searchable = [record.type, record.description, record.note, record.notes, record.comment, record.month]
    .filter(Boolean).join(" ").toLowerCase();
  const isFormFillup = /ফরম|ফর্ম|form[\s-]*(fill|fillup)|fill[\s-]*up/.test(searchable);
  const isExamFee = /পরীক্ষা|exam/.test(searchable);
  if (feeType === "form") return isFormFillup;
  if (feeType === "exam") return isExamFee && !isFormFillup;
  return isExamFee || isFormFillup;
}

function evaluateAdmitDisplay(student, year, mode, throughMonth, feeType) {
  if (mode === "class-all") return { eligible: true, status: admitText("শ্রেণি ও ট্রেডের সবাই", "Everyone in the selected class and trade") };
  if (mode === "exam-fee") {
    const eligible = feeRecords.some((record) => record.studentCode === student.studentCode && examFeeMatch(record, year, feeType));
    const typeLabel = byId("admitExamFeeType").selectedOptions[0]?.textContent || "";
    return { eligible, status: eligible
      ? (document.documentElement.lang === "en" ? "Paid: " + typeLabel : "পরিশোধিত: " + typeLabel)
      : admitText("এই শিক্ষাবর্ষে পরীক্ষার ফি / ফরম ফিলাপের জমা নেই", "No exam or form-fill-up payment found for this academic year") };
  }
  const eligibility = evaluateAdmitEligibility(student, year, throughMonth);
  return {
    ...eligibility,
    status: eligibility.eligible
      ? (document.documentElement.lang === "en"
        ? "Paid through " + admitMonthNamesEn[throughMonth - 1] + " " + year
        : admitMonthNames[throughMonth - 1] + " " + year + " পর্যন্ত পরিশোধিত")
      : (document.documentElement.lang === "en"
        ? "Due: " + eligibility.missingMonths.map((month) => admitMonthNamesEn[month - 1]).join(", ")
        : "বকেয়া: " + eligibility.missingMonths.map((month) => admitMonthNames[month - 1]).join(", "))
  };
}

function resetAdmitSelection() {
  if (!byId("admitEligiblePanel")) return;
  byId("admitEligiblePanel").hidden = true;
  byId("admitPrintArea").hidden = true;
  byId("printAdmitCards").hidden = true;
  byId("printSeatPlan").hidden = true;
  byId("printAttendanceSheet").hidden = true;
  byId("selectAllEligible").checked = false;
  byId("prepareAdmitCards").disabled = true;
  byId("prepareSeatPlan").disabled = true;
  byId("prepareAttendanceSheet").disabled = true;
  admitPrintMode = "";
  admitCandidates = new Map();
}

function updateAdmitModeFields() {
  const mode = byId("admitDisplayMode").value;
  const tuitionMode = mode === "tuition";
  const feeMode = mode === "exam-fee";
  byId("admitPaidThroughField").hidden = !tuitionMode;
  byId("admitExamFeeField").hidden = !feeMode;
  byId("admitPaidThrough").required = tuitionMode;
  byId("admitExamFeeType").required = feeMode;
  resetAdmitSelection();
}

function updateAdmitExamOptions() {
  const examSelect = byId("admitExam");
  if (!examSelect) return;
  const selectedExam = examSelect.value;
  const className = byId("admitFeeSheetClass").value;
  const year = Number(byId("admitFeeSheetYear").value);
  const isEnglish = document.documentElement.lang === "en";
  const exams = [
    ["অর্ধবার্ষিক", "অর্ধবার্ষিক পরীক্ষা", "Half-Yearly Exam"],
    ["নির্বাচনী", "নির্বাচনী পরীক্ষা", "Selection Exam"],
    ["বার্ষিক", "বার্ষিক পরীক্ষা", "Annual Exam"]
  ];
  examSelect.replaceChildren(new Option(
    isEnglish ? "Select class, academic year, and exam" : "শ্রেণি, শিক্ষাবর্ষ ও পরীক্ষা নির্বাচন করুন",
    ""
  ));

  const classCode = getClassCode(className);
  if (!classCode || !Number.isInteger(year) || year < 2000 || year > 2100) return;
  const classBn = `${classCodeValues.get(classCode) || className} শ্রেণি`;
  const classLabel = isEnglish
    ? (window.dashboardTranslate?.(classBn) || classBn)
    : classBn;
  const yearLabel = new Intl.NumberFormat(isEnglish ? "en-US" : "bn-BD", { useGrouping: false }).format(year);
  exams.forEach(([value, bnLabel, enLabel]) => {
    const label = isEnglish ? `${classLabel} — ${enLabel} ${yearLabel}` : `${classLabel} — ${bnLabel} ${yearLabel}`;
    examSelect.add(new Option(label, value));
  });
  if (exams.some(([value]) => value === selectedExam)) examSelect.value = selectedExam;
}

function checkAdmitEligibility() {
  const className = byId("admitFeeSheetClass").value;
  const trade = byId("admitFeeSheetTrade").value;
  const exam = byId("admitExam").value;
  const year = Number(byId("admitFeeSheetYear").value);
  const mode = byId("admitDisplayMode").value;
  const throughMonth = Number(byId("admitPaidThrough").value);
  const feeType = byId("admitExamFeeType").value;
  byId("admitPrintArea").hidden = true;
  byId("printAdmitCards").hidden = true;
  byId("printSeatPlan").hidden = true;
  byId("printAttendanceSheet").hidden = true;
  admitPrintMode = "";
  if (!className || !exam || !mode || !Number.isInteger(year) || year < 2000 || year > 2100
    || (mode === "tuition" && (throughMonth < 1 || throughMonth > 12))) {
    message("admitMessage", admitText("শ্রেণি, পরীক্ষা, শিক্ষাবর্ষ এবং প্রদর্শনের নিয়ম নির্বাচন করুন।", "Select the class, exam, academic year, and display rule."), true);
    byId("admitEligiblePanel").hidden = true;
    return;
  }
  const classCode = getClassCode(className);
  const classList = students.filter((student) => getClassCode(student.className || "") === classCode)
    .filter((student) => tradeMatches(student.trade, trade))
    .sort((a, b) => Number(normalizeDigits(String(a.roll || ""))) - Number(normalizeDigits(String(b.roll || ""))));
  const rows = byId("admitEligibleRows");
  rows.replaceChildren();
  admitCandidates = new Map();
  if (!classList.length) {
    message("admitMessage", admitText("এই শ্রেণি ও ট্রেডে কোনো শিক্ষার্থী পাওয়া যায়নি।", "No students were found in this class and trade."), true);
    byId("admitEligiblePanel").hidden = true;
    return;
  }

  const isEnglish = document.documentElement.lang === "en";
  for (const student of classList) {
    const eligibility = evaluateAdmitDisplay(student, year, mode, throughMonth, feeType);
    admitCandidates.set(student.studentCode, { ...student, eligibility });
    const row = rows.insertRow();
    const checkboxCell = row.insertCell();
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "admit-student-choice";
    checkbox.dataset.studentCode = student.studentCode;
    checkbox.disabled = !eligibility.eligible;
    checkbox.checked = eligibility.eligible;
    checkboxCell.append(checkbox);
    const photoCell = row.insertCell();
    const thumbnail = document.createElement("img");
    thumbnail.className = "admit-student-thumbnail";
    const placeholderPhoto = studentPlaceholderForName(student.name, student.gender);
    thumbnail.src = student.photoUrl ? admitPhotoUrl(student.photoUrl) : placeholderPhoto;
    thumbnail.alt = student.photoUrl ? "" : "Student illustration";
    thumbnail.addEventListener("error", () => {
      if (student.photoUrl && thumbnail.src !== student.photoUrl) thumbnail.src = student.photoUrl;
      else if (thumbnail.dataset.placeholder !== "true") {
        thumbnail.dataset.placeholder = "true";
        thumbnail.src = placeholderPhoto;
      }
    });
    photoCell.append(thumbnail);
    cell(row, isEnglish ? (student.name || student.nameBn) : (student.nameBn || student.name));
    cell(row, student.studentCode + " / " + normalizeDigits(String(student.roll || "—")));
    cell(row, eligibility.status);
    row.classList.toggle("admit-ineligible-row", !eligibility.eligible);
  }
  const eligibleCount = [...admitCandidates.values()].filter((student) => student.eligibility.eligible).length;
  byId("selectAllEligible").checked = eligibleCount > 0;
  byId("admitEligiblePanel").hidden = false;
  byId("admitPrintArea").hidden = true;
  byId("prepareAdmitCards").disabled = eligibleCount === 0;
  byId("prepareSeatPlan").disabled = eligibleCount === 0;
  byId("prepareAttendanceSheet").disabled = eligibleCount === 0;
  byId("printAdmitCards").hidden = true;
  byId("printSeatPlan").hidden = true;
  byId("printAttendanceSheet").hidden = true;
  admitPrintMode = "";
  message("admitMessage", isEnglish
    ? eligibleCount + " of " + classList.length + " students match this display rule for " + (window.dashboardTranslate?.(exam) || exam) + "."
    : bn(eligibleCount) + " জনের মধ্যে " + bn(classList.length) + " জন নির্বাচিত প্রদর্শন নিয়মে " + exam + " পরীক্ষার প্রবেশপত্রের জন্য আছেন।");
}
function buildAdmitCard(student, exam, year, selectedFields, blank = false) {
  const t = (text) => window.dashboardTranslate?.(text) || text;
  const isEnglish = document.documentElement.lang === "en";
  const yearText = new Intl.NumberFormat(uiLocale(), { useGrouping: false }).format(year);
  const card = document.createElement("article");
  card.className = "admit-card-sheet";
  const head = document.createElement("header");
  head.className = "admit-card-heading";
  const logo = document.createElement("img");
  logo.className = "admit-institution-logo";
  logo.src = "images/logo/logo-transparent.png";
  logo.alt = t("প্রতিষ্ঠানের লোগো");
  const headingText = document.createElement("div");
  headingText.className = "admit-institution-text";
  const institutionName = document.createElement("h1");
  institutionName.classList.toggle("english-institution-name", isEnglish);
  if (isEnglish) institutionName.append("Tabiul Mursaleen Nogor Karigori", document.createElement("br"), "School & College");
  else institutionName.append("তাবিউল মুরসালীন নগর", document.createElement("br"), "কারিগরি স্কুল এন্ড কলেজ");
  const address = document.createElement("p");
  address.textContent = (isEnglish ? "Tenguri, Kendua, Netrokona" : "টেঙ্গুরী, কেন্দুয়া, নেত্রকোণা") + " · EIIN No. 136065";
  headingText.append(institutionName, address);
  head.append(logo, headingText);
  card.append(head);
  const title = document.createElement("h2");
  title.className = "admit-card-title";
  const englishExamName = ({ "অর্ধবার্ষিক": "Half-Yearly Exam", "নির্বাচনী": "Selection Exam", "বার্ষিক": "Annual Exam" })[exam] || t(exam);
  title.textContent = isEnglish
    ? "Admit Card · " + englishExamName + " · " + yearText
    : t("পরীক্ষার প্রবেশপত্র") + " · " + exam + " পরীক্ষা · " + yearText;
  card.append(title);

  const details = document.createElement("div");
  details.className = "admit-card-body";
  const photo = blank ? document.createElement("div") : document.createElement("img");
  photo.className = blank ? "admit-card-photo admit-card-photo-blank" : "admit-card-photo";
  const placeholderPhoto = studentPlaceholderForName(student.name, student.gender);
  if (blank) {
    photo.setAttribute("aria-hidden", "true");
  } else if (student.photoUrl) {
    photo.src = admitPhotoUrl(student.photoUrl);
    photo.alt = "";
    photo.addEventListener("error", () => {
      if (photo.dataset.placeholder === "true") return;
      if (photo.src !== student.photoUrl) photo.src = student.photoUrl;
      else {
        photo.dataset.placeholder = "true";
        photo.alt = t("শিক্ষার্থীর নমুনা ছবি");
        photo.src = placeholderPhoto;
      }
    });
  } else {
    photo.dataset.placeholder = "true";
    photo.src = placeholderPhoto;
    photo.alt = t("শিক্ষার্থীর নমুনা ছবি");
  }
  const photoBlock = document.createElement("div");
  photoBlock.className = "admit-card-photo-block";
  const photoCaption = document.createElement("p");
  photoCaption.className = "admit-card-photo-caption";
  photoCaption.textContent = isEnglish ? "Candidate Photo" : "পরীক্ষার্থীর ছবি";
  photoBlock.append(photo, photoCaption);
  details.append(photoBlock);
  const list = document.createElement("dl");
  const name = isEnglish ? (student.name || student.nameBn) : (student.nameBn || student.name);
  const mode = byId("admitDisplayMode").value;
  let paymentLabel = "বেতন পরিশোধিত";
  let paymentValue = isEnglish
    ? "Through " + byId("admitPaidThrough").selectedOptions[0].textContent + " " + yearText
    : byId("admitPaidThrough").selectedOptions[0].textContent + " " + yearText + " পর্যন্ত";
  if (mode === "exam-fee") {
    paymentLabel = "পরিশোধিত ফি";
    paymentValue = byId("admitExamFeeType").selectedOptions[0].textContent;
  }
  if (blank) paymentLabel = isEnglish ? "Payment / Fee" : "বেতন / ফি";
  const fields = [
    ["name", "শিক্ষার্থীর নাম", name],
    ["studentCode", "শিক্ষার্থী আইডি", student.studentCode],
    ["branch", "শাখা", t(student.branch || "—")],
    ["className", "শ্রেণি", t(student.className || "—")],
    ["trade", "ট্রেড", t(student.trade || "—")],
    ["classRoll", isEnglish ? "Class Roll" : "ক্লাস রোল", normalizeDigits(String(student.roll || "—"))],
    ["boardRoll", isEnglish ? "Board Roll" : "বোর্ড রোল", normalizeDigits(String(student.boardRoll || "—"))],
    ["payment", paymentLabel, paymentValue]
  ];
  for (const [key, label, value] of fields) {
    if (!selectedFields.has(key) || (key === "payment" && mode === "class-all")) continue;
    const wrapper = document.createElement("div");
    const term = document.createElement("dt");
    term.textContent = t(label);
    const detail = document.createElement("dd");
    detail.textContent = blank ? "" : (value || "—");
    if (blank) wrapper.classList.add("admit-blank-field");
    wrapper.append(term, detail);
    list.append(wrapper);
  }
  details.append(list);
  card.append(details);
  const footer = document.createElement("div");
  footer.className = "admit-card-signatures";
  footer.innerHTML = `<div class="admit-signature"><span>${t("প্রতিষ্ঠান প্রধানের স্বাক্ষর")}</span></div><div class="admit-seal"><span>${t("প্রতিষ্ঠানের সীল")}</span></div>`;
  card.append(footer);
  return card;
}
function admitPhotoUrl(value) {
  try {
    const url = new URL(value);
    const fileId = url.pathname.match(/\/file\/d\/([^/]+)/)?.[1] || url.searchParams.get("id");
    if ((url.hostname === "drive.google.com" || url.hostname === "drive.usercontent.google.com") && fileId) {
      return `https://drive.google.com/thumbnail?id=${encodeURIComponent(fileId)}&sz=w600`;
    }
  } catch {
    // Keep the original source as a fallback for a previously stored URL.
  }
  return value;
}

function generateAdmitCards() {
  const selectedCodes = [...document.querySelectorAll(".admit-student-choice:checked")].map((input) => input.dataset.studentCode);
  const selectedStudents = selectedCodes.map((code) => admitCandidates.get(code)).filter(Boolean);
  if (!selectedStudents.length) {
    message("admitMessage", admitText("প্রবেশপত্র তৈরির জন্য যোগ্য শিক্ষার্থী নির্বাচন করুন।", "Select eligible students to generate admit cards."), true);
    return;
  }
  const mode = byId("admitDisplayMode").value;
  const selectedFields = new Set([...document.querySelectorAll(".admit-card-field:checked")].map((input) => input.value));
  if (![...selectedFields].some((field) => field !== "payment" || mode !== "class-all")) {
    message("admitMessage", admitText("প্রবেশপত্রে প্রদর্শনের জন্য অন্তত একটি তথ্য নির্বাচন করুন।", "Select at least one detail to show on the admit card."), true);
    return;
  }
  const area = byId("admitPrintArea");
  area.replaceChildren();
  admitPrintMode = "admit";
  const exam = byId("admitExam").value;
  const year = Number(byId("admitFeeSheetYear").value);
  for (let offset = 0; offset < selectedStudents.length; offset += 4) {
    const page = document.createElement("section");
    page.className = "admit-print-page";
    selectedStudents.slice(offset, offset + 4).forEach((student) => page.append(buildAdmitCard(student, exam, year, selectedFields)));
    area.append(page);
  }
  area.hidden = false;
  byId("printAdmitCards").hidden = false;
  byId("printSeatPlan").hidden = true;
  byId("printAttendanceSheet").hidden = true;
  area.scrollIntoView({ behavior: "smooth", block: "start" });
}

function prepareBlankAdmitCards() {
  const exam = byId("admitExam").value;
  const className = byId("admitFeeSheetClass").value;
  if (!exam || !className) {
    message("admitMessage", admitText("ব্ল্যাংক প্রবেশপত্র তৈরির আগে পরীক্ষা ও শ্রেণি নির্বাচন করুন।", "Select an exam and class before preparing blank admit cards."), true);
    return;
  }
  const selectedFields = new Set([...document.querySelectorAll(".admit-card-field:checked")].map((input) => input.value));
  if (![...selectedFields].some((field) => field !== "payment")) {
    message("admitMessage", admitText("ব্ল্যাংক প্রবেশপত্রে অন্তত একটি তথ্যের ঘর নির্বাচন করুন।", "Select at least one detail field for the blank admit card."), true);
    return;
  }
  const area = byId("admitPrintArea");
  area.replaceChildren();
  const year = Number(byId("admitFeeSheetYear").value);
  const blankStudent = { branch: "", className, trade: "", roll: "", boardRoll: "", studentCode: "" };
  const page = document.createElement("section");
  page.className = "admit-print-page";
  for (let index = 0; index < 4; index++) page.append(buildAdmitCard(blankStudent, exam, year, selectedFields, true));
  area.append(page);
  admitPrintMode = "admit";
  area.hidden = false;
  byId("printAdmitCards").hidden = false;
  byId("printSeatPlan").hidden = true;
  byId("printAttendanceSheet").hidden = true;
  message("admitMessage", admitText("একটি A4 পাতায় ৪টি ব্ল্যাংক প্রবেশপত্র তৈরি হয়েছে।", "Four blank admit cards are ready on one A4 page."));
  area.scrollIntoView({ behavior: "smooth", block: "start" });
}

function generateSeatPlan() {
  const selectedCodes = [...document.querySelectorAll(".admit-student-choice:checked")]
    .map((input) => input.dataset.studentCode);
  const selectedStudents = selectedCodes.map((code) => admitCandidates.get(code)).filter(Boolean);
  const selectedFields = [...document.querySelectorAll(".seat-plan-field:checked")]
    .map((input) => input.value);
  if (!selectedStudents.length) {
    message("admitMessage", admitText("সিট প্ল্যান তৈরির জন্য শিক্ষার্থী নির্বাচন করুন।", "Select students to create the seat plan."), true);
    return;
  }
  if (!selectedFields.length) {
    message("admitMessage", admitText("সিট প্ল্যানে অন্তত একটি তথ্য নির্বাচন করুন।", "Select at least one detail for the seat plan."), true);
    return;
  }

  const area = byId("admitPrintArea");
  area.replaceChildren();
  admitPrintMode = "seat-plan";
  const isEnglish = document.documentElement.lang === "en";
  const t = (text) => window.dashboardTranslate?.(text) || text;
  const exam = byId("admitExam").value;
  const year = Number(byId("admitFeeSheetYear").value);
  const yearText = new Intl.NumberFormat(uiLocale(), { useGrouping: false }).format(year);
  const fieldInfo = {
    name: { label: "শিক্ষার্থীর নাম", value: (student) => isEnglish ? (student.name || student.nameBn) : (student.nameBn || student.name) },
    classRoll: { label: isEnglish ? "Class Roll" : "ক্লাস রোল", value: (student) => normalizeDigits(String(student.roll || "—")) },
    boardRoll: { label: "বোর্ড রোল", value: (student) => normalizeDigits(String(student.boardRoll || "—")) },
    studentCode: { label: "শিক্ষার্থী আইডি", value: (student) => student.studentCode || "—" },
    branch: { label: "শাখা", value: (student) => t(student.branch || "—") },
    className: { label: "শ্রেণি", value: (student) => t(student.className || "—") },
    trade: { label: "ট্রেড", value: (student) => t(student.trade || "—") }
  };
  for (let offset = 0; offset < selectedStudents.length; offset += 15) {
    const page = document.createElement("section");
    page.className = "seat-plan-page";
    const grid = document.createElement("div");
    grid.className = "seat-plan-grid";
    selectedStudents.slice(offset, offset + 15).forEach((student, index) => {
      const card = document.createElement("article");
      card.className = "seat-plan-card";
      const head = document.createElement("header");
      head.className = "seat-plan-card-heading";
      const schoolName = document.createElement("h1");
      schoolName.textContent = isEnglish ? "Tabiul Mursaleen Nogor Karigori School & College" : "তাবিউল মুরসালীন নগর কারিগরি স্কুল এন্ড কলেজ";
      head.append(schoolName);
      card.append(head);

      const title = document.createElement("p");
      title.className = "seat-plan-card-title";
      title.textContent = `${isEnglish ? "Seat Plan" : "সিট প্ল্যান"} · ${t(exam)} · ${yearText}`;
      card.append(title);

      const details = document.createElement("dl");
      details.className = "seat-plan-card-details";
      selectedFields.forEach((field) => {
        const row = document.createElement("div");
        const label = document.createElement("dt");
        label.textContent = t(fieldInfo[field].label);
        const value = document.createElement("dd");
        value.textContent = String(fieldInfo[field].value(student) || "—");
        row.append(label, value);
        details.append(row);
      });
      card.append(details);
      grid.append(card);
    });
    page.append(grid);
    area.append(page);
  }
  area.hidden = false;
  byId("printAdmitCards").hidden = true;
  byId("printSeatPlan").hidden = false;
  byId("printAttendanceSheet").hidden = true;
  area.scrollIntoView({ behavior: "smooth", block: "start" });
}

function generateBlankSeatPlan() {
  const exam = byId("admitExam").value;
  const className = byId("admitFeeSheetClass").value;
  const selectedFields = [...document.querySelectorAll(".seat-plan-field:checked")].map((input) => input.value);
  if (!exam || !className) {
    message("admitMessage", admitText("ব্ল্যাংক সিট প্ল্যান তৈরির আগে পরীক্ষা ও শ্রেণি নির্বাচন করুন।", "Select an exam and class before preparing a blank seat plan."), true);
    return;
  }
  if (!selectedFields.length) {
    message("admitMessage", admitText("সিট প্ল্যানে অন্তত একটি তথ্যের ঘর নির্বাচন করুন।", "Select at least one detail field for the blank seat plan."), true);
    return;
  }
  const area = byId("admitPrintArea");
  area.replaceChildren();
  const isEnglish = document.documentElement.lang === "en";
  const t = (text) => window.dashboardTranslate?.(text) || text;
  const yearText = new Intl.NumberFormat(uiLocale(), { useGrouping: false }).format(Number(byId("admitFeeSheetYear").value));
  const fieldInfo = {
    name: "শিক্ষার্থীর নাম", classRoll: isEnglish ? "Class Roll" : "ক্লাস রোল", boardRoll: "বোর্ড রোল",
    studentCode: "শিক্ষার্থী আইডি", branch: "শাখা", className: "শ্রেণি", trade: "ট্রেড"
  };
  const page = document.createElement("section");
  page.className = "seat-plan-page";
  const grid = document.createElement("div");
  grid.className = "seat-plan-grid";
  for (let index = 0; index < 15; index++) {
    const card = document.createElement("article");
    card.className = "seat-plan-card seat-plan-card-blank";
    const head = document.createElement("header");
    head.className = "seat-plan-card-heading";
    const schoolName = document.createElement("h1");
    schoolName.textContent = isEnglish ? "Tabiul Mursaleen Nogor Karigori School & College" : "তাবিউল মুরসালীন নগর কারিগরি স্কুল এন্ড কলেজ";
    head.append(schoolName);
    card.append(head);
    const title = document.createElement("p");
    title.className = "seat-plan-card-title";
    title.textContent = `${isEnglish ? "Seat Plan" : "সিট প্ল্যান"} · ${t(exam)} · ${yearText}`;
    card.append(title);
    const details = document.createElement("dl");
    details.className = "seat-plan-card-details";
    selectedFields.forEach((field) => {
      const row = document.createElement("div");
      const label = document.createElement("dt");
      label.textContent = t(fieldInfo[field]);
      const value = document.createElement("dd");
      value.textContent = "";
      row.classList.add("seat-plan-blank-field");
      row.append(label, value);
      details.append(row);
    });
    card.append(details);
    grid.append(card);
  }
  page.append(grid);
  area.append(page);
  admitPrintMode = "seat-plan";
  area.hidden = false;
  byId("printAdmitCards").hidden = true;
  byId("printSeatPlan").hidden = false;
  byId("printAttendanceSheet").hidden = true;
  message("admitMessage", admitText("একটি A4 পাতায় ১৫টি ব্ল্যাংক সিট প্ল্যান তৈরি হয়েছে।", "Fifteen blank seat-plan cards are ready on one A4 page."));
  area.scrollIntoView({ behavior: "smooth", block: "start" });
}

function attendanceRoutinePageUrl(routineId) {
  return new URL(`exam-routine.html?id=${encodeURIComponent(routineId)}`, location.href).href;
}

function attendanceRoutineIdFromLink(value) {
  const url = new URL(value, location.href);
  if (!url.pathname.toLowerCase().endsWith("/exam-routine.html")) {
    throw new Error("রুটিন পেজের সঠিক লিংক দিন।");
  }
  const id = url.searchParams.get("id");
  if (!id) throw new Error("রুটিন লিংকে id পাওয়া যায়নি।");
  return id;
}

function normalizeAttendanceExam(value) {
  const normalized = normalizeDigits(String(value || ""))
    .normalize("NFKC")
    .toLocaleLowerCase("bn-BD");
  if (normalized.includes("অর্ধবার্ষিক") || normalized.includes("half-yearly") || normalized.includes("half yearly")) return "অর্ধবার্ষিক";
  if (normalized.includes("নির্বাচনী") || normalized.includes("selection")) return "নির্বাচনী";
  if (normalized.includes("বার্ষিক") || normalized.includes("annual")) return "বার্ষিক";
  return normalized
    .replace(/\d{2,4}/g, "")
    .replace(/পরীক্ষা|examination|exam/gi, "")
    .replace(/[\s–—-]+/g, "")
    .trim();
}

function attendanceRoutineMatches(routine, className, exam) {
  const wantedClass = getClassCode(String(className || ""));
  const routineClass = getClassCode(String(routine?.className || ""));
  return routine?.published === true
    && Boolean(wantedClass && routineClass && wantedClass === routineClass)
    && normalizeAttendanceExam(routine.examName) === normalizeAttendanceExam(exam);
}

function attendanceRoutineMismatch(routine, className, exam) {
  if (routine?.published !== true) {
    return admitText("লিংকের রুটিনটি ড্যাশবোর্ডে প্রকাশিত হিসেবে চিহ্নিত নয়।", "The linked routine is not marked as published in the dashboard.");
  }
  const wantedClass = getClassCode(String(className || ""));
  const routineClass = getClassCode(String(routine?.className || ""));
  if (!wantedClass || !routineClass || wantedClass !== routineClass) {
    const actual = routine?.className || "অজানা";
    return admitText(`শ্রেণি মিলছে না। নির্বাচিত: ${className}; রুটিনে: ${actual}।`, `Class mismatch. Selected: ${className}; routine: ${actual}.`);
  }
  const actualExam = String(routine?.examName || "অজানা");
  return admitText(`পরীক্ষার নাম মিলছে না। নির্বাচিত: ${exam}; রুটিনে: ${actualExam}।`, `Exam name mismatch. Selected: ${exam}; routine: ${actualExam}.`);
}

function showAttendanceRoutinePreview(routine) {
  const preview = byId("attendanceRoutinePreview");
  preview.replaceChildren();
  const isEnglish = document.documentElement.lang === "en";
  const summary = document.createElement("p");
  summary.className = "attendance-routine-summary";
  summary.textContent = isEnglish
    ? `${window.dashboardTranslate?.(routine.className) || routine.className} · ${window.dashboardTranslate?.(routine.examName) || routine.examName}`
    : `${routine.className} · ${routine.examName}`;
  preview.append(summary);

  const openLink = document.createElement("a");
  openLink.href = attendanceRoutinePageUrl(routine.id);
  openLink.target = "_blank";
  openLink.rel = "noopener noreferrer";
  openLink.textContent = isEnglish ? "Open published routine" : "প্রকাশিত রুটিন পেজ খুলুন";
  preview.append(openLink);

  const subjects = (routine.subjects || []).filter((subject) => subject.date && subject.subject)
    .slice().sort((a, b) => String(a.date).localeCompare(String(b.date)));
  const table = document.createElement("table");
  table.className = "attendance-routine-preview-table";
  const header = table.createTHead().insertRow();
  (isEnglish ? ["No.", "Date", "Subject", "Code"] : ["ক্রমিক", "তারিখ", "বিষয়", "কোড"])
    .forEach((text) => { const cell = document.createElement("th"); cell.textContent = text; header.append(cell); });
  const body = table.createTBody();
  subjects.forEach((subject, index) => {
    const row = body.insertRow();
    [bn(index + 1), formatDate(subject.date), subject.subject, subject.subjectCode || "—"]
      .forEach((text) => { const cell = row.insertCell(); cell.textContent = text; });
  });
  preview.append(table);
}

async function loadAttendanceRoutinePreview({ silent = false } = {}) {
  const className = byId("admitFeeSheetClass").value;
  const exam = byId("admitExam").value.trim();
  const linkValue = byId("attendanceRoutineLink").value.trim();
  const preview = byId("attendanceRoutinePreview");
  preview.replaceChildren(document.createTextNode(admitText("প্রকাশিত পরীক্ষার রুটিন খোঁজা হচ্ছে...", "Loading the published exam routine...")));
  if (!className || !exam) {
    preview.textContent = admitText("শ্রেণি ও পরীক্ষা নির্বাচন করলে প্রকাশিত রুটিন এখানে দেখা যাবে।", "Choose a class and exam to see its published routine here.");
    return null;
  }

  try {
    let routine;
    if (linkValue) {
      let routineId;
      try { routineId = attendanceRoutineIdFromLink(linkValue); }
      catch (error) {
        preview.textContent = error.message;
        if (!silent) message("admitMessage", error.message, true);
        return null;
      }
      const snapshot = await getDoc(doc(db, "examRoutines", routineId));
      if (!snapshot.exists()) {
        const text = admitText("এই লিংকের রুটিনটি ডাটাবেজে পাওয়া যায়নি।", "The routine for this link was not found.");
        preview.textContent = text;
        if (!silent) message("admitMessage", text, true);
        return null;
      }
      routine = { id: snapshot.id, ...snapshot.data() };
      if (!attendanceRoutineMatches(routine, className, exam)) {
        const text = attendanceRoutineMismatch(routine, className, exam);
        preview.textContent = text;
        if (!silent) message("admitMessage", text, true);
        return null;
      }
    } else {
      const snapshot = await getDocs(collection(db, "examRoutines"));
      const routines = snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() }))
        .filter((item) => attendanceRoutineMatches(item, className, exam))
        .sort((a, b) => {
          const timestamp = (value) => value?.toMillis?.() || (value?.seconds ? value.seconds * 1000 : 0);
          return timestamp(b.publishedAt || b.updatedAt || b.createdAt) - timestamp(a.publishedAt || a.updatedAt || a.createdAt);
        });
      routine = routines[0];
      if (!routine) {
        const text = admitText("এই শ্রেণি ও পরীক্ষার কোনো প্রকাশিত পরীক্ষার রুটিন পাওয়া যায়নি। আগে পরীক্ষার রুটিন প্রকাশ করুন।", "No published exam routine was found for this class and exam. Publish the exam routine first.");
        preview.textContent = text;
        if (!silent) message("admitMessage", text, true);
        return null;
      }
    }

    const subjects = (routine.subjects || []).filter((subject) => subject.date && subject.subject);
    if (!subjects.length) {
      const text = admitText("প্রকাশিত রুটিনে কোনো বিষয় ও পরীক্ষার তারিখ পাওয়া যায়নি।", "The published routine has no subjects with exam dates.");
      preview.textContent = text;
      if (!silent) message("admitMessage", text, true);
      return null;
    }
    showAttendanceRoutinePreview(routine);
    return routine;
  } catch (error) {
    console.error("পরীক্ষার রুটিন লোড করা যায়নি:", error);
    const text = admitText("পরীক্ষার রুটিন লোড করা যায়নি। Firestore access rules পরীক্ষা করুন।", "Could not load the exam routine. Check Firestore access rules.");
    preview.textContent = text;
    if (!silent) message("admitMessage", text, true);
    return null;
  }
}

async function generateAttendanceSheets(blank = false) {
  const selectedCodes = [...document.querySelectorAll(".admit-student-choice:checked")]
    .map((input) => input.dataset.studentCode);
  const selectedStudents = blank
    ? [{ name: "", nameBn: "", studentCode: "", branch: "", className: byId("admitFeeSheetClass").value, trade: "", roll: "", boardRoll: "" }]
    : selectedCodes.map((code) => admitCandidates.get(code)).filter(Boolean);
  const selectedFields = [...document.querySelectorAll(".attendance-field:checked")]
    .map((input) => input.value);
  if (!selectedStudents.length) {
    message("admitMessage", admitText("হাজিরা শিট তৈরির জন্য পরীক্ষার্থী নির্বাচন করুন।", "Select candidates to create attendance sheets."), true);
    return;
  }
  if (!selectedFields.length) {
    message("admitMessage", admitText("হাজিরা শিটে অন্তত একটি পরীক্ষার্থী তথ্য নির্বাচন করুন।", "Select at least one candidate detail for the attendance sheet."), true);
    return;
  }

  const className = byId("admitFeeSheetClass").value;
  const exam = byId("admitExam").value.trim();
  const year = Number(byId("admitFeeSheetYear").value);
  if (blank && (!className || !exam)) {
    message("admitMessage", admitText("ব্ল্যাংক হাজিরা শিট তৈরির আগে পরীক্ষা ও শ্রেণি নির্বাচন করুন।", "Select an exam and class before preparing a blank attendance sheet."), true);
    return;
  }
  byId("admitPrintArea").hidden = true;
  byId("printAdmitCards").hidden = true;
  byId("printSeatPlan").hidden = true;
  byId("printAttendanceSheet").hidden = true;
  admitPrintMode = "";
  if (!blank) message("admitMessage", admitText("প্রকাশিত পরীক্ষার রুটিন খোঁজা হচ্ছে...", "Loading the published exam routine..."));
  try {
    const routine = blank ? null : await loadAttendanceRoutinePreview();
    if (!blank && !routine) return;
    const subjects = blank
      ? []
      : (routine?.subjects || []).filter((subject) => subject.date && subject.subject)
        .slice().sort((a, b) => String(a.date).localeCompare(String(b.date)));
    if (!blank && (!routine || !subjects.length)) {
      message("admitMessage", admitText("এই শ্রেণি ও পরীক্ষার কোনো প্রকাশিত পরীক্ষার রুটিন পাওয়া যায়নি। আগে পরীক্ষার রুটিন প্রকাশ করুন।", "No published exam routine was found for this class and exam. Publish the exam routine first."), true);
      return;
    }

    const isEnglish = document.documentElement.lang === "en";
    const translate = (text) => window.dashboardTranslate?.(text) || text;
    const detailLabel = (english, bangla) => isEnglish ? `${english}:` : `${bangla}ঃ`;
    const fieldInfo = {
      name: { label: detailLabel("Student Name", "শিক্ষার্থীর নাম"), value: (student) => isEnglish ? (student.name || student.nameBn) : (student.nameBn || student.name) },
      classRoll: { label: detailLabel("Class Roll", "ক্লাস রোল"), value: (student) => normalizeDigits(String(student.roll || "—")) },
      boardRoll: { label: detailLabel("Board Roll", "বোর্ড রোল"), value: (student) => normalizeDigits(String(student.boardRoll || "—")) },
      studentCode: { label: detailLabel("Student ID", "শিক্ষার্থী আইডি"), value: (student) => student.studentCode || "—" },
      branch: { label: detailLabel("Branch", "শাখা"), value: (student) => translate(student.branch || "—") },
      className: { label: detailLabel("Class", "শ্রেণি"), value: (student) => translate(student.className || "—") },
      trade: { label: detailLabel("Trade", "ট্রেড"), value: (student) => translate(student.trade || "—") }
    };
    const tradeSubjectPrefixes = [
      { prefix: "এগ্রো বেইজড ফুড", names: ["এগ্রো বেইজড ফুড", "এগ্রো বেসড ফুড", "অ্যাগ্রো বেসড ফুড প্রসেসিং"] },
      { prefix: "অ্যাপারেল", names: ["অ্যাপারেল ম্যানুফ্যাকচারিং বেসিকস", "অ্যাপারেল", "এপারেল"] },
      { prefix: "জেনারেল মেকানিক্স", names: ["জেনারেল মেকানিক্স", "জেনারেল মেকানিকস", "জেনারেল মেকানিক"] },
      { prefix: "আইটি সাপোর্ট", names: ["আইটি সাপোর্ট এন্ড আইওটি বেসিকস", "আইটি সাপোর্ট"] },
      { prefix: "জেনারেল ইলেকট্রনিক্স", names: ["জেনারেল ইলেকট্রনিক্স", "জেনারেল ইলেক্ট্রনিক্স"] }
    ];
    const tradePaperForStudent = (student, paperNumber) => {
      const studentTrade = normalizeTradeName(student.trade);
      const trade = tradeSubjectPrefixes.find((item) => item.names.some((name) => normalizeTradeName(name) === studentTrade));
      if (!trade) return null;
      return getAcademicSubjects(student.className).find((item) =>
        item.name.startsWith(trade.prefix)
        && normalizeDigits(item.name).match(/[1-4]$/)?.[0] === String(paperNumber)
      ) || null;
    };
    const resolveAttendanceSubject = (subject, student) => {
      const subjectName = String(subject.subject || "").trim();
      const normalizedName = normalizeDigits(subjectName).replace(/[–—-]/g, "-").trim();
      const genericTrade = normalizedName.match(/^(?:ট্রেড|trade)\s*([1-4])$/i);
      const listedTrade = tradeSubjectPrefixes.some((trade) => normalizedName.startsWith(trade.prefix));
      const paperNumber = genericTrade?.[1] || (listedTrade ? normalizedName.match(/([1-4])$/)?.[1] : "");
      if (!paperNumber) return { ...subject, displaySubject: subjectName, displayCode: subject.subjectCode || "—" };
      const matched = tradePaperForStudent(student, paperNumber);
      return matched
        ? { ...subject, displaySubject: matched.name, displayCode: matched.code || subject.subjectCode || "—" }
        : { ...subject, displaySubject: subjectName, displayCode: subject.subjectCode || "—" };
    };
    const area = byId("admitPrintArea");
    area.replaceChildren();
    admitPrintMode = "attendance";
    const yearText = new Intl.NumberFormat(uiLocale(), { useGrouping: false }).format(year);
    selectedStudents.forEach((student) => {
      const page = document.createElement("section");
      page.className = "attendance-sheet-page";
      const header = document.createElement("header");
      header.className = "attendance-sheet-header";
      const brandRow = document.createElement("div");
      brandRow.className = "attendance-sheet-brand-row";
      const logo = document.createElement("img");
      logo.className = "attendance-sheet-logo";
      logo.src = "images/logo/logo-transparent.png";
      logo.alt = isEnglish ? "Institution logo" : "প্রতিষ্ঠানের লোগো";
      brandRow.append(logo);
      const institutionCopy = document.createElement("div");
      institutionCopy.className = "attendance-sheet-institution-copy";
      const institution = document.createElement("h1");
      institution.textContent = isEnglish ? "Tabiul Mursaleen Nogor Karigori School & College" : "তাবিউল মুরসালীন নগর কারিগরি স্কুল এন্ড কলেজ";
      institutionCopy.append(institution);
      const address = document.createElement("p");
      address.textContent = isEnglish ? "Tenguri, Kendua, Netrokona · EIIN No. 136065" : "টেঙ্গুরী, কেন্দুয়া, নেত্রকোণা · EIIN No. 136065";
      institutionCopy.append(address);
      brandRow.append(institutionCopy);
      const brandSpacer = document.createElement("span");
      brandSpacer.setAttribute("aria-hidden", "true");
      brandRow.append(brandSpacer);
      header.append(brandRow);
      const title = document.createElement("h2");
      const displayClass = translate(className);
      const displayExam = isEnglish
        ? ({ "অর্ধবার্ষিক": "Half-Yearly Exam", "নির্বাচনী": "Selection Exam", "বার্ষিক": "Annual Exam" })[exam] || translate(exam)
        : ({ "অর্ধবার্ষিক": "অর্ধবার্ষিক পরীক্ষা", "নির্বাচনী": "নির্বাচনী পরীক্ষা", "বার্ষিক": "বার্ষিক পরীক্ষা" })[exam] || translate(exam);
      const bengaliClass = className.includes("শ্রেণ")
        ? className.replace("শ্রেণি", "শ্রেণী")
        : `${className} শ্রেণী`;
      title.textContent = isEnglish
        ? `Attendance Sheet · ${displayClass} · ${displayExam} · ${yearText}`
        : `হাজিরা শিট · ${bengaliClass} · ${displayExam} · ${yearText}`;
      header.append(title);
      page.append(header);

      const studentDetails = document.createElement("dl");
      studentDetails.className = "attendance-student-details";
      selectedFields.forEach((field) => {
        const row = document.createElement("div");
        row.dataset.field = field;
        const label = document.createElement("dt");
        label.textContent = fieldInfo[field].label;
        const value = document.createElement("dd");
        value.textContent = blank ? "" : String(fieldInfo[field].value(student) || "—");
        if (blank) row.classList.add("attendance-blank-field");
        row.append(label, value);
        studentDetails.append(row);
      });
      page.append(studentDetails);

      const table = document.createElement("table");
      table.className = "attendance-subject-table";
      const head = table.createTHead().insertRow();
      const headers = isEnglish
        ? ["Exam Date", "Subject", "Subject Code", "Candidate Signature", "Invigilator Signature"]
        : ["পরীক্ষার তারিখ", "বিষয়ের নাম", "বিষয় কোড", "পরীক্ষার্থীর স্বাক্ষর", "ইনভিজিলেটরের স্বাক্ষর"];
      headers.forEach((label) => {
        const cell = document.createElement("th");
        cell.textContent = label;
        head.append(cell);
      });
      const body = table.createTBody();
      const sheetSubjects = blank ? Array.from({ length: 15 }, () => ({ date: "", displaySubject: "", displayCode: "" })) : subjects.map((subject) => resolveAttendanceSubject(subject, student));
      sheetSubjects.forEach((subject) => {
        const row = body.insertRow();
        [blank ? "" : formatAttendanceDate(subject.date), subject.displaySubject, subject.displayCode, "", ""]
          .forEach((value) => {
            const cell = row.insertCell();
            cell.textContent = value;
          });
      });
      page.append(table);
      area.append(page);
    });

    area.hidden = false;
    byId("printAdmitCards").hidden = true;
    byId("printSeatPlan").hidden = true;
    byId("printAttendanceSheet").hidden = false;
    message("admitMessage", blank
      ? admitText("একটি ব্ল্যাংক হাজিরা শিট তৈরি হয়েছে।", "A blank attendance sheet is ready.")
      : admitText(`${selectedStudents.length} জন পরীক্ষার্থীর জন্য হাজিরা শিট তৈরি হয়েছে।`, `Attendance sheets prepared for ${selectedStudents.length} candidates.`));
    area.scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (error) {
    console.error("হাজিরা শিট তৈরির জন্য পরীক্ষার রুটিন লোড হয়নি:", error);
    message("admitMessage", admitText("পরীক্ষার রুটিন লোড করা যায়নি। Firestore access rules পরীক্ষা করুন।", "Could not load the exam routine. Check Firestore access rules."), true);
  }
}

byId("checkAdmitEligibility").addEventListener("click", checkAdmitEligibility);
byId("admitDisplayMode").addEventListener("change", updateAdmitModeFields);
byId("admitFilterForm").addEventListener("change", () => {
  resetAdmitSelection();
  loadAttendanceRoutinePreview({ silent: true });
});
byId("loadAttendanceRoutine").addEventListener("click", () => loadAttendanceRoutinePreview());
byId("attendanceRoutineLink").addEventListener("change", () => loadAttendanceRoutinePreview());
byId("selectAllEligible").addEventListener("change", (event) => {
  document.querySelectorAll(".admit-student-choice:not(:disabled)").forEach((checkbox) => { checkbox.checked = event.target.checked; });
  const hasSelection = Boolean(document.querySelector(".admit-student-choice:checked"));
  byId("prepareAdmitCards").disabled = !hasSelection;
  byId("prepareSeatPlan").disabled = !hasSelection;
  byId("prepareAttendanceSheet").disabled = !hasSelection;
  byId("admitPrintArea").hidden = true;
  byId("printAdmitCards").hidden = true;
  byId("printSeatPlan").hidden = true;
  byId("printAttendanceSheet").hidden = true;
});
byId("admitEligibleRows").addEventListener("change", () => {
  const checkboxes = [...document.querySelectorAll(".admit-student-choice:not(:disabled)")];
  const selected = document.querySelector(".admit-student-choice:checked");
  byId("selectAllEligible").checked = checkboxes.length > 0 && checkboxes.every((checkbox) => checkbox.checked);
  byId("prepareAdmitCards").disabled = !selected;
  byId("prepareSeatPlan").disabled = !selected;
  byId("prepareAttendanceSheet").disabled = !selected;
  byId("admitPrintArea").hidden = true;
  byId("printAdmitCards").hidden = true;
  byId("printSeatPlan").hidden = true;
  byId("printAttendanceSheet").hidden = true;
  admitPrintMode = "";
});
byId("prepareAdmitCards").addEventListener("click", generateAdmitCards);
byId("prepareSeatPlan").addEventListener("click", generateSeatPlan);
byId("prepareAttendanceSheet").addEventListener("click", generateAttendanceSheets);
byId("prepareBlankAdmitCards").addEventListener("click", prepareBlankAdmitCards);
byId("prepareBlankSeatPlan").addEventListener("click", generateBlankSeatPlan);
byId("prepareBlankAttendanceSheet").addEventListener("click", () => generateAttendanceSheets(true));
async function printAdmitOutput() {
  const images = [...byId("admitPrintArea").querySelectorAll("img")];
  await Promise.all(images.map((image) => image.decode?.().catch(() => {}) || Promise.resolve()));
  window.print();
}
byId("printAdmitCards").addEventListener("click", printAdmitOutput);
byId("printSeatPlan").addEventListener("click", printAdmitOutput);
byId("printAttendanceSheet").addEventListener("click", printAdmitOutput);
document.addEventListener("dashboard-language-change", () => {
  renderAdmitFeeSpreadsheet();
  updateAdmitExamOptions();
  if (byId("admitEligiblePanel").hidden) return;
  const selectedBefore = new Set([...document.querySelectorAll(".admit-student-choice:checked")].map((input) => input.dataset.studentCode));
  const hadCards = !byId("admitPrintArea").hidden;
  const previousPrintMode = admitPrintMode;
  checkAdmitEligibility();
  document.querySelectorAll(".admit-student-choice").forEach((input) => { input.checked = selectedBefore.has(input.dataset.studentCode); });
  const availableChoices = [...document.querySelectorAll(".admit-student-choice:not(:disabled)")];
  byId("selectAllEligible").checked = availableChoices.length > 0 && availableChoices.every((input) => input.checked);
  const hasSelection = Boolean(document.querySelector(".admit-student-choice:checked"));
  byId("prepareAdmitCards").disabled = !hasSelection;
  byId("prepareSeatPlan").disabled = !hasSelection;
  byId("prepareAttendanceSheet").disabled = !hasSelection;
  if (hadCards) {
    if (previousPrintMode === "seat-plan") generateSeatPlan();
    else if (previousPrintMode === "attendance") generateAttendanceSheets();
    else generateAdmitCards();
  } else loadAttendanceRoutinePreview({ silent: true });
});
updateAdmitModeFields();
byId("admitPaidThrough").value = "04";

const RESULT_CUSTOM_SUBJECT = "__manual_result_subject__";

function addResultSubjectRow(className, subject = {}) {
  const row = document.createElement("div");
  row.className = "result-subject-setting";
  const subjectLabel = document.createElement("label");
  subjectLabel.textContent = "বিষয়";
  const select = document.createElement("select");
  select.className = "result-subject-select";
  select.required = true;
  select.append(new Option("বিষয় নির্বাচন করুন", ""));
  const academicSubjects = getAcademicSubjects(className);
  academicSubjects.forEach((entry) => {
    const option = new Option(entry.name, entry.name);
    select.append(option);
  });
  select.append(new Option("নিজে বিষয় লিখুন…", RESULT_CUSTOM_SUBJECT));
  const standardSubject = academicSubjects.find((entry) => entry.name === subject.name);
  select.value = standardSubject ? standardSubject.name : subject.name ? RESULT_CUSTOM_SUBJECT : "";
  subjectLabel.append(select);
  const customSubjectInput = document.createElement("input");
  customSubjectInput.type = "text";
  customSubjectInput.className = "result-custom-subject-name";
  customSubjectInput.placeholder = "বিষয়ের নাম লিখুন";
  customSubjectInput.value = standardSubject ? "" : subject.name || "";
  customSubjectInput.hidden = select.value !== RESULT_CUSTOM_SUBJECT;
  customSubjectInput.required = !customSubjectInput.hidden;
  subjectLabel.append(customSubjectInput);
  const codeLabel = document.createElement("label");
  codeLabel.textContent = "বিষয় কোড";
  const codeInput = document.createElement("input");
  codeInput.type = "text";
  codeInput.className = "result-subject-code";
  codeInput.value = subject.code || standardSubject?.code || "";
  codeLabel.append(codeInput);
  const settings = [
    ["theoryFullMarks", "তাত্ত্বিক পূর্ণমান", subject.theoryFullMarks ?? subject.fullMarks ?? "", false],
    ["practicalFullMarks", "ব্যবহারিক পূর্ণমান (ঐচ্ছিক)", subject.practicalFullMarks ?? (subject.fullMarks ? 0 : ""), false],
    ["theoryPassMarks", "তাত্ত্বিক পাশ নম্বর (ঐচ্ছিক)", subject.theoryPassMarks ?? subject.passMarks ?? "", false],
    ["practicalPassMarks", "ব্যবহারিক পাশ নম্বর (ঐচ্ছিক)", subject.practicalPassMarks ?? "", false]
  ];
  row.append(subjectLabel, codeLabel);
  settings.forEach(([key, labelText, value, required]) => {
    const label = document.createElement("label");
    label.textContent = labelText;
    const input = document.createElement("input");
    input.type = "number";
    input.min = "0";
    input.step = "0.01";
    input.required = required;
    input.value = value;
    input.dataset.markType = key;
    if (key === "theoryFullMarks" || key === "practicalFullMarks") {
      input.addEventListener("input", () => { byId("resultMatrixWrap").hidden = true; });
    }
    label.append(input);
    row.append(label);
  });
  const remove = document.createElement("button");
  remove.type = "button";
  remove.className = "secondary-button remove-subject-button";
  remove.textContent = "সরান";
  remove.addEventListener("click", () => { row.remove(); byId("resultMatrixWrap").hidden = true; });
  row.append(remove);
  select.addEventListener("change", () => {
    const customMode = select.value === RESULT_CUSTOM_SUBJECT;
    customSubjectInput.hidden = !customMode;
    customSubjectInput.required = customMode;
    const entry = getAcademicSubjects(className).find((item) => item.name === select.value);
    codeInput.value = entry?.code || "";
    byId("resultMatrixWrap").hidden = true;
  });
  customSubjectInput.addEventListener("input", () => { byId("resultMatrixWrap").hidden = true; });
  resultSubjectRows.append(row);
}

function renderSubjectOptions(className, previousSubjects = []) {
  resultSubjectRows.replaceChildren();
  const options = getAcademicSubjects(className);
  byId("resultSubjectsHint").textContent = options.length
    ? "বিষয় নির্বাচন করলে বিষয় কোড নিজে থেকে বসবে; নতুন বিষয়ও হাতে লেখা যাবে।"
    : "এই শ্রেণির তালিকায় বিষয় নেই; নতুন বিষয় হাতে লিখুন।";
  if (previousSubjects.length) previousSubjects.forEach((subject) => addResultSubjectRow(className, subject));
  else if (className) addResultSubjectRow(className);
  byId("resultMatrixWrap").hidden = true;
}

function selectedResultSubjects() {
  return [...resultSubjectRows.querySelectorAll(".result-subject-setting")].map((row) => ({
    name: row.querySelector(".result-subject-select").value === RESULT_CUSTOM_SUBJECT
      ? row.querySelector(".result-custom-subject-name").value.trim()
      : row.querySelector(".result-subject-select").value,
    code: row.querySelector(".result-subject-code").value.trim(),
    theoryFullMarks: Number(row.querySelector('[data-mark-type="theoryFullMarks"]').value),
    practicalFullMarks: Number(row.querySelector('[data-mark-type="practicalFullMarks"]').value),
    theoryPassMarks: row.querySelector('[data-mark-type="theoryPassMarks"]').value === ""
      ? null
      : Number(row.querySelector('[data-mark-type="theoryPassMarks"]').value),
    practicalPassMarks: row.querySelector('[data-mark-type="practicalPassMarks"]').value === ""
      ? null
      : Number(row.querySelector('[data-mark-type="practicalPassMarks"]').value)
  }));
}

function selectedResultDisplayFields() {
  return {
    studentId: byId("resultShowStudentId").checked,
    boardRoll: byId("resultShowBoardRoll").checked,
    classRoll: byId("resultShowClassRoll").checked,
    branch: byId("resultShowBranch").checked,
    className: byId("resultShowClass").checked,
    trade: byId("resultShowTrade").checked,
    meritRank: byId("resultShowMeritRank").checked,
    failSubjectCount: byId("resultShowFailSubjectCount").checked,
    absentSubjectCount: byId("resultShowAbsentSubjectCount").checked
  };
}

function applyResultDisplayFields(fields = {}) {
  byId("resultShowStudentId").checked = fields.studentId !== false;
  byId("resultShowBoardRoll").checked = fields.boardRoll !== false;
  byId("resultShowClassRoll").checked = fields.classRoll !== false;
  byId("resultShowBranch").checked = fields.branch !== false;
  byId("resultShowClass").checked = fields.className !== false;
  byId("resultShowTrade").checked = fields.trade !== false;
  byId("resultShowMeritRank").checked = fields.meritRank !== false;
  byId("resultShowFailSubjectCount").checked = fields.failSubjectCount !== false;
  byId("resultShowAbsentSubjectCount").checked = fields.absentSubjectCount !== false;
}

function selectedMeritDisplayFields() {
  return {
    rank: byId("meritShowRank").checked,
    name: byId("meritShowName").checked,
    studentId: byId("meritShowStudentId").checked,
    classRoll: byId("meritShowClassRoll").checked,
    marks: byId("meritShowMarks").checked,
    percentage: byId("meritShowPercentage").checked
  };
}

function applyMeritDisplayFields(fields = {}) {
  byId("meritShowRank").checked = fields.rank !== false;
  byId("meritShowName").checked = fields.name !== false;
  byId("meritShowStudentId").checked = fields.studentId !== false;
  byId("meritShowClassRoll").checked = fields.classRoll !== false;
  byId("meritShowMarks").checked = fields.marks !== false;
  byId("meritShowPercentage").checked = fields.percentage !== false;
}

function downloadClassResultsPdf() {
  const className = byId("resultClass").value;
  const exam = byId("resultExam").value;
  const year = Number(byId("resultYear").value);
  if (!className || !exam || !Number.isInteger(year)) {
    message("resultMessage", "PDF তৈরির আগে শ্রেণি, পরীক্ষা ও শিক্ষাবর্ষ নির্বাচন করুন।", true);
    return;
  }

  const records = resultRecords
    .filter((record) => record.className === className && record.exam === exam && Number(record.year) === year)
    .sort((a, b) => Number(normalizeDigits(String(a.roll || ""))) - Number(normalizeDigits(String(b.roll || "")))
      || String(a.studentName || "").localeCompare(String(b.studentName || ""), "bn"));
  if (!records.length) {
    message("resultMessage", "নির্বাচিত শ্রেণি, পরীক্ষা ও শিক্ষাবর্ষের কোনো সংরক্ষিত ফলাফল পাওয়া যায়নি।", true);
    return;
  }

  const number = (value) => value === "" ? "" : bn(value ?? 0);
  const fontUrl = new URL("fonts/kalpurush.ttf", location.href).href;
  const logoUrl = new URL("images/logo/logo-transparent.png", location.href).href;
  const pages = records.map((record, index) => {
    const subjects = record.subjects || [];
    const hasTheory = subjects.some((subject) => Number(subject.theoryFullMarks) > 0);
    const hasPractical = subjects.some((subject) => Number(subject.practicalFullMarks) > 0);
    const showPractical = record.showPractical === true && hasPractical;
    const hasTheoryPass = hasTheory && subjects.some((subject) => (subject.theoryPassMarks ?? subject.passMarks) != null && (subject.theoryPassMarks ?? subject.passMarks) !== "");
    const hasPracticalPass = showPractical && subjects.some((subject) => subject.practicalPassMarks != null && subject.practicalPassMarks !== "");
    const headers = ["ক্রমিক", "বিষয়", "বিষয় কোড"];
    if (showPractical) {
      if (hasTheory) headers.push("তাত্ত্বিক পূর্ণমান", "তাত্ত্বিক নম্বর");
      if (hasTheoryPass) headers.push("তাত্ত্বিক পাশ নম্বর");
      headers.push("ব্যবহারিক পূর্ণমান", "ব্যবহারিক নম্বর");
      if (hasPracticalPass) headers.push("ব্যবহারিক পাশ নম্বর");
      headers.push("মোট পূর্ণমান", "মোট নম্বর");
    } else {
      headers.push("পূর্ণমান", "প্রাপ্ত নম্বর");
      if (hasTheoryPass) headers.push("পাশ নম্বর");
    }
    const header = headers.map((title) => `<th>${receiptEscape(title)}</th>`).join("");
    const rows = subjects.map((subject, subjectIndex) => {
      const absentText = record.absent === true ? "অনুপস্থিত" : "";
      const cells = [number(subjectIndex + 1), subject.name || "—", subject.code || "—"];
      if (showPractical) {
        if (hasTheory) cells.push(Number(subject.theoryFullMarks) > 0 ? number(subject.theoryFullMarks) : "", Number(subject.theoryFullMarks) > 0 ? (record.absent ? absentText : number(subject.theoryMarks)) : "");
        if (hasTheoryPass) cells.push(Number(subject.theoryFullMarks) > 0 ? number(subject.theoryPassMarks ?? subject.passMarks ?? "") : "");
        cells.push(Number(subject.practicalFullMarks) > 0 ? number(subject.practicalFullMarks) : "", Number(subject.practicalFullMarks) > 0 ? (record.absent ? absentText : number(subject.practicalMarks)) : "");
        if (hasPracticalPass) cells.push(Number(subject.practicalFullMarks) > 0 ? number(subject.practicalPassMarks ?? "") : "");
        cells.push(number(subject.fullMarks), record.absent ? absentText : number(subject.marks));
      } else {
        cells.push(number(subject.fullMarks), record.absent ? absentText : number(subject.marks));
        if (hasTheoryPass) cells.push(number(subject.theoryPassMarks ?? subject.passMarks ?? ""));
      }
      return `<tr>${cells.map((value) => `<td>${receiptEscape(value)}</td>`).join("")}</tr>`;
    }).join("");

    const display = record.displayFields || {};
    const identity = [
      ["শিক্ষার্থী আইডি", record.studentCode, display.studentId !== false],
      ["বোর্ড রোল", record.boardRoll, display.boardRoll !== false],
      ["ক্লাস রোল", record.roll, display.classRoll !== false],
      ["শাখা", record.branch, display.branch !== false],
      ["শ্রেণি", record.className, display.className !== false],
      ["ট্রেড", record.trade, display.trade !== false]
    ].filter(([, value, enabled]) => enabled && value != null && value !== "")
      .map(([label, value]) => `<span>${receiptEscape(label)}: ${receiptEscape(value)}</span>`).join("");
    const rank = records.filter((candidate) => Number(candidate.totalMarks || 0) > Number(record.totalMarks || 0)).length + 1;
    const rankBadge = display.meritRank === false ? "" : `<p class="rank">মেধাতালিকায় ${number(rank)}তম স্থান</p>`;
    const absentBadge = record.absent === true ? '<p class="absent">অনুপস্থিত</p>' : "";
    const percentage = number(record.percentage);
    return `<article class="result-page${index === records.length - 1 ? " last-page" : ""}">
      <img class="watermark" src="${receiptEscape(logoUrl)}" alt="" aria-hidden="true">
      <header class="school"><h1>তাবিউল মুরসালীন নগর কারিগরি স্কুল এন্ড কলেজ</h1><p>টেঙ্গুরী, কেন্দুয়া, নেত্রকোণা · EIIN No. 136065</p></header>
      <h2 class="exam-title">${receiptEscape(exam)} পরীক্ষার ফলাফল — ${number(year)}</h2>
      <h3 class="student-name">${receiptEscape(record.studentName || "")}</h3>
      <div class="identity">${identity}</div>${absentBadge}${rankBadge}
      <table><thead><tr>${header}</tr></thead><tbody>${rows}</tbody></table>
      <p class="total">মোট: ${number(record.totalMarks)} / ${number(record.fullMarks)} · শতকরা: ${percentage}%</p>
      <footer><span>অভিভাবকের স্বাক্ষর</span><span>প্রতিষ্ঠান প্রধানের স্বাক্ষর ও সিল</span></footer>
    </article>`;
  }).join("");
  const safeTitle = receiptEscape(`${className}-${exam}-${year}-results`);
  const win = window.open("", "_blank", "width=900,height=750");
  if (!win) {
    message("resultMessage", "PDF তৈরির প্রিন্ট উইন্ডো খুলতে ব্রাউজারের পপ-আপ অনুমতি দিন।", true);
    return;
  }
  win.document.open();
  win.document.write(`<!doctype html><html lang="bn"><head><meta charset="utf-8"><base href="${receiptEscape(location.href)}"><title>${safeTitle}</title><style>
    @font-face{font-family:Kalpurush;src:url("${receiptEscape(fontUrl)}") format("truetype")}@page{size:A4 portrait;margin:8mm}*{box-sizing:border-box}html,body{margin:0;padding:0}body{font-family:Kalpurush,Arial,sans-serif;color:#111}.result-page{position:relative;isolation:isolate;min-height:281mm;padding:3mm 2mm;page-break-after:always;break-after:page}.result-page:last-child{page-break-after:auto;break-after:auto}.watermark{position:absolute;z-index:0;top:50%;left:50%;width:145mm;height:145mm;max-width:82%;max-height:72%;object-fit:contain;transform:translate(-50%,-50%);opacity:.065!important;pointer-events:none}.result-page>*:not(.watermark){position:relative;z-index:1}.school{text-align:center;border-bottom:1px solid #8a8a8a;padding:0 0 2mm;margin:0 0 3mm}.school h1{font-size:16pt;line-height:1.2;margin:0}.school p{font-size:9pt;margin:1mm 0 0}.exam-title{text-align:center;font-size:12pt;margin:2mm 0 3mm;padding:1.5mm;border:1px solid #333}.student-name{text-align:center;font-size:12pt;margin:0 0 1mm}.identity{display:flex;justify-content:center;flex-wrap:wrap;gap:1mm 3mm;margin:0 0 3mm;font-size:9pt}.identity span{white-space:nowrap}.absent,.rank{text-align:center;margin:1mm auto;padding:1mm}.absent{color:#8d303e}.rank{font-weight:bold}table{width:100%;border-collapse:collapse;table-layout:auto;font-size:9pt}th,td{border:1px solid #555;padding:1.7mm 1mm;text-align:center;line-height:1.2}thead{display:table-header-group}th{font-weight:bold}.total{text-align:right;font-weight:bold;margin:3mm 0}footer{display:flex;justify-content:space-between;gap:20mm;margin-top:16mm}footer span{width:55mm;border-top:1px solid #333;text-align:center;padding-top:1mm;font-size:9pt}@media screen{body{background:#e7ebef;padding:12mm}.result-page{width:210mm;min-height:297mm;background:#fff;margin:0 auto 10mm;box-shadow:0 2px 12px #8792a0}}
    </style></head><body>${pages}<script>window.addEventListener('load',async()=>{try{await document.fonts.ready}catch{}window.focus();setTimeout(()=>window.print(),150)});</script></body></html>`);
  win.document.close();
  message("resultMessage", document.documentElement.lang === "en"
    ? `${bn(records.length)} students' results are ready. Select “Save as PDF” in the print destination.`
    : `${bn(records.length)} জন শিক্ষার্থীর ফলাফল PDF প্রিন্টে প্রস্তুত। গন্তব্য থেকে “Save as PDF” নির্বাচন করুন।`);
}

byId("downloadClassResultPdf")?.addEventListener("click", downloadClassResultsPdf);

function classStudents(className, rollType) {
  const classCode = getClassCode(className);
  return students.filter((student) => getClassCode(student.className || "") === classCode
    && (rollType !== "boardRoll" || student.boardRoll))
    .sort((a, b) => Number(normalizeDigits(String(a[rollType] || ""))) - Number(normalizeDigits(String(b[rollType] || ""))));
}

function renderResultMatrix(prefillRecords = []) {
  const className = byId("resultClass").value;
  const rollType = byId("resultRollType").value;
  const subjects = selectedResultSubjects();
  const classList = classStudents(className, rollType);
  if (!className) {
    message("resultMessage", "শ্রেণি নির্বাচন করুন।", true);
    byId("resultMatrixWrap").hidden = true;
    return;
  }
  if (!rollType) {
    message("resultMessage", "বোর্ড রোল অথবা শ্রেণি রোল নির্বাচন করুন।", true);
    byId("resultMatrixWrap").hidden = true;
    return;
  }
  if (!subjects.length || subjects.some((subject) => !subject.name || subject.theoryFullMarks + subject.practicalFullMarks <= 0)) {
    message("resultMessage", "প্রতিটি বিষয়ের তাত্ত্বিক বা ব্যবহারিক পূর্ণমান দিন।", true);
    byId("resultMatrixWrap").hidden = true;
    return;
  }
  if (!classList.length) {
    message("resultMessage", rollType === "boardRoll"
      ? "এই শ্রেণির শিক্ষার্থীদের বোর্ড রোল যোগ করা নেই। আগে শিক্ষার্থী নিবন্ধনে বোর্ড রোল দিন।"
      : "এই শ্রেণিতে কোনো নিবন্ধিত শিক্ষার্থী পাওয়া যায়নি। শিক্ষার্থীর শ্রেণির তথ্য মিলিয়ে দেখুন।", true);
    byId("resultMatrixWrap").hidden = true;
    return;
  }
  const table = document.createElement("table");
  table.className = "data-table result-marks-table";
  table.classList.add("result-marks-compact");
  table.dataset.rollType = rollType;
  const scoreColumnCount = subjects.reduce((count, subject) => count
    + (Number(subject.theoryFullMarks) > 0 ? 1 : 0)
    + (Number(subject.practicalFullMarks) > 0 ? 1 : 0), 0);
  table.style.width = "max-content";
  table.style.minWidth = `${108 + scoreColumnCount * 82}px`;
  const t = (value) => window.dashboardTranslate?.(value) || value;
  const thead = table.createTHead();
  const subjectHeader = thead.insertRow();
  const rollHeader = document.createElement("th");
  rollHeader.rowSpan = 2;
  rollHeader.textContent = t("রোল / অবস্থা");
  subjectHeader.append(rollHeader);
  subjects.forEach((subject) => {
    const th = document.createElement("th");
    th.colSpan = (Number(subject.theoryFullMarks) > 0 ? 1 : 0) + (Number(subject.practicalFullMarks) > 0 ? 1 : 0);
    th.textContent = `${t(subject.name)}${subject.code ? ` · ${subject.code}` : ""}`;
    subjectHeader.append(th);
  });
  const componentHeader = thead.insertRow();
  subjects.forEach((subject) => {
    const parts = [];
    if (Number(subject.theoryFullMarks) > 0) parts.push(["তাত্ত্বিক", subject.theoryFullMarks]);
    if (Number(subject.practicalFullMarks) > 0) parts.push(["ব্যবহারিক", subject.practicalFullMarks]);
    parts.forEach(([label, maximum]) => {
      const th = document.createElement("th");
      th.textContent = `${t(label)} · ${bn(maximum)}`;
      componentHeader.append(th);
    });
  });
  const body = table.createTBody();
  const exam = byId("resultExam").value;
  const year = Number(byId("resultYear").value);
  const savedRecords = [...prefillRecords, ...resultDraftRecords.filter((record) =>
    record.exam === exam && Number(record.year) === year
  )];
  classList.forEach((student) => {
    const row = body.insertRow();
    row.dataset.studentCode = student.studentCode;
    const rollCell = row.insertCell();
    rollCell.className = "result-roll-cell";
    const savedStudentRecord = [...savedRecords].reverse().find((record) => record.studentCode === student.studentCode);
    const rollText = document.createElement("span");
    rollText.textContent = normalizeDigits(String(student[rollType] || "—"));
    rollCell.append(rollText);
    const absentLabel = document.createElement("label");
    absentLabel.className = "result-absent-control";
    const absentToggle = document.createElement("input");
    absentToggle.type = "checkbox";
    absentToggle.className = "result-absent-toggle";
    absentToggle.checked = savedStudentRecord?.absent === true;
    row.classList.toggle("result-student-absent", absentToggle.checked);
    absentToggle.setAttribute("aria-label", `${normalizeDigits(String(student[rollType] || "—"))} রোল অনুপস্থিত`);
    const absentText = document.createElement("span");
    absentText.textContent = "অনুপস্থিত";
    absentLabel.append(absentToggle, absentText);
    rollCell.append(absentLabel);
    subjects.forEach((subject) => {
      const saved = (savedStudentRecord?.subjects || [])
        .find((item) => item.name === subject.name || (subject.code && item.code === subject.code));
      const parts = [];
      if (Number(subject.theoryFullMarks) > 0) parts.push(["theory", subject.theoryFullMarks]);
      if (Number(subject.practicalFullMarks) > 0) parts.push(["practical", subject.practicalFullMarks]);
      parts.forEach(([component, maximum]) => {
        const cell = row.insertCell();
        const input = document.createElement("input");
        input.type = "number";
        input.min = "0";
        input.max = String(maximum);
        input.step = "0.01";
        input.required = true;
        input.inputMode = "decimal";
        input.className = "result-mark-input";
        input.setAttribute("aria-label", `${t("রোল")} ${student[rollType] || "—"} · ${t(subject.name)} · ${t(component === "theory" ? "তাত্ত্বিক" : "ব্যবহারিক")}`);
        input.dataset.studentCode = student.studentCode;
        input.dataset.subjectName = subject.name;
        input.dataset.component = component;
        input.value = saved
          ? (saved[`${component}Marks`] ?? (component === "theory" ? saved.marks : 0))
          : "";
        input.disabled = absentToggle.checked;
        cell.append(input);
      });
    });
  });
  byId("resultMatrix").replaceChildren(table);
  byId("resultMatrixWrap").hidden = false;
  message("resultMessage", `${bn(classList.length)} জন শিক্ষার্থীর জন্য নম্বরের ছক তৈরি হয়েছে।`);
}

byId("resultClass").addEventListener("change", () => renderSubjectOptions(byId("resultClass").value));
byId("addResultSubject").addEventListener("click", () => {
  const className = byId("resultClass").value;
  if (className) addResultSubjectRow(className);
});
byId("prepareResultMatrix").addEventListener("click", () => {
  const className = byId("resultClass").value;
  const exam = byId("resultExam").value;
  const year = Number(byId("resultYear").value);
  const selected = selectedResultSubjects();
  const savedDraft = resultDraftRecords.find((record) => record.exam === exam
    && Number(record.year) === year
    && getClassCode(record.className || "") === getClassCode(className || ""));
  if (savedDraft?.subjects?.length && selected.length === 1 && !selected[0].name) {
    renderSubjectOptions(className, savedDraft.subjects);
    byId("resultShowPractical").checked = savedDraft.showPractical === true;
    applyResultDisplayFields(savedDraft.displayFields);
    applyMeritDisplayFields(savedDraft.meritDisplayFields);
  }
  renderResultMatrix();
});
byId("resultRollType").addEventListener("change", () => { byId("resultMatrixWrap").hidden = true; });

const resultDraftSavesInProgress = new Set();

resultMatrix.addEventListener("change", async (event) => {
  const input = event.target.closest("input.result-mark-input");
  const absentToggle = event.target.closest("input.result-absent-toggle");
  if (!input && !absentToggle) return;
  const studentRow = (input || absentToggle).closest("tr");
  const studentCode = studentRow?.dataset.studentCode;
  if (!studentCode) return;
  if (absentToggle) {
    studentRow.classList.toggle("result-student-absent", absentToggle.checked);
    studentRow.querySelectorAll("input.result-mark-input").forEach((markInput) => {
      markInput.disabled = absentToggle.checked;
      if (absentToggle.checked) markInput.value = "";
    });
  }
  if (resultDraftSavesInProgress.has(studentCode)) return;
  const className = byId("resultClass").value;
  const rollType = byId("resultRollType").value;
  const exam = byId("resultExam").value;
  const year = Number(byId("resultYear").value);
  const student = classStudents(className, rollType).find((item) => item.studentCode === studentCode);
  const subjects = selectedResultSubjects();
  const inputs = [...resultMatrix.querySelectorAll(`input.result-mark-input[data-student-code="${CSS.escape(studentCode)}"]`)];
  const absent = studentRow.querySelector(".result-absent-toggle")?.checked === true;
  if (absentToggle && !absent) {
    const draftId = resultDocumentId(studentCode, year, exam);
    const absentDraft = resultDraftRecords.find((record) => record.id === draftId && record.absent);
    if (absentDraft && currentAdmin) {
      try {
        await deleteDoc(doc(db, resultDraftsCollection, draftId));
        resultDraftRecords = resultDraftRecords.filter((record) => record.id !== draftId);
        message("resultMessage", "অনুপস্থিতির খসড়া বাতিল হয়েছে; নম্বর লিখুন।");
      } catch (error) {
        console.error("অনুপস্থিতির খসড়া বাতিল হয়নি:", error);
        message("resultMessage", "অনুপস্থিতির খসড়া বাতিল হয়নি। Firestore access rules পরীক্ষা করুন।", true);
      }
    }
    return;
  }
  if (!currentAdmin || !student || !exam || !Number.isInteger(year) || !subjects.length
    || (!absent && inputs.some((field) => field.value === "" || Number(field.value) < 0 || Number(field.value) > Number(field.max)))) return;
  resultDraftSavesInProgress.add(studentCode);
  try {
    const studentSubjects = subjects.map((subject) => {
      const getMark = (component) => Number(resultMatrix.querySelector(`input[data-student-code="${CSS.escape(studentCode)}"][data-subject-name="${CSS.escape(subject.name)}"][data-component="${component}"]`)?.value || 0);
      const theoryMarks = absent ? 0 : getMark("theory");
      const practicalMarks = absent ? 0 : getMark("practical");
      return { ...subject, theoryMarks, practicalMarks, fullMarks: subject.theoryFullMarks + subject.practicalFullMarks, marks: theoryMarks + practicalMarks };
    });
    const totalMarks = studentSubjects.reduce((sum, subject) => sum + subject.marks, 0);
    const fullMarks = studentSubjects.reduce((sum, subject) => sum + subject.fullMarks, 0);
    const draftId = resultDocumentId(studentCode, year, exam);
    const draft = { studentCode, studentName: student.name, branch: student.branch, className: student.className, trade: student.trade || "", roll: student.roll || "", boardRoll: student.boardRoll || "", rollType, exam, year, subjects: studentSubjects, absent, totalMarks, fullMarks, percentage: fullMarks ? Math.round((totalMarks / fullMarks) * 10000) / 100 : 0, showPractical: byId("resultShowPractical").checked, displayFields: selectedResultDisplayFields(), meritDisplayFields: selectedMeritDisplayFields(), updatedAt: serverTimestamp(), updatedBy: currentAdmin.uid };
    await setDoc(doc(db, resultDraftsCollection, draftId), draft, { merge: true });
    resultDraftRecords = [...resultDraftRecords.filter((record) => record.id !== draftId), { ...draft, id: draftId }];
    message("resultMessage", "নম্বরের খসড়া স্বয়ংক্রিয়ভাবে সংরক্ষিত হয়েছে।");
  } catch (error) {
    console.error("নম্বরের খসড়া সেভ হয়নি:", error);
    message("resultMessage", "নম্বরের খসড়া সেভ হয়নি। Firestore access rules পরীক্ষা করুন।", true);
  } finally {
    resultDraftSavesInProgress.delete(studentCode);
  }
});

function resultDocumentId(studentCode, year, exam) {
  const bytes = new TextEncoder().encode(exam.trim().toLowerCase());
  const examKey = [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${studentCode}_${year}_${examKey}`;
}

function resetResultForm() {
  resultForm.reset();
  editingResultId = null;
  editingResultGroup = null;
  byId("resultShowPractical").checked = true;
  byId("saveResultButton").textContent = "ফলাফল সংরক্ষণ";
  byId("cancelResultEdit").hidden = true;
  resultSubjectRows.replaceChildren();
  resultMatrix.replaceChildren();
  byId("resultMatrixWrap").hidden = true;
}

resultForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!currentAdmin || busy) return;
  const className = byId("resultClass").value;
  const rollType = byId("resultRollType").value;
  const exam = byId("resultExam").value.trim();
  const year = Number(byId("resultYear").value);
  const subjects = selectedResultSubjects();
  const classList = classStudents(className, rollType);
  const inputs = [...resultMatrix.querySelectorAll("input.result-mark-input")];
  if (!className || !rollType || !exam || !Number.isInteger(year) || !subjects.length || !classList.length || !inputs.length) {
    message("resultMessage", "শ্রেণি, পরীক্ষা, বিষয় ও রোলের ছক তৈরি করুন।", true);
    return;
  }
  if (subjects.some((subject) => !subject.name || !Number.isFinite(subject.theoryFullMarks) || subject.theoryFullMarks < 0 || !Number.isFinite(subject.practicalFullMarks) || subject.practicalFullMarks < 0 || subject.theoryFullMarks + subject.practicalFullMarks <= 0
    || (subject.theoryPassMarks !== null && (!Number.isFinite(subject.theoryPassMarks) || subject.theoryPassMarks < 0 || subject.theoryPassMarks > subject.theoryFullMarks))
    || (subject.practicalPassMarks !== null && (!Number.isFinite(subject.practicalPassMarks) || subject.practicalPassMarks < 0 || subject.practicalPassMarks > subject.practicalFullMarks)))
    || new Set(subjects.map((subject) => subject.name)).size !== subjects.length
    || inputs.some((input) => {
      if (input.closest("tr")?.querySelector(".result-absent-toggle")?.checked) return false;
      return input.value === "" || Number(input.value) < 0 || Number(input.value) > Number(input.max);
    })) {
    message("resultMessage", "প্রতিটি বিষয়ের পূর্ণমান দিন এবং প্রাপ্ত নম্বর পূর্ণমানের মধ্যে রাখুন।", true);
    return;
  }

  const published = byId("resultPublished").checked;
  const showPractical = byId("resultShowPractical").checked;
  busy = true;
  byId("saveResultButton").disabled = true;
  message("resultMessage", "শ্রেণির ফলাফল সংরক্ষণ হচ্ছে...");
  try {
    for (let start = 0; start < classList.length; start += 250) {
      const batch = writeBatch(db);
      classList.slice(start, start + 250).forEach((student) => {
        const studentSubjects = subjects.map((subject) => {
          const findMark = (component) => Number(resultMatrix.querySelector(`input[data-student-code="${CSS.escape(student.studentCode)}"][data-subject-name="${CSS.escape(subject.name)}"][data-component="${component}"]`)?.value || 0);
          const theoryMarks = findMark("theory");
          const practicalMarks = findMark("practical");
          return { name: subject.name, code: subject.code, theoryFullMarks: subject.theoryFullMarks, practicalFullMarks: subject.practicalFullMarks, theoryPassMarks: subject.theoryPassMarks, practicalPassMarks: subject.practicalPassMarks, theoryMarks, practicalMarks, fullMarks: subject.theoryFullMarks + subject.practicalFullMarks, marks: theoryMarks + practicalMarks };
        });
        const totalMarks = studentSubjects.reduce((sum, subject) => sum + subject.marks, 0);
        const fullMarks = studentSubjects.reduce((sum, subject) => sum + subject.fullMarks, 0);
        const percentage = fullMarks ? Math.round((totalMarks / fullMarks) * 10000) / 100 : 0;
        const resultId = resultDocumentId(student.studentCode, year, exam);
        const absent = resultMatrix.querySelector(`tr[data-student-code="${CSS.escape(student.studentCode)}"] .result-absent-toggle`)?.checked === true;
        const data = { studentCode: student.studentCode, studentName: student.name, branch: student.branch, className: student.className, trade: student.trade || "", roll: student.roll || "", boardRoll: student.boardRoll || "", rollType, exam, year, subjects: studentSubjects, absent, totalMarks, fullMarks, percentage, published, showPractical, displayFields: selectedResultDisplayFields(), meritDisplayFields: selectedMeritDisplayFields(), updatedAt: serverTimestamp() };
        const existing = resultRecords.some((record) => record.studentCode === student.studentCode && record.year === year && record.exam === exam);
        batch.set(doc(db, resultsCollection, resultId), { ...data, ...(existing ? {} : { createdAt: serverTimestamp(), createdBy: currentAdmin.uid }) }, { merge: true });
        batch.set(doc(db, publicResultsCollection, resultId), data, { merge: true });
      });
      await batch.commit();
    }
    for (let start = 0; start < classList.length; start += 400) {
      const draftCleanup = writeBatch(db);
      classList.slice(start, start + 400).forEach((student) => {
        draftCleanup.delete(doc(db, resultDraftsCollection, resultDocumentId(student.studentCode, year, exam)));
      });
      await draftCleanup.commit();
    }
    const submittedDrafts = resultDraftRecords.filter((record) => record.authorTeacherId
      && record.authorTeacherId !== "admin"
      && record.className === className
      && Number(record.year) === year
      && record.exam === exam);
    for (let start = 0; start < submittedDrafts.length; start += 400) {
      const teacherDraftCleanup = writeBatch(db);
      submittedDrafts.slice(start, start + 400).forEach((item) => teacherDraftCleanup.delete(doc(db, "teacherResultDrafts", item.id)));
      await teacherDraftCleanup.commit();
    }
    resetResultForm();
    message("resultMessage", "শ্রেণির ফলাফল সংরক্ষণ হয়েছে।");
    await loadResults();
  } catch (error) {
    console.error("ফলাফল সংরক্ষণের সমস্যা:", error);
    message("resultMessage", "ফলাফল সংরক্ষণ হয়নি। Firestore access rules পরীক্ষা করুন।", true);
  } finally {
    busy = false;
    byId("saveResultButton").disabled = false;
  }
});

async function loadResults() {
  const [snapshot, draftsSnapshot, teacherDraftSnapshot] = await Promise.all([
    getDocs(collection(db, resultsCollection)),
    getDocs(collection(db, resultDraftsCollection)),
    getDocs(collection(db, "teacherResultDrafts"))
  ]);
  const records = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
  const teacherDrafts = teacherDraftSnapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
  resultDraftRecords = [
    ...draftsSnapshot.docs.map((item) => ({ id: item.id, ...item.data() })),
    ...teacherDrafts.map((item) => ({
      ...item,
      subjects: [{
        name: item.subjectName,
        code: item.subjectCode,
        theoryFullMarks: Number(item.theoryFullMarks || 0),
        practicalFullMarks: Number(item.practicalFullMarks || 0),
        theoryMarks: Number(item.theoryMarks || 0),
        practicalMarks: Number(item.practicalMarks || 0),
        fullMarks: Number(item.fullMarks || 0),
        marks: Number(item.totalMarks || 0)
      }]
    }))
  ];
  resultRecords = records;
  renderTeacherResultSubmissions(teacherDrafts);
  records.sort((a, b) => (b.year || 0) - (a.year || 0) || (a.exam || "").localeCompare(b.exam || "", "bn"));
  resultRows.replaceChildren();
  if (!records.length) {
    const row = resultRows.insertRow();
    cell(row, "এখনো কোনো ফলাফল সংরক্ষণ করা হয়নি।").colSpan = 6;
    return;
  }
  for (const result of records) {
    const row = resultRows.insertRow();
    cell(row, result.exam);
    cell(row, bn(result.year || ""));
    cell(row, `${result.studentName || ""} (${result.studentCode || ""})`);
    cell(row, `${bn(result.totalMarks || 0)} / ${bn(result.fullMarks || 0)} (${bn(result.percentage || 0)}%)`);
    cell(row, result.published ? "প্রকাশিত" : "গোপন");
    const actions = cell(row, "");
    actions.className = "table-actions-cell";
    actions.append(
      actionButton("এডিট", "edit-result", result.id),
      actionButton("মুছুন", "delete-result", result.id, "danger-action")
    );
  }
}

function renderTeacherResultSubmissions(records) {
  const body = byId("teacherResultSubmissionRows");
  if (!body) return;
  body.replaceChildren();
  records.sort((a, b) => (b.updatedAt?.toMillis?.() || 0) - (a.updatedAt?.toMillis?.() || 0));
  if (!records.length) {
    const row = body.insertRow();
    cell(row, "এখনো কোনো শিক্ষক ফলাফলের খসড়া জমা দেননি।").colSpan = 6;
    return;
  }
  records.forEach((record) => {
    const row = body.insertRow();
    cell(row, record.authorName || "—");
    cell(row, `${record.studentName || ""} · ${record.studentCode || ""}`);
    cell(row, `${record.className || ""}${record.trade ? ` · ${record.trade}` : ""}`);
    cell(row, `${record.exam || ""} · ${bn(record.year || "")}`);
    cell(row, `${record.subjectName || ""}${record.subjectCode ? ` · ${record.subjectCode}` : ""}`);
    cell(row, `${bn(record.totalMarks ?? 0)} / ${bn(record.fullMarks ?? 0)}`);
  });
}

resultRows.addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button || busy) return;
  const { action, id } = button.dataset;
  try {
    const resultRef = doc(db, resultsCollection, id);
    const resultSnapshot = await getDoc(resultRef);
    if (!resultSnapshot.exists()) return;
    const data = resultSnapshot.data();
    if (action === "edit-result") {
      editingResultId = id;
      if (![...byId("resultExam").options].some((option) => option.value === data.exam)) {
        const legacyExamOption = new Option(data.exam || "আগের পরীক্ষার নাম", data.exam || "");
        byId("resultExam").add(legacyExamOption);
      }
      byId("resultExam").value = data.exam || "";
      byId("resultYear").value = data.year || "";
      byId("resultPublished").checked = data.published === true;
      byId("resultShowPractical").checked = data.showPractical === true;
      applyResultDisplayFields(data.displayFields);
      applyMeritDisplayFields(data.meritDisplayFields);
      byId("resultClass").value = data.className || "";
      byId("resultRollType").value = data.rollType || "roll";
      editingResultGroup = { exam: data.exam, year: data.year, className: data.className };
      const matching = resultRecords.filter((record) => record.exam === data.exam && Number(record.year) === Number(data.year)
        && getClassCode(record.className || "") === getClassCode(data.className || ""));
      renderSubjectOptions(data.className, data.subjects || []);
      renderResultMatrix(matching);
      byId("saveResultButton").textContent = "পরিবর্তন সংরক্ষণ";
      byId("cancelResultEdit").hidden = false;
      resultForm.scrollIntoView({ behavior: "smooth", block: "start" });
    } else if (action === "delete-result") {
      const confirmText = "এই ফলাফলটি মুছে ফেলতে চান?";
      if (!window.confirm(window.dashboardTranslate?.(confirmText) || confirmText)) return;
      busy = true;
      const batch = writeBatch(db);
      batch.delete(resultRef);
      batch.delete(doc(db, publicResultsCollection, id));
      await batch.commit();
      message("resultMessage", "ফলাফল মুছে ফেলা হয়েছে।");
      await loadResults();
    }
  } catch (error) {
    console.error("ফলাফল পরিচালনার সমস্যা:", error);
    message("resultMessage", "কাজটি করা যায়নি। Firestore access rules পরীক্ষা করুন।", true);
  } finally {
    busy = false;
  }
});

const cancelResultButton = document.createElement("button");
cancelResultButton.type = "button";
cancelResultButton.id = "cancelResultEdit";
cancelResultButton.className = "secondary-button";
cancelResultButton.textContent = "এডিট বাতিল";
cancelResultButton.hidden = true;
byId("saveResultButton").after(cancelResultButton);
cancelResultButton.addEventListener("click", resetResultForm);

byId("feeDate").value = localDateString();
byId("feeMonthsYear").value = String(new Date().getFullYear());
byId("resultYear").value = String(new Date().getFullYear());
byId("feeSheetYear").value = String(new Date().getFullYear());
byId("admitFeeSheetYear").value = String(new Date().getFullYear());
updateAdmitExamOptions();
byId("expenseDate").value = localDateString();

onAuthStateChanged(auth, async (user) => {
  if (!user || user.uid !== ADMIN_UID) {
    if (user) await signOut(auth);
    window.location.replace("admin.html");
    return;
  }

  currentAdmin = user;
  const loads = await Promise.allSettled([loadStudents(), loadFees(), loadResults(), loadExpenses()]);
  const loadTargets = [
    ["studentMessage", "শিক্ষার্থী"],
    ["feeMessage", "বেতন"],
    ["resultMessage", "ফলাফল"],
    ["expenseMessage", "খরচ"]
  ];
  loads.forEach((result, index) => {
    if (result.status === "rejected") {
      const [messageId, sectionName] = loadTargets[index];
      console.error(`${sectionName} তথ্য লোডের সমস্যা:`, result.reason);
      const errorCode = result.reason?.code || result.reason?.message || "unknown";
      message(messageId, `${sectionName} তথ্য লোড হয়নি। Firebase error: ${errorCode}`, true);
    }
  });
});

document.addEventListener("dashboard-language-change", () => {
  if (!currentAdmin) return;
  updateLateFineField();
  updateFeeMonthSelectionCount();
  refreshStudentSelects();
  renderFeeStudentChoices();
  renderFeeSpreadsheet();
  renderAdmitFeeSpreadsheet();
  renderAccountIncome();
  renderExpenses();
  Promise.all([loadFees(), loadResults(), loadExpenses()]).catch((error) => {
    console.error("ভাষা পরিবর্তনের পর টেবিল হালনাগাদ হয়নি:", error);
  });
});










