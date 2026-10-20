
function staffEscape(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}

function staffValue(value) {
  return value
    ? staffEscape(value)
    : "তথ্য দেওয়া নেই";
}

function staffBanglaNumber(value) {
  return String(value).replace(
    /\d/g,
    digit => "০১২৩৪৫৬৭৮৯"[digit]
  );
}

function staffFormatDate(value) {
  if (!value) return "তথ্য দেওয়া নেই";

  const [year, month, day] = value.split("-").map(Number);

  return new Intl.DateTimeFormat("bn-BD", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(new Date(year, month - 1, day));
}

function staffCalculateExperience(joiningDate) {
  if (!joiningDate) return "তথ্য দেওয়া নেই";
  const [year, month, day] = joiningDate.split("-").map(Number);
  const today = new Date();

  let years = today.getFullYear() - year;
  let months = today.getMonth() + 1 - month;
  let days = today.getDate() - day;

  if (days < 0) {
    months--;
    days += new Date(
      today.getFullYear(),
      today.getMonth(),
      0
    ).getDate();
  }

  if (months < 0) {
    years--;
    months += 12;
  }

  return `${staffBanglaNumber(years)} বছর, ${
    staffBanglaNumber(months)
  } মাস, ${staffBanglaNumber(days)} দিন`;
}

function renderStaffList() {
  const grid = document.getElementById("staffGrid");
  if (!grid) return;

  grid.innerHTML = staffMembers.map(staff => {
    const profileUrl =
      `staff-profile.html?id=${encodeURIComponent(staff.id)}`;

    return `
      <article class="teacher-card">
        <a href="${profileUrl}" class="staff-card-link">
          <img
            src="${staffEscape(staff.photo)}"
            alt="${staffEscape(staff.name)}"
            loading="lazy">

          <div class="teacher-card-content">
            <h2>${staffEscape(staff.name)}</h2>
            <p>${staffEscape(staff.designation)}</p>
          </div>
        </a>
      </article>
    `;
  }).join("");
}

function renderStaffProfile() {
  const profile = document.getElementById("staffProfile");
  if (!profile) return;

  const id = new URLSearchParams(location.search).get("id");
  const staff = staffMembers.find(person => person.id === id);

  if (!staff) {
    profile.innerHTML = `
      <div class="profile-not-found">
        <h1>কর্মচারীর তথ্য পাওয়া যায়নি</h1>
        <a class="btn" href="staff.html">
          কর্মচারী তালিকায় ফিরুন
        </a>
      </div>
    `;
    return;
  }

  document.title =
    `${staff.name} | তাবিউল মুরসালীন নগর কারিগরি স্কুল এন্ড কলেজ`;

  profile.innerHTML = `
    <aside class="profile-summary">
      <img src="${staffEscape(staff.photo)}"
           alt="${staffEscape(staff.name)}">

      <h1>${staffEscape(staff.name)}</h1>
      <p>${staffEscape(staff.designation)}</p>
    </aside>

    <section class="profile-details">
      <h2>কর্মচারীর বিস্তারিত তথ্য</h2>

      <dl>
        <div>
          <dt>নাম</dt>
          <dd>${staffEscape(staff.name)}</dd>
        </div>

        <div>
          <dt>পদবি</dt>
          <dd>${staffEscape(staff.designation)}</dd>
        </div>

        <div>
          <dt>ইনডেক্স নম্বর</dt>
          <dd>${staffValue(staff.index)}</dd>
        </div>

        <div>
          <dt>শিক্ষাগত যোগ্যতা</dt>
          <dd>${staffValue(staff.qualification)}</dd>
        </div>

        <div>
          <dt>যোগদানের তারিখ</dt>
          <dd>${staffFormatDate(staff.joiningDate)}</dd>
        </div>

        <div>
          <dt>অভিজ্ঞতা</dt>
          <dd>${staffCalculateExperience(staff.joiningDate)}</dd>
        </div>

        <div>
          <dt>জন্মতারিখ</dt>
          <dd>${staffFormatDate(staff.dob)}</dd>
        </div>

        <div>
          <dt>মোবাইল নম্বর</dt>
          <dd>${staffValue(staff.phone)}</dd>
        </div>

        <div>
          <dt>ইমেইল</dt>
          <dd>${staffValue(staff.email)}</dd>
        </div>
      </dl>

      <a class="back-to-list" href="staff.html">
        ← সকল কর্মচারী দেখুন
      </a>
    </section>
  `;
}

renderStaffList();
renderStaffProfile();
window.renderStaffList = renderStaffList;
window.renderStaffProfile = renderStaffProfile;
