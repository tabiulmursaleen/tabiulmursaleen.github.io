function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]);
}

function showValue(value) {
  return value ? escapeHtml(value) : "প্রযোজ্য নয়";
}

function renderTeacherList() {
  const grid = document.getElementById("teacherGrid");
  if (!grid) return;

  grid.innerHTML = teachers.map(teacher => `
    <article class="teacher-card">
      <img src="${teacher.photo}" alt="${escapeHtml(teacher.name)}" loading="lazy">
      <div class="teacher-card-content">
        <h2><a href="teacher-profile.html?id=${encodeURIComponent(teacher.id)}">${escapeHtml(teacher.name)}</a></h2>
        <p>${escapeHtml(teacher.designation)}</p>
        ${teacher.subject ? `<span>${escapeHtml(teacher.subject)}</span>` : ""}
      </div>
    </article>
  `).join("");
}

function renderTeacherProfile() {
  const profile = document.getElementById("teacherProfile");
  if (!profile) return;

  const id = new URLSearchParams(window.location.search).get("id");
  const teacher = teachers.find(person => person.id === id);

  if (!teacher) {
    profile.innerHTML = `<div class="profile-not-found"><h1>শিক্ষকের তথ্য পাওয়া যায়নি</h1><a class="btn" href="teachers.html">শিক্ষক তালিকায় ফিরুন</a></div>`;
    return;
  }

  document.title = `${teacher.name} | তাবিউল মুরসালীন নগর কারিগরি স্কুল এন্ড কলেজ`;
  profile.innerHTML = `
    <aside class="profile-summary">
      <img src="${teacher.photo}" alt="${escapeHtml(teacher.name)}">
      <h1>${escapeHtml(teacher.name)}</h1>
      <p>${escapeHtml(teacher.designation)}</p>
      ${teacher.subject ? `<span>${escapeHtml(teacher.subject)}</span>` : ""}
    </aside>
    <section class="profile-details" aria-label="শিক্ষকের বিস্তারিত তথ্য">
      <h2>ব্যক্তিগত ও পেশাগত তথ্য</h2>
      <dl>
        <div><dt>ইনডেক্স নম্বর</dt><dd>${showValue(teacher.index)}</dd></div>
        <div><dt>পদবি</dt><dd>${showValue(teacher.designation)}</dd></div>
        <div><dt>বিষয় / ট্রেড</dt><dd>${showValue(teacher.subject)}</dd></div>
        <div><dt>শিক্ষাগত যোগ্যতা</dt><dd>${showValue(teacher.qualification)}</dd></div>
        <div><dt>যোগদানের তারিখ</dt><dd>${showValue(teacher.joiningDate)}</dd></div>
        <div><dt>অভিজ্ঞতা</dt><dd>${showValue(teacher.experience)}</dd></div>
        <div><dt>জন্মতারিখ</dt><dd>${showValue(teacher.dob)}</dd></div>
        <div><dt>মোবাইল নম্বর</dt><dd>${showValue(teacher.phone)}</dd></div>
        <div><dt>রক্তের গ্রুপ</dt><dd>${showValue(teacher.blood)}</dd></div>
      </dl>
      <a class="back-to-list" href="teachers.html">← সকল শিক্ষক-কর্মচারী দেখুন</a>
    </section>
  `;
}

renderTeacherList();
renderTeacherProfile();
