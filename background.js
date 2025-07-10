console.log("Background service worker loaded");
const alarmName = "checkAPScore";

chrome.tabs.onRemoved.addListener((closedTabId) => {
  chrome.storage.local.get("apTabId", ({ apTabId }) => {
    if (apTabId === closedTabId) {
      console.log(`AP Scores tab (id: ${closedTabId}) was closed. Clearing saved ID.`);
      chrome.storage.local.remove("apTabId");
    }
  });
});

chrome.runtime.onMessage.addListener((message) => {
  console.log("Background received message:", message);

  if (message.action === "startChecking") {
    const minIntervalSeconds = 30;
    let interval = message.interval || 60; // default 60 seconds if not set
    if (interval < minIntervalSeconds) {
      interval = minIntervalSeconds;
    }
    chrome.storage.local.set({ interval, isChecking: true });
    chrome.alarms.create(alarmName, { periodInMinutes: interval / 60 });
    console.log(`Alarm created: every ${interval} seconds`);
    chrome.storage.local.set({ alreadyNotified: false });

  } else if (message.action === "stopChecking") {
    chrome.storage.local.set({ isChecking: false });
    chrome.alarms.clear(alarmName, (wasCleared) => {
      console.log("Alarm cleared:", wasCleared);
    });
    chrome.storage.local.remove(["alreadyNotified", "apTabId"]);
    console.log("Alarm cleared, notifier stopped, storage cleaned.");

  } else if (message.action === "scoreFound") {
    chrome.storage.local.get("alreadyNotified", (data) => {
      if (data.alreadyNotified) {
        console.log("Already notified, skipping.");
        return;
      }

      chrome.storage.local.set({
        alreadyNotified: true,
        scoreDetectedAt: new Date().toISOString(),
      });

      const title = "AP Scores Released!";
      const msg = "Your AP scores are now available!";

      chrome.notifications.create({
        type: "basic",
        iconUrl: "icon.png",
        title,
        message: msg,
        priority: 2,
        requireInteraction: true,
      }, (notificationId) => {
        console.log("Notification created with ID:", notificationId);
      });

      chrome.tabs.create({
        url: chrome.runtime.getURL("notify.html"),
      });

      chrome.alarms.clear(alarmName);
      console.log("Notified and alarm cleared.");
    });
  }
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name !== alarmName) return;

  chrome.storage.local.get(["apTabId", "alreadyNotified", "isChecking"], (data) => {
    if (!data.isChecking) {
      console.log("Checking stopped; skipping alarm.");
      chrome.alarms.clear(alarmName);
      return;
    }

    if (data.alreadyNotified) {
      console.log("Already notified; skipping.");
      chrome.alarms.clear(alarmName);
      return;
    }

    const url = "https://apstudents.collegeboard.org/view-scores";

    if (data.apTabId !== undefined) {
      chrome.tabs.get(data.apTabId, (tab) => {
        if (chrome.runtime.lastError || !tab) {
          console.warn("Stored tab invalid; opening new.");
          openNewTabAndStoreId();
          return;
        }

        if (!tab.url.includes("apstudents.collegeboard.org/view-scores")) {
          console.warn("Tab not on AP Scores page; opening new.");
          openNewTabAndStoreId();
          return;
        }

        chrome.tabs.reload(data.apTabId, () => {
          chrome.scripting.executeScript({
            target: { tabId: data.apTabId },
            files: ["content.js"],
          }, () => {
            if (chrome.runtime.lastError) {
              console.error("Injection failed:", chrome.runtime.lastError.message);
            } else {
              console.log("Injected content.js into existing tab.");
            }
          });
        });
      });
    } else {
      console.log("No saved tab; opening new.");
      openNewTabAndStoreId();
    }
  });

  function openNewTabAndStoreId() {
    chrome.tabs.create({ url: "https://apstudents.collegeboard.org/view-scores" }, (newTab) => {
      chrome.storage.local.set({ apTabId: newTab.id });
      chrome.tabs.onUpdated.addListener(function listener(tabId, changeInfo) {
        if (tabId === newTab.id && changeInfo.status === "complete") {
          chrome.scripting.executeScript({
            target: { tabId },
            files: ["content.js"],
          }, () => {
            if (chrome.runtime.lastError) {
              console.error("Script injection failed:", chrome.runtime.lastError.message);
            } else {
              console.log("Injected content.js into new tab.");
            }
          });
          chrome.tabs.onUpdated.removeListener(listener);
        }
      });
    });
  }
});
