import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import { auth, db } from "./firebase-config.js";
import { routineDefaults, routineTeacherPhotos } from "./routines-data.js";

const ADMIN_UID = "wWuBEmlsaofgjAaQi7bfblsX6L62";
const branchSelect = document.getElementById("adminRoutineBranch");
const yearInput = document.getElementById("adminRoutineYear");
const effectiveDateInput = document.getElementById("adminRoutineEffectiveDate");
const publishedInput = document.getElementById("adminRoutinePublished");
const teachersBody = document.getElementById("adminRoutineTeachers");
const editor = document.getElementById("adminRoutineEditor");
const message = document.getElementById("adminRoutineMessage");
const saveButton = document.getElementById("saveRoutineButton");
let activeRoutine = null;
let saving = false;

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function makeCell(tag, text = "", className = "") {
  const element = document.createElement(tag);
  if (text) element.textContent = text;
  if (className) element.className = className;
  return element;
}

function makeInput(className, value, placeholder = "") {
  const input = document.createElement("input");
  input.className = className;
  input.type = "text";
  input.value = value || "";
  input.placeholder = placeholder;
  return input;
}

function teacherRecords(routine) {
  return Object.entries(routine.teachers || {}).map(([code, name]) => ({
    code,
    name: typeof name === "string" ? name : name?.name || "",
    photo: routine.teacherPhotos?.[code]
      || (typeof name === "object" ? name.photo : "")
      || routineTeacherPhotos[branchSelect.value]?.[code]
      || ""
  }));
}

function renderTeachers(records) {
  teachersBody.replaceChildren();
  records.forEach((teacher) => {
    const row = document.createElement("tr");
    row.dataset.routineTeacher = "true";
    const codeCell = document.createElement("td");
    codeCell.append(makeInput("routine-teacher-code", teacher.code, "যেমন: JH"));
    const nameCell = document.createElement("td");
    nameCell.append(makeInput("routine-teacher-name", teacher.name, "শিক্ষকের সম্পূর্ণ নাম"));
    const photoCell = document.createElement("td");
    photoCell.append(makeInput("routine-teacher-photo", teacher.photo, "images/teachers/teacher-01.jpg"));
    const actionCell = document.createElement("td");
    const removeButton = makeCell("button", "মুছুন", "secondary-button routine-remove-teacher");
    removeButton.type = "button";
    removeButton.addEventListener("click", () => row.remove());
    actionCell.append(removeButton);
    row.append(codeCell, nameCell, photoCell, actionCell);
    teachersBody.append(row);
  });
}

function renderEditor(routine) {
  const table = document.createElement("table");
  table.className = "data-table routine-edit-table";
  const head = table.createTHead();
  const header = head.insertRow();
  header.append(makeCell("th", "বার"), makeCell("th", "শ্রেণি"));
  routine.periods.forEach((period) => {
    const th = makeCell("th");
    const input = makeInput("routine-period-input", period, "পিরিয়ড ও সময়");
    input.setAttribute("aria-label", `পিরিয়ড ${header.cells.length - 1}`);
    th.append(input);
    header.append(th);
  });

  const body = table.createTBody();
  routine.days.forEach((day, dayIndex) => {
    day.classes.forEach((classRow, classIndex) => {
      const row = body.insertRow();
      row.dataset.dayIndex = String(dayIndex);
      row.dataset.classIndex = String(classIndex);
      if (classIndex === 0) {
        const dayCell = row.insertCell();
        dayCell.rowSpan = day.classes.length;
        const dayInput = makeInput("routine-day-input", day.name, "বার");
        dayInput.setAttribute("aria-label", `বার ${dayIndex + 1}`);
        dayCell.append(dayInput);
      }
      const classCell = row.insertCell();
      classCell.append(makeInput("routine-class-input", classRow.name, "শ্রেণি"));
      classRow.lessons.forEach((lesson, periodIndex) => {
        const cell = row.insertCell();
        const textarea = document.createElement("textarea");
        textarea.className = "routine-lesson-input";
        textarea.rows = 2;
        textarea.value = lesson || "";
        textarea.setAttribute("aria-label", `${day.name} ${classRow.name}, ${routine.periods[periodIndex] || "পিরিয়ড"}`);
        cell.append(textarea);
      });
    });
  });
  editor.replaceChildren(table);
}

function paintRoutine(routine) {
  activeRoutine = clone(routine);
  yearInput.value = routine.academicYear || "";
  effectiveDateInput.value = routine.effectiveDate || "";
  publishedInput.checked = routine.published === true;
  renderTeachers(teacherRecords(routine));
  renderEditor(routine);
}

async function loadRoutine() {
  const key = branchSelect.value;
  message.textContent = "রুটিন লোড হচ্ছে...";
  try {
    const snapshot = await getDoc(doc(db, "classRoutines", key));
    const routine = snapshot.exists()
      ? { ...clone(routineDefaults[key]), ...snapshot.data() }
      : clone(routineDefaults[key]);
    paintRoutine(routine);
    message.textContent = snapshot.exists()
      ? "সংরক্ষিত রুটিন লোড হয়েছে।"
      : "Excel থেকে রুটিন লোড হয়েছে। পরিবর্তন করে সংরক্ষণ করুন।";
  } catch (error) {
    console.error("রুটিন লোডের সমস্যা:", error);
    paintRoutine(clone(routineDefaults[key]));
    message.textContent = "ডাটাবেজ থেকে রুটিন লোড হয়নি। Firestore access rules পরীক্ষা করুন।";
  }
}

function collectRoutine() {
  const routine = clone(activeRoutine);
  routine.branch = branchSelect.value === "school" ? "স্কুল" : "কলেজ";
  routine.academicYear = yearInput.value.trim();
  routine.effectiveDate = effectiveDateInput.value;
  routine.published = publishedInput.checked;
  routine.periods = [...editor.querySelectorAll(".routine-period-input")].map((input) => input.value.trim());

  routine.days.forEach((day, dayIndex) => {
    const firstRow = editor.querySelector(`tr[data-day-index="${dayIndex}"]`);
    const dayInput = firstRow?.querySelector(".routine-day-input");
    if (dayInput) day.name = dayInput.value.trim();
    day.classes.forEach((classRow, classIndex) => {
      const row = editor.querySelector(`tr[data-day-index="${dayIndex}"][data-class-index="${classIndex}"]`);
      classRow.name = row.querySelector(".routine-class-input").value.trim();
      classRow.lessons = [...row.querySelectorAll(".routine-lesson-input")].map((input) => input.value.trim());
    });
  });

  const teachers = {};
  const teacherPhotos = {};
  for (const row of teachersBody.querySelectorAll("[data-routine-teacher]") ) {
    const code = row.querySelector(".routine-teacher-code").value.trim();
    const name = row.querySelector(".routine-teacher-name").value.trim();
    const photo = row.querySelector(".routine-teacher-photo").value.trim();
    if (!code && !name && !photo) continue;
    if (!code || !name) throw new Error("প্রতিটি শিক্ষক-সংকেতে সংকেত ও নাম দুটিই দিন।");
    if (teachers[code]) throw new Error("একই সংকেত একাধিকবার দেওয়া হয়েছে।");
    teachers[code] = name;
    if (photo) teacherPhotos[code] = photo;
  }
  routine.teachers = teachers;
  routine.teacherPhotos = teacherPhotos;

  if (!routine.academicYear || !routine.effectiveDate) {
    throw new Error("শিক্ষাবর্ষ ও কার্যকর হওয়ার তারিখ দিন।");
  }
  if (routine.days.some((day) => !day.name || day.classes.some((item) => !item.name))) {
    throw new Error("প্রতিটি বার ও শ্রেণির নাম পূরণ করুন।");
  }
  if (routine.periods.some((period) => !period)) {
    throw new Error("প্রতিটি পিরিয়ডের শিরোনাম ও সময় পূরণ করুন।");
  }
  return routine;
}

document.getElementById("addRoutineTeacher").addEventListener("click", () => {
  const records = [...teachersBody.querySelectorAll("[data-routine-teacher]")].map((row) => ({
    code: row.querySelector(".routine-teacher-code").value,
    name: row.querySelector(".routine-teacher-name").value,
    photo: row.querySelector(".routine-teacher-photo").value
  }));
  records.push({ code: "", name: "", photo: "" });
  renderTeachers(records);
});

branchSelect.addEventListener("change", loadRoutine);
saveButton.addEventListener("click", async () => {
  if (saving || !activeRoutine) return;
  let routine;
  try {
    routine = collectRoutine();
  } catch (error) {
    message.textContent = error.message;
    return;
  }
  saving = true;
  saveButton.disabled = true;
  message.textContent = "রুটিন সংরক্ষণ হচ্ছে...";
  try {
    await setDoc(doc(db, "classRoutines", branchSelect.value), {
      ...routine,
      updatedAt: serverTimestamp()
    });
    paintRoutine(routine);
    message.textContent = routine.published
      ? "রুটিন সংরক্ষিত ও ওয়েবসাইটে প্রকাশিত হয়েছে।"
      : "রুটিন সংরক্ষিত হয়েছে; ওয়েবসাইটে দেখাতে প্রকাশের ঘরটি নির্বাচন করুন।";
  } catch (error) {
    console.error("রুটিন সংরক্ষণের সমস্যা:", error);
    message.textContent = "রুটিন সংরক্ষণ হয়নি। Firestore access rules ও সংযোগ পরীক্ষা করুন।";
  } finally {
    saving = false;
    saveButton.disabled = false;
  }
});

onAuthStateChanged(auth, (user) => {
  if (user?.uid !== ADMIN_UID) return;
  loadRoutine();
});
