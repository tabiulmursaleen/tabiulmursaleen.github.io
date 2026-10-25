import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";
import { db } from "./firebase-config.js";

const classSelect = document.getElementById("textbookClass");
const tradeSelect = document.getElementById("textbookTrade");
const list = document.getElementById("textbookList");
const listTitle = document.getElementById("textbookListTitle");
const count = document.getElementById("textbookCount");
const frame = document.getElementById("textbookPdfFrame");
const placeholder = document.getElementById("textbookViewerPlaceholder");
const viewerTitle = document.getElementById("textbookViewerTitle");
const openBook = document.getElementById("textbookOpenBook");
const downloadBook = document.getElementById("textbookDownloadBook");
const downloadWrap = document.getElementById("textbookDownloadWrap");
let books = [];

const gradeLabels = { "09": "নবম", "10": "দশম", "11": "একাদশ", "12": "দ্বাদশ" };

function safePdfUrl(value) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return "";
    if (url.hostname === "drive.google.com") {
      const fileId = url.pathname.match(/\/file\/d\/([^/]+)/)?.[1] || url.searchParams.get("id");
      if (fileId) return `https://drive.google.com/file/d/${encodeURIComponent(fileId)}/preview`;
    }
    return url.href;
  } catch {
    return "";
  }
}

function directDownloadUrl(value) {
  try {
    const url = new URL(value);
    if (url.hostname === "drive.google.com") {
      const fileId = url.pathname.match(/\/file\/d\/([^/]+)/)?.[1] || url.searchParams.get("id");
      if (fileId) return `https://drive.google.com/uc?export=download&id=${encodeURIComponent(fileId)}`;
    }
    return url.href;
  } catch {
    return "";
  }
}

function closeViewer() {
  frame.removeAttribute("src");
  frame.hidden = true;
  placeholder.hidden = true;
  openBook.hidden = true;
  downloadBook.hidden = true;
  downloadWrap.hidden = true;
  viewerTitle.textContent = "নির্বাচিত পাঠ্যবই";
}

function showBook(book) {
  const pdfUrl = safePdfUrl(book.pdfUrl);
  if (!pdfUrl) return;
  viewerTitle.textContent = `নির্বাচিত পাঠ্যবই ${book.bookTitle || book.subjectName}`;
  frame.src = pdfUrl;
  frame.hidden = false;
  placeholder.hidden = true;
  openBook.href = pdfUrl;
  openBook.hidden = false;
  downloadBook.href = directDownloadUrl(book.pdfUrl);
  downloadBook.hidden = !downloadBook.href;
  downloadWrap.hidden = !downloadBook.href;
  downloadBook.setAttribute("download", "");
  document.querySelector(".textbook-viewer-panel")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderBooks() {
  closeViewer();
  const classCode = classSelect.value;
  if (!classCode) {
    tradeSelect.disabled = true;
    listTitle.textContent = "শ্রেণি নির্বাচন করুন";
    count.textContent = "";
    list.innerHTML = '<p class="textbook-empty">বই দেখতে আগে শ্রেণি নির্বাচন করুন।</p>';
    return;
  }

  tradeSelect.disabled = false;
  const trade = tradeSelect.value;
  const visibleBooks = books
    .filter((book) => book.classCode === classCode && safePdfUrl(book.pdfUrl))
    .filter((book) => !trade || book.trade === trade)
    .sort((a, b) => Number(a.subjectIndex || 0) - Number(b.subjectIndex || 0));

  listTitle.textContent = `${gradeLabels[classCode]} শ্রেণির ${trade ? `${trade} ট্রেডের ` : ""}বই`;
  count.textContent = `${visibleBooks.length}টি বই`;

  if (!visibleBooks.length) {
    list.innerHTML = `<p class="textbook-empty">${trade ? "এই ট্রেডের বই এখনো প্রকাশ করা হয়নি।" : "এই শ্রেণির বই এখনো প্রকাশ করা হয়নি।"}</p>`;
    return;
  }

  list.replaceChildren();
  visibleBooks.forEach((book) => {
    const item = document.createElement("article");
    item.className = "textbook-item";

    const details = document.createElement("div");
    const title = document.createElement("h3");
    title.textContent = book.bookTitle || book.subjectName || "পাঠ্যবই";
    const subject = document.createElement("span");
    subject.className = "textbook-code";
    subject.textContent = `${book.subjectName || ""}${book.subjectCode ? ` · বিষয় কোড: ${book.subjectCode}` : ""}`;
    details.append(title, subject);

    const button = document.createElement("button");
    button.className = "textbook-show";
    button.type = "button";
    button.textContent = "বই দেখুন";
    button.addEventListener("click", () => showBook(book));
    item.append(details, button);
    list.append(item);
  });
}

classSelect.addEventListener("change", () => {
  tradeSelect.value = "";
  renderBooks();
});
tradeSelect.addEventListener("change", renderBooks);

async function loadBooks() {
  try {
    const snapshot = await getDocs(query(collection(db, "textbooks"), where("published", "==", true)));
    books = snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() }));
    renderBooks();
  } catch (error) {
    console.error("পাঠ্যবই লোড হয়নি:", error);
    list.innerHTML = '<p class="textbook-empty">বইয়ের তথ্য লোড হয়নি। পরে আবার চেষ্টা করুন।</p>';
  }
}

closeViewer();
loadBooks();
