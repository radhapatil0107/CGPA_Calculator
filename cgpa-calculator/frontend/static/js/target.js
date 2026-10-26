/**
 * Target Plan Client-side Script
 * Department of Computer Science & Engineering (Data Science)
 * D.Y. Patil College of Engineering & Technology, Kolhapur
 */

function autofillFromTracker(cgpa, credits) {
  document.getElementById("currentCgpaInput").value = parseFloat(cgpa).toFixed(2);
  document.getElementById("completedCreditsInput").value = parseFloat(credits).toFixed(1);
}

function setTargetPreset(value) {
  document.getElementById("targetCgpaInput").value = parseFloat(value).toFixed(2);
}

async function handleCalculateTarget(event) {
  event.preventDefault();

  const currentCgpa = parseFloat(document.getElementById("currentCgpaInput").value);
  const completedCredits = parseFloat(document.getElementById("completedCreditsInput").value);
  const targetCgpa = parseFloat(document.getElementById("targetCgpaInput").value);
  const remainingCredits = parseFloat(document.getElementById("remainingCreditsInput").value);

  const errorAlert = document.getElementById("targetErrorAlert");
  const errorText = document.getElementById("targetErrorText");
  const btn = document.getElementById("targetSubmitBtn");
  const spinner = document.getElementById("targetSpinner");

  errorAlert.style.display = "none";

  // Validation
  if (isNaN(currentCgpa) || currentCgpa < 0 || currentCgpa > 10) {
    showTargetError("Current CGPA must be a number between 0.0 and 10.0.");
    return;
  }
  if (isNaN(completedCredits) || completedCredits < 0) {
    showTargetError("Completed credits cannot be negative.");
    return;
  }
  if (isNaN(targetCgpa) || targetCgpa < 0 || targetCgpa > 10) {
    showTargetError("Target CGPA must be a number between 0.0 and 10.0.");
    return;
  }
  if (isNaN(remainingCredits) || remainingCredits <= 0) {
    showTargetError("Remaining credits must be greater than 0.");
    return;
  }

  try {
    btn.disabled = true;
    spinner.style.display = "inline-block";

    const response = await fetch("/api/target", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        current_cgpa: currentCgpa,
        completed_credits: completedCredits,
        target_cgpa: targetCgpa,
        remaining_credits: remainingCredits
      })
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || "Failed to calculate target plan");
    }

    renderTargetResults(data);
  } catch (err) {
    showTargetError(err.message);
  } finally {
    btn.disabled = false;
    spinner.style.display = "none";
  }
}

function renderTargetResults(data) {
  document.getElementById("targetEmptyCard").style.display = "none";
  const card = document.getElementById("targetResultCard");
  card.style.display = "block";

  const sgpaVal = document.getElementById("targetRequiredSgpa");
  const statusBadge = document.getElementById("targetStatusBadge");
  const msgAlert = document.getElementById("targetMessageAlert");
  const msgText = document.getElementById("targetMessageText");

  sgpaVal.textContent = data.required_sgpa.toFixed(2);
  msgText.textContent = data.message;

  // Reset classes
  statusBadge.className = "badge";
  msgAlert.className = "alert";
  card.style.borderLeftColor = "var(--primary)";

  if (!data.reachable || data.status === "unreachable") {
    statusBadge.classList.add("badge-F");
    statusBadge.textContent = "Unreachable Target";
    msgAlert.classList.add("alert-danger");
    sgpaVal.style.color = "var(--danger)";
    card.style.borderLeftColor = "var(--danger)";
  } else if (data.status === "already_achieved") {
    statusBadge.classList.add("badge-O");
    statusBadge.textContent = "Goal Already Secured!";
    msgAlert.classList.add("alert-success");
    sgpaVal.style.color = "var(--success)";
    card.style.borderLeftColor = "var(--success)";
  } else if (data.required_sgpa >= 9.0) {
    statusBadge.classList.add("badge-B-plus");
    statusBadge.textContent = "Ambitious & Challenging";
    msgAlert.classList.add("alert-warning");
    sgpaVal.style.color = "var(--warning)";
    card.style.borderLeftColor = "var(--warning)";
  } else {
    statusBadge.classList.add("badge-A-plus");
    statusBadge.textContent = "Very Achievable";
    msgAlert.classList.add("alert-info");
    sgpaVal.style.color = "var(--primary)";
    card.style.borderLeftColor = "var(--primary)";
  }

  // Update progress bar
  const curCgpa = parseFloat(document.getElementById("currentCgpaInput").value) || 0;
  const tgtCgpa = parseFloat(document.getElementById("targetCgpaInput").value) || 0;
  
  const barCurVal = document.getElementById("barCurrentVal");
  const barTgtVal = document.getElementById("barTargetVal");
  const barCurProg = document.getElementById("targetProgressBarCurrent");
  const barGoalProg = document.getElementById("targetProgressBarGoal");

  if (barCurVal) barCurVal.textContent = curCgpa.toFixed(2);
  if (barTgtVal) barTgtVal.textContent = tgtCgpa.toFixed(2);
  if (barCurProg) barCurProg.style.width = `${Math.min(100, Math.max(0, (curCgpa / 10) * 100))}%`;
  if (barGoalProg) barGoalProg.style.width = `${Math.min(100, Math.max(0, (tgtCgpa / 10) * 100))}%`;

  card.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function showTargetError(msg) {
  const alertBox = document.getElementById("targetErrorAlert");
  const alertText = document.getElementById("targetErrorText");
  alertText.textContent = msg;
  alertBox.style.display = "block";
}
