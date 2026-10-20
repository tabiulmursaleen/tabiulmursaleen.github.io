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
import { getAcademicSubjects } from "./academic-subjects.js?v=20261020-6";
import { studentPlaceholderForName } from "./student-placeholder.js?v=20261020-1";

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
const studentImportFile = document.getElementById("studentImportFile");
const studentImportButton = document.getElementById("studentImportButton");
const studentImportMessage = document.getElementById("studentImportMessage");
const studentPublishImportedButton = document.getElementById("studentPublishImportedButton");
const studentPublishImportedMessage = document.getElementById("studentPublishImportedMessage");
const feeRows = document.getElementById("feeRows");
const resultRows = document.getElementById("resultRows");
const feeStudentSelect = document.getElementById("feeStudentCode");
const resultSubjectRows = document.getElementById("resultSubjectRows");
const resultMatrix = document.getElementById("resultMatrix");

let currentAdmin = null;
let students = [];
let feeRecords = [];
let admitCandidates = new Map();
let editingStudentCode = null;
let editingResultId = null;
let resultRecords = [];
let resultDraftRecords = [];
let editingResultGroup = null;
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
  for (const select of [feeStudentSelect]) {
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
    actions.append(actionButton("মুছুন", "delete-student", student.studentCode, "danger-action"));
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
  setStudentFormRequirements();
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
  updatePreviousExamOptions();
}

function setStudentFormRequirements(student = null) {
  const requiredFields = [
    ["studentName", "name"], ["studentNameBn", "nameBn"],
    ["studentFatherName", "fatherName"], ["studentFatherNameBn", "fatherNameBn"],
    ["studentMotherName", "motherName"], ["studentMotherNameBn", "motherNameBn"],
    ["studentGender", "gender"], ["studentDob", "dob"],
    ["studentAdmissionDate", "admissionDate"], ["studentGuardianPhone", "guardianPhone"],
    ["studentEmergencyPhone", "emergencyPhone"], ["studentVillage", "village"],
    ["studentUpazila", "upazila"], ["studentDistrict", "district"], ["studentPhotoUrl", "photoUrl"]
  ];
  requiredFields.forEach(([id, key]) => {
    byId(id).required = student ? Boolean(student[key]) : true;
  });
  byId("studentBranch").required = true;
  byId("studentClass").required = true;
  byId("studentAcademicYear").required = true;
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
  byId("studentBoardRoll").required = completed;
  byId("studentBoardRegistrationNumber").required = completed;
}

function updatePreviousExamOptions() {
  const selected = Boolean(byId("studentPreviousExam").value);
  byId("previousExamFields").hidden = !selected;
  ["studentPreviousExamRoll", "studentPreviousExamGpa", "studentPreviousExamRegistration", "studentPreviousExamSession", "studentPreviousExamPassingYear"]
    .forEach((id) => { byId(id).required = selected; });
}

byId("studentBranch").addEventListener("change", () => {
  updateClassOptions();
  updateBoardRegistrationOptions();
});
byId("boardRegistrationCompleted").addEventListener("change", updateBoardRegistrationOptions);
byId("studentPreviousExam").addEventListener("change", updatePreviousExamOptions);
updateClassOptions();
updateBoardRegistrationOptions();
updatePreviousExamOptions();

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
  const classCode = getClassCode(className);
  const usedRolls = students
    .filter((student) => String(student.session || "") === session
      && getClassCode(student.className || "") === classCode)
    .map((student) => Number(normalizeDigits(String(student.roll || ""))))
    .filter((roll) => Number.isInteger(roll) && roll > 0);
  const roll = Math.max(0, ...usedRolls) + 1;
  if (roll > 9999) throw new Error("এই শ্রেণির জন্য আর রোল তৈরি করা যাচ্ছে না।");
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
  let photoUrl = existing?.photoUrl || "";
  const photoInput = byId("studentPhotoUrl").value.trim();
  if (photoInput) {
    try {
      photoUrl = normalizeStudentPhotoUrl(photoInput);
    } catch (error) {
      message("studentMessage", error.message, true);
      return;
    }
  } else if (!existing) {
    message("studentMessage", "নতুন শিক্ষার্থীর ছবির Google Drive লিংক দিন।", true);
    return;
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
    const currentStudents = currentSnapshot.docs.map((item) => ({ studentCode: item.id, ...item.data() }));
    students = currentStudents;
    const existingImportKeys = new Set(currentStudents.map((student) => student.sourceImportKey).filter(Boolean));
    const pending = payload.records.filter((record) => !existingImportKeys.has(record.sourceImportKey));
    const skipped = payload.records.length - pending.length;
    if (!pending.length) {
      message("studentImportMessage", `এই ফাইলের সব ${bn(payload.records.length)}টি রেকর্ড আগে থেকেই ডাটাবেজে আছে।`);
      renderStudents();
      return;
    }

    const importSession = String(new Date().getFullYear());
    const classRolls = new Map();
    const usedIds = new Set(currentStudents.map((student) => student.studentCode));
    currentStudents.forEach((student) => {
      if (String(student.session || "") !== importSession) return;
      const classCode = getClassCode(student.className || "");
      const roll = Number(normalizeDigits(String(student.roll || "")));
      if (classCode && Number.isInteger(roll) && roll > 0) {
        classRolls.set(classCode, Math.max(classRolls.get(classCode) || 0, roll));
      }
    });

    const importedAt = serverTimestamp();
    const prepared = pending.map((record) => {
      const classCode = getClassCode(String(record.className || ""));
      const trade = String(record.trade || "").trim();
      if (!classCode || !tradeIdCodes.has(trade.toLocaleLowerCase()) || !record.name || !record.fatherName || !record.motherName) {
        throw new Error(`ফাইলে শ্রেণি, ট্রেড বা নামের তথ্য অসম্পূর্ণ আছে (উৎস: ${record.sourceImportKey})।`);
      }
      const nextRoll = (classRolls.get(classCode) || 0) + 1;
      if (nextRoll > 9999) throw new Error(`শ্রেণি ${record.className}-এ আর রোল তৈরি করা যাচ্ছে না।`);
      classRolls.set(classCode, nextRoll);
      const roll = String(nextRoll).padStart(3, "0");
      const studentCode = makeStudentCode({ className: record.className, trade, roll });
      if (usedIds.has(studentCode)) throw new Error(`তৈরি হওয়া আইডি আগে থেকেই আছে: ${studentCode}`);
      usedIds.add(studentCode);
      return {
        studentCode,
        session: importSession,
        publicDirectoryId: crypto.randomUUID(),
        sourceImportKey: record.sourceImportKey,
        sourceSheet: String(record.sourceSheet || ""),
        sourceTradeName: String(record.sourceTradeName || ""),
        studentSourceSession: String(record.sourceSession || ""),
        studentType: String(record.studentType || ""),
        subjectCodes: String(record.subjectCodes || ""),
        name: String(record.name).trim(),
        nameBn: "",
        branch: String(record.branch),
        className: String(record.className),
        trade,
        roll,
        dob: "",
        gender: "",
        admissionDate: "",
        academicYear: Number(new Date().getFullYear()),
        fatherName: String(record.fatherName).trim(),
        fatherNameBn: "",
        motherName: String(record.motherName).trim(),
        motherNameBn: "",
        guardianName: "",
        guardianPhone: "",
        emergencyPhone: "",
        village: "",
        upazila: "",
        district: "",
        address: "",
        boardRegistrationCompleted: Boolean(record.boardRoll || record.boardRegistrationNumber),
        boardRoll: String(record.boardRoll || ""),
        boardRegistrationNumber: String(record.boardRegistrationNumber || ""),
        previousExam: "",
        previousExamRoll: "",
        previousExamGpa: "",
        previousExamRegistrationNumber: "",
        previousExamSession: "",
        previousExamPassingYear: "",
        photoUrl: "",
        published: false,
        createdAt: importedAt,
        createdBy: currentAdmin.uid,
        updatedAt: importedAt
      };
    });

    if (!window.confirm(`${bn(prepared.length)}টি নতুন শিক্ষার্থী রেকর্ড ডাটাবেজে যোগ হবে। কোনো তথ্য ওয়েবসাইটে প্রকাশ করা হবে না। চালিয়ে যাবেন?`)) {
      message("studentImportMessage", "আমদানি বাতিল করা হয়েছে।");
      return;
    }

    for (let start = 0; start < prepared.length; start += 80) {
      const chunk = prepared.slice(start, start + 80);
      await runTransaction(db, async (transaction) => {
        const refs = chunk.map((student) => doc(db, studentsCollection, student.studentCode));
        const snapshots = await Promise.all(refs.map((ref) => transaction.get(ref)));
        const collision = snapshots.find((snapshot) => snapshot.exists());
        if (collision) throw new Error(`আইডি আগে থেকেই ডাটাবেজে আছে: ${collision.id}`);
        chunk.forEach((student, index) => transaction.set(refs[index], student));
      });
      savedCount += chunk.length;
      message("studentImportMessage", `${bn(savedCount)} / ${bn(prepared.length)}টি রেকর্ড যোগ হয়েছে...`);
    }

    await loadStudents();
    message("studentImportMessage", `${bn(savedCount)}টি রেকর্ড ডাটাবেজে যোগ হয়েছে। ${bn(skipped)}টি আগে থেকেই ছিল। রোল ও আইডি শ্রেণি অনুযায়ী তৈরি হয়েছে; সব রেকর্ড অপ্রকাশিত রাখা হয়েছে।`);
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
  const unpublishedStudents = importedStudents.filter((student) => student.published !== true);
  if (!unpublishedStudents.length) {
    message("studentPublishImportedMessage", importedStudents.length
      ? "আমদানি করা সব শিক্ষার্থী ইতিমধ্যে প্রকাশিত আছে।"
      : "আমদানি করা কোনো শিক্ষার্থী পাওয়া যায়নি।", !importedStudents.length);
    return;
  }

  const approved = window.confirm(
    `${bn(unpublishedStudents.length)} জন আমদানি করা শিক্ষার্থীর নাম, আইডি, শিক্ষাবর্ষ, শাখা, শ্রেণি, ট্রেড, রোল ও ছবির অবস্থা প্রকাশিত হবে। পিতা-মাতা, জন্মতারিখ, যোগাযোগ ও বোর্ডের ব্যক্তিগত তথ্য প্রকাশ হবে না। এখন প্রকাশ করবেন?`
  );
  if (!approved) return;

  busy = true;
  studentPublishImportedButton.disabled = true;
  let publishedCount = 0;
  try {
    for (let start = 0; start < unpublishedStudents.length; start += 200) {
      const chunk = unpublishedStudents.slice(start, start + 200);
      const batch = writeBatch(db);
      chunk.forEach((student) => {
        if (!student.publicDirectoryId) {
          throw new Error(`প্রকাশিত তালিকার আইডি নেই: ${student.studentCode}`);
        }
        const updatedAt = serverTimestamp();
        batch.set(doc(db, studentsCollection, student.studentCode), { published: true, updatedAt }, { merge: true });
        batch.set(doc(db, publicStudentsCollection, student.publicDirectoryId), {
          name: student.name || "",
          studentCode: student.studentCode,
          session: student.session || "",
          academicYear: student.academicYear || student.session || "",
          branch: student.branch || "",
          className: student.className || "",
          trade: student.trade || "",
          roll: student.roll || "",
          photoUrl: student.photoUrl || "",
          published: true,
          updatedAt
        }, { merge: true });
      });
      await batch.commit();
      publishedCount += chunk.length;
      message("studentPublishImportedMessage", `${bn(publishedCount)} / ${bn(unpublishedStudents.length)} জন প্রকাশিত হয়েছে...`);
    }
    await loadStudents();
    message("studentPublishImportedMessage", `${bn(publishedCount)} জন আমদানি করা শিক্ষার্থী ওয়েবসাইটে প্রকাশিত হয়েছে।`);
  } catch (error) {
    console.error("আমদানি করা শিক্ষার্থীদের প্রকাশে সমস্যা:", error);
    message("studentPublishImportedMessage", `${bn(publishedCount)} জন প্রকাশিত হয়েছে; বাকিগুলো হয়নি। ${error.message || "প্রকাশ করা যায়নি।"}`, true);
  } finally {
    busy = false;
    studentPublishImportedButton.disabled = false;
  }
});

studentForm.addEventListener("input", (event) => {
  if (editingStudentCode || ["studentRoll", "studentCode"].includes(event.target.id)) return;
  byId("studentRoll").value = "";
  byId("studentCode").value = "";
});

studentRows.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const student = students.find((item) => item.studentCode === button.dataset.id);
  if (!student) return;
  if (button.dataset.action === "delete-student") {
    deleteStudentAndRelatedRecords(student);
    return;
  }
  if (button.dataset.action !== "edit-student") return;

  editingStudentCode = student.studentCode;
  byId("studentCode").value = student.studentCode;
  byId("studentCode").readOnly = true;
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
    const relatedSnapshots = await Promise.all(relatedCollections.map((name) =>
      getDocs(query(collection(db, name), where("studentCode", "==", student.studentCode)))
    ));

    const refs = new Map();
    const addRef = (reference) => refs.set(reference.path, reference);
    addRef(doc(db, studentsCollection, student.studentCode));
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

    if (editingStudentCode === student.studentCode) resetStudentForm();
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
}

byId("feeType").addEventListener("change", updateLateFineField);
updateLateFineField();

feeForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!currentAdmin || busy) return;
  const student = students.find((item) => item.studentCode === feeStudentSelect.value);
  const amount = Number(byId("feeAmount").value);
  const lateFine = byId("feeType").value === "বোর্ড রেজিস্ট্রেশন ফি"
    ? Number(byId("feeLateFine").value || 0)
    : 0;
  if (!student || !Number.isFinite(amount) || amount <= 0 || !Number.isFinite(lateFine) || lateFine < 0) {
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
      lateFine,
      totalAmount: amount + lateFine,
      paymentDate: byId("feeDate").value,
      method: byId("feeMethod").value,
      receipt: byId("feeReceipt").value.trim(),
      note: byId("feeNote").value.trim(),
      createdAt: serverTimestamp(),
      createdBy: currentAdmin.uid
    });
    feeForm.reset();
    byId("feeDate").value = localDateString();
    updateLateFineField();
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
  feeRecords = records;
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
    const isEnglish = document.documentElement.lang === "en";
    const fineNote = Number(record.lateFine) > 0
      ? (isEnglish ? ` (late fine BDT ${bn(record.lateFine)})` : ` (লেট ফাইন ৳${bn(record.lateFine)})`)
      : "";
    cell(row, `${isEnglish ? "BDT " : "৳"}${bn(record.totalAmount ?? record.amount ?? 0)}${fineNote}`);
    cell(row, record.receipt);
  }
}

const admitMonthNames = ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"];
const admitMonthNamesEn = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const admitText = (bnText, enText) => document.documentElement.lang === "en" ? enText : bnText;

function monthlyFeeMonths(studentCode, year) {
  return new Set(feeRecords
    .filter((fee) => fee.studentCode === studentCode
      && ["মাসিক বেতন", "Monthly Tuition"].includes(fee.type))
    .map((fee) => {
      const month = String(fee.month || "");
      if (/^\d{4}-\d{2}$/.test(month) && month.startsWith(`${year}-`)) return Number(month.slice(5));
      if (/^\d{1,2}$/.test(month)) return Number(month);
      return 0;
    })
    .filter((month) => month >= 1 && month <= 12));
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

function checkAdmitEligibility() {
  const className = byId("admitClass").value;
  const exam = byId("admitExam").value;
  const year = Number(byId("admitYear").value);
  const throughMonth = Number(byId("admitPaidThrough").value);
  if (!className || !exam || !Number.isInteger(year) || year < 2000 || year > 2100 || throughMonth < 1 || throughMonth > 12) {
    message("admitMessage", admitText("শ্রেণি, পরীক্ষা, শিক্ষাবর্ষ ও বেতনের শেষ মাস নির্বাচন করুন।", "Select the class, exam, academic year, and fee cutoff month."), true);
    byId("admitEligiblePanel").hidden = true;
    return;
  }
  const classCode = getClassCode(className);
  const classList = students.filter((student) => getClassCode(student.className || "") === classCode)
    .sort((a, b) => Number(normalizeDigits(String(a.roll || ""))) - Number(normalizeDigits(String(b.roll || ""))));
  const rows = byId("admitEligibleRows");
  rows.replaceChildren();
  admitCandidates = new Map();
  if (!classList.length) {
    message("admitMessage", admitText("এই শ্রেণিতে কোনো শিক্ষার্থী পাওয়া যায়নি।", "No students were found in this class."), true);
    byId("admitEligiblePanel").hidden = true;
    return;
  }

  const monthLabel = byId("admitPaidThrough").selectedOptions[0].textContent;
  const isEnglish = document.documentElement.lang === "en";
  for (const student of classList) {
    const eligibility = evaluateAdmitEligibility(student, year, throughMonth);
    const record = { ...student, eligibility };
    admitCandidates.set(student.studentCode, record);
    const row = rows.insertRow();
    const checkboxCell = row.insertCell();
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "admit-student-choice";
    checkbox.dataset.studentCode = student.studentCode;
    checkbox.disabled = !eligibility.eligible;
    checkboxCell.append(checkbox);
    const photoCell = row.insertCell();
    const thumbnail = document.createElement("img");
    thumbnail.className = "admit-student-thumbnail";
    const placeholderPhoto = studentPlaceholderForName(student.name, student.gender);
    thumbnail.src = student.photoUrl ? admitPhotoUrl(student.photoUrl) : placeholderPhoto;
    thumbnail.alt = student.photoUrl ? "" : "Student illustration";
    thumbnail.addEventListener("error", () => {
      if (student.photoUrl && thumbnail.src !== student.photoUrl) {
        thumbnail.src = student.photoUrl;
      } else if (thumbnail.dataset.placeholder !== "true") {
        thumbnail.dataset.placeholder = "true";
        thumbnail.src = placeholderPhoto;
      }
    });
    photoCell.append(thumbnail);
    cell(row, isEnglish ? (student.name || student.nameBn) : (student.nameBn || student.name));
    cell(row, `${student.studentCode} / ${normalizeDigits(String(student.roll || "—"))}`);
    cell(row, eligibility.eligible
      ? (isEnglish ? `Eligible through ${monthLabel}` : `${monthLabel} পর্যন্ত যোগ্য`)
      : (isEnglish
        ? `Unpaid: ${eligibility.missingMonths.map((month) => admitMonthNamesEn[month - 1]).join(", ")}`
        : `বকেয়া: ${eligibility.missingMonths.map((month) => admitMonthNames[month - 1]).join(", ")}`));
    row.classList.toggle("admit-ineligible-row", !eligibility.eligible);
  }
  byId("selectAllEligible").checked = false;
  byId("admitEligiblePanel").hidden = false;
  byId("admitPrintArea").hidden = true;
  byId("prepareAdmitCards").disabled = true;
  const eligibleCount = [...admitCandidates.values()].filter((student) => student.eligibility.eligible).length;
  message("admitMessage", isEnglish
    ? `${eligibleCount} of ${classList.length} students are eligible for ${window.dashboardTranslate?.(exam) || exam}.`
    : `${bn(eligibleCount)} জনের মধ্যে ${bn(classList.length)} জন ${exam} পরীক্ষার প্রবেশপত্রের জন্য যোগ্য।`);
}

function buildAdmitCard(student, exam, year, throughMonth) {
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
  if (isEnglish) {
    institutionName.append("Tabiul Mursaleen Nogor Karigori", document.createElement("br"), "School & College");
  } else {
    institutionName.textContent = t("তাবিউল মুরসালীন নগর কারিগরি স্কুল এন্ড কলেজ");
  }
  const address = document.createElement("p");
  address.textContent = `${isEnglish ? "Tenguri, Kendua, Netrokona" : "টেঙ্গুরী, কেন্দুয়া, নেত্রকোণা"} · EIIN No. 136065`;
  headingText.append(institutionName, address);
  head.append(logo, headingText);
  card.append(head);
  const title = document.createElement("h2");
  title.className = "admit-card-title";
  const englishExamName = ({
    "অর্ধবার্ষিক": "Half-Yearly Exam",
    "নির্বাচনী": "Selection Exam",
    "বার্ষিক": "Annual Exam"
  })[exam] || t(exam);
  title.textContent = isEnglish
    ? `Admit Card · ${englishExamName} · ${yearText}`
    : `${t("পরীক্ষার প্রবেশপত্র")} · ${exam} পরীক্ষা · ${yearText}`;
  card.append(title);

  const details = document.createElement("div");
  details.className = "admit-card-body";
  const photo = document.createElement("img");
  photo.className = "admit-card-photo";
  const placeholderPhoto = studentPlaceholderForName(student.name, student.gender);
  if (student.photoUrl) {
    photo.src = admitPhotoUrl(student.photoUrl);
    photo.alt = "";
    photo.addEventListener("error", () => {
      if (photo.dataset.placeholder === "true") return;
      if (photo.src !== student.photoUrl) {
        photo.src = student.photoUrl;
      } else {
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
  details.append(photo);
  const list = document.createElement("dl");
  const name = isEnglish ? (student.name || student.nameBn) : (student.nameBn || student.name);
  const fields = [
    ["শিক্ষার্থীর নাম", name], ["শিক্ষার্থী আইডি", student.studentCode], ["শাখা", t(student.branch || "—")],
    ["শ্রেণি", t(student.className || "—")], ["ট্রেড", t(student.trade || "—")], ["রোল নম্বর", normalizeDigits(String(student.roll || "—"))],
    ["বেতন পরিশোধিত", isEnglish
      ? `Through ${byId("admitPaidThrough").selectedOptions[0].textContent} ${yearText}`
      : `${byId("admitPaidThrough").selectedOptions[0].textContent} ${yearText} পর্যন্ত`]
  ];
  for (const [label, value] of fields) {
    const wrapper = document.createElement("div");
    const term = document.createElement("dt");
    term.textContent = t(label);
    const detail = document.createElement("dd");
    detail.textContent = value || "—";
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
  const area = byId("admitPrintArea");
  area.replaceChildren();
  const exam = byId("admitExam").value;
  const year = Number(byId("admitYear").value);
  const throughMonth = Number(byId("admitPaidThrough").value);
  for (let offset = 0; offset < selectedStudents.length; offset += 4) {
    const page = document.createElement("section");
    page.className = "admit-print-page";
    selectedStudents.slice(offset, offset + 4).forEach((student) => page.append(buildAdmitCard(student, exam, year, throughMonth)));
    area.append(page);
  }
  area.hidden = false;
  byId("printAdmitCards").hidden = false;
  area.scrollIntoView({ behavior: "smooth", block: "start" });
}

byId("checkAdmitEligibility").addEventListener("click", checkAdmitEligibility);
byId("admitPaidThrough").addEventListener("change", () => { byId("selectAllEligible").checked = false; });
byId("selectAllEligible").addEventListener("change", (event) => {
  document.querySelectorAll(".admit-student-choice:not(:disabled)").forEach((checkbox) => { checkbox.checked = event.target.checked; });
  byId("prepareAdmitCards").disabled = !document.querySelector(".admit-student-choice:checked");
});
byId("admitEligibleRows").addEventListener("change", () => {
  byId("prepareAdmitCards").disabled = !document.querySelector(".admit-student-choice:checked");
  byId("admitPrintArea").hidden = true;
});
byId("prepareAdmitCards").addEventListener("click", generateAdmitCards);
byId("printAdmitCards").addEventListener("click", async () => {
  const images = [...byId("admitPrintArea").querySelectorAll("img")];
  await Promise.all(images.map((image) => image.decode?.().catch(() => {}) || Promise.resolve()));
  window.print();
});
byId("admitFilterForm").addEventListener("change", (event) => {
  if (["admitClass", "admitExam", "admitYear", "admitPaidThrough"].includes(event.target.id)) {
    byId("admitEligiblePanel").hidden = true;
    byId("admitPrintArea").hidden = true;
    byId("printAdmitCards").hidden = true;
  }
});
document.addEventListener("dashboard-language-change", () => {
  if (byId("admitEligiblePanel").hidden) return;
  const selectedBefore = new Set([...document.querySelectorAll(".admit-student-choice:checked")].map((input) => input.dataset.studentCode));
  const hadCards = !byId("admitPrintArea").hidden;
  checkAdmitEligibility();
  document.querySelectorAll(".admit-student-choice").forEach((input) => { input.checked = selectedBefore.has(input.dataset.studentCode); });
  byId("prepareAdmitCards").disabled = !document.querySelector(".admit-student-choice:checked");
  if (hadCards) generateAdmitCards();
});
byId("admitYear").value = String(new Date().getFullYear());
byId("admitPaidThrough").value = "04";

function addResultSubjectRow(className, subject = {}) {
  const row = document.createElement("div");
  row.className = "result-subject-setting";
  const subjectLabel = document.createElement("label");
  subjectLabel.textContent = "বিষয়";
  const select = document.createElement("select");
  select.className = "result-subject-select";
  select.required = true;
  select.append(new Option("বিষয় নির্বাচন করুন", ""));
  getAcademicSubjects(className).forEach((entry) => {
    const option = new Option(entry.name, entry.name);
    select.append(option);
  });
  if (subject.name && !getAcademicSubjects(className).some((entry) => entry.name === subject.name)) {
    select.append(new Option(subject.name, subject.name));
  }
  select.value = subject.name || "";
  subjectLabel.append(select);
  const codeLabel = document.createElement("label");
  codeLabel.textContent = "বিষয় কোড";
  const codeInput = document.createElement("input");
  codeInput.type = "text";
  codeInput.className = "result-subject-code";
  codeInput.readOnly = true;
  codeInput.value = subject.code || getAcademicSubjects(className).find((entry) => entry.name === select.value)?.code || "";
  codeLabel.append(codeInput);
  const settings = [["theoryFullMarks", "তাত্ত্বিক পূর্ণমান", subject.theoryFullMarks ?? subject.fullMarks ?? ""], ["practicalFullMarks", "ব্যবহারিক পূর্ণমান", subject.practicalFullMarks ?? (subject.fullMarks ? 0 : "")]];
  row.append(subjectLabel, codeLabel);
  settings.forEach(([key, labelText, value]) => {
    const label = document.createElement("label");
    label.textContent = labelText;
    const input = document.createElement("input");
    input.type = "number";
    input.min = "0";
    input.step = "0.01";
    input.required = true;
    input.value = value;
    input.dataset.markType = key;
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
    const entry = getAcademicSubjects(className).find((item) => item.name === select.value);
    codeInput.value = entry?.code || "";
    byId("resultMatrixWrap").hidden = true;
  });
  resultSubjectRows.append(row);
}

function renderSubjectOptions(className, previousSubjects = []) {
  resultSubjectRows.replaceChildren();
  const options = getAcademicSubjects(className);
  byId("resultSubjectsHint").textContent = options.length
    ? "বিষয় নির্বাচন করলে বিষয় কোড নিজে থেকে বসবে।"
    : "এই শ্রেণির বিষয় তালিকা এখনো যোগ করা হয়নি।";
  if (previousSubjects.length) previousSubjects.forEach((subject) => addResultSubjectRow(className, subject));
  else if (options.length) addResultSubjectRow(className);
  byId("resultMatrixWrap").hidden = true;
}

function selectedResultSubjects() {
  return [...resultSubjectRows.querySelectorAll(".result-subject-setting")].map((row) => ({
    name: row.querySelector(".result-subject-select").value,
    code: row.querySelector(".result-subject-code").value,
    theoryFullMarks: Number(row.querySelector('[data-mark-type="theoryFullMarks"]').value),
    practicalFullMarks: Number(row.querySelector('[data-mark-type="practicalFullMarks"]').value)
  }));
}

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
  if (!subjects.length || subjects.some((subject) => !subject.name || !subject.code)) {
    message("resultMessage", "কমপক্ষে একটি বিষয় নির্বাচন করুন।", true);
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
  const t = (value) => window.dashboardTranslate?.(value) || value;
  const thead = table.createTHead();
  const subjectHeader = thead.insertRow();
  const rollHeader = document.createElement("th");
  rollHeader.rowSpan = 2;
  rollHeader.textContent = t("রোল");
  subjectHeader.append(rollHeader);
  subjects.forEach((subject) => {
    const th = document.createElement("th");
    th.colSpan = Number(subject.practicalFullMarks) > 0 ? 2 : 1;
    th.textContent = `${t(subject.name)} · ${subject.code}`;
    subjectHeader.append(th);
  });
  const componentHeader = thead.insertRow();
  subjects.forEach((subject) => {
    const parts = [["তাত্ত্বিক", subject.theoryFullMarks]];
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
    rollCell.textContent = normalizeDigits(String(student[rollType] || "—"));
    subjects.forEach((subject) => {
      const saved = savedRecords.find((record) => record.studentCode === student.studentCode)
        ?.subjects?.find((item) => item.name === subject.name || item.code === subject.code);
      const parts = [["theory", subject.theoryFullMarks]];
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
  if (className && getAcademicSubjects(className).length) addResultSubjectRow(className);
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
  }
  renderResultMatrix();
});
byId("resultRollType").addEventListener("change", () => { byId("resultMatrixWrap").hidden = true; });

const resultDraftSavesInProgress = new Set();

resultMatrix.addEventListener("change", async (event) => {
  const input = event.target.closest("input.result-mark-input");
  if (!input) return;
  const studentCode = input.dataset.studentCode;
  if (resultDraftSavesInProgress.has(studentCode)) return;
  const className = byId("resultClass").value;
  const rollType = byId("resultRollType").value;
  const exam = byId("resultExam").value;
  const year = Number(byId("resultYear").value);
  const student = classStudents(className, rollType).find((item) => item.studentCode === studentCode);
  const subjects = selectedResultSubjects();
  const inputs = [...resultMatrix.querySelectorAll(`input.result-mark-input[data-student-code="${CSS.escape(studentCode)}"]`)];
  if (!currentAdmin || !student || !exam || !Number.isInteger(year) || !subjects.length
    || inputs.some((field) => field.value === "" || Number(field.value) < 0 || Number(field.value) > Number(field.max))) return;
  resultDraftSavesInProgress.add(studentCode);
  try {
    const studentSubjects = subjects.map((subject) => {
      const getMark = (component) => Number(resultMatrix.querySelector(`input[data-student-code="${CSS.escape(studentCode)}"][data-subject-name="${CSS.escape(subject.name)}"][data-component="${component}"]`)?.value || 0);
      const theoryMarks = getMark("theory");
      const practicalMarks = getMark("practical");
      return { ...subject, theoryMarks, practicalMarks, fullMarks: subject.theoryFullMarks + subject.practicalFullMarks, marks: theoryMarks + practicalMarks };
    });
    const totalMarks = studentSubjects.reduce((sum, subject) => sum + subject.marks, 0);
    const fullMarks = studentSubjects.reduce((sum, subject) => sum + subject.fullMarks, 0);
    const draftId = resultDocumentId(studentCode, year, exam);
    const draft = { studentCode, studentName: student.name, branch: student.branch, className: student.className, roll: student.roll || "", boardRoll: student.boardRoll || "", rollType, exam, year, subjects: studentSubjects, totalMarks, fullMarks, percentage: fullMarks ? Math.round((totalMarks / fullMarks) * 10000) / 100 : 0, showPractical: byId("resultShowPractical").checked, updatedAt: serverTimestamp(), updatedBy: currentAdmin.uid };
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
  if (subjects.some((subject) => !subject.name || !subject.code || !Number.isFinite(subject.theoryFullMarks) || subject.theoryFullMarks < 0 || !Number.isFinite(subject.practicalFullMarks) || subject.practicalFullMarks < 0 || subject.theoryFullMarks + subject.practicalFullMarks <= 0)
    || new Set(subjects.map((subject) => subject.name)).size !== subjects.length
    || inputs.some((input) => input.value === "" || Number(input.value) < 0 || Number(input.value) > Number(input.max))) {
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
          return { name: subject.name, code: subject.code, theoryFullMarks: subject.theoryFullMarks, practicalFullMarks: subject.practicalFullMarks, theoryMarks, practicalMarks, fullMarks: subject.theoryFullMarks + subject.practicalFullMarks, marks: theoryMarks + practicalMarks };
        });
        const totalMarks = studentSubjects.reduce((sum, subject) => sum + subject.marks, 0);
        const fullMarks = studentSubjects.reduce((sum, subject) => sum + subject.fullMarks, 0);
        const percentage = fullMarks ? Math.round((totalMarks / fullMarks) * 10000) / 100 : 0;
        const resultId = resultDocumentId(student.studentCode, year, exam);
        const data = { studentCode: student.studentCode, studentName: student.name, branch: student.branch, className: student.className, roll: student.roll || "", boardRoll: student.boardRoll || "", rollType, exam, year, subjects: studentSubjects, totalMarks, fullMarks, percentage, published, showPractical, updatedAt: serverTimestamp() };
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
  const [snapshot, draftsSnapshot] = await Promise.all([
    getDocs(collection(db, resultsCollection)),
    getDocs(collection(db, resultDraftsCollection))
  ]);
  const records = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
  resultDraftRecords = draftsSnapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
  resultRecords = records;
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
      if (![...byId("resultExam").options].some((option) => option.value === data.exam)) {
        const legacyExamOption = new Option(data.exam || "আগের পরীক্ষার নাম", data.exam || "");
        byId("resultExam").add(legacyExamOption);
      }
      byId("resultExam").value = data.exam || "";
      byId("resultYear").value = data.year || "";
      byId("resultPublished").checked = data.published === true;
      byId("resultShowPractical").checked = data.showPractical === true;
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
