import {
  collection,
  doc,
  getDoc,
  getDocs,
  runTransaction,
  serverTimestamp,
  setDoc,
  writeBatch
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

import { auth, db } from "./firebase-config.js";

const ADMIN_UID = "wWuBEmlsaofgjAaQi7bfblsX6L62";
const studentsCollection = "students";
const publicStudentsCollection = "studentDirectory";
const feesCollection = "studentFees";
const resultsCollection = "studentResults";
const publicResultsCollection = "publicStudentResults";

const studentForm = document.getElementById("studentForm");
const feeForm = document.getElementById("feeForm");
const resultForm = document.getElementById("resultForm");
const studentRows = document.getElementById("studentRows");
const feeRows = document.getElementById("feeRows");
const resultRows = document.getElementById("resultRows");
const feeStudentSelect = document.getElementById("feeStudentCode");
const resultStudentSelect = document.getElementById("resultStudentCode");
const subjectRows = document.getElementById("resultSubjects");

let currentAdmin = null;
let students = [];
let editingStudentCode = null;
let editingResultId = null;
let busy = false;

const byId = (id) => document.getElementById(id);
const uiLocale = () => document.documentElement.lang === "en" ? "en-US" : "bn-BD";
const bn = (value) => new Intl.NumberFormat(uiLocale()).format(value);

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

function makeStudentOption(student) {
  const option = document.createElement("option");
  option.value = student.studentCode;
  option.textContent = `${student.name} — ${student.studentCode} (${student.className || "NO CLASS"})`;
  return option;
}

function refreshStudentSelects() {
  for (const select of [feeStudentSelect, resultStudentSelect]) {
    const previousValue = select.value;
    select.replaceChildren(new Option("শিক্ষার্থী নির্বাচন করুন", ""));
    [...students]
      .sort((a, b) => (a.name || "").localeCompare(b.name || "", "bn"))
      .forEach((student) => select.append(makeStudentOption(student)));
    if (students.some((student) => student.studentCode === previousValue)) {
      select.value = previousValue;
    }
  }
}

function renderStudents() {
  studentRows.replaceChildren();
  if (!students.length) {
    const row = studentRows.insertRow();
    cell(row, "এখনো কোনো শিক্ষার্থী নিবন্ধিত হয়নি।").colSpan = 6;
    return;
  }

  students.sort((a, b) => (a.name || "").localeCompare(b.name || "", "bn"));
  for (const student of students) {
    const row = studentRows.insertRow();
    cell(row, student.studentCode);
    cell(row, student.name);
    cell(row, `${student.branch || ""} / ${student.className || ""}`);
    cell(row, student.roll);
    cell(row, student.published ? "প্রকাশিত" : "গোপন");
    const actions = cell(row, "");
    actions.className = "table-actions-cell";
    actions.append(actionButton("সম্পাদনা", "edit-student", student.studentCode));
  }
  refreshStudentSelects();
}

async function loadStudents() {
  studentRows.replaceChildren();
  const loading = studentRows.insertRow();
  cell(loading, "শিক্ষার্থীর তথ্য লোড হচ্ছে...").colSpan = 6;

  const snapshot = await getDocs(collection(db, studentsCollection));
  students = snapshot.docs.map((item) => ({
    studentCode: item.id,
    ...item.data()
  }));
  renderStudents();
}

function resetStudentForm() {
  studentForm.reset();
  byId("studentAdmissionDate").value = localDateString();
  byId("studentAcademicYear").value = String(new Date().getFullYear());
  editingStudentCode = null;
  byId("legacyParentNameNotice").hidden = true;
  byId("legacyParentNameNotice").textContent = "";
  byId("legacyAddressNotice").hidden = true;
  byId("legacyAddressNotice").textContent = "";
  byId("studentCode").readOnly = true;
  byId("studentCode").value = "";
  byId("saveStudentButton").textContent = "শিক্ষার্থী সংরক্ষণ";
  byId("cancelStudentEdit").hidden = true;
  byId("studentPhotoUrl").value = "";
  updateBoardRegistrationOptions();
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
  return classIdCodes.get(normalized)
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
  byId("studentBoardRoll").required = completed;
  byId("studentBoardRegistrationNumber").required = completed;
}

byId("studentBranch").addEventListener("change", () => {
  updateClassOptions();
  updateBoardRegistrationOptions();
});
byId("boardRegistrationCompleted").addEventListener("change", updateBoardRegistrationOptions);
updateClassOptions();
updateBoardRegistrationOptions();

function makeStudentCode({ className, trade, roll }) {
  const sessionYear = String(new Date().getFullYear());

  const classCode = getClassCode(className);
  if (!classCode) throw new Error("৬ থেকে ১২-এর মধ্যে একটি শ্রেণি নির্বাচন করুন।");

  const normalizedTrade = trade.trim().replace(/\s+/g, " ").toLocaleLowerCase();
  const tradeCode = normalizedTrade ? tradeIdCodes.get(normalizedTrade) : "NTR";
  if (!tradeCode) throw new Error("প্রতিষ্ঠানের তালিকাভুক্ত ট্রেডের নাম লিখুন বা নির্বাচন করুন।");

  const rollCode = normalizeDigits(roll.trim());
  if (!/^\d{1,4}$/.test(rollCode) || Number(rollCode) < 1) {
    throw new Error("রোল নম্বরে ১–৪ অঙ্কের সঠিক সংখ্যা লিখুন।");
  }

  return `${tradeCode}-${sessionYear.slice(-2)}-${classCode}-${rollCode.padStart(3, "0")}`;
}

function nextStudentRoll({ session, className, trade }) {
  const normalizedTrade = trade.trim().replace(/\s+/g, " ").toLocaleLowerCase();
  const classCode = getClassCode(className);
  const usedRolls = students
    .filter((student) => String(student.session || "") === session
      && getClassCode(student.className || "") === classCode
      && String(student.trade || "").trim().replace(/\s+/g, " ").toLocaleLowerCase() === normalizedTrade)
    .map((student) => Number(normalizeDigits(String(student.roll || ""))))
    .filter((roll) => Number.isInteger(roll) && roll > 0);
  const roll = Math.max(0, ...usedRolls) + 1;
  if (roll > 9999) throw new Error("এই শ্রেণি ও ট্রেডের জন্য আর রোল তৈরি করা যাচ্ছে না।");
  return String(roll).padStart(3, "0");
}

studentForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!currentAdmin || busy) return;

  const name = byId("studentName").value.trim();
  const branch = byId("studentBranch").value;
  const className = byId("studentClass").value.trim();
  const session = String(new Date().getFullYear());
  const trade = byId("studentTrade").value.trim();
  let studentCode = editingStudentCode;
  let roll = byId("studentRoll").value.trim();
  if (!studentCode) {
    try {
      roll = nextStudentRoll({ session, className, trade });
      studentCode = makeStudentCode({ className, trade, roll });
    } catch (error) {
      message("studentMessage", error.message, true);
      return;
    }
  }

  const existing = students.find((student) => student.studentCode === studentCode);
  if (existing && editingStudentCode !== studentCode) {
    message("studentMessage", "এই শিক্ষার্থী আইডিটি আগে থেকেই আছে।", true);
    return;
  }

  const publicDirectoryId = existing?.publicDirectoryId || crypto.randomUUID();
  let photoUrl;
  try {
    photoUrl = normalizeStudentPhotoUrl(byId("studentPhotoUrl").value);
  } catch (error) {
    message("studentMessage", error.message, true);
    return;
  }
  const data = {
    studentCode,
    session,
    publicDirectoryId,
    name,
    branch,
    className,
    trade: byId("studentTrade").value.trim(),
    roll,
    dob: byId("studentDob").value,
    gender: byId("studentGender").value,
    admissionDate: byId("studentAdmissionDate").value,
    academicYear: Number(byId("studentAcademicYear").value),
    fatherName: byId("studentFatherName").value.trim(),
    motherName: byId("studentMotherName").value.trim(),
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
    const privateRef = doc(db, studentsCollection, studentCode);
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
    byId("studentRoll").value = roll;
    byId("studentCode").value = studentCode;
    message("studentMessage", existing
      ? "শিক্ষার্থীর তথ্য হালনাগাদ হয়েছে।"
      : `নতুন শিক্ষার্থী নিবন্ধিত হয়েছে। রোল: ${roll}। শিক্ষার্থী আইডি: ${studentCode}`);
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

studentForm.addEventListener("input", (event) => {
  if (editingStudentCode || ["studentRoll", "studentCode"].includes(event.target.id)) return;
  byId("studentRoll").value = "";
  byId("studentCode").value = "";
});

studentRows.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action='edit-student']");
  if (!button) return;
  const student = students.find((item) => item.studentCode === button.dataset.id);
  if (!student) return;

  editingStudentCode = student.studentCode;
  byId("studentCode").value = student.studentCode;
  byId("studentCode").readOnly = true;
  byId("studentName").value = student.name || "";
  byId("studentBranch").value = student.branch === "স্কুল" || student.branch === "SCHOOL" ? "স্কুল"
    : student.branch === "কলেজ" || student.branch === "COLLEGE" ? "কলেজ"
      : student.branch || "";
  updateClassOptions();
  byId("studentClass").value = classCodeValues.get(getClassCode(student.className || "")) || "";
  byId("boardRegistrationCompleted").checked = student.boardRegistrationCompleted === true;
  byId("studentBoardRoll").value = student.boardRoll || "";
  byId("studentBoardRegistrationNumber").value = student.boardRegistrationNumber || "";
  updateBoardRegistrationOptions();
  byId("studentTrade").value = student.trade || "";
  byId("studentRoll").value = student.roll || "";
  byId("studentDob").value = student.dob || "";
  byId("studentGender").value = student.gender || "";
  byId("studentAdmissionDate").value = student.admissionDate || "";
  byId("studentAcademicYear").value = student.academicYear || String(new Date().getFullYear());
  byId("studentFatherName").value = student.fatherName || "";
  byId("studentMotherName").value = student.motherName || "";
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
  byId("saveStudentButton").textContent = "পরিবর্তন সংরক্ষণ";
  byId("cancelStudentEdit").hidden = false;
  studentForm.scrollIntoView({ behavior: "smooth", block: "start" });
});

byId("cancelStudentEdit").addEventListener("click", resetStudentForm);

feeForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!currentAdmin || busy) return;
  const student = students.find((item) => item.studentCode === feeStudentSelect.value);
  const amount = Number(byId("feeAmount").value);
  if (!student || !Number.isFinite(amount) || amount <= 0) {
    message("feeMessage", "শিক্ষার্থী নির্বাচন করে সঠিক টাকার পরিমাণ দিন।", true);
    return;
  }

  busy = true;
  byId("saveFeeButton").disabled = true;
  message("feeMessage", "জমার তথ্য সংরক্ষণ হচ্ছে...");
  try {
    await setDoc(doc(collection(db, feesCollection)), {
      studentCode: student.studentCode,
      studentName: student.name,
      branch: student.branch,
      className: student.className,
      type: byId("feeType").value,
      month: byId("feeMonth").value,
      amount,
      paymentDate: byId("feeDate").value,
      method: byId("feeMethod").value,
      receipt: byId("feeReceipt").value.trim(),
      note: byId("feeNote").value.trim(),
      createdAt: serverTimestamp(),
      createdBy: currentAdmin.uid
    });
    feeForm.reset();
    byId("feeDate").value = localDateString();
    message("feeMessage", "জমার তথ্য সংরক্ষণ হয়েছে।");
    await loadFees();
  } catch (error) {
    console.error("ফি সংরক্ষণের সমস্যা:", error);
    message("feeMessage", "জমার তথ্য সংরক্ষণ হয়নি। Firestore access rules পরীক্ষা করুন।", true);
  } finally {
    busy = false;
    byId("saveFeeButton").disabled = false;
  }
});

async function loadFees() {
  const snapshot = await getDocs(collection(db, feesCollection));
  const records = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
  records.sort((a, b) => (b.paymentDate || "").localeCompare(a.paymentDate || ""));
  feeRows.replaceChildren();
  if (!records.length) {
    const row = feeRows.insertRow();
    cell(row, "এখনো কোনো জমার তথ্য নেই।").colSpan = 6;
    return;
  }
  for (const record of records.slice(0, 100)) {
    const row = feeRows.insertRow();
    cell(row, formatDate(record.paymentDate));
    cell(row, `${record.studentName || ""} (${record.studentCode || ""})`);
    cell(row, record.type);
    cell(row, record.month ? record.month.replace("-", " / ") : "—");
    cell(row, document.documentElement.lang === "en"
      ? `BDT ${bn(record.amount || 0)}`
      : `৳${bn(record.amount || 0)}`);
    cell(row, record.receipt);
  }
}

function addSubjectRow(subject = {}) {
  const row = document.createElement("div");
  row.className = "subject-row";
  const subjectInput = document.createElement("input");
  subjectInput.type = "text";
  subjectInput.required = true;
  subjectInput.maxLength = 80;
  subjectInput.placeholder = "বিষয়ের নাম";
  subjectInput.setAttribute("aria-label", "বিষয়ের নাম");
  subjectInput.value = subject.name || "";

  const fullInput = document.createElement("input");
  fullInput.type = "number";
  fullInput.min = "1";
  fullInput.step = "0.01";
  fullInput.required = true;
  fullInput.placeholder = "পূর্ণমান";
  fullInput.setAttribute("aria-label", "পূর্ণমান");
  fullInput.value = subject.fullMarks ?? "100";

  const marksInput = document.createElement("input");
  marksInput.type = "number";
  marksInput.min = "0";
  marksInput.step = "0.01";
  marksInput.required = true;
  marksInput.placeholder = "প্রাপ্ত নম্বর";
  marksInput.setAttribute("aria-label", "প্রাপ্ত নম্বর");
  marksInput.value = subject.marks ?? "";

  const removeButton = document.createElement("button");
  removeButton.type = "button";
  removeButton.className = "remove-subject-button";
  removeButton.textContent = "সরান";
  removeButton.addEventListener("click", () => {
    if (subjectRows.children.length > 1) row.remove();
    else {
      subjectInput.value = "";
      marksInput.value = "";
    }
  });

  row.append(subjectInput, fullInput, marksInput, removeButton);
  subjectRows.append(row);
}

byId("addSubjectButton").addEventListener("click", () => addSubjectRow());
addSubjectRow();

function resultDocumentId(studentCode, year, exam) {
  const bytes = new TextEncoder().encode(exam.trim().toLowerCase());
  const examKey = [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${studentCode}_${year}_${examKey}`;
}

function resetResultForm() {
  resultForm.reset();
  editingResultId = null;
  byId("resultStudentCode").disabled = false;
  byId("resultExam").disabled = false;
  byId("resultYear").disabled = false;
  byId("saveResultButton").textContent = "ফলাফল সংরক্ষণ";
  byId("cancelResultEdit").hidden = true;
  subjectRows.replaceChildren();
  addSubjectRow();
}

resultForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!currentAdmin || busy) return;
  const student = students.find((item) => item.studentCode === resultStudentSelect.value);
  const exam = byId("resultExam").value.trim();
  const year = Number(byId("resultYear").value);
  const subjects = [...subjectRows.querySelectorAll(".subject-row")].map((row) => {
    const [nameInput, fullInput, marksInput] = row.querySelectorAll("input");
    return {
      name: nameInput.value.trim(),
      fullMarks: Number(fullInput.value),
      marks: Number(marksInput.value)
    };
  });

  if (!student || !exam || !Number.isInteger(year)) {
    message("resultMessage", "শিক্ষার্থী, পরীক্ষার নাম ও সঠিক শিক্ষাবর্ষ নির্বাচন করুন।", true);
    return;
  }
  if (!subjects.length || subjects.some((subject) =>
    !subject.name || !Number.isFinite(subject.fullMarks) || subject.fullMarks <= 0 ||
    !Number.isFinite(subject.marks) || subject.marks < 0 || subject.marks > subject.fullMarks
  )) {
    message("resultMessage", "প্রতিটি বিষয়ের প্রাপ্ত নম্বর শূন্য বা তার বেশি এবং পূর্ণমানের সমান/কম হতে হবে।", true);
    return;
  }

  const totalMarks = subjects.reduce((sum, subject) => sum + subject.marks, 0);
  const fullMarks = subjects.reduce((sum, subject) => sum + subject.fullMarks, 0);
  const percentage = fullMarks ? Math.round((totalMarks / fullMarks) * 10000) / 100 : 0;
  const resultId = editingResultId || resultDocumentId(student.studentCode, year, exam);
  const data = {
    studentCode: student.studentCode,
    studentName: student.name,
    branch: student.branch,
    className: student.className,
    roll: student.roll || "",
    exam,
    year,
    subjects,
    totalMarks,
    fullMarks,
    percentage,
    published: byId("resultPublished").checked,
    updatedAt: serverTimestamp()
  };

  busy = true;
  byId("saveResultButton").disabled = true;
  message("resultMessage", "ফলাফল সংরক্ষণ হচ্ছে...");
  try {
    const batch = writeBatch(db);
    const privateRef = doc(db, resultsCollection, resultId);
    const publicRef = doc(db, publicResultsCollection, resultId);
    batch.set(privateRef, {
      ...data,
      ...(editingResultId ? {} : { createdAt: serverTimestamp(), createdBy: currentAdmin.uid })
    }, { merge: true });
    batch.set(publicRef, {
      studentCode: data.studentCode,
      studentName: data.studentName,
      branch: data.branch,
      className: data.className,
      roll: data.roll,
      exam: data.exam,
      year: data.year,
      subjects: data.subjects,
      totalMarks: data.totalMarks,
      fullMarks: data.fullMarks,
      percentage: data.percentage,
      published: data.published,
      updatedAt: serverTimestamp()
    }, { merge: true });
    await batch.commit();
    resetResultForm();
    message("resultMessage", "ফলাফল সংরক্ষণ হয়েছে।");
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
  const snapshot = await getDocs(collection(db, resultsCollection));
  const records = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
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
      actionButton("সম্পাদনা", "edit-result", result.id),
      actionButton("মুছুন", "delete-result", result.id, "danger-action")
    );
  }
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
      resultStudentSelect.value = data.studentCode;
      resultStudentSelect.disabled = true;
      byId("resultExam").value = data.exam || "";
      byId("resultExam").disabled = true;
      byId("resultYear").value = data.year || "";
      byId("resultYear").disabled = true;
      byId("resultPublished").checked = data.published === true;
      subjectRows.replaceChildren();
      (data.subjects || []).forEach((subject) => addSubjectRow(subject));
      if (!subjectRows.children.length) addSubjectRow();
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
cancelResultButton.textContent = "সম্পাদনা বাতিল";
cancelResultButton.hidden = true;
byId("saveResultButton").after(cancelResultButton);
cancelResultButton.addEventListener("click", resetResultForm);

byId("feeDate").value = localDateString();
byId("resultYear").value = String(new Date().getFullYear());

onAuthStateChanged(auth, async (user) => {
  if (!user || user.uid !== ADMIN_UID) {
    if (user) await signOut(auth);
    window.location.replace("admin.html");
    return;
  }

  currentAdmin = user;
  const loads = await Promise.allSettled([loadStudents(), loadFees(), loadResults()]);
  const loadTargets = [
    ["studentMessage", "শিক্ষার্থী"],
    ["feeMessage", "বেতন"],
    ["resultMessage", "ফলাফল"]
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
  Promise.all([loadFees(), loadResults()]).catch((error) => {
    console.error("ভাষা পরিবর্তনের পর টেবিল হালনাগাদ হয়নি:", error);
  });
});
