import {
  collection,
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

import { db } from "./firebase-config.js";

const form = document.getElementById("publicResultSearch");
const resultYearSelect = document.getElementById("publicResultYear");
const resultClassSelect = document.getElementById("publicResultClass");
const resultRollSelect = document.getElementById("publicResultRoll");
const status = document.getElementById("publicResultStatus");
const resultList = document.getElementById("publicResultList");
const number = (value) => new Intl.NumberFormat("bn-BD", { maximumFractionDigits: 2 }).format(value || 0);
const yearNumber = (value) => new Intl.NumberFormat("bn-BD", { useGrouping: false }).format(value || 0);
const meritForm = document.getElementById("meritSearch");
const meritStatus = document.getElementById("meritStatus");
const meritResults = document.getElementById("meritResults");
const resultTabs = [...document.querySelectorAll(".result-tab[data-panel]")];
const resultAccessGate = document.getElementById("resultAccessGate");
const resultAccessForm = document.getElementById("resultAccessForm");
const resultAccessPassword = document.getElementById("resultAccessPassword");
const resultAccessMessage = document.getElementById("resultAccessMessage");
const publicResultsProtected = document.getElementById("publicResultsProtected");
const RESULT_PAGE_PASSWORD = "136065";
const RESULT_UNLOCK_KEY = "publicResultsUnlocked";
let publishedResultsPromise;
let publishedStudentsPromise;
let resultsInitialized = false;

function activateResultTab(tabId, updateHash = true) {
  const selected = resultTabs.find((tab) => tab.id === tabId) || resultTabs[0];
  if (!selected) return;
  resultTabs.forEach((tab) => {
    const active = tab === selected;
    tab.setAttribute("aria-selected", String(active));
    tab.tabIndex = active ? 0 : -1;
    const panel = document.getElementById(tab.dataset.panel);
    if (panel) panel.hidden = !active;
  });
  if (updateHash) history.replaceState(null, "", selected.dataset.hash || "#single");
}

resultTabs.forEach((tab) => tab.addEventListener("click", () => activateResultTab(tab.id)));
if (resultTabs.length) {
  const initialTab = location.hash === "#merit" ? "meritResultTab" : "singleResultTab";
  activateResultTab(initialTab, false);
  window.addEventListener("hashchange", () => activateResultTab(location.hash === "#merit" ? "meritResultTab" : "singleResultTab", false));
}

function loadPublishedResults() {
  if (!publishedResultsPromise) {
    publishedResultsPromise = getDocs(query(
      collection(db, "publicStudentResults"),
      where("published", "==", true)
    )).then((snapshot) => snapshot.docs.map((item) => item.data()));
  }
  return publishedResultsPromise;
}

function loadPublishedStudents() {
  if (!publishedStudentsPromise) {
    publishedStudentsPromise = getDocs(query(
      collection(db, "studentDirectory"),
      where("published", "==", true)
    )).then((snapshot) => snapshot.docs.map((item) => item.data()));
  }
  return publishedStudentsPromise;
}

function resultStudentKey(student) {
  return student.studentCode ? `code:${student.studentCode}` : `name:${String(student.studentName || student.name || "").trim().toLocaleLowerCase("bn-BD")}`;
}

function addCell(row, tag, text) {
  const cell = document.createElement(tag);
  cell.textContent = text == null ? "—" : String(text);
  row.append(cell);
  return cell;
}

function renderResult(result, rank) {
  const card = document.createElement("article");
  card.className = "public-result-card";
  const watermark = document.createElement("img");
  watermark.className = "result-print-watermark";
  watermark.src = "images/logo/logo-transparent.png";
  watermark.alt = "";
  watermark.setAttribute("aria-hidden", "true");
  card.append(watermark);
  const institution = document.createElement("header");
  institution.className = "result-institution-heading";
  const institutionName = document.createElement("h1");
  institutionName.textContent = "তাবিউল মুরসালীন নগর কারিগরি স্কুল এন্ড কলেজ";
  const institutionAddress = document.createElement("p");
  institutionAddress.textContent = "টেঙ্গুরী, কেন্দুয়া, নেত্রকোণা · EIIN No. 136065";
  institution.append(institutionName, institutionAddress);
  card.append(institution);
  const heading = document.createElement("h2");
  heading.textContent = `${result.exam || "পরীক্ষা"} পরীক্ষার ফলাফল — ${yearNumber(result.year)}`;
  card.append(heading);

  const metadata = document.createElement("p");
  metadata.className = "public-result-meta";
  const studentName = document.createElement("p");
  studentName.className = "result-student-name";
  studentName.textContent = result.studentName || "";
  const displayFields = result.displayFields || {};
  const resultSubjects = result.subjects || [];
  const passNumberFor = (subject, component) => component === "theory"
    ? (subject.theoryPassMarks ?? subject.passMarks)
    : subject.practicalPassMarks;
  const subjectsWithPassNumber = resultSubjects.filter((subject) =>
    ((Number(subject.theoryFullMarks) > 0) && passNumberFor(subject, "theory") != null && passNumberFor(subject, "theory") !== "")
    || ((Number(subject.practicalFullMarks) > 0) && passNumberFor(subject, "practical") != null && passNumberFor(subject, "practical") !== "")
  );
  const failedSubjectCount = result.absent === true ? 0 : resultSubjects.filter((subject) => {
    if (subject.absent === true) return false;
    const theoryPass = passNumberFor(subject, "theory");
    const practicalPass = passNumberFor(subject, "practical");
    const theoryFailed = Number(subject.theoryFullMarks) > 0 && theoryPass != null && theoryPass !== ""
      && Number(subject.theoryMarks || 0) < Number(theoryPass);
    const practicalFailed = Number(subject.practicalFullMarks) > 0 && practicalPass != null && practicalPass !== ""
      && Number(subject.practicalMarks || 0) < Number(practicalPass);
    return theoryFailed || practicalFailed;
  }).length;
  const absentSubjectCount = result.absent === true
    ? resultSubjects.length
    : resultSubjects.filter((subject) => subject.absent === true).length;
  const identityParts = [
    ["আইডি", result.studentCode, displayFields.studentId !== false],
    ["বোর্ড রোল", result.boardRoll, displayFields.boardRoll !== false],
    ["ক্লাস রোল", result.roll, displayFields.classRoll !== false],
    ["শাখা", result.branch, displayFields.branch !== false],
    ["শ্রেণি", result.className, displayFields.className !== false],
    ["ট্রেড", result.trade, displayFields.trade !== false]
  ].filter(([, value, enabled]) => enabled && value != null && value !== "");
  identityParts.forEach(([label, value]) => {
    const item = document.createElement("span");
    item.textContent = `${label}: ${value}`;
    metadata.append(item);
  });
  if (displayFields.failSubjectCount !== false) {
    const item = document.createElement("span");
    item.textContent = `ফেল বিষয়: ${subjectsWithPassNumber.length ? number(failedSubjectCount) : "পাশ নম্বর দেওয়া নেই"}`;
    metadata.append(item);
  }
  if (displayFields.absentSubjectCount !== false) {
    const item = document.createElement("span");
    item.textContent = `অনুপস্থিত বিষয়: ${number(absentSubjectCount)}`;
    metadata.append(item);
  }
  card.append(studentName, metadata);
  if (result.absent === true) {
    const absentBadge = document.createElement("p");
    absentBadge.className = "result-absent-badge";
    absentBadge.textContent = "অনুপস্থিত";
    card.append(absentBadge);
  }

  if (displayFields.meritRank !== false) {
    const rankBadge = document.createElement("p");
    rankBadge.className = "result-merit-rank";
    const rankSuffix = ({ 1: "ম", 2: "য়", 3: "য়", 4: "র্থ" })[rank] || "তম";
    rankBadge.textContent = `🏅 মেধাতালিকায় ${number(rank)}${rankSuffix} স্থান`;
    card.append(rankBadge);
  }

  const table = document.createElement("table");
  table.className = "public-result-table";
  const thead = table.createTHead();
  const header = thead.insertRow();
  const subjects = result.subjects || [];
  const hasTheory = subjects.some((subject) => Number(subject.theoryFullMarks) > 0);
  const hasPractical = subjects.some((subject) => Number(subject.practicalFullMarks) > 0);
  const showPractical = result.showPractical === true && hasPractical;
  const showTheoryPass = hasTheory && subjects.some((subject) => (subject.theoryPassMarks ?? subject.passMarks) != null && (subject.theoryPassMarks ?? subject.passMarks) !== "");
  const showPracticalPass = showPractical && subjects.some((subject) => subject.practicalPassMarks != null && subject.practicalPassMarks !== "");
  const headers = ["ক্রমিক", "বিষয়", "বিষয় কোড"];
  if (showPractical) {
    if (hasTheory) headers.push("তাত্ত্বিক পূর্ণমান", "তাত্ত্বিক নম্বর");
    if (showTheoryPass) headers.push("তাত্ত্বিক পাশ নম্বর");
    headers.push("ব্যবহারিক পূর্ণমান", "ব্যবহারিক নম্বর");
    if (showPracticalPass) headers.push("ব্যবহারিক পাশ নম্বর");
    headers.push("মোট পূর্ণমান", "মোট নম্বর");
  } else {
    headers.push("পূর্ণমান", "প্রাপ্ত নম্বর");
    if (showTheoryPass) headers.push("তাত্ত্বিক পাশ নম্বর");
  }
  headers.forEach((title) => {
    const cell = addCell(header, "th", title);
    if (title === "ক্রমিক") cell.className = "result-subject-serial";
  });
  const tbody = table.createTBody();
  subjects.forEach((subject, index) => {
    const row = tbody.insertRow();
    const subjectAbsent = result.absent === true || subject.absent === true;
    addCell(row, "td", number(index + 1)).className = "result-subject-serial";
    addCell(row, "td", subject.name);
    addCell(row, "td", subject.code);
    if (showPractical) {
      if (hasTheory) {
        const theoryActive = Number(subject.theoryFullMarks) > 0;
        addCell(row, "td", theoryActive ? number(subject.theoryFullMarks) : "");
        addCell(row, "td", !theoryActive ? "" : subjectAbsent ? "অনুপস্থিত" : number(subject.theoryMarks));
      }
      if (showTheoryPass) addCell(row, "td", Number(subject.theoryFullMarks) <= 0 || (subject.theoryPassMarks == null && subject.passMarks == null) ? "" : number(subject.theoryPassMarks ?? subject.passMarks));
      const practicalActive = Number(subject.practicalFullMarks) > 0;
      addCell(row, "td", practicalActive ? number(subject.practicalFullMarks) : "");
      addCell(row, "td", !practicalActive ? "" : subjectAbsent ? "অনুপস্থিত" : number(subject.practicalMarks));
      if (showPracticalPass) addCell(row, "td", !practicalActive || subject.practicalPassMarks == null || subject.practicalPassMarks === "" ? "" : number(subject.practicalPassMarks));
      addCell(row, "td", number(subject.fullMarks));
      addCell(row, "td", subjectAbsent ? "অনুপস্থিত" : number(subject.marks));
    } else {
      addCell(row, "td", number(subject.fullMarks));
      addCell(row, "td", subjectAbsent ? "অনুপস্থিত" : number(subject.marks));
      if (showTheoryPass) addCell(row, "td", subject.theoryPassMarks == null && subject.passMarks == null ? "" : number(subject.theoryPassMarks ?? subject.passMarks));
    }
  });
  const tableWrap = document.createElement("div");
  tableWrap.className = "public-result-table-wrap";
  tableWrap.append(table);
  card.append(tableWrap);

  const total = document.createElement("p");
  total.className = "public-result-total";
  total.textContent = `মোট: ${number(result.totalMarks)} / ${number(result.fullMarks)} · শতকরা: ${number(result.percentage)}%`;
  card.append(total);
  const signatures = document.createElement("div");
  signatures.className = "result-signatures";
  const parentSignature = document.createElement("div");
  parentSignature.textContent = "অভিভাবকের স্বাক্ষর";
  const principalSignature = document.createElement("div");
  principalSignature.textContent = "প্রতিষ্ঠান প্রধানের স্বাক্ষর ও সিল";
  signatures.append(parentSignature, principalSignature);
  card.append(signatures);
  const printButton = document.createElement("button");
  printButton.type = "button";
  printButton.className = "result-print-button";
  printButton.textContent = "ফলাফল প্রিন্ট করুন";
  printButton.addEventListener("click", () => {
    document.querySelectorAll(".public-result-card").forEach((item) => item.classList.remove("print-target"));
    card.classList.add("print-target");
    document.body.classList.add("print-single-result");
    window.print();
  });
  card.append(printButton);
  return card;
}

function renderMeritList(records) {
  const sorted = [...records].sort((a, b) => Number(b.totalMarks || 0) - Number(a.totalMarks || 0)
    || Number(b.percentage || 0) - Number(a.percentage || 0)
    || String(a.studentName || "").localeCompare(String(b.studentName || ""), "bn"));
  const section = document.createElement("section");
  section.className = "public-result-card";
  const watermark = document.createElement("img");
  watermark.className = "merit-print-watermark";
  watermark.src = "images/logo/logo-transparent.png";
  watermark.alt = "";
  watermark.setAttribute("aria-hidden", "true");
  section.append(watermark);
  const institution = document.createElement("header");
  institution.className = "result-institution-heading merit-institution-heading";
  const institutionName = document.createElement("h1");
  institutionName.textContent = "তাবিউল মুরসালীন নগর কারিগরি স্কুল এন্ড কলেজ";
  const institutionAddress = document.createElement("p");
  institutionAddress.textContent = "টেঙ্গুরী, কেন্দুয়া, নেত্রকোণা · EIIN No. 136065";
  institution.append(institutionName, institutionAddress);
  section.append(institution);
  const title = document.createElement("h2");
  title.textContent = `মেধাতালিকা — ${sorted[0].className} · ${number(sorted[0].year)} · ${sorted[0].exam}`;
  section.append(title);
  const table = document.createElement("table");
  table.className = "merit-table";
  const display = sorted[0].meritDisplayFields || {};
  const columns = [
    { key: "rank", label: "মেধাক্রম" },
    { key: "name", label: "শিক্ষার্থীর নাম" },
    { key: "studentId", label: "শিক্ষার্থী আইডি" },
    { key: "boardRoll", label: "বোর্ড রোল" },
    { key: "classRoll", label: "ক্লাস রোল" },
    { key: "trade", label: "ট্রেড" },
    { key: "marks", label: "প্রাপ্ত নম্বর" },
    { key: "percentage", label: "শতকরা" },
    { key: "failSubjectCount", label: "ফেল বিষয় সংখ্যা" },
    { key: "absentSubjectCount", label: "অনুপস্থিত বিষয় সংখ্যা" }
  ].filter((column) => display[column.key] !== false);
  const head = table.createTHead().insertRow();
  columns.forEach((column) => {
    const cell = addCell(head, "th", column.label);
    cell.dataset.column = column.key;
  });
  const body = table.createTBody();
  let rank = 0;
  let previousMarks = null;
  sorted.forEach((student, index) => {
    const marks = Number(student.totalMarks || 0);
    if (marks !== previousMarks) rank = index + 1;
    previousMarks = marks;
    const row = body.insertRow();
    const subjects = student.subjects || [];
    const hasPassMarks = subjects.some((subject) =>
      (Number(subject.theoryFullMarks) > 0 && (subject.theoryPassMarks ?? subject.passMarks) != null && (subject.theoryPassMarks ?? subject.passMarks) !== "")
      || (Number(subject.practicalFullMarks) > 0 && subject.practicalPassMarks != null && subject.practicalPassMarks !== "")
    );
    const failedSubjectCount = student.absent === true ? 0 : subjects.filter((subject) => {
      if (subject.absent === true) return false;
      const theoryPass = subject.theoryPassMarks ?? subject.passMarks;
      const practicalPass = subject.practicalPassMarks;
      return (Number(subject.theoryFullMarks) > 0 && theoryPass != null && theoryPass !== "" && Number(subject.theoryMarks || 0) < Number(theoryPass))
        || (Number(subject.practicalFullMarks) > 0 && practicalPass != null && practicalPass !== "" && Number(subject.practicalMarks || 0) < Number(practicalPass));
    }).length;
    const absentSubjectCount = student.absent === true
      ? subjects.length
      : subjects.filter((subject) => subject.absent === true).length;
    const values = {
      rank: number(rank),
      name: student.studentName || "—",
      studentId: student.studentCode || "—",
      boardRoll: student.boardRoll || "—",
      classRoll: student.roll || "—",
      trade: student.trade || "—",
      marks: `${number(marks)} / ${number(student.fullMarks)}`,
      percentage: `${number(student.percentage)}%`,
      failSubjectCount: hasPassMarks ? number(failedSubjectCount) : "পাশ নম্বর দেওয়া নেই",
      absentSubjectCount: number(absentSubjectCount)
    };
    columns.forEach((column) => {
      const cell = addCell(row, "td", values[column.key]);
      cell.dataset.column = column.key;
    });
  });
  section.append(table);
  const printButton = document.createElement("button");
  printButton.type = "button";
  printButton.className = "merit-print-button";
  printButton.textContent = "মেধাতালিকা প্রিন্ট করুন";
  printButton.addEventListener("click", () => {
    document.body.classList.add("print-merit");
    window.print();
  });
  section.append(printButton);
  meritResults.replaceChildren(section);
}

if (meritForm) {
const yearSelect = document.getElementById("meritYear");
for (let year = new Date().getFullYear(); year >= 2020; year--) {
  const option = document.createElement("option");
  option.value = String(year);
  option.textContent = number(year);
  yearSelect.append(option);
}

meritForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  meritStatus.hidden = false;
  meritStatus.textContent = "মেধাতালিকা খোঁজা হচ্ছে...";
  meritResults.replaceChildren();
  try {
    const all = await loadPublishedResults();
    const matches = all.filter((result) => result.className === document.getElementById("meritClass").value
      && Number(result.year) === Number(yearSelect.value)
      && result.exam === document.getElementById("meritExam").value);
    if (!matches.length) {
      meritStatus.textContent = "নির্বাচিত শ্রেণি, সাল ও পরীক্ষার কোনো প্রকাশিত ফলাফল পাওয়া যায়নি।";
      return;
    }
    meritStatus.hidden = true;
    renderMeritList(matches);
  } catch (error) {
    console.error("মেধাতালিকা খোঁজার সমস্যা:", error);
    meritStatus.textContent = "মেধাতালিকা লোড করা যায়নি। Firestore access rules পরীক্ষা করুন।";
  }
});

}

window.addEventListener("afterprint", () => {
  document.body.classList.remove("print-single-result", "print-merit");
  document.querySelectorAll(".public-result-card").forEach((item) => item.classList.remove("print-target"));
});

if (form) form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const selectedYear = Number(resultYearSelect?.value || 0);
  const className = resultClassSelect?.value || "";
  const selectedStudentKey = resultRollSelect?.value || "";
  if (!selectedYear || !className || !selectedStudentKey) {
    status.textContent = "সাল, শ্রেণি ও শিক্ষার্থী নির্বাচন করুন।";
    status.hidden = false;
    return;
  }
  form.querySelector("button").disabled = true;
  status.hidden = false;
  status.textContent = "ফলাফল খোঁজা হচ্ছে...";
  resultList.replaceChildren();

  try {
    const allResults = await loadPublishedResults();
    const selectedByCode = selectedStudentKey.startsWith("code:");
    const selectedIdentity = selectedStudentKey.slice(selectedStudentKey.indexOf(":") + 1);
    const matches = allResults
      .filter((result) => (selectedByCode
        ? result.studentCode === selectedIdentity
        : String(result.studentName || "").trim().toLocaleLowerCase("bn-BD") === selectedIdentity)
        && result.className === className
        && Number(result.year) === selectedYear)
      .sort((a, b) => (b.year || 0) - (a.year || 0) || (a.exam || "").localeCompare(b.exam || "", "bn"));

    if (!matches.length) {
      status.textContent = "নির্বাচিত সাল, শ্রেণি ও রোলের কোনো প্রকাশিত ফলাফল পাওয়া যায়নি।";
      return;
    }

    status.textContent = `${number(matches.length)}টি ফলাফল পাওয়া গেছে।`;
    matches.forEach((result) => {
      const cohort = allResults.filter((candidate) => candidate.className === result.className
        && Number(candidate.year) === Number(result.year)
        && candidate.exam === result.exam);
      const higherScores = cohort.filter((candidate) => Number(candidate.totalMarks || 0) > Number(result.totalMarks || 0)).length;
      resultList.append(renderResult(result, higherScores + 1));
    });
  } catch (error) {
    console.error("ফলাফল খোঁজার সমস্যা:", error);
    status.textContent = "ফলাফল খোঁজা যায়নি। Firestore access rules পরীক্ষা করুন।";
  } finally {
    form.querySelector("button").disabled = false;
  }
});

if (resultYearSelect && resultClassSelect && resultRollSelect) {
  const populateResultRolls = async () => {
    const year = Number(resultYearSelect.value || 0);
    const className = resultClassSelect.value;
    const canLoad = Boolean(year && className);
    resultRollSelect.replaceChildren(new Option(canLoad ? "শিক্ষার্থী বা রোল নির্বাচন করুন" : "আগে সাল ও শ্রেণি নির্বাচন করুন", ""));
    resultRollSelect.disabled = !canLoad;
    if (!canLoad) return;
    try {
      const [allResults, allStudents] = await Promise.all([loadPublishedResults(), loadPublishedStudents()]);
      const yearStudents = allStudents.filter((student) => {
        const studentYear = Number(student.academicYear || student.session || 0);
        return student.className === className && (!studentYear || studentYear === year);
      });
      const classResults = allResults.filter((result) => Number(result.year) === year && result.className === className);
      const studentsByKey = new Map();
      yearStudents.forEach((student) => {
        const normalized = { ...student, studentName: student.name || student.studentName || "" };
        studentsByKey.set(resultStudentKey(normalized), normalized);
      });
      classResults.forEach((result) => {
        const key = resultStudentKey(result);
        if (!key.endsWith(":")) studentsByKey.set(key, { ...studentsByKey.get(key), ...result });
      });
      [...studentsByKey.values()]
        .sort((a, b) => {
          const aHasRoll = a.roll != null && String(a.roll).trim() !== "";
          const bHasRoll = b.roll != null && String(b.roll).trim() !== "";
          if (aHasRoll !== bHasRoll) return aHasRoll ? -1 : 1;
          if (aHasRoll) {
            const rollOrder = Number(a.roll) - Number(b.roll);
            if (Number.isFinite(rollOrder) && rollOrder !== 0) return rollOrder;
          }
          return String(a.studentName || "").localeCompare(String(b.studentName || ""), "bn");
        })
        .forEach((student) => {
          const studentName = student.studentName || student.name || student.studentCode;
          const roll = student.roll != null && String(student.roll).trim() !== "" ? `${student.roll} · ` : "রোল নেই · ";
          const option = new Option(`${roll}${studentName}`, resultStudentKey(student));
          resultRollSelect.append(option);
        });
      if (!studentsByKey.size) resultRollSelect.replaceChildren(new Option("এই সাল ও শ্রেণির শিক্ষার্থী পাওয়া যায়নি", ""));
    } catch (error) {
      console.error("রোল তালিকা লোড হয়নি:", error);
      resultRollSelect.replaceChildren(new Option("রোল তালিকা লোড করা যায়নি", ""));
    }
  };
  resultYearSelect.addEventListener("change", populateResultRolls);
  resultClassSelect.addEventListener("change", populateResultRolls);
}

async function initializePublicResults() {
  if (resultsInitialized) return;
  resultsInitialized = true;
  try {
    const results = await loadPublishedResults();
    const years = [...new Set(results.map((result) => Number(result.year)).filter(Boolean))].sort((a, b) => b - a);
    years.forEach((year) => resultYearSelect.add(new Option(yearNumber(year), String(year))));
    if (!years.length) resultYearSelect.add(new Option("প্রকাশিত ফল নেই", ""));

    const examSelect = document.getElementById("meritExam");
    [...new Set(results.map((result) => result.exam).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b, "bn"))
      .forEach((exam) => examSelect.add(new Option(exam, exam)));
  } catch (error) {
    console.error("প্রকাশিত ফলাফলের তালিকা লোড হয়নি:", error);
    status.textContent = "ফলাফলের তথ্য লোড করা যায়নি। Firestore access rules পরীক্ষা করুন।";
    status.hidden = false;
  }
}

function unlockPublicResults() {
  resultAccessGate.hidden = true;
  publicResultsProtected.hidden = false;
  initializePublicResults();
}

resultAccessForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (resultAccessPassword.value.trim() !== RESULT_PAGE_PASSWORD) {
    resultAccessMessage.textContent = "পাসওয়ার্ড সঠিক নয়। আবার চেষ্টা করুন।";
    resultAccessPassword.value = "";
    resultAccessPassword.focus();
    return;
  }
  sessionStorage.setItem(RESULT_UNLOCK_KEY, "true");
  unlockPublicResults();
});

if (sessionStorage.getItem(RESULT_UNLOCK_KEY) === "true") unlockPublicResults();
