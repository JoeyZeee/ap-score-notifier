console.log("[content.js] Script started.");

// Run this only once we see the 2025 Scores header in the DOM
function checkFor2025Scores() {
  const scoreHeader = document.querySelector(".year-label");
  const textMatch = scoreHeader?.textContent?.includes("2025 Scores");

  if (textMatch) {
    console.log("[content.js] Found '2025 Scores'!");
    chrome.runtime.sendMessage({ action: "scoreFound", awardDetected: false });
    observer.disconnect(); // Stop observing once found
  } else {
    console.log("[content.js] Did not find '2025 Scores' yet.");
  }
}

// Observe DOM mutations and wait for "2025 Scores"
const observer = new MutationObserver(() => {
  checkFor2025Scores();
});

// Start observing when body is available
if (document.body) {
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
  console.log("[content.js] MutationObserver started.");
} else {
  console.warn("[content.js] No document.body yet.");
}
