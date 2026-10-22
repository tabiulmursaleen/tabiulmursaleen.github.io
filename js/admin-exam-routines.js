import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import {
  collection, deleteDoc, doc, getDocs, serverTimestamp, setDoc
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";
import { auth, db } from "./firebase-config.js";
import { getAcademicSubjects } from "./academic-subjects.js?v=20261020-6";

const ADMIN_UID = "wWuBEmlsaofgjAaQi7bfblsX6L62";
const form = document.getElementById("examRoutineForm");
const rowsHost = document.getElementById("examRoutineRows");
const listBody = document.getElementById("examRoutineAdminList");
const message = document.getElementById("examRoutineMessage");
const saveButton = document.getElementById("saveExamRoutine");
const cancelButton = document.getElementById("cancelExamRoutineEdit");
let editingId = "";
let busy = false;

const classTab = document.getElementById("classRoutineTab");
const examTab = document.getElementById("examRoutineTab");
const classPanel = document.getElementById("classRoutinePanel");
const examPanel = document.getElementById("exam-routines");

function showRoutinePanel(panel) {
  const showExam = panel === "exam";
  classPanel.hidden = showExam;
  examPanel.hidden = !showExam;
  classTab.classList.toggle("is-active", !showExam);
  examTab.classList.toggle("is-active", showExam);
  classTab.setAttribute("aria-selected", String(!showExam));
  examTab.setAttribute("aria-selected", String(showExam));
}

classTab.addEventListener("click", () => showRoutinePanel("class"));
examTab.addEventListener("click", () => showRoutinePanel("exam"));

function input(type, className, value = "", placeholder = "") {
  const element = document.createElement("input");
  element.type = type;
  element.className = className;
  element.value = value || "";
  element.placeholder = placeholder;
  if (type !== "date") element.required = true;
  return element;
}

function fillSubjectOptions(select, className, selectedName = "") {
  select.replaceChildren(new Option("বিষয় নির্বাচন করুন", ""));
  const subjects = getAcademicSubjects(className);
  subjects.forEach((subject) => select.append(new Option(subject.name, subject.name)));
  ["ট্রেড ১", "ট্রেড ২", "ট্রেড ৩", "ট্রেড ৪"].forEach((name) => {
    if (!subjects.some((subject) => subject.name === name)) select.append(new Option(name, name));
  });
  const legacy = selectedName && !subjects.some((subject) => subject.name === selectedName);
  if (legacy && ![...select.options].some((option) => option.value === selectedName)) {
    select.append(new Option(selectedName, selectedName));
  }
  select.value = selectedName;
}

function addRow(item = {}) {
  const row = document.createElement("div");
  row.className = "exam-routine-edit-row";
  const dateLabel = document.createElement("label");
  dateLabel.append("তারিখ ");
  const date = input("date", "exam-routine-date", item.date);
  date.required = true;
  dateLabel.append(date);
  const dayLabel = document.createElement("label");
  dayLabel.append("বার ");
  const day = input("text", "exam-routine-day", item.day, "তারিখ নির্বাচন করুন");
  day.readOnly = true;
  day.required = true;
  dayLabel.append(day);
  date.addEventListener("change", () => {
    if (!date.value) { day.value = ""; return; }
    const [year, month, dateNumber] = date.value.split("-").map(Number);
    day.value = new Intl.DateTimeFormat("bn-BD", { weekday: "long" }).format(new Date(year, month - 1, dateNumber));
  });
  const subjectLabel = document.createElement("label");
  subjectLabel.append("বিষয়ের নাম ");
  const subjectSelect = document.createElement("select");
  subjectSelect.className = "exam-routine-subject";
  subjectSelect.required = true;
  const className = document.getElementById("examRoutineClass").value;
  fillSubjectOptions(subjectSelect, className, item.subject || "");
  subjectLabel.append(subjectSelect);
  const codeLabel = document.createElement("label");
  codeLabel.append("বিষয় কোড ");
  const codeInput = input("text", "exam-routine-code", item.subjectCode || "", "বিষয় কোড লিখুন");
  codeInput.required = false;
  codeLabel.append(codeInput);
  subjectSelect.addEventListener("change", () => {
    codeInput.value = getAcademicSubjects(document.getElementById("examRoutineClass").value)
      .find((subject) => subject.name === subjectSelect.value)?.code || "";
  });
  const remove = document.createElement("button");
  remove.type = "button";
  remove.className = "secondary-button exam-routine-remove-row";
  remove.textContent = "মুছুন";
  remove.addEventListener("click", () => {
    if (rowsHost.children.length > 1) row.remove();
    else message.textContent = "অন্তত একটি বিষয়ের সারি রাখতে হবে।";
  });
  row.append(dateLabel, dayLabel, subjectLabel, codeLabel, remove);
  rowsHost.append(row);
}

document.getElementById("examRoutineClass").addEventListener("change", () => {
  [...rowsHost.querySelectorAll(".exam-routine-edit-row")].forEach((row) => {
    const select = row.querySelector(".exam-routine-subject");
    const code = row.querySelector(".exam-routine-code");
    const oldName = select.value;
    const classSubjects = getAcademicSubjects(document.getElementById("examRoutineClass").value);
    fillSubjectOptions(select, document.getElementById("examRoutineClass").value);
    select.value = classSubjects.some((subject) => subject.name === oldName)
      || ["ট্রেড ১", "ট্রেড ২", "ট্রেড ৩", "ট্রেড ৪"].includes(oldName) ? oldName : "";
    code.value = classSubjects.find((subject) => subject.name === select.value)?.code || "";
  });
});

function resetForm() {
  form.reset();
  editingId = "";
  rowsHost.replaceChildren();
  addRow();
  saveButton.textContent = "রুটিন সংরক্ষণ ও প্রকাশ";
  cancelButton.hidden = true;
}

function showErrorRow(text) {
  const row = document.createElement("tr");
  const cell = document.createElement("td");
  cell.colSpan = 4;
  cell.textContent = text;
  row.append(cell);
  listBody.replaceChildren(row);
}

function timeValue(item) {
  return item?.toMillis?.() || (item?.seconds ? item.seconds * 1000 : 0) || 0;
}

async function loadRoutines() {
  try {
    const snapshot = await getDocs(collection(db, "examRoutines"));
    const records = snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() }));
    records.sort((a, b) => timeValue(b.updatedAt || b.publishedAt || b.createdAt) - timeValue(a.updatedAt || a.publishedAt || a.createdAt));
    listBody.replaceChildren();
    if (!records.length) { showErrorRow("এখনো কোনো পরীক্ষার রুটিন সংরক্ষণ করা হয়নি।"); return; }
    for (const routine of records) {
      const row = document.createElement("tr");
      for (const value of [routine.className || "—", routine.examName || "—", routine.published ? "প্রকাশিত" : "অপ্রকাশিত"]) {
        const cell = document.createElement("td"); cell.textContent = value; row.append(cell);
      }
      const actions = document.createElement("td");
      const edit = document.createElement("button"); edit.type = "button"; edit.className = "secondary-button exam-routine-action"; edit.textContent = "সম্পাদনা";
      edit.addEventListener("click", () => editRoutine(routine));
      const remove = document.createElement("button"); remove.type = "button"; remove.className = "secondary-button exam-routine-action"; remove.textContent = "মুছুন";
      remove.addEventListener("click", async () => {
        if (!window.confirm("এই পরীক্ষার রুটিনটি মুছে ফেলতে চান?")) return;
        try { await deleteDoc(doc(db, "examRoutines", routine.id)); message.textContent = "রুটিন মুছে ফেলা হয়েছে।"; await loadRoutines(); }
        catch (error) { console.error(error); message.textContent = "রুটিন মুছতে সমস্যা হয়েছে। Firestore Rules পরীক্ষা করুন।"; }
      });
      actions.append(edit, remove); row.append(actions); listBody.append(row);
    }
  } catch (error) {
    console.error("পরীক্ষার রুটিন লোড করা যায়নি:", error);
    showErrorRow("পরীক্ষার রুটিন লোড করা যায়নি। Firestore access rules পরীক্ষা করুন।");
  }
}

function editRoutine(routine) {
  editingId = routine.id;
  document.getElementById("examRoutineClass").value = routine.className || "";
  const examSelect = document.getElementById("examRoutineName");
  const examName = routine.examName || "";
  if (examName && ![...examSelect.options].some((option) => option.value === examName)) {
    examSelect.add(new Option(examName, examName));
  }
  examSelect.value = examName;
  document.getElementById("examRoutineStartTime").value = routine.startTime || "";
  document.getElementById("examRoutinePublished").checked = routine.published === true;
  rowsHost.replaceChildren();
  (routine.subjects || []).forEach((item) => addRow(item));
  if (!rowsHost.children.length) addRow();
  saveButton.textContent = "পরিবর্তন সংরক্ষণ";
  cancelButton.hidden = false;
  message.textContent = "রুটিন সম্পাদনা করুন, তারপর সংরক্ষণ চাপুন।";
  form.scrollIntoView({ behavior: "smooth", block: "start" });
}

document.getElementById("addExamRoutineRow").addEventListener("click", () => addRow());
cancelButton.addEventListener("click", resetForm);
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (busy) return;
  const subjects = [...rowsHost.querySelectorAll(".exam-routine-edit-row")].map((row) => ({
    date: row.querySelector(".exam-routine-date").value,
    day: row.querySelector(".exam-routine-day").value,
    subject: row.querySelector(".exam-routine-subject").value.trim(),
    subjectCode: row.querySelector(".exam-routine-code").value.trim()
  }));
  if (subjects.some((item) => !item.date || !item.day || !item.subject)) {
    message.textContent = "প্রতিটি সারিতে তারিখ, বার ও বিষয় নির্বাচন করুন।"; return;
  }
  const published = document.getElementById("examRoutinePublished").checked;
  const data = {
    className: document.getElementById("examRoutineClass").value,
    examName: document.getElementById("examRoutineName").value.trim(),
    startTime: document.getElementById("examRoutineStartTime").value,
    subjects,
    published,
    updatedAt: serverTimestamp()
  };
  if (published) data.publishedAt = serverTimestamp();
  if (!editingId) data.createdAt = serverTimestamp();
  busy = true; saveButton.disabled = true; message.textContent = "পরীক্ষার রুটিন সংরক্ষণ হচ্ছে...";
  try {
    const target = editingId ? doc(db, "examRoutines", editingId) : doc(collection(db, "examRoutines"));
    await setDoc(target, data, { merge: true });
    message.textContent = published ? "পরীক্ষার রুটিন সংরক্ষিত ও প্রকাশিত হয়েছে।" : "পরীক্ষার রুটিন সংরক্ষিত হয়েছে; প্রকাশ করতে প্রকাশের ঘরটি নির্বাচন করুন।";
    resetForm();
    await loadRoutines();
  } catch (error) {
    console.error("পরীক্ষার রুটিন সংরক্ষণ হয়নি:", error);
    message.textContent = "পরীক্ষার রুটিন সংরক্ষণ হয়নি। Firestore Rules ও সংযোগ পরীক্ষা করুন।";
  } finally { busy = false; saveButton.disabled = false; }
});

addRow();
onAuthStateChanged(auth, (user) => { if (user?.uid === ADMIN_UID) loadRoutines(); });
