import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";
import { db } from "./firebase-config.js";
import { routineDefaults, routineTeacherPhotos } from "./routines-data.js";

const status = document.getElementById("publicRoutineStatus");
const content = document.getElementById("publicRoutineContent");
const title = document.getElementById("publicRoutineBranchTitle");
const meta = document.getElementById("publicRoutineMeta");
const tableHost = document.getElementById("publicRoutineTable");
const printButton = document.getElementById("printRoutineButton");
const tabs = [...document.querySelectorAll("[data-routine-branch]")];
const routineCache = {};
let selectedBranch = "school";
let routineLoadFailed = false;

function showStatus(text) {
  status.textContent = text;
  status.hidden = false;
  content.hidden = true;
}

function teacherDetails(routine, branch, code) {
  const teacher = routine.teachers?.[code];
  const name = typeof teacher === "string" ? teacher : teacher?.name;
  const photo = routine.teacherPhotos?.[code]
    || (typeof teacher === "object" ? teacher.photo : "")
    || routineTeacherPhotos[branch]?.[code]
    || "";
  return { name: name || code, photo };
}

function appendLesson(cell, rawText, routine, branch) {
  const lines = String(rawText || "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (!lines.length) return;

  const subject = document.createElement("span");
  subject.className = "routine-subject";
  subject.textContent = lines[0];
  cell.append(subject);

  const code = lines.length > 1 && Object.hasOwn(routine.teachers || {}, lines[1])
    ? lines[1]
    : "";
  if (code) {
    const teacher = teacherDetails(routine, branch, code);
    const teacherLine = document.createElement("span");
    teacherLine.className = "routine-teacher-line";
    if (teacher.photo) {
      const image = document.createElement("img");
      image.className = "routine-teacher-photo";
      image.src = teacher.photo;
      image.alt = "";
      image.loading = "lazy";
      image.addEventListener("error", () => image.remove(), { once: true });
      teacherLine.append(image);
    }
    const name = document.createElement("span");
    name.textContent = code;
    name.title = teacher.name;
    name.setAttribute("aria-label", `${teacher.name} (${code})`);
    teacherLine.append(name);
    cell.append(teacherLine);
    return;
  }

  if (lines.length > 1) {
    const note = document.createElement("span");
    note.className = "routine-cell-note";
    note.textContent = lines.slice(1).join(" ");
    cell.append(note);
  }
}

function renderRoutine(branch) {
  const routine = routineCache[branch];
  tabs.forEach((tab) => {
    const active = tab.dataset.routineBranch === branch;
    tab.classList.toggle("is-active", active);
    tab.setAttribute("aria-selected", String(active));
  });

  if (!routine || routine.published !== true) {
    showStatus("এই শাখার রুটিন বর্তমানে প্রকাশিত নেই।");
    return;
  }

  const table = document.createElement("table");
  table.className = "published-routine-table";
  table.classList.add(`routine-${branch}`);
  const header = table.createTHead().insertRow();
  const periods = routine.periods || [];
  const specialPeriods = new Map();
  periods.forEach((label, index) => {
    const match = String(label).match(/^(সমাবেশ|বিরতি)\s*(.*)$/u);
    if (match) specialPeriods.set(index, { label: match[1], time: match[2], fullLabel: label });
  });
  const regularPeriodCount = periods.length - specialPeriods.size;
  const mobileTableWidth = 38 + 38 + (specialPeriods.size * 36) + (regularPeriodCount * 72);
  table.style.setProperty("--routine-mobile-width", `${mobileTableWidth}px`);
  ["বার", "শ্রেণি", ...periods].forEach((label, columnIndex) => {
    const th = document.createElement("th");
    const special = specialPeriods.get(columnIndex - 2);
    if (special) {
      th.className = "routine-special-period-heading";
      th.setAttribute("aria-label", special.fullLabel);
      th.textContent = "";
    } else if (columnIndex < 2) {
      const axisLabel = document.createElement("span");
      axisLabel.className = "routine-axis-label";
      axisLabel.textContent = label;
      th.append(axisLabel);
    } else {
      th.textContent = label;
    }
    header.append(th);
  });

  const body = table.createTBody();
  for (const [dayIndex, day] of (routine.days || []).entries()) {
    (day.classes || []).forEach((classRow, classIndex) => {
      const row = body.insertRow();
      row.dataset.dayIndex = String(dayIndex % 5);
      if (classIndex === 0) row.classList.add("routine-day-start");
      if (classIndex === day.classes.length - 1) row.classList.add("routine-day-end");
      if (classIndex === 0) {
        const dayCell = row.insertCell();
        dayCell.rowSpan = day.classes.length;
        dayCell.className = "routine-day-cell routine-day-group-cell";
        dayCell.dataset.dayIndex = String(dayIndex % 5);
        const dayLabel = document.createElement("span");
        dayLabel.className = "routine-day-label";
        dayLabel.textContent = day.name;
        dayCell.append(dayLabel);
      }
      const classCell = row.insertCell();
      classCell.className = "routine-class-cell";
      const classLabel = document.createElement("span");
      classLabel.className = "routine-class-label";
      classLabel.textContent = classRow.name;
      classCell.append(classLabel);
      periods.forEach((_, periodIndex) => {
        const special = specialPeriods.get(periodIndex);
        if (special) {
          if (classIndex !== 0) return;
          const specialCell = row.insertCell();
          specialCell.rowSpan = day.classes.length;
          specialCell.className = "routine-special-period-cell routine-day-group-cell";
          specialCell.setAttribute("aria-label", `${special.label} ${special.time}`.trim());
          const specialLabel = document.createElement("span");
          specialLabel.className = "routine-special-period-label";
          specialLabel.textContent = [special.label, special.time].filter(Boolean).join(" · ");
          specialCell.append(specialLabel);
          return;
        }
        const cell = row.insertCell();
        const lesson = classRow.lessons?.[periodIndex] || "";
        if (lesson) {
          const lessonLines = String(lesson).split(/\r?\n/).map((line) => line.trim());
          const isJamilClass = lessonLines[1] === "JH";
          const isTradeClass = lessonLines[0]?.startsWith("ট্রেড");
          if (branch === "school" && (isJamilClass || isTradeClass)) {
            cell.classList.add("routine-highlight-cell");
          }
          appendLesson(cell, lesson, routine, branch);
        }
        else cell.className = "routine-empty-cell";
      });
    });
  }

  const branchName = branch === "school" ? "স্কুল শাখা" : "কলেজ শাখা";
  title.textContent = `${branchName} — ক্লাস রুটিন`;
  let effectiveDate = routine.effectiveDate || "";
  if (effectiveDate) {
    const [year, month, day] = effectiveDate.split("-").map(Number);
    effectiveDate = new Intl.DateTimeFormat("bn-BD", {
      day: "numeric", month: "long", year: "numeric"
    }).format(new Date(year, month - 1, day));
  }
  meta.textContent = `শিক্ষাবর্ষ ${routine.academicYear || ""}${effectiveDate ? ` · ${effectiveDate} থেকে কার্যকর` : ""}`;
  tableHost.replaceChildren(table);
  status.textContent = routineLoadFailed
    ? "ডাটাবেজের লাইভ আপডেট পাওয়া যায়নি; Excel-এর প্রাথমিক রুটিন দেখানো হচ্ছে।"
    : "";
  status.hidden = !routineLoadFailed;
  content.hidden = false;
}

async function loadRoutines() {
  status.textContent = "রুটিন লোড হচ্ছে...";
  for (const branch of ["school", "college"]) {
    try {
      const snapshot = await getDoc(doc(db, "classRoutines", branch));
      routineCache[branch] = snapshot.exists()
        ? { ...routineDefaults[branch], ...snapshot.data() }
        : routineDefaults[branch];
    } catch (error) {
      console.error(`${branch} রুটিন লোডের সমস্যা:`, error);
      routineCache[branch] = routineDefaults[branch];
      routineLoadFailed = true;
    }
  }
  renderRoutine(selectedBranch);
}

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    selectedBranch = tab.dataset.routineBranch;
    renderRoutine(selectedBranch);
  });
});

printButton?.addEventListener("click", () => {
  if (content.hidden) return;
  window.print();
});

loadRoutines();
