import {
  addDoc, collection, deleteDoc, doc, getDocs, query, serverTimestamp, setDoc, where
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";
import { db } from "./firebase-config.js";
import { academicClassCode, getAcademicSubjects } from "./academic-subjects.js";

const $ = (id) => document.getElementById(id);
const tools = [...document.querySelectorAll("[data-teacher-tool]")];
const panels = {
  content: $("teacherContentPanel"),
  results: $("teacherResultsPanel"),
  questions: $("teacherQuestionPanel")
};
const ADMIN_UID = "wWuBEmlsaofgjAaQi7bfblsX6L62";
const bn = (value) => String(value ?? "").replace(/\d/g, (digit) => "০১২৩৪৫৬৭৮৯"[digit]);
let currentUser = null;
let teacher = null;
let isAdmin = false;
let contentItems = [];
let resultDrafts = [];
let roster = [];
let currentRows = [];

function portalMessage(text, error = false) {
  const node = $("teacherPortalMessage");
  node.textContent = text;
  node.classList.toggle("is-error", error);
}

function resultMessage(text, error = false) {
  const node = $("teacherResultMessage");
  node.textContent = text;
  node.classList.toggle("is-error", error);
}

function safeExternalUrl(value) {
  const url = new URL(value);
  if (url.protocol !== "https:") throw new Error("নিরাপদ https লিংক দিন।");
  return url.href;
}

function teacherOwnerFields() {
  return { ownerUid: currentUser.uid, authorTeacherId: teacher.id, authorName: teacher.name };
}

tools.forEach((button) => button.addEventListener("click", async () => {
  const selected = button.dataset.teacherTool;
  tools.forEach((item) => item.classList.toggle("is-active", item === button));
  Object.entries(panels).forEach(([key, panel]) => { panel.hidden = key !== selected; });
  if (selected === "content") await loadContents();
  if (selected === "results") await loadResultDrafts();
  if (selected === "questions") portalMessage("প্রশ্নপত্র তৈরি ও সংরক্ষণের অংশ প্রস্তুত।");
}));

function getTeacherContext() {
  currentUser = window.teacherPortalUser || null;
  teacher = window.teacherQuestionSignedInTeacher || null;
  isAdmin = Boolean(window.teacherQuestionIsAdmin || currentUser?.uid === ADMIN_UID);
}

async function loadContents() {
  getTeacherContext();
  if (!currentUser) return;
  const source = isAdmin
    ? collection(db, "classContents")
    : query(collection(db, "classContents"), where("ownerUid", "==", currentUser.uid));
  try {
    const snapshot = await getDocs(source);
    contentItems = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))
      .sort((a, b) => (b.updatedAt?.toMillis?.() || 0) - (a.updatedAt?.toMillis?.() || 0));
    renderContentRows();
    portalMessage(isAdmin ? "সকল শিক্ষকের ক্লাস কন্টেন্ট দেখানো হবে।" : "আপনার ক্লাস কন্টেন্ট দেখানো হবে।");
  } catch (error) {
    console.error("ক্লাস কন্টেন্ট লোড হয়নি:", error);
    portalMessage("ক্লাস কন্টেন্ট লোড হয়নি। Firestore Rules প্রকাশ করুন।", true);
  }
}

function renderContentRows() {
  const body = $("teacherContentRows");
  body.replaceChildren();
  if (!contentItems.length) {
    const row = body.insertRow(); const cell = row.insertCell(); cell.colSpan = 5; cell.textContent = "এখনো কোনো কন্টেন্ট নেই।"; return;
  }
  contentItems.forEach((item) => {
    const row = body.insertRow();
    row.insertCell().textContent = `${item.branch || ""} · ${item.className || ""}`;
    row.insertCell().textContent = item.subject || "—";
    row.insertCell().textContent = item.title || "—";
    row.insertCell().textContent = `${item.published ? "প্রকাশিত" : "অপ্রকাশিত"}${isAdmin && item.authorName ? ` · ${item.authorName}` : ""}`;
    const actions = row.insertCell(); actions.className = "table-actions-cell";
    const edit = document.createElement("button"); edit.type = "button"; edit.className = "table-action"; edit.textContent = "সম্পাদনা";
    edit.addEventListener("click", () => {
      $("teacherContentId").value = item.id;
      $("teacherContentBranch").value = item.branch || "School";
      $("teacherContentClass").value = item.className || "";
      $("teacherContentSubject").value = item.subject || "";
      $("teacherContentTitle").value = item.title || "";
      $("teacherContentDescription").value = item.description || "";
      $("teacherContentUrl").value = item.driveUrl || "";
      $("teacherContentPublished").checked = item.published === true;
      $("teacherContentForm").scrollIntoView({ behavior: "smooth", block: "start" });
    });
    const remove = document.createElement("button"); remove.type = "button"; remove.className = "table-action danger-action"; remove.textContent = "মুছুন";
    remove.addEventListener("click", async () => {
      if (!window.confirm("এই ক্লাস কন্টেন্টটি মুছে ফেলবেন?")) return;
      try { await deleteDoc(doc(db, "classContents", item.id)); await loadContents(); }
      catch (error) { console.error(error); portalMessage("কন্টেন্ট মুছতে পারেনি।", true); }
    });
    actions.append(edit, remove);
  });
}

$("teacherContentForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  getTeacherContext();
  const id = $("teacherContentId").value;
  const existing = contentItems.find((item) => item.id === id);
  if (id && !existing) { portalMessage("সম্পাদনার কন্টেন্টটি আর পাওয়া যাচ্ছে না।", true); return; }
  if (id && !isAdmin && existing.ownerUid !== currentUser.uid) { portalMessage("শুধু নিজের কন্টেন্ট সম্পাদনা করা যাবে।", true); return; }
  let driveUrl;
  try {
    driveUrl = safeExternalUrl($("teacherContentUrl").value.trim());
    if (!/(^|\.)drive\.google\.com$|(^|\.)docs\.google\.com$/.test(new URL(driveUrl).hostname)) throw new Error("Google Drive-এর শেয়ার লিংক দিন।");
  } catch (error) { portalMessage(error.message || "সঠিক Google Drive লিংক দিন।", true); return; }
  const author = isAdmin ? (existing || {}) : teacherOwnerFields();
  const record = {
    branch: $("teacherContentBranch").value,
    className: $("teacherContentClass").value,
    subject: $("teacherContentSubject").value.trim(),
    teacherName: isAdmin ? (existing?.teacherName || existing?.authorName || "") : teacher.name,
    title: $("teacherContentTitle").value.trim(),
    description: $("teacherContentDescription").value.trim(),
    driveUrl,
    published: $("teacherContentPublished").checked,
    updatedAt: serverTimestamp(),
    ...(isAdmin ? {} : author)
  };
  try {
    if (id) await setDoc(doc(db, "classContents", id), record, { merge: true });
    else await addDoc(collection(db, "classContents"), record);
    $("teacherContentForm").reset(); $("teacherContentId").value = ""; $("teacherContentPublished").checked = true;
    await loadContents(); portalMessage("ক্লাস কন্টেন্ট সংরক্ষিত হয়েছে।");
  } catch (error) { console.error(error); portalMessage("কন্টেন্ট সংরক্ষিত হয়নি। Firestore Rules প্রকাশ হয়েছে কি না দেখুন।", true); }
});

$("teacherContentReset").addEventListener("click", () => {
  $("teacherContentForm").reset(); $("teacherContentId").value = ""; $("teacherContentPublished").checked = true;
});

const resultClass = $("teacherResultClass");
const resultBranch = $("teacherResultBranch");
const resultTrade = $("teacherResultTrade");
const resultSubject = $("teacherResultSubject");

function fillClassOptions(branch) {
  const values = branch === "College" ? ["একাদশ", "দ্বাদশ"] : ["ষষ্ঠ", "সপ্তম", "অষ্টম", "নবম", "দশম"];
  resultClass.replaceChildren(new Option("শ্রেণি নির্বাচন করুন", ""), ...values.map((value) => new Option(value, value)));
  resultTrade.replaceChildren(new Option("সব / সাধারণ বিষয়", ""), ...["এগ্রো বেইজড ফুড", "অ্যাপারেল ম্যানুফ্যাকচারিং বেসিকস", "জেনারেল মেকানিক্স", "আইটি সাপোর্ট", "জেনারেল ইলেকট্রনিক্স"].map((value) => new Option(value, value)));
  fillSubjectOptions();
}

function fillSubjectOptions() {
  const subjects = getAcademicSubjects(resultClass.value);
  resultSubject.replaceChildren(new Option("বিষয় নির্বাচন করুন", ""), ...subjects.map((subject) => {
    const option = new Option(`${subject.name}${subject.code ? ` · ${subject.code}` : ""}`, subject.name);
    option.dataset.code = subject.code;
    return option;
  }));
  $("teacherResultSubjectCode").value = "";
}

resultBranch.addEventListener("change", () => fillClassOptions(resultBranch.value));
resultClass.addEventListener("change", fillSubjectOptions);
resultSubject.addEventListener("change", () => {
  const selected = resultSubject.selectedOptions[0];
  $("teacherResultSubjectCode").value = selected?.dataset.code || "";
});

async function loadRoster() {
  const snapshot = await getDocs(query(collection(db, "studentDirectory"), where("published", "==", true)));
  roster = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
}

function currentResultMeta() {
  return {
    year: Number($("teacherResultYear").value),
    exam: $("teacherResultExam").value,
    branch: resultBranch.value,
    className: resultClass.value,
    trade: resultTrade.value,
    subjectName: resultSubject.value,
    subjectCode: $("teacherResultSubjectCode").value.trim(),
    theoryFullMarks: Number($("teacherResultTheoryFull").value),
    practicalFullMarks: Number($("teacherResultPracticalFull").value || 0)
  };
}

function isStudentInSelectedTrade(student, trade) {
  if (!trade) return true;
  return String(student.trade || "").includes(trade);
}

function studentBranchMatches(studentBranch, selectedBranch) {
  const value = String(studentBranch || "").trim().toLowerCase();
  return selectedBranch === "School"
    ? ["school", "স্কুল"].includes(value)
    : ["college", "কলেজ"].includes(value);
}

async function loadResultDrafts() {
  getTeacherContext();
  if (!currentUser) return;
  try {
    if (!roster.length) await loadRoster();
    const source = isAdmin ? collection(db, "teacherResultDrafts") : query(collection(db, "teacherResultDrafts"), where("ownerUid", "==", currentUser.uid));
    const snapshot = await getDocs(source);
    resultDrafts = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))
      .sort((a, b) => (b.updatedAt?.toMillis?.() || 0) - (a.updatedAt?.toMillis?.() || 0));
    renderResultDraftRows();
    portalMessage(isAdmin ? "সকল শিক্ষকের ফলাফলের খসড়া দেখানো হবে।" : "আপনার সংরক্ষিত ফলাফলের খসড়া দেখানো হবে।");
  } catch (error) { console.error(error); resultMessage("শিক্ষার্থী বা ফলাফলের তথ্য লোড হয়নি। শিক্ষার্থী তালিকা প্রকাশিত এবং Firestore Rules সঠিক আছে কি না দেখুন।", true); }
}

function renderResultDraftRows() {
  const body = $("teacherResultRows"); body.replaceChildren();
  if (!resultDrafts.length) { const row = body.insertRow(); const cell = row.insertCell(); cell.colSpan = 5; cell.textContent = "এখনো কোনো ফলাফলের খসড়া নেই।"; return; }
  resultDrafts.forEach((item) => {
    const row = body.insertRow();
    row.insertCell().textContent = `${item.studentName || ""} · ${item.studentCode || ""}`;
    row.insertCell().textContent = `${item.className || ""}${item.trade ? ` · ${item.trade}` : ""}`;
    row.insertCell().textContent = `${item.exam || ""} · ${bn(item.year || "")}`;
    row.insertCell().textContent = item.subjectName || "";
    const actions = row.insertCell(); actions.className = "table-actions-cell";
    if (isAdmin) { const author = document.createElement("span"); author.textContent = item.authorName || "শিক্ষক"; actions.append(author); }
    const edit = document.createElement("button"); edit.type = "button"; edit.className = "table-action"; edit.textContent = "সম্পাদনা";
    edit.addEventListener("click", () => {
      $("teacherResultYear").value = String(item.year || "");
      $("teacherResultExam").value = item.exam || "";
      resultBranch.value = item.branch || "School";
      fillClassOptions(resultBranch.value);
      resultClass.value = item.className || "";
      fillSubjectOptions();
      resultTrade.value = item.trade || "";
      resultSubject.value = item.subjectName || "";
      $("teacherResultSubjectCode").value = item.subjectCode || "";
      $("teacherResultTheoryFull").value = item.theoryFullMarks ?? "";
      $("teacherResultPracticalFull").value = item.practicalFullMarks ?? 0;
      $("teacherResultPrepare").click();
      $("teacherResultForm").scrollIntoView({ behavior: "smooth", block: "start" });
    });
    actions.append(edit);
    const remove = document.createElement("button"); remove.type = "button"; remove.className = "table-action danger-action"; remove.textContent = "মুছুন";
    remove.addEventListener("click", async () => {
      if (!window.confirm("এই নম্বরের খসড়াটি মুছে ফেলবেন?")) return;
      try { await deleteDoc(doc(db, "teacherResultDrafts", item.id)); await loadResultDrafts(); }
      catch (error) { console.error(error); resultMessage("খসড়াটি মুছতে পারেনি।", true); }
    }); actions.append(remove);
  });
}

$("teacherResultPrepare").addEventListener("click", async () => {
  const meta = currentResultMeta();
  if (!meta.year || !meta.exam || !meta.branch || !meta.className || !meta.subjectName || !meta.theoryFullMarks) {
    resultMessage("শিক্ষাবর্ষ, পরীক্ষা, শাখা, শ্রেণি, বিষয় ও তাত্ত্বিক পূর্ণমান দিন।", true); return;
  }
  const students = roster.filter((student) => studentBranchMatches(student.branch, meta.branch)
    && academicClassCode(student.className) === academicClassCode(meta.className)
    && isStudentInSelectedTrade(student, meta.trade))
    .sort((a, b) => Number(a.roll || 0) - Number(b.roll || 0));
  if (!students.length) { resultMessage("এই শ্রেণি ও ট্রেডে প্রকাশিত শিক্ষার্থী পাওয়া যায়নি।", true); return; }
  const existing = resultDrafts.filter((item) => item.year === meta.year && item.exam === meta.exam
    && item.className === meta.className && item.subjectName === meta.subjectName);
  const table = document.createElement("table"); table.className = "data-table result-marks-table result-marks-compact";
  table.innerHTML = "<thead><tr><th>রোল</th><th>শিক্ষার্থী</th><th>তাত্ত্বিক নম্বর</th><th>ব্যবহারিক নম্বর</th></tr></thead>";
  const body = table.createTBody();
  students.forEach((student) => {
    const row = body.insertRow(); row.dataset.studentCode = student.studentCode;
    row.insertCell().textContent = student.roll || "—";
    row.insertCell().textContent = student.name || "";
    [["theory", meta.theoryFullMarks], ["practical", meta.practicalFullMarks]].forEach(([component, max]) => {
      const cell = row.insertCell();
      const input = document.createElement("input"); input.type = "number"; input.min = "0"; input.max = String(max); input.step = "0.01"; input.inputMode = "decimal"; input.className = "teacher-mark-input"; input.dataset.component = component; input.setAttribute("aria-label", `${student.roll || ""} ${component}`);
      const saved = existing.find((item) => item.studentCode === student.studentCode);
      input.value = saved ? String(saved[component === "theory" ? "theoryMarks" : "practicalMarks"] ?? "") : "";
      if (max <= 0) input.disabled = true;
      cell.append(input);
    });
  });
  $("teacherResultMatrix").replaceChildren(table);
  $("teacherResultMatrixWrap").hidden = false;
  currentRows = students;
  resultMessage(`${bn(students.length)} জন শিক্ষার্থীর রোল অনুযায়ী ছক তৈরি হয়েছে।`);
});

$("teacherResultForm").addEventListener("submit", async (event) => {
  event.preventDefault(); getTeacherContext();
  const meta = currentResultMeta();
  const rows = [...$("teacherResultMatrix").querySelectorAll("tbody tr")];
  if (!rows.length) { resultMessage("আগে রোলসহ নম্বরের ছক তৈরি করুন।", true); return; }
  const entries = rows.map((row, index) => {
    const inputs = [...row.querySelectorAll("input")];
    return { student: currentRows[index], theoryMarks: inputs[0].value === "" ? null : Number(inputs[0].value), practicalMarks: inputs[1].disabled || inputs[1].value === "" ? 0 : Number(inputs[1].value) };
  });
  const enteredEntries = entries.filter((entry) => entry.theoryMarks !== null);
  if (!enteredEntries.length || enteredEntries.some((entry) => !entry.student || entry.theoryMarks < 0 || entry.theoryMarks > meta.theoryFullMarks || entry.practicalMarks < 0 || entry.practicalMarks > meta.practicalFullMarks)) {
    resultMessage("অন্তত একজনের নম্বর দিন; কোনো নম্বর পূর্ণমানের বেশি হতে পারবে না।", true); return;
  }
  try {
    const owner = isAdmin ? { ownerUid: currentUser.uid, authorTeacherId: "admin", authorName: "অ্যাডমিন" } : teacherOwnerFields();
    await Promise.all(enteredEntries.map(({ student, theoryMarks, practicalMarks }) => {
      const subjectKey = encodeURIComponent(`${meta.subjectName}_${meta.subjectCode}`).replace(/%/g, "~").slice(0, 100);
      const examKey = encodeURIComponent(meta.exam).replace(/%/g, "~").slice(0, 50);
      const id = `${currentUser.uid}_${student.studentCode}_${meta.year}_${examKey}_${subjectKey}`;
      return setDoc(doc(db, "teacherResultDrafts", id), {
        ...owner,
        studentCode: student.studentCode, studentName: student.name || "", branch: meta.branch,
        className: meta.className, trade: meta.trade || student.trade || "", roll: student.roll || "",
        boardRoll: student.boardRoll || "", exam: meta.exam, year: meta.year,
        subjectName: meta.subjectName, subjectCode: meta.subjectCode,
        theoryFullMarks: meta.theoryFullMarks, practicalFullMarks: meta.practicalFullMarks,
        theoryMarks, practicalMarks, totalMarks: theoryMarks + practicalMarks,
        fullMarks: meta.theoryFullMarks + meta.practicalFullMarks,
        updatedAt: serverTimestamp()
      }, { merge: true });
    }));
    resultMessage("নম্বরের খসড়া সংরক্ষণ হয়েছে। অ্যাডমিন এটি দেখে চূড়ান্ত ফলাফল প্রকাশ করতে পারবেন।");
    await loadResultDrafts();
  } catch (error) { console.error(error); resultMessage("নম্বর সংরক্ষণ হয়নি। Firestore Rules প্রকাশ করুন।", true); }
});

$("teacherResultYear").value = String(new Date().getFullYear());
