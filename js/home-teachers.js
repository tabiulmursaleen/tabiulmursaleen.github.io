(function renderHomeTeacherPreview() {
  const grid = document.getElementById("teacherPreviewGrid");
  if (!grid || typeof teachers === "undefined") return;

  const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);

  const orderedTeachers = [...teachers].sort((a, b) =>
    Number(b.id === 'teacher-01') - Number(a.id === 'teacher-01')
  );
  const previewTeachers = orderedTeachers.slice(0, 10);
  const kamruzzaman = orderedTeachers.find(teacher => teacher.id === 'teacher-11');
  if (kamruzzaman && !previewTeachers.some(teacher => teacher.id === kamruzzaman.id)) {
    previewTeachers.push(kamruzzaman);
  }

  grid.innerHTML = previewTeachers.map(teacher => `
    <article class="teacher-card${teacher.id === 'teacher-01' ? ' principal-card' : ''}${teacher.id === 'teacher-03' ? ' teacher-name-small' : ''}">
      <a class="teacher-preview-card-link" href="teacher-profile.html?id=${encodeURIComponent(teacher.id)}">
        <img src="${escapeHtml(teacher.photo)}" alt="${escapeHtml(teacher.name)}" loading="lazy">
        <div class="teacher-card-content">
          <h2>${escapeHtml(teacher.name)}</h2>
          <p>${escapeHtml(teacher.designation)}</p>
          ${teacher.subject ? `<span>${escapeHtml(teacher.subject)}</span>` : ""}
        </div>
      </a>
    </article>
  `).join("");
})();
