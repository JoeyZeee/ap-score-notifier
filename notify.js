document.addEventListener("DOMContentLoaded", () => {
  chrome.storage.local.get("scoreDetectedAt", ({ scoreDetectedAt }) => {
    if (scoreDetectedAt) {
      const time = new Date(scoreDetectedAt);
      const formatted = time.toLocaleString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      });
      document.getElementById("release-time").textContent =
        `Approximate release time: ${formatted}`;
    }
  });

  document.getElementById("dismissBtn").addEventListener("click", () => {
    window.close();
  });

  document.getElementById("openCBBtn").addEventListener("click", () => {
    chrome.tabs.create({ url: "https://apstudents.collegeboard.org/view-scores" });
  });
});
