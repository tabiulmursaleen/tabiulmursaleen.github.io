import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import { collection, deleteDoc, doc, getDoc, getDocs, query, serverTimestamp, setDoc, where } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";
import { auth, db } from "./firebase-config.js";
import { getAcademicSubjects } from "./academic-subjects.js?v=20261022-subject-catalog2";

const ADMIN_UID = "wWuBEmlsaofgjAaQi7bfblsX6L62";
const collectionName = "questionPapers";
const $ = (id) => document.getElementById(id);
const form = $("questionPaperForm");
const rowsHost = $("questionRows");
const sectionHost = $("questionPaperSections");
let papers = [];
let sectionCounter = 0;
let busy = false;
const teacherPortal = document.body.dataset.teacherQuestionPortal === "true";
let signedInUser = null;
let signedInTeacher = null;

const bnDigits = (value) => String(value).replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[d]);
const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[c]);
const englishName = "Tabiul Mursaleen Nogor Karigori School & College";
const classOrdinal = (value, english) => english ? ({ "ষষ্ঠ":"Sixth", "সপ্তম":"Seventh", "অষ্টম":"Eighth", "নবম":"Ninth", "দশম":"Tenth", "একাদশ":"Eleventh", "দ্বাদশ":"Twelfth" }[value] || value) : `${value} শ্রেণি`;

function setMessage(text, error = false) {
  $("questionPaperMessage").textContent = text;
  $("questionPaperMessage").classList.toggle("is-error", error);
}

function fillSelect(select, values, placeholder) {
  select.replaceChildren(new Option(placeholder, ""));
  values.forEach((value) => select.add(new Option(value.label, value.value)));
}

function updateSubjects(selected = "") {
  const select = $("questionPaperSubject");
  const subjects = getAcademicSubjects($("questionPaperClass").value).map((subject) => ({ value: subject.name, label: `${subject.name} · ${subject.code || "কোড নেই"}` }));
  subjects.push({ value: "__custom__", label: "নিজে বিষয় লিখুন…" });
  fillSelect(select, subjects, "বিষয় নির্বাচন করুন");
  select.value = subjects.some((item) => item.value === selected) ? selected : selected ? "__custom__" : "";
  $("questionPaperCustomSubject").hidden = select.value !== "__custom__";
  $("questionPaperCustomSubject").value = select.value === "__custom__" ? selected : "";
  const match = getAcademicSubjects($("questionPaperClass").value).find((subject) => subject.name === select.value);
  if (match) $("questionPaperSubjectCode").value = match.code;
}

function subjectChanged() {
  const custom = $("questionPaperSubject").value === "__custom__";
  $("questionPaperCustomSubject").hidden = !custom;
  if (!custom) {
    const item = getAcademicSubjects($("questionPaperClass").value).find((subject) => subject.name === $("questionPaperSubject").value);
    $("questionPaperSubjectCode").value = item?.code || "";
  } else {
    $("questionPaperCustomSubject").focus();
    $("questionPaperSubjectCode").value = "";
  }
}

function selectedSubject() {
  return $("questionPaperSubject").value === "__custom__" ? $("questionPaperCustomSubject").value.trim() : $("questionPaperSubject").value;
}

function syncGeneralInstructionMode() {
  $("questionPaperGeneralStructured").hidden = !$("questionPaperGeneralModeStructured").checked;
  $("questionPaperGeneralCustom").hidden = !$("questionPaperGeneralModeCustom").checked;
  updateInstructionTotals();
}

function generalInstructionItems(instruction) {
  if (!instruction) return [];
  if (instruction.structured || instruction.custom) {
    return [
      instruction.structured && { ...instruction.structured, mode: "structured" },
      instruction.custom && { ...instruction.custom, mode: "custom" }
    ].filter(Boolean);
  }
  return [instruction];
}

function instructionMarks() {
  return [...sectionHost.querySelectorAll(".question-paper-instruction-section")]
    .reduce((sum, section) => sum + (Number(section.querySelector(".qp-section-count").value) || 0) * (Number(section.querySelector(".qp-section-each").value) || 0), 0);
}

function addInstructionSection(data = {}) {
  if (!data.id && instructionMarks() >= Number($("questionPaperMarks").value || $("questionPaperCustomMarks").value || 0)) {
    setMessage("পূর্ণমান শেষ হয়েছে; আর বিভাগীয় নির্দেশনা যোগ করা যাবে না।", true); return;
  }
  sectionCounter += 1;
  const section = document.createElement("fieldset");
  section.className = "question-paper-instruction-section";
  section.dataset.sectionId = data.id || `section-${crypto.randomUUID?.() || sectionCounter}`;
  const defaultName = $("questionPaperEnglish").checked ? `Section ${String.fromCharCode(64 + Math.min(sectionCounter, 26))}` : `${bengaliBranchLetters[sectionCounter - 1] || bnDigits(sectionCounter)} বিভাগ`;
  section.innerHTML = `<legend><input class="qp-section-name" aria-label="বিভাগের নাম" value="${esc(data.name || defaultName)}"><button type="button" class="qp-remove-section" title="বিভাগ বাদ দিন" aria-label="বিভাগ বাদ দিন">×</button></legend>
    <p class="qp-section-scope">এই বিভাগের নিয়ম শুধু নিচের প্রশ্নগুলোর জন্য</p>
    <div class="question-paper-instruction-fields">
      <label>${$("questionPaperEnglish").checked ? "Choose any" : "যে কোনো"}<input class="qp-section-count" type="number" min="1" value="${esc(data.count ?? 5)}">${$("questionPaperEnglish").checked ? "questions" : "টি প্রশ্নের উত্তর দাও"}</label>
      <label>${$("questionPaperEnglish").checked ? "Marks per question" : "প্রতি প্রশ্নের নম্বর"}<input class="qp-section-each" type="number" min="1" value="${esc(data.each ?? 10)}"></label>
      <output class="qp-section-total qp-instruction-product"></output>
    </div><div class="qp-section-question-list" data-section-id="${esc(section.dataset.sectionId)}"></div>`;
  section.querySelector(".qp-remove-section").addEventListener("click", () => { section.remove(); updateInstructionTotals(); });
  section.querySelectorAll("input").forEach((input) => input.addEventListener("input", updateInstructionTotals));
  sectionHost.append(section);
  refreshQuestionSectionOptions();
  updateInstructionTotals();
  if (!data.id) addQuestion({}, section.querySelector(".qp-section-question-list"));
}

function updateInstructionTotals() {
  const max = Number($("questionPaperMarks").value || $("questionPaperCustomMarks").value || 0);
  sectionHost.querySelectorAll(".question-paper-instruction-section").forEach((section) => {
    const count = Number(section.querySelector(".qp-section-count").value) || 0;
    const each = Number(section.querySelector(".qp-section-each").value) || 0;
    const total = count * each;
    const english = $("questionPaperEnglish").checked;
    section.querySelector(".qp-section-total").textContent = english ? `${count} × ${each} = ${total}` : `${bnDigits(count)} × ${bnDigits(each)} = ${bnDigits(total)}`;
    section.querySelector(".qp-section-each").max = max || "";
    section.querySelector(".qp-section-count").max = each ? Math.floor(max / each) : "";
  });
  const generalCount = Number($("questionPaperGeneralCount").value) || 0;
  const generalEach = Number($("questionPaperGeneralEach").value) || 0;
  $("questionPaperGeneralProduct").textContent = $("questionPaperEnglish").checked
    ? `${generalEach} × ${generalCount} = ${generalEach * generalCount}`
    : `${bnDigits(generalEach)} × ${bnDigits(generalCount)} = ${bnDigits(generalEach * generalCount)}`;
  $("questionPaperGeneralStructured").hidden = !$("questionPaperGeneralModeStructured").checked;
  $("questionPaperGeneralCustom").hidden = !$("questionPaperGeneralModeCustom").checked;
  $("addQuestionSection").disabled = max > 0 && instructionMarks() >= max;
}

const bengaliBranchLetters = ["ক", "খ", "গ", "ঘ", "ঙ", "চ", "ছ", "জ", "ঝ", "ঞ", "ট", "ঠ", "ড", "ঢ", "ণ", "ত", "থ", "দ", "ধ", "ন"];
const branchLabels = (english) => (english ? "abcdefghijklmnopqrst".split("") : bengaliBranchLetters).map((letter) => `(${letter})`);

function addBranch(host, label = "", data = {}) {
  const row = document.createElement("div"); row.className = "qp-branch-row";
  const options = branchLabels($("questionPaperEnglish").checked);
  const usedIndexes = [...host.querySelectorAll(".qp-branch-label")]
    .map((select) => options.indexOf(select.value)).filter((index) => index >= 0);
  const nextLabel = options[Math.min(usedIndexes.length ? Math.max(...usedIndexes) + 1 : 0, options.length - 1)];
  const selectedLabel = label || nextLabel;
  row.innerHTML = `<select class="qp-branch-label" aria-label="শাখা নম্বর">${options.map((item) => `<option value="${item}" ${item === selectedLabel ? "selected" : ""}>${item}</option>`).join("")}</select><input class="qp-branch-text" value="${esc(data.text || "")}" placeholder="শাখার প্রশ্ন লিখুন"><input class="qp-branch-mark" type="number" min="0" step="0.5" value="${esc(data.marks ?? "")}" placeholder="নম্বর"><button type="button" class="secondary-button qp-remove-branch" aria-label="শাখা মুছুন">×</button>`;
  row.querySelector(".qp-remove-branch").hidden = $("questionPaperCreative").checked;
  row.querySelector(".qp-remove-branch").addEventListener("click", () => row.remove()); host.append(row);
  row.querySelector(".qp-branch-mark").addEventListener("input", () => {
    const question = host.closest(".qp-question-row");
    const creativeRows = [...document.querySelectorAll(".qp-question-row")].filter((item) => !item.querySelector(".qp-stimulus-label").hidden);
    if (!question || creativeRows[0] !== question) return;
    const branchIndex = [...host.querySelectorAll(".qp-branch-row")].indexOf(row);
    const value = row.querySelector(".qp-branch-mark").value;
    creativeRows.slice(1).forEach((item) => {
      const target = item.querySelectorAll(".qp-branch-mark")[branchIndex];
      if (target) target.value = value;
    });
  });
}

function ensureCreativeBranches(questionRow) {
  const host = questionRow.querySelector(".qp-branches");
  const branchCount = 4;
  const defaultMarks = ["0.5", "1", "2", "3"];
  const existingCreative = [...document.querySelectorAll(".qp-question-row")]
    .find((item) => item !== questionRow && !item.querySelector(".qp-stimulus-label").hidden);
  const templateMarks = existingCreative
    ? [...existingCreative.querySelectorAll(".qp-branch-mark")].map((input) => input.value)
    : defaultMarks;
  const labels = branchLabels($("questionPaperEnglish").checked);
  while (host.querySelectorAll(".qp-branch-row").length < branchCount) {
    const index = host.querySelectorAll(".qp-branch-row").length;
    addBranch(host, labels[index], { marks: templateMarks[index] ?? defaultMarks[index] });
  }
  [...host.querySelectorAll(".qp-branch-mark")].slice(0, branchCount).forEach((input, index) => {
    if (!input.value) input.value = templateMarks[index] || defaultMarks[index];
  });
  questionRow.querySelector(".qp-question-branches-toggle").checked = true;
  questionRow.querySelector(".qp-question-branches-toggle").disabled = true;
  host.hidden = false;
  questionRow.querySelector(".qp-add-branch").hidden = true;
  host.querySelectorAll(".qp-remove-branch").forEach((button) => { button.hidden = true; });
}

function refreshQuestionSectionOptions() {
  // Questions are attached directly to their general or division card.
}

function addQuestion(data = {}, targetHost = rowsHost) {
  const number = document.querySelectorAll(".qp-question-row").length + 1;
  const creative = $("questionPaperCreative").checked;
  const row = document.createElement("article"); row.className = "qp-question-row";
  row.innerHTML = `<div class="qp-question-top"><strong>প্রশ্ন ${bnDigits(number)}.</strong><input class="qp-main-question" value="${esc(data.text || "")}" placeholder="প্রশ্ন লিখুন" aria-label="প্রশ্ন ${bnDigits(number)}" ${creative ? "hidden" : ""}><label class="question-paper-checkbox qp-branches-toggle-label" ${creative ? "hidden" : ""}><input class="qp-question-branches-toggle" type="checkbox" ${data.hasBranches ? "checked" : ""}> শাখা প্রশ্ন</label><button type="button" class="qp-confirm-question" title="প্রশ্ন নিশ্চিত করুন" aria-label="প্রশ্ন নিশ্চিত করুন">✓</button><button type="button" class="qp-add-question" title="প্রশ্ন যোগ করুন" aria-label="প্রশ্ন যোগ করুন">+</button><button type="button" class="qp-delete-question" title="প্রশ্ন মুছুন" aria-label="প্রশ্ন মুছুন">×</button></div>
    <div class="qp-question-body"><label class="qp-stimulus-label" ${creative ? "" : "hidden"}>উদ্দীপক অনুচ্ছেদ<textarea class="qp-stimulus" rows="3">${esc(data.stimulus || "")}</textarea></label><div class="qp-branches" ${data.hasBranches || creative ? "" : "hidden"}></div><button type="button" class="secondary-button qp-add-branch" ${data.hasBranches || creative ? "" : "hidden"}>+ শাখা যোগ করুন</button></div>`;
  const toggle = row.querySelector(".qp-question-branches-toggle");
  toggle.addEventListener("change", () => { row.querySelector(".qp-branches").hidden = !toggle.checked; row.querySelector(".qp-add-branch").hidden = !toggle.checked; });
  row.querySelector(".qp-add-branch").addEventListener("click", () => addBranch(row.querySelector(".qp-branches")));
  row.querySelector(".qp-confirm-question").addEventListener("click", (event) => { const done = event.currentTarget.classList.toggle("is-confirmed"); event.currentTarget.textContent = done ? "✓" : "✓"; row.classList.toggle("is-confirmed", done); });
  row.querySelector(".qp-delete-question").addEventListener("click", () => { row.remove(); renumberQuestions(); });
  if (data.branches?.length) data.branches.forEach((branch, index) => addBranch(row.querySelector(".qp-branches"), branch.label || branchLabels($("questionPaperEnglish").checked)[index], branch));
  if (creative) ensureCreativeBranches(row);
  row.querySelector(".qp-add-question").addEventListener("click", () => { addQuestion({}, targetHost); targetHost.lastElementChild.scrollIntoView({ behavior: "smooth", block: "center" }); });
  targetHost.append(row); renumberQuestions();
}

function renumberQuestions() { document.querySelectorAll(".qp-question-row").forEach((row, index) => { row.querySelector(".qp-question-top strong").textContent = `প্রশ্ন ${bnDigits(index + 1)}.`; }); }

function collectPaper() {
  const marks = Number($("questionPaperMarks").value || $("questionPaperCustomMarks").value);
  const sections = [...sectionHost.querySelectorAll(".question-paper-instruction-section")].map((section) => ({
    id: section.dataset.sectionId, enabled: true, name: section.querySelector(".qp-section-name").value.trim(), count: Number(section.querySelector(".qp-section-count").value), each: Number(section.querySelector(".qp-section-each").value)
  }));
  const questions = [...document.querySelectorAll(".qp-question-row")].map((row) => ({
    sectionId: row.closest(".qp-section-question-list")?.dataset.sectionId || "all", stimulus: row.querySelector(".qp-stimulus")?.value.trim() || "", text: row.querySelector(".qp-main-question").value.trim(),
    hasBranches: row.querySelector(".qp-question-branches-toggle").checked,
    branches: [...row.querySelectorAll(".qp-branch-row")].map((branch) => ({ label: branch.querySelector(".qp-branch-label").value, text: branch.querySelector(".qp-branch-text").value.trim(), marks: Number(branch.querySelector(".qp-branch-mark").value) || 0 })), confirmed: row.classList.contains("is-confirmed")
  }));
  const generalInstruction = $("questionPaperGeneralInstructionEnabled").checked
    ? {
        ...( $("questionPaperGeneralModeStructured").checked ? { structured: { count: Number($("questionPaperGeneralCount").value), each: Number($("questionPaperGeneralEach").value) } } : {} ),
        ...( $("questionPaperGeneralModeCustom").checked ? { custom: { text: $("questionPaperGeneralCustomText").value.trim() } } : {} )
      }
    : null;
  return { institution: $("questionPaperInstitution").value.trim(), english: $("questionPaperEnglish").checked, creative: $("questionPaperCreative").checked, exam: $("questionPaperExam").value, year: Number($("questionPaperYear").value), className: $("questionPaperClass").value, subject: selectedSubject(), subjectCode: $("questionPaperSubjectCode").value.trim(), duration: $("questionPaperDuration").value, fullMarks: marks, generalInstruction, sections, questions, printFont: Number($("questionPrintFont").value), printPages: Number($("questionPrintPages").value), printColumns: Number($("questionPrintColumns").value) };
}

function validatePaper(paper) {
  if (!Number.isFinite(paper.fullMarks) || paper.fullMarks < 1) throw new Error("পূর্ণমান নির্বাচন বা লিখুন।");
  if (!paper.exam || !paper.year || !paper.className || !paper.duration) throw new Error("পরীক্ষা, সাল, শ্রেণি ও সময় নির্বাচন করুন।");
  if (!paper.subject) throw new Error("বিষয় নির্বাচন বা লিখুন।");
  if (!paper.questions.length || paper.questions.some((question) => (!paper.creative && !question.text) || !question.confirmed)) throw new Error("প্রতিটি প্রশ্ন লিখে ✓ চিহ্নে নিশ্চিত করুন।");
  if (paper.creative && paper.questions.some((question) => !question.stimulus || question.branches.length !== 4 || question.branches.some((branch) => !branch.text || !Number.isFinite(branch.marks) || branch.marks <= 0))) throw new Error("প্রতিটি সৃজনশীল প্রশ্নে উদ্দীপক, চারটি প্রশ্ন ও তাদের নম্বর পূরণ করুন।");
  const generalItems = generalInstructionItems(paper.generalInstruction);
  if (paper.generalInstruction && !generalItems.length) throw new Error("প্রধান নির্দেশনার অন্তত একটি ধরন নির্বাচন করুন।");
  if (generalItems.some((item) => item.mode === "custom" && !item.text)) throw new Error("নিজের প্রধান নির্দেশনা লিখুন।");
  if (generalItems.some((item) => item.mode === "structured" && (!item.count || !item.each || item.count * item.each > paper.fullMarks))) throw new Error("প্রধান নির্দেশনার প্রশ্নসংখ্যা ও নম্বর পূর্ণমানের মধ্যে রাখুন।");
  if (paper.sections.some((item) => item.enabled && (!item.count || !item.each))) throw new Error("প্রতিটি সক্রিয় বিভাগের প্রশ্নসংখ্যা ও নম্বর পূরণ করুন।");
  const directed = paper.sections.filter((item) => item.enabled).reduce((sum, item) => sum + item.count * item.each, 0);
  if (directed > paper.fullMarks) throw new Error("নির্দেশনায় নির্ধারিত মোট নম্বর পূর্ণমানের বেশি হতে পারবে না。");
}

function renderRows() {
  const host = $("questionPaperRows"); host.replaceChildren();
  if (!papers.length) { host.innerHTML = '<tr><td colspan="6">এখনো কোনো প্রশ্নপত্র সংরক্ষণ করা হয়নি।</td></tr>'; return; }
  [...papers].sort((a,b) => (b.updatedAt?.toMillis?.() || 0) - (a.updatedAt?.toMillis?.() || 0)).forEach((paper) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${esc(paper.exam)}</td><td>${esc(paper.className)}</td><td>${esc(paper.subject)}${paper.subjectCode ? ` · ${esc(paper.subjectCode)}` : ""}</td><td>${bnDigits(paper.year)}</td><td>${esc(paper.authorName || (paper.ownerUid ? "শিক্ষক" : "অ্যাডমিন"))}</td><td></td>`;
    const actions = tr.lastElementChild;
    const edit = document.createElement("button"); edit.type = "button"; edit.className = "table-action"; edit.textContent = "এডিট"; edit.addEventListener("click", () => loadPaper(paper));
    const print = document.createElement("button"); print.type = "button"; print.className = "table-action"; print.textContent = "প্রিন্ট"; print.addEventListener("click", () => { loadPaper(paper); setTimeout(printPaper, 0); });
    const remove = document.createElement("button"); remove.type = "button"; remove.className = "table-action danger-action"; remove.textContent = "মুছুন"; remove.addEventListener("click", async () => { if (!confirm("প্রশ্নপত্রটি মুছে ফেলবেন?")) return; await deleteDoc(doc(db, collectionName, paper.id)); papers = papers.filter((item) => item.id !== paper.id); renderRows(); });
    actions.append(edit, print, remove); host.append(tr);
  });
}

function loadPaper(paper) {
  $("questionPaperId").value = paper.id;
  $("questionPaperInstitution").value = paper.institution || "তাবিউল মুরসালীন নগর কারিগরি স্কুল এন্ড কলেজ";
  $("questionPaperEnglish").checked = !!paper.english; $("questionPaperCreative").checked = !!paper.creative;
  $("questionPaperExam").value = paper.exam || ""; $("questionPaperYear").value = String(paper.year || new Date().getFullYear());
  $("questionPaperClass").value = paper.className || ""; updateSubjects(paper.subject || ""); $("questionPaperSubjectCode").value = paper.subjectCode || "";
  $("questionPaperDuration").value = paper.duration || "1 ঘণ্টা";
  const standardMarks = [30,45,60,80,100].map(String).includes(String(paper.fullMarks));
  $("questionPaperMarks").value = standardMarks ? String(paper.fullMarks) : "__custom__";
  $("questionPaperCustomMarks").hidden = standardMarks; if (!standardMarks) $("questionPaperCustomMarks").value = paper.fullMarks || "";
  const general = paper.generalInstruction;
  const generalItems = generalInstructionItems(general);
  const structuredGeneral = generalItems.find((item) => item.mode === "structured");
  const customGeneral = generalItems.find((item) => item.mode === "custom");
  $("questionPaperGeneralInstructionEnabled").checked = !!general; $("questionPaperGeneralInstruction").hidden = !general;
  $("questionPaperGeneralModeCustom").checked = !!customGeneral;
  $("questionPaperGeneralModeStructured").checked = !!structuredGeneral || !customGeneral;
  $("questionPaperGeneralCustomText").value = customGeneral?.text || "";
  if (structuredGeneral) { $("questionPaperGeneralCount").value = structuredGeneral.count; $("questionPaperGeneralEach").value = structuredGeneral.each; }
  syncGeneralInstructionMode();
  sectionHost.replaceChildren(); sectionCounter = 0; (paper.sections || []).forEach((item) => addInstructionSection(item));
  rowsHost.replaceChildren(); sectionHost.querySelectorAll(".qp-section-question-list").forEach((host) => host.replaceChildren());
  (paper.questions || []).forEach((item) => { const target = item.sectionId && item.sectionId !== "all" ? sectionHost.querySelector(`.qp-section-question-list[data-section-id="${CSS.escape(item.sectionId)}"]`) : null; addQuestion(item, target || rowsHost); if (item.confirmed) (target || rowsHost).lastElementChild.classList.add("is-confirmed"); });
  $("questionPrintFont").value = Math.max(13, Math.min(22, paper.printFont || 16)); $("questionPrintFontValue").value = `${$("questionPrintFont").value}px`; $("questionPrintPages").value = String(paper.printPages ?? 2); $("questionPrintColumns").value = String(paper.printColumns || 1);
  form.scrollIntoView({ behavior: "smooth", block: "start" });
}

function instructionMarkup(item, english, label = "", kind = "") {
  const classes = `qp-print-instruction-block${kind ? ` ${kind}` : ""}`;
  if (item.mode === "custom") return `<div class="${classes}"><p class="qp-print-instruction-custom">${label ? "" : "{"}${esc(item.text)}${label ? "" : "}"}</p></div>`;
  const division = english ? label : item.name ? `${item.name.replace(/\s*বিভাগ$/, "")} বিভাগ` : label;
  const direction = english
    ? `Answer any ${item.count} questions. Each question carries ${item.each} marks.`
    : `যে কোনো ${bnDigits(item.count)} টি প্রশ্নের উত্তর দাও। প্রতি প্রশ্নের নম্বর ${bnDigits(item.each)}।`;
  const product = english
    ? `(${item.each} × ${item.count} = ${item.each * item.count})`
    : `(${bnDigits(item.each)} × ${bnDigits(item.count)} = ${bnDigits(item.each * item.count)})`;
  if (label) {
    return `<div class="${classes} qp-print-division-instruction"><p><strong>${esc(division)} —</strong><span>${english ? `Answer any ${item.count} questions.` : `যে কোনো ${bnDigits(item.count)} টি প্রশ্নের উত্তর দাও।`}</span><b>${product}</b></p></div>`;
  }
  return `<div class="${classes}">${division ? `<h4>${esc(division)}</h4>` : ""}<p>${label ? "" : "<span>{</span>"}<span>${esc(direction)}</span><b>${product}</b>${label ? "" : "<span>}</span>"}</p></div>`;
}

function imposeFourPageBooklet(print) {
  const header = print.querySelector(".qp-print-header")?.outerHTML || "";
  const meta = print.querySelector(".qp-print-meta")?.outerHTML || "";
  const questionHost = print.querySelector(".qp-print-questions");
  const units = [...(questionHost?.children || [])];
  if (units.length < 4) return false;

  const totalWeight = units.reduce((sum, unit) => sum + Math.max(1, unit.textContent.trim().length), 0);
  const targetWeight = totalWeight / 4;
  const pages = [[], [], [], []];
  let pageIndex = 0;
  let pageWeight = 0;
  units.forEach((unit, index) => {
    const remainingUnits = units.length - index;
    const remainingPages = 3 - pageIndex;
    if (pageIndex < 3 && remainingUnits <= remainingPages) {
      pageIndex++;
      pageWeight = 0;
    } else if (pageIndex < 3 && pageWeight >= targetWeight) {
      pageIndex++;
      pageWeight = 0;
    }
    pages[pageIndex].push(unit.outerHTML);
    pageWeight += Math.max(1, unit.textContent.trim().length);
  });

  const logicalPage = (index) => `<div class="qp-booklet-page">${index === 0 ? `${header}${meta}` : ""}${pages[index].join("")}</div>`;
  print.innerHTML = `<div class="qp-booklet-sheet">${logicalPage(0)}${logicalPage(3)}</div><div class="qp-booklet-sheet">${logicalPage(1)}${logicalPage(2)}</div>`;
  print.classList.add("is-booklet");
  return true;
}

function printPaper(downloadWord = false) {
  const paper = collectPaper();
  try { validatePaper(paper); } catch (error) { setMessage(error.message, true); return; }
  const english = paper.english;
  const examName = english ? ({ "অর্ধবার্ষিক পরীক্ষা":"Half-Yearly Examination", "নির্বাচনী পরীক্ষা":"Selection Examination", "বার্ষিক পরীক্ষা":"Annual Examination", "প্রাক-নির্বাচনী পরীক্ষা":"Pre-Selection Examination" }[paper.exam] || paper.exam) : paper.exam;
  const className = classOrdinal(paper.className, english);
  const heading = `${className} — ${examName} · ${english ? paper.year : bnDigits(paper.year)}`;
  const renderQuestion = (question, index) => `<article class="qp-print-question"><div class="qp-print-question-main"><b>${english ? `${index + 1}.` : `${bnDigits(index + 1)}.`}</b><span>${esc(paper.creative ? `${english ? "Stimulus: " : "উদ্দীপক: "}${question.stimulus}` : question.text)}</span></div>${question.branches.map((branch) => `<div class="qp-print-branch"><span>${esc(branch.label)} ${esc(branch.text)}</span><b>${branch.marks ? `(${english ? branch.marks : bnDigits(branch.marks)})` : ""}</b></div>`).join("")}</article>`;
  const generalQuestions = paper.questions.map((question, index) => ({ question, index })).filter(({ question }) => !paper.sections.some((section) => section.enabled && section.id === question.sectionId));
  const generalInstructions = generalInstructionItems(paper.generalInstruction)
    .map((item) => instructionMarkup(item, english, "", "qp-print-general-instruction")).join("");
  const general = `${generalInstructions ? `<div class="qp-print-general-instructions">${generalInstructions}</div>` : ""}${generalQuestions.map(({ question, index }) => renderQuestion(question, index)).join("")}`;
  const divisionGroups = paper.sections.filter((section) => section.enabled).map((section, index) => {
    const label = english ? `Section ${String.fromCharCode(65 + index)}` : `${bnDigits(index + 1)} বিভাগ`;
    const instruction = instructionMarkup(section, english, label);
    const items = paper.questions.map((question, questionIndex) => ({ question, questionIndex })).filter(({ question }) => question.sectionId === section.id);
    return `${instruction}${items.map(({ question, questionIndex }) => renderQuestion(question, questionIndex)).join("")}`;
  }).join("");
  let print = document.getElementById("questionPaperPrintRoot");
  if (!print) { print = document.createElement("div"); print.id = "questionPaperPrintRoot"; document.body.append(print); }
  const printDuration = english
    ? paper.duration.replace(" ঘণ্টা", " hour").replace(" মিনিট", " minutes")
    : bnDigits(paper.duration).replace(/ঘণ্টা/g, "ঘন্টা");
  print.innerHTML = `<header class="qp-print-header"><h1>${esc(english ? englishName : paper.institution)}</h1><h2>${esc(heading)}</h2><h3>${esc(paper.subject)}${paper.subjectCode ? ` · ${esc(paper.subjectCode)}` : ""}</h3></header><div class="qp-print-meta"><span>${english ? "Time" : "সময়"}: ${esc(printDuration)}</span><span>${english ? "Full Marks" : "পূর্ণমান"}: ${english ? paper.fullMarks : bnDigits(paper.fullMarks)}</span></div><div class="qp-print-questions">${general}${divisionGroups}</div>`;
  const textLength = print.textContent.length;
  const maxPages = Number(paper.printPages);
  const baseFont = Math.max(13, paper.printFont || 16);
  const landscape = paper.printColumns === 2;
  print.classList.remove("is-booklet");
  const estimatedPages = Math.max(1, Math.ceil(textLength / (landscape ? 2300 : 4200)));
  const adjustedFont = maxPages > 0 && estimatedPages > maxPages ? Math.max(13, baseFont * Math.sqrt(maxPages / estimatedPages)) : baseFont;
  print.style.setProperty("--question-paper-print-font", `${adjustedFont.toFixed(1)}px`);
  print.classList.toggle("is-landscape", landscape);
  print.style.setProperty("--question-paper-columns", landscape ? "2" : "1");
  if (!downloadWord && landscape && maxPages === 4 && estimatedPages >= 4) imposeFourPageBooklet(print);
  if (downloadWord) {
    const wordStyles = `
      @page { size: A4 ${landscape ? "landscape" : "portrait"}; margin: 18mm; }
      body { font-family: Kalpurush, Arial, sans-serif; font-size: ${adjustedFont}pt; color: #111; line-height: 1.4; }
      .qp-print-header { text-align: center; margin-bottom: 12pt; }
      .qp-print-header h1 { margin: 0; font-size: 20pt; }
      .qp-print-header h2 { margin: 5pt 0; font-size: 15pt; }
      .qp-print-header h3 { margin: 3pt 0; font-size: 13pt; }
      .qp-print-meta { margin: 8pt 0 14pt; font-weight: bold; }
      .qp-print-instruction-block { margin: 8pt 0; text-align: center; page-break-inside: avoid; }
      .qp-print-general-instructions { margin-bottom: 20pt; }
      .qp-print-instruction-block p { text-align: center; font-weight: bold; }
      .qp-print-instruction-block h4 { text-align: center; margin: 4pt 0; }
      .qp-print-question { margin: 0 0 10pt 10mm; page-break-inside: avoid; }
      .qp-print-question-main b { margin-right: 6pt; }
      .qp-print-branch { margin: 4pt 0 0 12mm; }
      .qp-print-branch b { float: right; }
      ${landscape && paper.printColumns === 2 ? "#questionPaperPrintRoot { column-count: 2; column-gap: 12mm; }" : ""}
    `;
    const wordDocument = `<!doctype html><html lang="${english ? "en" : "bn"}"><head><meta charset="utf-8"><title>${esc(heading)} · ${esc(paper.subject)}</title><style>${wordStyles}</style></head><body>${print.innerHTML}</body></html>`;
    const blob = new Blob(["\ufeff", wordDocument], { type: "application/msword;charset=utf-8" });
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = `Question-Paper-${paper.year}.doc`;
    document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
    return;
  }
  document.getElementById("questionPaperPrintPageRule")?.remove();
  if (landscape) {
    const pageRule = document.createElement("style");
    pageRule.id = "questionPaperPrintPageRule";
    pageRule.textContent = "@media print { @page { size: A4 landscape; margin: 8mm; } }";
    document.head.append(pageRule);
  }
  document.body.classList.add("question-paper-printing");
  window.print();
}

window.addEventListener("afterprint", () => {
  document.body.classList.remove("question-paper-printing");
  document.getElementById("questionPaperPrintPageRule")?.remove();
});

function resetForm() {
  form.reset(); $("questionPaperId").value = ""; $("questionPaperYear").value = String(new Date().getFullYear());
  $("questionPaperDuration").value = "1 ঘণ্টা"; $("questionPrintColumns").value = "1"; $("questionPaperCustomSubject").hidden = true; $("questionPaperCustomMarks").hidden = true;
  $("questionPaperGeneralInstruction").hidden = true; sectionHost.replaceChildren(); sectionCounter = 0; rowsHost.replaceChildren(); addQuestion();
  updateSubjects(); updateInstructionTotals(); setMessage("");
}

$("questionPaperClass").addEventListener("change", () => updateSubjects());
$("questionPaperSubject").addEventListener("change", subjectChanged);
$("questionPaperMarks").addEventListener("change", () => { const custom = $("questionPaperMarks").value === "__custom__"; $("questionPaperCustomMarks").hidden = !custom; if (!custom) $("questionPaperCustomMarks").value = ""; updateInstructionTotals(); });
$("questionPaperCustomMarks").addEventListener("input", updateInstructionTotals);
$("questionPaperEnglish").addEventListener("change", () => {
  const english = $("questionPaperEnglish").checked;
  document.querySelectorAll(".qp-branch-label").forEach((select) => { const index = select.selectedIndex; const labels = branchLabels(english); select.replaceChildren(...labels.map((label) => new Option(label, label))); select.selectedIndex = Math.min(index, labels.length - 1); });
  refreshQuestionSectionOptions();
  updateInstructionTotals();
});
$("questionPaperCreative").addEventListener("change", (event) => {
  const creative = event.target.checked;
  document.querySelectorAll(".qp-question-row").forEach((row) => {
    row.querySelector(".qp-stimulus-label").hidden = !creative;
    row.querySelector(".qp-main-question").hidden = creative;
    row.querySelector(".qp-branches-toggle-label").hidden = creative;
    const toggle = row.querySelector(".qp-question-branches-toggle");
    toggle.disabled = creative;
    if (creative) ensureCreativeBranches(row);
    else {
      const host = row.querySelector(".qp-branches");
      host.querySelectorAll(".qp-remove-branch").forEach((button) => { button.hidden = false; });
      host.hidden = !toggle.checked;
      row.querySelector(".qp-add-branch").hidden = !toggle.checked;
    }
  });
});
$("questionPaperGeneralInstructionEnabled").addEventListener("change", (event) => { $("questionPaperGeneralInstruction").hidden = !event.target.checked; });
$("questionPaperGeneralInstruction").querySelectorAll("input").forEach((input) => input.addEventListener("input", updateInstructionTotals));
$("questionPaperGeneralModeStructured").addEventListener("change", syncGeneralInstructionMode);
$("questionPaperGeneralModeCustom").addEventListener("change", syncGeneralInstructionMode);
$("addQuestionSection").addEventListener("click", () => addInstructionSection());
  $("questionPrintFont").addEventListener("input", (event) => { $("questionPrintFontValue").value = `${event.target.value}px`; });
$("printQuestionPaper").addEventListener("click", printPaper);
$("downloadQuestionPaperWord").addEventListener("click", () => printPaper(true));
form.addEventListener("submit", async (event) => {
  event.preventDefault(); if (busy) return;
  let record; try { record = collectPaper(); validatePaper(record); } catch (error) { setMessage(error.message, true); return; }
  const id = $("questionPaperId").value || doc(collection(db, collectionName)).id;
  busy = true; $("saveQuestionPaper").disabled = true; setMessage("প্রশ্নপত্র সংরক্ষণ হচ্ছে…");
  try {
    const author = teacherPortal && signedInTeacher
      ? { ownerUid: signedInUser.uid, authorName: signedInTeacher.name, authorTeacherId: signedInTeacher.id }
      : {};
    const saved = { ...record, ...author, updatedAt: serverTimestamp() };
    await setDoc(doc(db, collectionName, id), saved, { merge: true });
    papers = [...papers.filter((paper) => paper.id !== id), { ...saved, id, updatedAt: null }]; renderRows(); $("questionPaperId").value = id; setMessage("প্রশ্নপত্র সংরক্ষিত হয়েছে।");
  } catch (error) { console.error(error); setMessage("সংরক্ষণ করা যায়নি। Firestore Rules পরীক্ষা করুন।", true); }
  finally { busy = false; $("saveQuestionPaper").disabled = false; }
});

function initialize() {
  const year = new Date().getFullYear();
  fillSelect($("questionPaperYear"), [year, year + 1].map((value) => ({ value: String(value), label: bnDigits(value) })), "সাল নির্বাচন করুন");
  fillSelect($("questionPaperDuration"), Array.from({ length: 7 }, (_, index) => { const minutes = 30 + index * 30; const value = [Math.floor(minutes / 60) ? `${Math.floor(minutes / 60)} ঘণ্টা` : "", minutes % 60 ? `${minutes % 60} মিনিট` : ""].filter(Boolean).join(" "); return { value, label: value.replace(/\d/g, (digit) => "০১২৩৪৫৬৭৮৯"[digit]) }; }), "সময় নির্বাচন করুন");
  fillSelect($("questionPaperMarks"), [30,45,60,80,100].map((value) => ({ value: String(value), label: bnDigits(value) })), "পূর্ণমান নির্বাচন করুন"); $("questionPaperMarks").add(new Option("নিজে পূর্ণমান লিখুন…", "__custom__"));
  resetForm();
}

onAuthStateChanged(auth, async (user) => {
  if (!user) return;
  await (window.teacherDirectoryReady || Promise.resolve());
  signedInUser = user;
  const isAdminUser = user.uid === ADMIN_UID;
  if (teacherPortal && !isAdminUser) {
    if (!user.isAnonymous) { setMessage("শিক্ষকের নাম ও জন্মতারিখ দিয়ে প্রবেশ করুন।", true); return; }
    const sessionSnapshot = await getDoc(doc(db, "teacherSessions", user.uid));
    const teacherId = sessionSnapshot.exists() ? sessionSnapshot.data().teacherId : "";
    const teacher = (window.teachersData || []).find((person) => person.id === teacherId);
    if (!teacher) { setMessage("প্রশ্নপত্র ব্যবহারের আগে নাম ও জন্মতারিখ দিয়ে প্রবেশ করুন।", true); return; }
    signedInTeacher = teacher;
  } else if (user.uid !== ADMIN_UID) { setMessage("এই বিভাগ ব্যবহারের অনুমতি নেই।", true); return; }
  initialize();
  try {
    const teacherOwnRecords = teacherPortal && !isAdminUser;
    const source = teacherOwnRecords
      ? query(collection(db, collectionName), where("ownerUid", "==", user.uid), where("authorTeacherId", "==", signedInTeacher.id))
      : collection(db, collectionName);
    const snapshot = await getDocs(source);
    papers = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
    renderRows();
    if (teacherPortal) {
      document.getElementById("teacherQuestionLogin").hidden = true;
      document.getElementById("teacherQuestionWorkspace").hidden = false;
      document.getElementById("teacherQuestionIdentity").textContent = signedInTeacher
        ? signedInTeacher.name
        : "অ্যাডমিন · সকল সংরক্ষিত প্রশ্নপত্র";
      const avatar = document.getElementById("teacherQuestionAvatar");
      const fallback = document.getElementById("teacherQuestionAvatarFallback");
      if (signedInTeacher?.photo) {
        avatar.onload = () => { avatar.hidden = false; fallback.hidden = true; };
        avatar.onerror = () => { avatar.hidden = true; fallback.hidden = false; };
        avatar.src = signedInTeacher.photo;
      } else {
        avatar.hidden = true;
        fallback.hidden = false;
        fallback.textContent = "অ";
      }
    }
  }
  catch (error) { console.error(error); $("questionPaperRows").innerHTML = '<tr><td colspan="6">প্রশ্নপত্রের তথ্য লোড হয়নি। Firestore Rules পরীক্ষা করুন।</td></tr>'; }
});
