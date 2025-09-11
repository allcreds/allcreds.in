// ✅ Allcreds Chat - Group-free version with time-based restriction

import { getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { Timestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  getFirestore, collection, addDoc, query,
  where, orderBy, onSnapshot, serverTimestamp, doc,
  setDoc, updateDoc, deleteDoc, getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAyA6Ch4tU7T8eubnUrjms0gFPXUMk4jjo",
  authDomain: "allcreds-chat.firebaseapp.com",
  projectId: "allcreds-chat",
  storageBucket: "allcreds-chat.appspot.com",
  messagingSenderId: "321280486674",
  appId: "1:321280486674:web:57760ec03186fb50dbd7cb"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

let loggedInUser = localStorage.getItem("loggedInUser");
let currentUser = null;
let replyTo = null;

function isChatAllowed() {
  const now = new Date();
  const hour = now.getHours();
  return hour >= 8 && hour < 19; // 8:00 AM to 6:59 PM
}

function showRestrictionBanner() {
  const banner = document.createElement("div");
  banner.style.position = "fixed";
  banner.style.top = "0";
  banner.style.left = "0";
  banner.style.right = "0";
  banner.style.padding = "12px";
  banner.style.backgroundColor = "#cc0000";
  banner.style.color = "#fff";
  banner.style.fontWeight = "bold";
  banner.style.textAlign = "center";
  banner.style.zIndex = "9999";
  banner.innerText = "🚫 Chat is available only between 8:00 AM and 7:00 PM";
  document.body.appendChild(banner);
}

if (!loggedInUser) {
  window.location.href = "login.html";
} else {
  document.addEventListener("DOMContentLoaded", async () => {
    try {
      const userRef = doc(db, "users", loggedInUser);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        alert("User record not found.");
        localStorage.removeItem("loggedInUser");
        window.location.href = "login.html";
        return;
      }

      const userData = userSnap.data();

      if (!userData.approved) {
        alert("Access denied. You are not approved by admin yet.");
        localStorage.removeItem("loggedInUser");
        window.location.href = "login.html";
        return;
      }

      const loginInfo = document.getElementById("loginInfo");
      if (loginInfo) loginInfo.textContent = `You are logged in as ${userData.name || loggedInUser}`;

      const userName = document.getElementById("userName");
      if (userName) userName.textContent = `- ${userData.name || loggedInUser}`;

      await signInAnonymously(auth);
      await setDoc(userRef, { online: true }, { merge: true });

      loadUsers();
      setupListeners();

      const logoutBtn = document.getElementById("logoutBtn");
      if (logoutBtn) {
        logoutBtn.addEventListener("click", async () => {
          await setDoc(userRef, { online: false }, { merge: true });
          localStorage.removeItem("loggedInUser");
          window.location.href = "login.html";
        });
      }

      if (!isChatAllowed()) {
        showRestrictionBanner();
        const input = document.getElementById("messageInput");
        const sendBtn = document.getElementById("sendButton");
        const imageInput = document.getElementById("imageInput");
        if (input) input.disabled = true;
        if (sendBtn) sendBtn.disabled = true;
        if (imageInput) imageInput.disabled = true;
      }

    } catch (err) {
      console.error("Initialization Error:", err);
      alert("Something went wrong loading chat:\n" + err.message);
    }
  });
}

window.addEventListener("beforeunload", () => {
  try {
    if (loggedInUser) {
      setDoc(doc(db, "users", loggedInUser), { online: false }, { merge: true });
    }
  } catch (e) {
    console.warn("Unload cleanup failed:", e);
  }
});

window.sendMessage = async function (e) {
  e.preventDefault();
  if (!isChatAllowed()) {
    alert("🚫 Chat is available only between 8:00 AM and 7:00 PM");
    return;
  }
  const input = document.getElementById("messageInput");
  const message = input.value.trim();
  if (!currentUser || !message) {
    alert("Select a user and type a message.");
    return;
  }

  const finalMsg = replyTo ? `reply-marker::${replyTo} reply-marker::${message}` : message;

  const chatData = {
    sender: loggedInUser,
    message: finalMsg,
    timestamp: serverTimestamp(),
    readBy: [loggedInUser],
    receiver: currentUser,
    participants: [loggedInUser, currentUser]
  };

  await addDoc(collection(db, "chats"), chatData);

  input.value = "";
  replyTo = null;
  input.placeholder = "Type your message...";
};

async function sendImage(base64) {
  if (!isChatAllowed()) {
    alert("🚫 Chat is available only between 8:00 AM and 7:00 PM");
    return;
  }
  if (!currentUser) {
    alert("Select a user first.");
    return;
  }

  await addDoc(collection(db, "chats"), {
    sender: loggedInUser,
    receiver: currentUser,
    participants: [loggedInUser, currentUser],
    timestamp: serverTimestamp(),
    image: base64,
    readBy: [loggedInUser]
  });
}

async function loadUsers() {
  const userList = document.getElementById("userList");
  const q = query(collection(db, "users"));

  onSnapshot(q, async (snapshot) => {
    userList.innerHTML = `
      <input type="text" id="searchUser" placeholder="Search users..." 
             style="width: 90%; padding: 8px; margin-bottom: 10px;">`;

    await processUserDocs(snapshot.docs, userList);

    const searchInput = document.getElementById("searchUser");
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        const val = e.target.value.toLowerCase();
        document.querySelectorAll("#userList .user").forEach(user => {
          user.style.display = user.textContent.toLowerCase().includes(val) ? "flex" : "none";
        });
      });
    }
  });
}

async function fetchUnreadAndUpdate(uid) {
  try {
    const chatQ = query(
      collection(db, "chats"),
      where("sender", "==", uid),
      where("receiver", "==", loggedInUser)
    );
    const unreadSnap = await getDocs(chatQ);
    let unreadCount = 0;

    unreadSnap.forEach(chatDoc => {
      const msg = chatDoc.data();
      const readBy = msg.readBy || [];
      if (!readBy.includes(loggedInUser)) {
        unreadCount++;
      }
    });

    const badge = document.getElementById(`badge-${uid}`);
    if (unreadCount > 0 && badge) {
      badge.textContent = unreadCount;
      badge.style.display = "block";
    }
  } catch (err) {
    console.warn(`Error loading unread count for ${uid}:`, err.message);
  }
}
  async function processUserDocs(docs, userList) {
    for (const docSnap of docs) {
      const userId = docSnap.id;
      const data = docSnap.data();

      if (userId === loggedInUser) continue;

      const div = document.createElement("div");
  div.className = "user" + (userId === currentUser ? " selected" : "");
      div.setAttribute("data-userid", userId);

      const avatar = (data.name || userId)[0].toUpperCase();
      const name = data.name || userId;
      const statusClass = data.online ? "online" : "";

      div.innerHTML = `
        <div class="user-left">
          <div class="avatar">${avatar}</div>
          <div class="user-info">
            <div class="user-name">${name}</div>
            <div class="status ${statusClass}"></div>
          </div>
        </div>
        <div class="unread-badge" id="badge-${userId}" style="display:none;"></div>
      `;

      div.addEventListener("click", handleUserClick(div, userId));
      userList.appendChild(div);

      // ✅ Call external async function — avoids inline declaration inside loop
      fetchUnreadAndUpdate(userId);
    }
  }

  function handleUserClick(div, userId) {
    return () => {
      document.querySelectorAll("#userList .user").forEach(el => el.classList.remove("selected"));
      div.classList.add("selected");
      selectUser(userId);
    };
  }

  function attachClickHandler(element, userId) {
    element.onclick = function () {
      document.querySelectorAll("#userList .user").forEach(el => el.classList.remove("selected"));
      element.classList.add("selected");
      selectUser(userId);
    };
  }
async function selectUser(userId) {
  currentUser = userId;
    document.querySelectorAll("#userList .user").forEach(el => {
    if (el.getAttribute("data-userid") === userId) {
      el.classList.add("selected");
    } else {
      el.classList.remove("selected");
    }
  });

  const chatBox = document.getElementById("chatBox");

  const userRef = doc(db, "users", userId);
  const userSnap = await getDoc(userRef);
  const userName = userSnap.exists() ? userSnap.data().name || userId : userId;

  chatBox.innerHTML = `<p><b>Chatting with: ${userName}</b></p>`;

  const q = query(
    collection(db, "chats"),
    where("participants", "array-contains", loggedInUser),
    orderBy("timestamp")
  );

onSnapshot(q, async (snapshot) => {
  document.getElementById("chatHeader").innerHTML = `<p>Chatting with: <b>${userName}</b></p>`;
  chatBox.innerHTML = `<div id="typingIndicator" style="font-style: italic; color: #777;"></div>`;
  let lastDate = "";

  snapshot.forEach(async (docSnap) => {
    const data = docSnap.data();
    const id = docSnap.id;
    const timestamp = data.timestamp?.toDate();

    const isBetween =
      (data.sender === loggedInUser && data.receiver === userId) ||
      (data.sender === userId && data.receiver === loggedInUser);
    if (!isBetween) return;

    if (data.sender === userId && !data.readBy?.includes(loggedInUser)) {
      const msgRef = doc(db, "chats", id);
      await updateDoc(msgRef, {
        readBy: [...(data.readBy || []), loggedInUser]
      });
    }

    const dateStr = timestamp?.toLocaleDateString(undefined, {
      day: "2-digit",
      month: "short",
      year: "numeric"
    }) || "";

    if (dateStr !== lastDate) {
      const divider = document.createElement("div");
      divider.className = "date-divider";
      divider.textContent = dateStr;
      chatBox.appendChild(divider);
      lastDate = dateStr;
    }

    const msgDiv = document.createElement("div");
    msgDiv.className = "chat-message " + (data.sender === loggedInUser ? "sent" : "received");

    const contentDiv = document.createElement("div");
if (data.sender !== loggedInUser) {
  const actionsMenu = document.createElement("div");
  actionsMenu.className = "message-actions";

  const replyBtn = document.createElement("span");
  replyBtn.title = "Reply";
  replyBtn.className = "action-btn";
  replyBtn.onclick = (e) => {
    e.stopPropagation();
    replyTo = data.message;
    const replyBox = document.getElementById("replyPreview");
    if (replyBox) {
      replyBox.innerHTML = `
        <div class="reply-preview">
          <span class="reply-label">Replying to:</span>
          <div class="reply-text">${data.message}</div>
          <span class="cancel-reply" onclick="cancelReply()">✕</span>
        </div>`;
    }
    document.getElementById("messageInput").focus();
  };

  const emojis = ["❤️", "😂","🤣", "😢", "😡", "👍", "👎"];
  emojis.forEach((emoji) => {
    const emojiBtn = document.createElement("span");
    emojiBtn.innerText = emoji;
    emojiBtn.className = "action-btn";
    emojiBtn.title = "React";
    emojiBtn.onclick = (e) => {
      e.stopPropagation();
      reactToMessage(id, emoji);
    };
    actionsMenu.appendChild(emojiBtn);
  });
if (data.reactions) {
  const reactionsBar = document.createElement("div");
  reactionsBar.className = "reactions-bar";

  const counted = {};
  Object.values(data.reactions).forEach(e => {
    counted[e] = (counted[e] || 0) + 1;
  });

  for (const [emoji, count] of Object.entries(counted)) {
    const span = document.createElement("span");
    span.className = "reaction-count";
    span.innerText = `${emoji} ${count}`;
    reactionsBar.appendChild(span);
  }

  msgDiv.appendChild(reactionsBar);
}

  actionsMenu.appendChild(replyBtn);
  msgDiv.appendChild(actionsMenu);
}

    // 📌 Reply display
    if (data.message?.includes("reply-marker::")) {
      const replyParts = data.message.split("reply-marker::");
      const original = replyParts[1];
      const actual = replyParts.slice(2).join("reply-marker::");

      const replyContainer = document.createElement("div");
      replyContainer.className = "quoted-reply";
      replyContainer.textContent = original;
      msgDiv.appendChild(replyContainer);

      data.message = actual;
    }

    if (data.image) {
      const img = document.createElement("img");
      img.src = data.image;
      img.style.maxWidth = "550px";
      img.style.borderRadius = "8px";
      contentDiv.appendChild(img);
    } else {
      contentDiv.textContent = data.message;
    }
    msgDiv.appendChild(contentDiv);

    const timeDiv = document.createElement("div");
    timeDiv.className = "timestamp";
    timeDiv.textContent = timestamp?.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    }) || "";
   msgDiv.appendChild(timeDiv);

// ✅ Append emoji reaction if exists
if (data.reactions && Array.isArray(data.reactions) && data.reactions.length > 0) {
  const emojiSpan = document.createElement("div");
  emojiSpan.className = "emoji-reactions";
  emojiSpan.textContent = data.reactions.join(" ");
  emojiSpan.style.marginTop = "5px";
  msgDiv.appendChild(emojiSpan);
}


    if (data.sender === loggedInUser) {
      const readIndicator = document.createElement("span");
      readIndicator.className = "tick-indicator";

      if (data.readBy?.includes(userId)) {
        readIndicator.innerHTML = "&#10003;&#10003;";
        readIndicator.style.color = "#2196F3";
      } else {
        readIndicator.innerHTML = "&#10003;";
        readIndicator.style.color = "#888";
      }

      msgDiv.appendChild(readIndicator);
    }

    // 📌 Enable reply on click (if received message)
    msgDiv.onclick = () => {
      if (data.sender !== loggedInUser && data.message) {
        replyTo = data.message;
        const replyBox = document.getElementById("replyPreview");
        if (replyBox) {
          replyBox.innerHTML = `
            <div class="reply-preview">
              <span class="reply-label">Replying to:</span>
              <div class="reply-text">${data.message}</div>
              <span class="cancel-reply" onclick="cancelReply()">✕</span>
            </div>`;
        }
        document.getElementById("messageInput").focus();
      }
    };

    chatBox.appendChild(msgDiv);
  });

  chatBox.scrollTop = chatBox.scrollHeight;
});

  onSnapshot(doc(db, "users", userId), (docSnap) => {
    const data = docSnap.data();
    const typingEl = document.getElementById("typingIndicator");
    typingEl.textContent = (data.typingTo === loggedInUser) ? `${userName} is typing...` : "";
  });
}

function previewImageBeforeSend(file) {
  const imagePreview = document.getElementById("imagePreviewContainer");
  imagePreview.innerHTML = ""; // Clear old preview

  const reader = new FileReader();
  reader.onload = () => {
    const img = document.createElement("img");
    img.src = reader.result;
    img.style.maxWidth = "150px";
    img.style.borderRadius = "8px";
    img.style.marginRight = "10px";

    const sendBtn = document.createElement("button");
    sendBtn.textContent = "Send Image";
    sendBtn.style.padding = "5px 10px";
    sendBtn.onclick = () => {
      sendImage(reader.result);
      imagePreview.innerHTML = ""; // Clear preview after sending
    };

    imagePreview.appendChild(img);
    imagePreview.appendChild(sendBtn);
  };
  reader.readAsDataURL(file);
}

function setupListeners() {
  const input = document.getElementById("messageInput");
  input.addEventListener("input", async () => {
    const userRef = doc(db, "users", loggedInUser);
    await setDoc(userRef, { typingTo: currentUser || "" }, { merge: true });

    clearTimeout(window.typingTimeout);
    window.typingTimeout = setTimeout(() => {
      setDoc(userRef, { typingTo: "" }, { merge: true });
    }, 3000);
  });
}

// Auto logout after 11:59:59 PM
setInterval(() => {
  const now = new Date();
  if (now.getHours() === 0 && now.getMinutes() === 0) {
    alert("Session expired. Logging out after midnight.");
    const userRef = doc(db, "users", loggedInUser);
    setDoc(userRef, { online: false }, { merge: true }).finally(() => {
      localStorage.removeItem("loggedInUser");
      window.location.href = "login.html";
    });
  }
}, 60000); // Check every 60 seconds

const userNameCache = {};

async function reactToMessage(messageId, emoji) {
  const msgRef = doc(db, "chats", messageId);
  const docSnap = await getDoc(msgRef);
  if (!docSnap.exists()) return;

  const data = docSnap.data();
  const existingReactions = data.reactions || {};

  // Toggle emoji for this user
  if (existingReactions[loggedInUser] === emoji) {
    delete existingReactions[loggedInUser];
  } else {
    existingReactions[loggedInUser] = emoji;
  }

  await updateDoc(msgRef, {
    reactions: existingReactions
  });
}
