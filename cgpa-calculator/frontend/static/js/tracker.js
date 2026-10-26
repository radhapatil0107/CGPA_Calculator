/**
 * CGPA Tracker Client-side Script
 * Department of Computer Science & Engineering (Data Science)
 * D.Y. Patil College of Engineering & Technology, Kolhapur
 */

let chartInstance = null;
let savedSemesters = [];

document.addEventListener("DOMContentLoaded", () => {
  loadTrackerData();
});

/**
 * Fetch all semesters from API and initialize table & chart
 */
async function loadTrackerData() {
  try {
    const res = await fetch("/api/semesters");
    if (!res.ok) {
      if (res.status === 401) {
        // Not logged in or guest
        return;
      }
      throw new Error("Failed to load semesters");
    }

    const data = await res.json();
    if (data.success) {
      savedSemesters = data.semesters || [];
      renderTrackerUI(data);
    }
  } catch (err) {
    console.error("Tracker fetch error:", err);
  }
}

/**
 * Update UI elements, summary stats, and chart
 */
function renderTrackerUI(data) {
  const semesters = data.semesters || savedSemesters;
  const cgpa = data.cgpa || 0.0;
  const credits = data.total_credits || 0.0;
  const pct = Math.min(100, cgpa * 9.5);

  // Update Metric Cards
  const cgpaEl = document.getElementById("trackerCgpaDisplay");
  const creditsEl = document.getElementById("trackerCreditsDisplay");
  const pctEl = document.getElementById("trackerPctDisplay");
  const countEl = document.getElementById("trackerCountDisplay");

  if (cgpaEl) cgpaEl.textContent = cgpa.toFixed(2);
  if (creditsEl) creditsEl.textContent = credits.toFixed(1);
  if (pctEl) pctEl.textContent = `${pct.toFixed(2)}%`;
  if (countEl) countEl.textContent = semesters.length;

  // Toggle table & empty state
  const emptyState = document.getElementById("trackerEmptyState");
  const tableContainer = document.getElementById("trackerTableContainer");

  if (semesters.length === 0) {
    if (emptyState) emptyState.style.display = "block";
    if (tableContainer) tableContainer.style.display = "none";
  } else {
    if (emptyState) emptyState.style.display = "none";
    if (tableContainer) tableContainer.style.display = "block";
    renderTableRows(semesters);
  }

  // Render Progression Chart
  renderProgressionChart(semesters);
}

/**
 * Render table rows
 */
function renderTableRows(semesters) {
  const tbody = document.getElementById("semestersTableBody");
  if (!tbody) return;

  tbody.innerHTML = "";
  semesters.forEach(sem => {
    const tr = document.createElement("tr");
    tr.dataset.semId = sem.id;
    tr.innerHTML = `
      <td>
        <strong>${escapeHtml(sem.semester_name)}</strong>
        <span style="display: block; font-size: 0.78rem; color: var(--text-muted);">
          Saved: ${sem.created_at || 'Recent'}
        </span>
      </td>
      <td>${parseFloat(sem.credits).toFixed(1)}</td>
      <td>
        <span class="badge badge-A-plus" style="font-size: 0.9rem;">
          ${parseFloat(sem.sgpa).toFixed(2)}
        </span>
      </td>
      <td>${parseFloat(sem.grade_points).toFixed(1)}</td>
      <td>
        <div style="display: flex; gap: 0.4rem;">
          <a href="/report/${sem.id}" class="btn btn-secondary btn-sm" title="View & Print Grade Sheet" target="_blank">
            &#128438; Report
          </a>
          <button type="button" class="btn btn-secondary btn-sm" 
            data-id="${sem.id}" 
            data-sem-no="${sem.semester_no}" 
            data-sem-name="${escapeHtml(sem.semester_name)}" 
            data-credits="${sem.credits}" 
            data-sgpa="${sem.sgpa}" 
            onclick="openEditModalFromBtn(this)" 
            title="Edit Semester">
            &#9998; Edit
          </button>
          <button type="button" class="btn btn-danger-outline btn-sm" 
            data-id="${sem.id}" 
            data-sem-name="${escapeHtml(sem.semester_name)}" 
            onclick="confirmDeleteFromBtn(this)" 
            title="Delete Semester">
            &#128465; Delete
          </button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

/**
 * Render Chart.js line graph of semester progression
 */
function renderProgressionChart(semesters) {
  const canvas = document.getElementById("cgpaProgressionChart");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  // Sort semesters by semester_no
  const sorted = [...semesters].sort((a, b) => a.semester_no - b.semester_no);

  const labels = sorted.map(s => s.semester_name || `Sem ${s.semester_no}`);
  const sgpaData = sorted.map(s => s.sgpa);

  // Compute progressive running CGPA
  let runningPoints = 0;
  let runningCredits = 0;
  const runningCgpaData = sorted.map(s => {
    runningPoints += (s.credits * s.sgpa);
    runningCredits += s.credits;
    return runningCredits > 0 ? parseFloat((runningPoints / runningCredits).toFixed(2)) : 0;
  });

  if (chartInstance) {
    chartInstance.destroy();
  }

  // Create subtle gradient for SGPA
  const gradient = ctx.createLinearGradient(0, 0, 0, 300);
  gradient.addColorStop(0, "rgba(79, 70, 229, 0.28)");
  gradient.addColorStop(1, "rgba(79, 70, 229, 0.02)");

  chartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels.length ? labels : ["Sem 1", "Sem 2", "Sem 3", "Sem 4"],
      datasets: [
        {
          label: "Semester SGPA",
          data: sgpaData.length ? sgpaData : [0, 0, 0, 0],
          borderColor: "#4f46e5",
          backgroundColor: gradient,
          borderWidth: 3,
          fill: true,
          tension: 0.35,
          pointBackgroundColor: "#ffffff",
          pointBorderColor: "#4f46e5",
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 7
        },
        {
          label: "Cumulative CGPA",
          data: runningCgpaData.length ? runningCgpaData : [0, 0, 0, 0],
          borderColor: "#10b981",
          borderDash: [5, 5],
          borderWidth: 2.5,
          fill: false,
          tension: 0.25,
          pointBackgroundColor: "#ffffff",
          pointBorderColor: "#10b981",
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: "index",
        intersect: false
      },
      plugins: {
        legend: {
          position: "top",
          labels: {
            boxWidth: 14,
            usePointStyle: true,
            font: { family: "Inter, sans-serif", size: 12, weight: 600 }
          }
        },
        tooltip: {
          backgroundColor: "rgba(15, 23, 42, 0.9)",
          titleFont: { size: 13, weight: 600 },
          bodyFont: { size: 12 },
          padding: 10,
          cornerRadius: 8
        }
      },
      scales: {
        y: {
          min: 0,
          max: 10,
          ticks: {
            stepSize: 1,
            font: { family: "Inter, sans-serif" }
          },
          grid: {
            color: "rgba(226, 232, 240, 0.6)"
          }
        },
        x: {
          grid: {
            display: false
          },
          ticks: {
            font: { family: "Inter, sans-serif", weight: 500 }
          }
        }
      }
    }
  });
}

/**
 * Modal Handling
 */
function openAddModal() {
  document.getElementById("modalTitle").textContent = "Add Semester Record";
  document.getElementById("modalSemId").value = "";
  document.getElementById("modalSemNo").value = "3";
  document.getElementById("modalSemName").value = "Semester 3 (SY)";
  document.getElementById("modalCredits").value = "20";
  document.getElementById("modalSgpa").value = "";
  document.getElementById("modalErrorBox").style.display = "none";
  document.getElementById("semesterModal").classList.add("open");
}

function openEditModalFromBtn(btn) {
  const id = btn.dataset.id;
  const semNo = parseInt(btn.dataset.semNo, 10);
  const semName = btn.dataset.semName;
  const credits = parseFloat(btn.dataset.credits);
  const sgpa = parseFloat(btn.dataset.sgpa);
  openEditModal(id, semNo, semName, credits, sgpa);
}

function confirmDeleteFromBtn(btn) {
  const id = btn.dataset.id;
  const semName = btn.dataset.semName;
  confirmDeleteSemester(id, semName);
}

function openEditModal(id, semNo, semName, credits, sgpa) {
  document.getElementById("modalTitle").textContent = "Edit Semester Record";
  document.getElementById("modalSemId").value = id;
  document.getElementById("modalSemNo").value = semNo;
  document.getElementById("modalSemName").value = semName;
  document.getElementById("modalCredits").value = credits;
  document.getElementById("modalSgpa").value = sgpa;
  document.getElementById("modalErrorBox").style.display = "none";
  document.getElementById("semesterModal").classList.add("open");
}

function closeSemesterModal() {
  document.getElementById("semesterModal").classList.remove("open");
}

function autoUpdateSemName() {
  const semNo = document.getElementById("modalSemNo").value;
  const select = document.getElementById("modalSemNo");
  document.getElementById("modalSemName").value = select.selectedOptions[0].text;
}

/**
 * Submit Add/Edit form
 */
async function handleSaveModalSemester(event) {
  event.preventDefault();
  const id = document.getElementById("modalSemId").value;
  const semNo = parseInt(document.getElementById("modalSemNo").value);
  const semName = document.getElementById("modalSemName").value.trim();
  const credits = parseFloat(document.getElementById("modalCredits").value);
  const sgpa = parseFloat(document.getElementById("modalSgpa").value);

  const errorBox = document.getElementById("modalErrorBox");
  errorBox.style.display = "none";

  if (isNaN(credits) || credits <= 0) {
    errorBox.textContent = "Credits must be a number greater than 0.";
    errorBox.style.display = "block";
    return;
  }
  if (isNaN(sgpa) || sgpa < 0 || sgpa > 10) {
    errorBox.textContent = "SGPA must be a number between 0.0 and 10.0.";
    errorBox.style.display = "block";
    return;
  }

  const payload = {
    semester_no: semNo,
    semester_name: semName,
    credits: credits,
    sgpa: sgpa
  };

  try {
    let url = "/api/semesters";
    let method = "POST";
    if (id) {
      url = `/api/semesters/${id}`;
      method = "PUT";
    }

    const res = await fetch(url, {
      method: method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || "Failed to save semester record");
    }

    closeSemesterModal();
    // Reload full tracker data
    await loadTrackerData();
  } catch (err) {
    errorBox.textContent = err.message;
    errorBox.style.display = "block";
  }
}

/**
 * Delete Semester with confirmation
 */
async function confirmDeleteSemester(id, semName) {
  if (!confirm(`Are you sure you want to delete ${semName} from your tracker?`)) {
    return;
  }

  try {
    const res = await fetch(`/api/semesters/${id}`, {
      method: "DELETE"
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || "Failed to delete semester");
    }

    await loadTrackerData();
  } catch (err) {
    alert("Delete failed: " + err.message);
  }
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/**
 * Scroll smoothly to the multi-semester CGPA calculator section
 */
function scrollToCgpaCalculator() {
  const el = document.getElementById("cgpaCalculatorSection");
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

/**
 * Add another semester row to the multi-semester calculator without credits
 */
function addCgpaCalcRow(name = "", sgpa = "") {
  const tbody = document.getElementById("cgpaCalcBody");
  if (!tbody) return;
  const count = tbody.children.length + 1;
  const semDefaultName = name || `Semester ${count}`;

  const tr = document.createElement("tr");
  tr.className = "cgpa-calc-row";
  tr.innerHTML = `
    <td>
      <input type="text" class="form-control cgpa-sem-name" value="${escapeHtml(semDefaultName)}" required>
    </td>
    <td>
      <input type="text" inputmode="decimal" class="form-control cgpa-sem-sgpa" placeholder="SGPA / CGPA (e.g. 8.5)" value="${sgpa}" required>
    </td>
    <td style="text-align: center;">
      <button type="button" class="btn btn-danger-outline btn-sm" onclick="removeCgpaCalcRow(this)" title="Remove">&times;</button>
    </td>
  `;
  tbody.appendChild(tr);
}

/**
 * Remove a row from the multi-semester calculator
 */
function removeCgpaCalcRow(btn) {
  const tbody = document.getElementById("cgpaCalcBody");
  if (tbody.children.length <= 1) {
    alert("You must keep at least one semester entry to calculate CGPA.");
    return;
  }
  const tr = btn.closest("tr");
  if (tr) tr.remove();
}

/**
 * Calculate overall CGPA by taking the average of the entered SGPA/CGPA values
 */
function calculateMultiSemesterCgpa() {
  const rows = document.querySelectorAll(".cgpa-calc-row");
  if (rows.length === 0) {
    alert("Please add at least one semester entry.");
    return;
  }

  let sumSgpa = 0.0;
  let count = 0;
  let hasError = false;

  rows.forEach(r => {
    const nameInp = r.querySelector(".cgpa-sem-name");
    const sgpaInp = r.querySelector(".cgpa-sem-sgpa");

    nameInp.classList.remove("is-invalid");
    sgpaInp.classList.remove("is-invalid");

    const sgpa = parseFloat(sgpaInp.value.trim());

    if (isNaN(sgpa) || sgpa < 0 || sgpa > 10) {
      sgpaInp.classList.add("is-invalid");
      hasError = true;
    } else {
      sumSgpa += sgpa;
      count += 1;
    }
  });

  if (hasError) {
    alert("Please enter valid SGPA / CGPA values between 0.00 and 10.00.");
    return;
  }

  if (count === 0) {
    alert("Please provide at least one valid grade average.");
    return;
  }

  const overallCgpa = (sumSgpa / count);
  const percentage = Math.min(100, overallCgpa * 9.5);

  let division = "Pass Class";
  if (overallCgpa >= 7.75) division = "First Class with Distinction";
  else if (overallCgpa >= 6.75) division = "First Class";
  else if (overallCgpa >= 5.75) division = "Higher Second Class";
  else if (overallCgpa >= 5.00) division = "Second Class";
  else if (overallCgpa < 4.00) division = "Failed / Needs Improvement";

  // Display results
  const resultBox = document.getElementById("cgpaCalcResultBox");
  document.getElementById("cgpaCalcScore").textContent = overallCgpa.toFixed(2);
  document.getElementById("cgpaCalcDivision").textContent = division;
  document.getElementById("cgpaCalcCount").textContent = count;
  document.getElementById("cgpaCalcPercentage").textContent = `${percentage.toFixed(2)}%`;

  resultBox.style.display = "block";
  resultBox.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

/**
 * Helper to auto-fill the calculator with user's saved tracker semesters
 */
function loadSavedSemestersIntoCalculator() {
  if (!savedSemesters || savedSemesters.length === 0) {
    alert("No saved semesters found in your account.");
    return;
  }

  const tbody = document.getElementById("cgpaCalcBody");
  tbody.innerHTML = "";

  savedSemesters.forEach(s => {
    addCgpaCalcRow(s.semester_name || `Semester ${s.semester_no}`, s.sgpa);
  });

  calculateMultiSemesterCgpa();
}

/**
 * Save calculated CGPA and all entered semesters to user's tracker
 * and update the Cumulative CGPA display card at the top.
 */
async function saveCalculatedCgpa() {
  const rows = document.querySelectorAll(".cgpa-calc-row");
  if (rows.length === 0) {
    alert("Please add at least one semester entry to save.");
    return;
  }

  // First ensure calculation runs and validate inputs
  calculateMultiSemesterCgpa();

  let hasError = false;
  const semesterPayload = [];

  rows.forEach((r, idx) => {
    const nameInp = r.querySelector(".cgpa-sem-name");
    const sgpaInp = r.querySelector(".cgpa-sem-sgpa");

    nameInp.classList.remove("is-invalid");
    sgpaInp.classList.remove("is-invalid");

    const semName = nameInp.value.trim() || `Semester ${idx + 1}`;
    const sgpa = parseFloat(sgpaInp.value.trim());

    if (isNaN(sgpa) || sgpa < 0 || sgpa > 10) {
      sgpaInp.classList.add("is-invalid");
      hasError = true;
    } else {
      // Determine semester number from text (e.g. "Semester 1 (FY)" -> 1)
      let semNo = idx + 1;
      const match = semName.match(/(?:Semester|Sem)\s*(\d+)/i);
      if (match) {
        semNo = parseInt(match[1], 10);
      }

      semesterPayload.push({
        semester_no: semNo,
        semester_name: semName,
        sgpa: sgpa,
        credits: 20.0
      });
    }
  });

  if (hasError || semesterPayload.length === 0) {
    alert("Please ensure all SGPA values are valid numbers between 0.00 and 10.00 before saving.");
    return;
  }

  const saveBtn1 = document.getElementById("saveCgpaBtn");
  const saveBtn2 = document.getElementById("saveCgpaResultBtn");
  const statusMsg = document.getElementById("saveCgpaStatusMessage");

  const originalText1 = saveBtn1 ? saveBtn1.innerHTML : "";
  const originalText2 = saveBtn2 ? saveBtn2.innerHTML : "";

  if (saveBtn1) {
    saveBtn1.disabled = true;
    saveBtn1.innerHTML = "&#9203; Saving...";
  }
  if (saveBtn2) {
    saveBtn2.disabled = true;
    saveBtn2.innerHTML = "&#9203; Saving to Cumulative CGPA...";
  }

  if (statusMsg) {
    statusMsg.style.display = "none";
  }

  try {
    const res = await fetch("/api/save-cgpa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ semesters: semesterPayload })
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      if (res.status === 401) {
        alert("Please log in to your account first to save your Cumulative CGPA.");
        window.location.href = "/login?next=tracker_view";
        return;
      }
      throw new Error(data.error || "Failed to save CGPA");
    }

    // 1. Update UI, chart and history table
    savedSemesters = data.semesters || [];
    renderTrackerUI(data);

    // 2. Update the Cumulative CGPA display explicitly
    const cgpaDisplay = document.getElementById("trackerCgpaDisplay");
    if (cgpaDisplay) {
      cgpaDisplay.textContent = parseFloat(data.cgpa).toFixed(2);
    }

    // 3. Show "Saved" badge on card
    const savedBadge = document.getElementById("cgpaSavedBadge");
    if (savedBadge) {
      savedBadge.style.display = "inline-block";
    }

    // 4. Trigger pulse glow animation on Cumulative CGPA card
    const cumCard = document.getElementById("cumulativeCgpaCard");
    if (cumCard) {
      cumCard.classList.remove("highlight-saved");
      void cumCard.offsetWidth; // trigger reflow
      cumCard.classList.add("highlight-saved");
    }

    // 5. Scroll smoothly up to the Cumulative CGPA card so student clearly sees the updated number
    if (cumCard) {
      cumCard.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    // 6. Display success message in the result box
    if (statusMsg) {
      statusMsg.className = "alert alert-success";
      statusMsg.style.display = "block";
      statusMsg.style.backgroundColor = "rgba(16, 185, 129, 0.15)";
      statusMsg.style.border = "1px solid #10b981";
      statusMsg.style.color = "#047857";
      statusMsg.innerHTML = `&#10004; <strong>Success!</strong> CGPA of <strong>${parseFloat(data.cgpa).toFixed(2)}</strong> has been successfully saved to your Cumulative CGPA place!`;
    }
  } catch (err) {
    console.error("Save CGPA error:", err);
    if (statusMsg) {
      statusMsg.className = "alert alert-danger";
      statusMsg.style.display = "block";
      statusMsg.style.backgroundColor = "rgba(239, 68, 68, 0.15)";
      statusMsg.style.border = "1px solid #ef4444";
      statusMsg.style.color = "#b91c1c";
      statusMsg.textContent = "Error: " + err.message;
    } else {
      alert("Error saving CGPA: " + err.message);
    }
  } finally {
    if (saveBtn1) {
      saveBtn1.disabled = false;
      saveBtn1.innerHTML = originalText1;
    }
    if (saveBtn2) {
      saveBtn2.disabled = false;
      saveBtn2.innerHTML = originalText2;
    }
  }
}

