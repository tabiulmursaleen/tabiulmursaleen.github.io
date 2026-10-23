function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  })[char]);
}

function showValue(value) {
  return value ? escapeHtml(value) : 'তথ্য দেওয়া নেই';
}

function banglaNumber(value) {
  return String(value).replace(/\d/g, digit => '০১২৩৪৫৬৭৮৯'[digit]);
}

function formatTeacherDate(value) {
  if (!value) return 'তথ্য দেওয়া নেই';
  const [year, month, day] = value.split('-').map(Number);
  return new Intl.DateTimeFormat('bn-BD', {
    day: 'numeric', month: 'long', year: 'numeric'
  }).format(new Date(year, month - 1, day));
}

function calculateTeacherExperience(joiningDate) {
  if (!joiningDate) return 'তথ্য দেওয়া নেই';
  const [year, month, day] = joiningDate.split('-').map(Number);
  const today = new Date();
  let years = today.getFullYear() - year;
  let months = today.getMonth() + 1 - month;
  let days = today.getDate() - day;
  if (days < 0) {
    months--;
    days += new Date(today.getFullYear(), today.getMonth(), 0).getDate();
  }
  if (months < 0) { years--; months += 12; }
  return `${banglaNumber(years)} বছর, ${banglaNumber(months)} মাস, ${banglaNumber(days)} দিন`;
}

function renderTeacherList() {
  const grid = document.getElementById('teacherGrid');
  if (!grid) return;
  const orderedTeachers = [...teachers].sort((a, b) =>
    Number(b.id === 'teacher-01') - Number(a.id === 'teacher-01')
  );
  grid.innerHTML = orderedTeachers.map(teacher => `
    <article class="teacher-card${teacher.id === 'teacher-01' ? ' principal-card' : ''}${teacher.id === 'teacher-03' ? ' teacher-name-small' : ''}">
      <a class="teacher-card-link" href="teacher-profile.html?id=${encodeURIComponent(teacher.id)}" aria-label="${escapeHtml(teacher.name)} — প্রোফাইল দেখুন">
        <img src="${escapeHtml(teacher.photo)}" alt="${escapeHtml(teacher.name)}" loading="lazy">
        <div class="teacher-card-content">
          <h2>${escapeHtml(teacher.name)}</h2>
          <p>${escapeHtml(teacher.designation)}</p>
          ${teacher.subject ? `<span>${escapeHtml(teacher.subject)}</span>` : ''}
        </div>
      </a>
    </article>`).join('');
}

function renderTeacherProfile() {
  const profile = document.getElementById('teacherProfile');
  if (!profile) return;
  const id = new URLSearchParams(window.location.search).get('id');
  const teacher = teachers.find(person => person.id === id);
  if (!teacher) {
    profile.innerHTML = `<div class="profile-not-found"><h1>শিক্ষকের তথ্য পাওয়া যায়নি</h1><a class="btn" href="teachers.html">শিক্ষক তালিকায় ফিরুন</a></div>`;
    return;
  }
  document.title = `${teacher.name} | তাবিউল মুরসালীন নগর কারিগরি স্কুল এন্ড কলেজ`;
  const details = [
    ['ইনডেক্স নম্বর', teacher.index],
    ['পদবি', teacher.designation],
    ['বিষয় / ট্রেড', teacher.subject],
    ['শিক্ষাগত যোগ্যতা', teacher.qualification],
    ['যোগদানের তারিখ', formatTeacherDate(teacher.joiningDate)],
    ['অভিজ্ঞতা', calculateTeacherExperience(teacher.joiningDate)],
    ['মোবাইল নম্বর', teacher.phone],
    ['ইমেইল', teacher.email]
  ];
  profile.innerHTML = `
    <aside class="profile-summary${teacher.id === 'teacher-03' ? ' teacher-name-small' : ''}">
      <img src="${escapeHtml(teacher.photo)}" alt="${escapeHtml(teacher.name)}">
      <h1>${escapeHtml(teacher.name)}</h1>
      <p>${escapeHtml(teacher.designation)}</p>
      ${teacher.subject ? `<span>${escapeHtml(teacher.subject)}</span>` : ''}
    </aside>
    <section class="profile-details" aria-label="শিক্ষকের বিস্তারিত তথ্য">
      <h2>ব্যক্তিগত ও পেশাগত তথ্য</h2>
      <dl>${details.map(([label, value]) => `<div><dt>${label}</dt><dd>${showValue(value)}</dd></div>`).join('')}</dl>
      <a class="back-to-list" href="teachers.html">← সকল শিক্ষক দেখুন</a>
    </section>`;
}

renderTeacherList();
renderTeacherProfile();
window.renderTeacherList = renderTeacherList;
window.renderTeacherProfile = renderTeacherProfile;
