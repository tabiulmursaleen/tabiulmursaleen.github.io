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
let publishedResultsPromise;

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

function addCell(row, tag, text) {
  const cell = document.createElement(tag);
  cell.textContent = text == null ? "—" : String(text);
  row.append(cell);
  return cell;
}

function renderResult(result, rank) {
  const card = document.createElement("article");
  card.className = "public-result-card";
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
  const identityParts = [
    ["আইডি", result.studentCode],
    ["শ্রেণি", result.className],
    ["রোল", result.roll]
  ].filter(([, value]) => value != null && value !== "");
  identityParts.forEach(([label, value]) => {
    const item = document.createElement("span");
    item.textContent = `${label}: ${value}`;
    metadata.append(item);
  });
  card.append(studentName, metadata);

  const rankBadge = document.createElement("p");
  rankBadge.className = "result-merit-rank";
  const rankSuffix = ({ 1: "ম", 2: "য়", 3: "য়", 4: "র্থ" })[rank] || "তম";
  rankBadge.textContent = `🏅 মেধাতালিকায় ${number(rank)}${rankSuffix} স্থান`;
  card.append(rankBadge);

  const table = document.createElement("table");
  table.className = "public-result-table";
  const thead = table.createTHead();
  const header = thead.insertRow();
  const showPractical = result.showPractical === true;
  (showPractical
    ? ["বিষয়", "বিষয় কোড", "তাত্ত্বিক পূর্ণমান", "তাত্ত্বিক নম্বর", "ব্যবহারিক পূর্ণমান", "ব্যবহারিক নম্বর", "মোট পূর্ণমান", "মোট নম্বর"]
    : ["বিষয়", "বিষয় কোড", "পূর্ণমান", "প্রাপ্ত নম্বর"]
  ).forEach((title) => addCell(header, "th", title));
  const tbody = table.createTBody();
  for (const subject of result.subjects || []) {
    const row = tbody.insertRow();
    addCell(row, "td", subject.name);
    addCell(row, "td", subject.code);
    if (showPractical) {
      addCell(row, "td", number(subject.theoryFullMarks));
      addCell(row, "td", number(subject.theoryMarks));
      addCell(row, "td", number(subject.practicalFullMarks));
      addCell(row, "td", number(subject.practicalMarks));
      addCell(row, "td", number(subject.fullMarks));
      addCell(row, "td", number(subject.marks));
    } else {
      addCell(row, "td", number(subject.fullMarks));
      addCell(row, "td", number(subject.marks));
    }
  }
  card.append(table);

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
  const title = document.createElement("h2");
  title.textContent = `মেধাতালিকা — ${sorted[0].className} · ${number(sorted[0].year)} · ${sorted[0].exam}`;
  section.append(title);
  const table = document.createElement("table");
  table.className = "merit-table";
  const head = table.createTHead().insertRow();
  ["মেধাক্রম", "শিক্ষার্থীর নাম", "শিক্ষার্থী আইডি", "রোল", "প্রাপ্ত নম্বর", "শতকরা"].forEach((label) => addCell(head, "th", label));
  const body = table.createTBody();
  let rank = 0;
  let previousMarks = null;
  sorted.forEach((student, index) => {
    const marks = Number(student.totalMarks || 0);
    if (marks !== previousMarks) rank = index + 1;
    previousMarks = marks;
    const row = body.insertRow();
    addCell(row, "td", number(rank));
    addCell(row, "td", student.studentName || "—");
    addCell(row, "td", student.studentCode || "—");
    addCell(row, "td", student.roll || "—");
    addCell(row, "td", `${number(marks)} / ${number(student.fullMarks)}`);
    addCell(row, "td", `${number(student.percentage)}%`);
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

loadPublishedResults().then((results) => {
  const examSelect = document.getElementById("meritExam");
  [...new Set(results.map((result) => result.exam).filter(Boolean))].sort((a, b) => a.localeCompare(b, "bn")).forEach((exam) => {
    const option = document.createElement("option");
    option.value = exam;
    option.textContent = exam;
    examSelect.append(option);
  });
}).catch((error) => console.error("প্রকাশিত পরীক্ষার তালিকা লোড হয়নি:", error));
}

window.addEventListener("afterprint", () => {
  document.body.classList.remove("print-single-result", "print-merit");
  document.querySelectorAll(".public-result-card").forEach((item) => item.classList.remove("print-target"));
});

if (form) form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const selectedYear = Number(resultYearSelect?.value || 0);
  const className = resultClassSelect?.value || "";
  const selectedStudentCode = resultRollSelect?.value || "";
  if (!selectedYear || !className || !selectedStudentCode) {
    status.textContent = "সাল, শ্রেণি ও রোল নির্বাচন করুন।";
    status.hidden = false;
    return;
  }
  form.querySelector("button").disabled = true;
  status.hidden = false;
  status.textContent = "ফলাফল খোঁজা হচ্ছে...";
  resultList.replaceChildren();

  try {
    const allResults = await loadPublishedResults();
    const matches = allResults
      .filter((result) => result.studentCode === selectedStudentCode
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
    resultRollSelect.replaceChildren(new Option(canLoad ? "রোল নির্বাচন করুন" : "আগে সাল ও শ্রেণি নির্বাচন করুন", ""));
    resultRollSelect.disabled = !canLoad;
    if (!canLoad) return;
    try {
      const classResults = (await loadPublishedResults()).filter((result) => Number(result.year) === year && result.className === className && result.roll != null && result.studentCode);
      const studentsByCode = new Map(classResults.map((result) => [result.studentCode, result]));
      [...studentsByCode.values()]
        .sort((a, b) => Number(a.roll) - Number(b.roll) || String(a.studentName || "").localeCompare(String(b.studentName || ""), "bn"))
        .forEach((student) => {
          const option = new Option(`${student.roll} · ${student.studentName || student.studentCode}`, student.studentCode);
          resultRollSelect.append(option);
        });
      if (!studentsByCode.size) resultRollSelect.replaceChildren(new Option("এই সাল ও শ্রেণির প্রকাশিত ফল নেই", ""));
    } catch (error) {
      console.error("রোল তালিকা লোড হয়নি:", error);
      resultRollSelect.replaceChildren(new Option("রোল তালিকা লোড করা যায়নি", ""));
    }
  };
  resultYearSelect.addEventListener("change", populateResultRolls);
  resultClassSelect.addEventListener("change", populateResultRolls);
  loadPublishedResults().then((results) => {
    const years = [...new Set(results.map((result) => Number(result.year)).filter(Boolean))].sort((a, b) => b - a);
    years.forEach((year) => resultYearSelect.add(new Option(yearNumber(year), String(year))));
    if (!years.length) resultYearSelect.add(new Option("প্রকাশিত ফল নেই", ""));
  }).catch((error) => console.error("প্রকাশিত শিক্ষাবর্ষ লোড হয়নি:", error));
}
