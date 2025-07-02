export default defineBackground(() => {
  console.log('🟢 Background script loaded!', { 
    id: browser.runtime.id,
    timestamp: new Date().toISOString()
  });

  // Test if the background script is alive
  setInterval(() => {
    console.log('🔄 Background script heartbeat:', new Date().toISOString());
  }, 10000); // Every 10 seconds

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('🟡 Background received message:', {
      message,
      sender: sender.tab?.url,
      timestamp: new Date().toISOString()
    });
    
    if (message.type === "OPEN_POPUP") {
      console.log("🟢 Opening popup...");
      chrome.action.openPopup();
      return false;
    }
    
    if (message.type === "TRIM_TITLE_WITH_OPENAI") {
      console.log("🟢 Processing TRIM_TITLE_WITH_OPENAI request");
      const title = message.title;
      
      if (!title) {
        console.error("🔴 No title provided");
        sendResponse({ trimmedTitle: "" });
        return false;
      }
      
      console.log("🟡 Making API call to localhost:8000 with title:", title);
      
      fetch("http://localhost:8000/api/trim-title", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({ title }),
      })
        .then((res) => {
          console.log("🟢 API response status:", res.status);
          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
          }
          return res.json();
        })
        .then((data) => {
          console.log("🟢 API response data:", data);
          sendResponse({ trimmedTitle: data.trimmedTitle ?? title });
        })
        .catch((error) => {
          console.error("🔴 API call failed:", error);
          sendResponse({ trimmedTitle: title });
        });
      
      return true;
    }
    
    console.log("🟡 Unhandled message type:", message.type);
    return false;
  });
});