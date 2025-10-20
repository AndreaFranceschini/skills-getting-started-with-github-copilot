document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Build participants HTML (render list items with remove buttons)
        let participantsHtml = "";
        if (Array.isArray(details.participants) && details.participants.length > 0) {
          const items = details.participants
            .map((p) =>
              `<li class="participant-item"><span class="participant-email">${escapeHtml(String(p))}</span><button class="participant-remove" data-activity="${escapeHtml(name)}" data-email="${escapeHtml(String(p))}" title="Unregister">✖</button></li>`
            )
            .join("");
          participantsHtml = `<ul class="participants-list">${items}</ul>`;
        } else {
          participantsHtml = `<p class="no-participants">No participants yet</p>`;
        }

        activityCard.innerHTML = `
          <h4>${escapeHtml(name)}</h4>
          <p>${escapeHtml(details.description)}</p>
          <p><strong>Schedule:</strong> ${escapeHtml(details.schedule)}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>

          <div class="participants-section">
            <div class="participants-title">
              <span>Participants</span>
              <span class="participants-count">${details.participants.length}</span>
            </div>
            ${participantsHtml}
          </div>
        `;

        activitiesList.appendChild(activityCard);

          // Attach click handlers for remove buttons (delegation not used because elements are just created)
          const removeButtons = activityCard.querySelectorAll('.participant-remove');
          removeButtons.forEach((btn) => {
            btn.addEventListener('click', async (e) => {
              const activityName = btn.getAttribute('data-activity');
              const email = btn.getAttribute('data-email');

              if (!confirm(`Unregister ${email} from ${activityName}?`)) return;

              try {
                const res = await fetch(
                  `/activities/${encodeURIComponent(activityName)}/unregister?email=${encodeURIComponent(email)}`,
                  { method: 'DELETE' }
                );

                const json = await res.json();
                if (res.ok) {
                  // Remove the participant item from the DOM
                  const li = btn.closest('li.participant-item');
                  if (li) li.remove();

                  // Update count badge
                  const countBadge = activityCard.querySelector('.participants-count');
                  if (countBadge) {
                    const current = parseInt(countBadge.textContent || '0', 10);
                    countBadge.textContent = Math.max(0, current - 1);
                  }
                } else {
                  console.error('Failed to unregister:', json);
                  alert(json.detail || 'Failed to unregister participant');
                }
              } catch (err) {
                console.error('Error unregistering participant:', err);
                alert('Error unregistering participant');
              }
            });
          });

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Simple HTML-escape helper to avoid raw HTML injection from data
  function escapeHtml(str) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
