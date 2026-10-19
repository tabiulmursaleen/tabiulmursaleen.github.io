import {
  collection,
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

import { db } from "./firebase-config.js";

const form = document.getElementById("publicResultSearch");
const codeInput = document.getElementById("publicStudentCode");
const status = document.getElementById("publicResultStatus");
const resultList = document.getElementById("publicResultList");
const number = (value) => new Intl.NumberFormat("bn-BD", { maximumFractionDigits: 2 }).format(value || 0);

function addCell(row, tag, text) {
  const cell = document.createElement(tag);
  cell.textContent = text == null ? "—" : String(text);
  row.append(cell);
  return cell;
}

function renderResult(result) {
  const card = document.createElement("article");
  card.className = "public-result-card";
  const heading = document.createElement("h2");
  heading.textContent = `${result.exam || "পরীক্ষার ফলাফল"} — ${number(result.year)}`;
  card.append(heading);

  const metadata = document.createElement("p");
  metadata.className = "public-result-meta";
  metadata.textContent = `${result.studentName || ""} · আইডি: ${result.studentCode || ""}${result.className ? ` · ${result.className}` : ""}${result.roll ? ` · রোল: ${result.roll}` : ""}`;
  card.append(metadata);

  const table = document.createElement("table");
  table.className = "public-result-table";
  const thead = table.createTHead();
  const header = thead.insertRow();
  ["বিষয়", "পূর্ণমান", "প্রাপ্ত নম্বর"].forEach((title) => addCell(header, "th", title));
  const tbody = table.createTBody();
  for (const subject of result.subjects || []) {
    const row = tbody.insertRow();
    addCell(row, "td", subject.name);
    addCell(row, "td", number(subject.fullMarks));
    addCell(row, "td", number(subject.marks));
  }
  card.append(table);

  const total = document.createElement("p");
  total.className = "public-result-total";
  total.textContent = `মোট: ${number(result.totalMarks)} / ${number(result.fullMarks)} · শতকরা: ${number(result.percentage)}%`;
  card.append(total);
  return card;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const studentCode = codeInput.value.trim();
  if (!studentCode) return;
  form.querySelector("button").disabled = true;
  status.hidden = false;
  status.textContent = "ফলাফল খোঁজা হচ্ছে...";
  resultList.replaceChildren();

  try {
    const snapshot = await getDocs(query(
      collection(db, "publicStudentResults"),
      where("published", "==", true)
    ));
    const matches = snapshot.docs
      .map((item) => item.data())
      .filter((result) => result.studentCode === studentCode)
      .sort((a, b) => (b.year || 0) - (a.year || 0) || (a.exam || "").localeCompare(b.exam || "", "bn"));

    if (!matches.length) {
      status.textContent = "এই আইডির কোনো প্রকাশিত ফলাফল পাওয়া যায়নি।";
      return;
    }

    status.textContent = `${number(matches.length)}টি ফলাফল পাওয়া গেছে।`;
    matches.forEach((result) => resultList.append(renderResult(result)));
  } catch (error) {
    console.error("ফলাফল খোঁজার সমস্যা:", error);
    status.textContent = "ফলাফল খোঁজা যায়নি। Firestore access rules পরীক্ষা করুন।";
  } finally {
    form.querySelector("button").disabled = false;
  }
});
