document.addEventListener("DOMContentLoaded", () => {
  const startBtn = document.getElementById("start");
  const stopBtn = document.getElementById("stop");
  const intervalInput = document.getElementById("interval");
  const statusEl = document.getElementById("status");

  const MIN_INTERVAL = 30; // seconds

  // Load saved interval and isChecking flag to update UI
  chrome.storage.local.get(["interval", "isChecking"], (data) => {
    if (data.interval) {
      intervalInput.value = data.interval;
    }
    if (data.isChecking) {
      startBtn.disabled = true;
      stopBtn.disabled = false;
      intervalInput.disabled = true;
      statusEl.textContent = `Checking every ${data.interval || MIN_INTERVAL} seconds...`;
      statusEl.className = "success";
    } else {
      startBtn.disabled = false;
      stopBtn.disabled = true;
      intervalInput.disabled = false;
      statusEl.textContent = "";
      statusEl.className = "";
    }
  });

  startBtn.addEventListener("click", () => {
    let interval = parseInt(intervalInput.value, 10);

    if (isNaN(interval) || interval < MIN_INTERVAL) {
      statusEl.textContent = `Minimum interval is ${MIN_INTERVAL} seconds. Please increase the value.`;
      statusEl.className = "error";
      return;
    }

    chrome.runtime.sendMessage({ action: "startChecking", interval });

    statusEl.textContent = `Checking every ${interval} seconds...`;
    statusEl.className = "success";
    startBtn.disabled = true;
    stopBtn.disabled = false;
    intervalInput.disabled = true;
  });

  stopBtn.addEventListener("click", () => {
    chrome.runtime.sendMessage({ action: "stopChecking" });

    statusEl.textContent = "Stopped checking.";
    statusEl.className = "";
    startBtn.disabled = false;
    stopBtn.disabled = true;
    intervalInput.disabled = false;
  });
});
