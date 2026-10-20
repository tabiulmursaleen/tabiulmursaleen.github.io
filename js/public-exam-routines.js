import { collection, doc, getDoc, getDocs, query, where } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";
import { db } from "./firebase-config.js";

const listView = document.getElementById("examRoutineListView");
const list = document.getElementById("examRoutinePublicList");
const detail = document.getElementById("examRoutineDetailView");
const params = new URLSearchParams(location.search);
const selectedId = params.get("id");

function timestamp(value) {
  return value?.toMillis?.() || (value?.seconds ? value.seconds * 1000 : 0) || 0;
}

function addText(parent, tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  node.textContent = text;
  parent.append(node);
  return node;
}

function formatExamDate(value) {
  if (!value) return "—";
  const [year, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("bn-BD", { day: "numeric", month: "long", year: "numeric" })
    .format(new Date(year, month - 1, day));
}

function formatStartTime(value) {
  if (!value) return "—";
  const [hour, minute] = value.split(":").map(Number);
  return new Intl.DateTimeFormat("bn-BD", { hour: "numeric", minute: "2-digit", hour12: true })
    .format(new Date(2000, 0, 1, hour, minute));
}

function showListMessage(text) {
  const box = document.createElement("div");
  box.className = "public-routine-status";
  box.textContent = text;
  list.replaceChildren(box);
}

function renderList(items) {
  list.replaceChildren();
  if (!items.length) { showListMessage("এখনো কোনো পরীক্ষার রুটিন প্রকাশ করা হয়নি।"); return; }
  items.sort((a, b) => timestamp(b.publishedAt || b.updatedAt || b.createdAt) - timestamp(a.publishedAt || a.updatedAt || a.createdAt));
  items.forEach((routine, index) => {
    const link = document.createElement("a");
    link.className = "exam-routine-public-item";
    link.href = `exam-routine.html?id=${encodeURIComponent(routine.id)}`;
    const head = document.createElement("div");
    head.className = "exam-routine-public-heading";
    addText(head, "span", "exam-routine-class", routine.className || "শ্রেণি উল্লেখ নেই");
    if (index === 0) addText(head, "span", "exam-routine-latest", "সর্বশেষ প্রকাশিত");
    link.append(head);
    addText(link, "h2", "", routine.examName || "পরীক্ষার রুটিন");
    const dates = (routine.subjects || []).map((item) => item.date).filter(Boolean).sort();
    const dateSummary = dates.length ? `${formatExamDate(dates[0])}${dates.length > 1 ? ` — ${formatExamDate(dates.at(-1))}` : ""}` : "তারিখ নির্ধারিত হয়নি";
    addText(link, "p", "exam-routine-summary", `শুরু: ${formatStartTime(routine.startTime)} · ${dateSummary}`);
    addText(link, "span", "exam-routine-open", "রুটিন দেখুন →");
    list.append(link);
  });
}

function renderDetail(routine) {
  detail.replaceChildren();
  const cardHeader = document.createElement("header");
  cardHeader.className = "routine-card-header exam-routine-card-header";
  const headingGroup = document.createElement("div");
  addText(headingGroup, "p", "exam-institution-name", "তাবিউল মুরসালীন নগর কারিগরি স্কুল এন্ড কলেজ");
  addText(headingGroup, "p", "exam-institution-address", "টেঙ্গুরী, কেন্দুয়া, নেত্রকোণা");
  addText(headingGroup, "p", "exam-institution-eiin", "EIIN No. 136065");
  addText(headingGroup, "h2", "", `${routine.className || ""} শ্রেণি — ${routine.examName || "পরীক্ষার রুটিন"}`);
  addText(headingGroup, "p", "exam-routine-start", `পরীক্ষা শুরু: ${formatStartTime(routine.startTime)}`);
  cardHeader.append(headingGroup);
  detail.append(cardHeader);

  const wrap = document.createElement("div");
  wrap.className = "published-routine-table-wrap exam-routine-table-wrap";
  const table = document.createElement("table");
  table.className = "published-routine-table exam-routine-table";
  const thead = table.createTHead();
  const headerRow = thead.insertRow();
  ["তারিখ", "বার", "বিষয়ের নাম", "বিষয় কোড"].forEach((text) => addText(headerRow, "th", "", text));
  const body = table.createTBody();
  (routine.subjects || []).slice().sort((a, b) => String(a.date).localeCompare(String(b.date))).forEach((item, index) => {
    const row = body.insertRow();
    row.dataset.dayIndex = String(index % 5);
    addText(row, "td", "exam-date-cell", formatExamDate(item.date));
    addText(row, "td", "exam-weekday-cell", item.day || "—");
    addText(row, "td", "exam-subject-cell", item.subject || "—");
    addText(row, "td", "exam-code-cell", item.subjectCode || "—");
  });
  wrap.append(table);
  detail.append(wrap);

  const signature = document.createElement("div");
  signature.className = "routine-signature";
  signature.setAttribute("aria-label", "প্রতিষ্ঠান প্রধানের স্বাক্ষর ও সিলের স্থান");
  const signatureBlock = document.createElement("div");
  signatureBlock.className = "routine-signature-block";
  addText(signatureBlock, "div", "routine-signature-line", "প্রতিষ্ঠান প্রধান\nস্বাক্ষর ও সিল");
  signature.append(signatureBlock);
  detail.append(signature);

  const actions = document.createElement("div");
  actions.className = "exam-routine-actions routine-print-actions";
  const back = document.createElement("a");
  back.className = "back-to-list";
  back.href = "exam-routine.html";
  back.textContent = "← সকল পরীক্ষার রুটিন";
  actions.append(back);
  const print = document.createElement("button");
  print.className = "routine-print-button";
  print.type = "button";
  print.textContent = "🖨 প্রিন্ট / PDF ডাউনলোড";
  print.addEventListener("click", () => window.print());
  actions.append(print);
  detail.append(actions);
  detail.hidden = false;
  listView.hidden = true;
  document.title = `${routine.examName || "পরীক্ষার রুটিন"} | তাবিউল মুরসালীন নগর কারিগরি স্কুল এন্ড কলেজ`;
}

async function loadList() {
  try {
    const snapshot = await getDocs(query(collection(db, "examRoutines"), where("published", "==", true)));
    renderList(snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() })));
  } catch (error) {
    console.error("পরীক্ষার রুটিন লোড করা যায়নি:", error);
    showListMessage("পরীক্ষার রুটিন লোড করা যায়নি। পরে আবার চেষ্টা করুন।");
  }
}

async function loadDetail(id) {
  listView.hidden = true;
  detail.hidden = false;
  detail.replaceChildren();
  addText(detail, "p", "public-routine-status", "পরীক্ষার রুটিন লোড হচ্ছে...");
  try {
    const snapshot = await getDoc(doc(db, "examRoutines", id));
    if (!snapshot.exists() || snapshot.data().published !== true) throw new Error("not-published");
    renderDetail({ id: snapshot.id, ...snapshot.data() });
  } catch (error) {
    console.error("পরীক্ষার রুটিন খোলা যায়নি:", error);
    detail.replaceChildren();
    addText(detail, "p", "public-routine-status", "এই পরীক্ষার রুটিনটি পাওয়া যায়নি বা প্রকাশিত নয়।");
    const back = document.createElement("a"); back.className = "back-to-list"; back.href = "exam-routine.html"; back.textContent = "← পরীক্ষার রুটিন তালিকায় ফিরুন"; detail.append(back);
  }
}

if (selectedId) loadDetail(selectedId);
else loadList();
