// ✅ Allcreds Chat - Fully Cleaned and Complete chat-app.js with Comments

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore, collection, addDoc, query,
  where, orderBy, onSnapshot, serverTimestamp, doc,
  setDoc, updateDoc, deleteDoc, getDoc, getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { Timestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ✅ Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAyA6Ch4tU7T8eubnUrjms0gFPXUMk4jjo",
  authDomain: "allcreds-chat.firebaseapp.com",
  projectId: "allcreds-chat",
  storageBucket: "allcreds-chat.appspot.com",
  messagingSenderId: "321280486674",
  appId: "1:321280486674:web:57760ec03186fb50dbd7cb"
};

// ✅ Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

let loggedInUser = localStorage.getItem("loggedInUser");
let currentUser = null;
let replyTo = null;

// ✅ Redirect if not logged in
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

      document.getElementById("loginInfo").textContent = `You are logged in as ${userData.name || loggedInUser}`;
      document.getElementById("userName").textContent = `- ${userData.name || loggedInUser}`;

      await signInAnonymously(auth);
      await setDoc(userRef, { online: true }, { merge: true });

      loadUsers();
      loadGroups();
      setupListeners();

      document.getElementById("logoutBtn").addEventListener("click", async () => {
        await setDoc(userRef, { online: false }, { merge: true });
        localStorage.removeItem("loggedInUser");
        window.location.href = "login.html";
      });
    } catch (err) {
      console.error("Initialization Error:", err);
      alert("Something went wrong loading chat.");
    }
  });
}

// ✅ Set user offline before window unload
window.addEventListener("beforeunload", () => {
  if (loggedInUser) {
    setDoc(doc(db, "users", loggedInUser), { online: false }, { merge: true });
  }
});

// ✅ Send message handler (used in 1-to-1 and group chat)
window.sendMessage = async function (e) {
  e.preventDefault();
  const input = document.getElementById("messageInput");
  const message = input.value.trim();
  if (!currentUser || !message) return alert("Select a user or group and type a message.");

  const finalMsg = replyTo ? `reply-marker::${replyTo} reply-marker::${message}` : message;

  const chatData = {
    sender: loggedInUser,
    message: finalMsg,
    timestamp: serverTimestamp(),
    readBy: [loggedInUser]
  };

  if (currentUser.startsWith("group_")) {
    chatData.groupId = currentUser;
  } else {
    chatData.receiver = currentUser;
    chatData.participants = [loggedInUser, currentUser];
  }

  await addDoc(collection(db, "chats"), chatData);
  input.value = "";
  replyTo = null;
  input.placeholder = "Type your message...";
};

// ✅ Load Users - fetches all users and renders them in the sidebar
function loadUsers() {
  const userList = document.getElementById("userList");
  const q = query(collection(db, "users"));

  onSnapshot(q, (snapshot) => {
    userList.innerHTML = `
      <input type="text" id="searchUser" placeholder="Search users..." style="width:90%; padding:8px; margin-bottom:10px;">
    `;

    snapshot.forEach((docSnap) => {
      const userId = docSnap.id;
      const userData = docSnap.data();
      const userName = userData.name || userId;

      if (userId === loggedInUser) return; // Skip self

      const div = document.createElement("div");
      div.classList.add("user");

      const initials = document.createElement("div");
      initials.className = "avatar";
      initials.textContent = userName[0].toUpperCase();

      const nameText = document.createElement("span");
      nameText.textContent = userName;

      const statusDot = document.createElement("div");
      statusDot.className = "status";
      if (userData.online === true) {
        statusDot.classList.add("online");
      }

      const badge = document.createElement("span");
      badge.className = "unread-badge";
      badge.style.display = "none";
      badge.textContent = "0";

      const rightWrap = document.createElement("div");
      rightWrap.style.display = "flex";
      rightWrap.style.alignItems = "center";
      rightWrap.style.gap = "6px";
      rightWrap.appendChild(statusDot);
      rightWrap.appendChild(badge);

      div.appendChild(initials);
      div.appendChild(nameText);
      div.appendChild(rightWrap);

      const msgQuery = query(
        collection(db, "chats"),
        where("sender", "==", userName),
        where("receiver", "==", loggedInUser)
      );

      onSnapshot(msgQuery, (msgs) => {
        const unreadCount = msgs.docs.filter(doc => {
          const data = doc.data();
          return !(data.readBy || []).includes(loggedInUser);
        }).length;

        badge.textContent = unreadCount > 0 ? unreadCount : "";
        badge.style.display = unreadCount > 0 ? "inline-block" : "none";
      });

      div.onclick = () => {
        document.querySelectorAll("#userList .user").forEach(el => el.classList.remove("active-user"));
        div.classList.add("active-user");
        selectUser(userName);
      };

      userList.appendChild(div);
    });

    document.getElementById("searchUser").addEventListener("input", (e) => {
      const val = e.target.value.toLowerCase();
      document.querySelectorAll("#userList .user").forEach(user => {
        user.style.display = user.textContent.toLowerCase().includes(val) ? "flex" : "none";
      });
    });
  });
}

// ✅ Select user for 1-to-1 chat
function selectUser(name) {
  const chatBox = document.getElementById("chatBox");
  currentUser = name;
  chatBox.innerHTML = `<p style='font-weight:bold;'>Chatting with: ${name}</p>`;
  document.getElementById("messageInput").focus();

  const q = query(
    collection(db, "chats"),
    where("participants", "array-contains", loggedInUser),
    orderBy("timestamp")
  );

  onSnapshot(q, (snapshot) => {
    chatBox.innerHTML = `<p style='font-weight:bold;'>Chatting with: ${name}</p>`;
    let lastDate = "";

    snapshot.forEach(async (docSnap) => {
      const data = docSnap.data();
      const id = docSnap.id;
      const timestamp = data.timestamp?.toDate();

      const isChatBetween =
        (data.sender === loggedInUser && data.receiver === name) ||
        (data.sender === name && data.receiver === loggedInUser);

      if (!isChatBetween) return;

      if (data.receiver === loggedInUser && !data.readBy?.includes(loggedInUser)) {
        await updateDoc(doc(db, "chats", id), {
          readBy: [...(data.readBy || []), loggedInUser]
        });
      }

      const dateStr = timestamp?.toLocaleDateString(undefined, {
        day: "numeric", month: "short", year: "numeric"
      }) || "";

      if (dateStr !== lastDate) {
        const divider = document.createElement("div");
        divider.className = "date-divider";
        divider.textContent = dateStr;
        chatBox.appendChild(divider);
        lastDate = dateStr;
      }

      const msgDiv = document.createElement("div");
      msgDiv.classList.add("chat-message", data.sender === loggedInUser ? "sent" : "received");
      msgDiv.setAttribute("data-id", id);

      const contentDiv = document.createElement("div");
      if (data.message.includes("reply-marker::")) {
        const [replyPart, actualMsg] = data.message.split("reply-marker::").slice(1);
        const replyBox = document.createElement("div");
        replyBox.className = "reply-box";
        replyBox.textContent = replyPart.trim();
        contentDiv.appendChild(replyBox);
        contentDiv.appendChild(document.createTextNode(actualMsg.trim()));
      } else {
        contentDiv.innerHTML = data.message;
      }

      msgDiv.appendChild(contentDiv);

      const timeDiv = document.createElement("div");
      timeDiv.className = "timestamp";
      timeDiv.textContent = timestamp?.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) || "";
      msgDiv.appendChild(timeDiv);

      if (data.sender === loggedInUser) {
        const readIndicator = document.createElement("span");
        readIndicator.className = "tick-indicator";

        if (data.readBy?.includes(currentUser)) {
          readIndicator.innerHTML = "&#10003;&#10003;";
          readIndicator.style.color = "#2196F3";
        } else {
          readIndicator.innerHTML = "&#10003;";
          readIndicator.style.color = "#888";
        }

        msgDiv.appendChild(readIndicator);
      }

      chatBox.appendChild(msgDiv);
    });

    chatBox.scrollTop = chatBox.scrollHeight;
  });

  onSnapshot(doc(db, "users", name), (docSnap) => {
    const data = docSnap.data();
    const typingEl = document.getElementById("typingIndicator");
    typingEl.textContent = (data.typingTo === loggedInUser) ? `${name} is typing...` : "";
  });
}

// ✅ Select group chat and load its messages
function selectGroup(groupName, groupId, memberList) {
  const chatBox = document.getElementById("chatBox");
  currentUser = groupId;  // We'll treat groupId as the receiver ID
  const isGroup = true;

  chatBox.innerHTML = `<p style='font-weight:bold;'>Group: ${groupName}</p>`;
  document.getElementById("messageInput").focus();

  const q = query(
    collection(db, "chats"),
    where("groupId", "==", groupId),
    orderBy("timestamp")
  );

  onSnapshot(q, (snapshot) => {
    chatBox.innerHTML = `<p style='font-weight:bold;'>Group: ${groupName}</p>`;
    let lastDate = "";

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const id = docSnap.id;
      const timestamp = data.timestamp?.toDate();

      const dateStr = timestamp?.toLocaleDateString(undefined, {
        day: "numeric", month: "short", year: "numeric"
      }) || "";

      if (dateStr !== lastDate) {
        const divider = document.createElement("div");
        divider.className = "date-divider";
        divider.textContent = dateStr;
        chatBox.appendChild(divider);
        lastDate = dateStr;
      }

      const msgDiv = document.createElement("div");
      msgDiv.classList.add("chat-message", data.sender === loggedInUser ? "sent" : "received");
      msgDiv.setAttribute("data-id", id);

      const senderName = document.createElement("strong");
      senderName.textContent = `${data.sender}: `;
      senderName.style.display = "block";
      senderName.style.color = "#2193b0";

      const contentDiv = document.createElement("div");
      contentDiv.innerHTML = data.message;

      msgDiv.appendChild(senderName);
      msgDiv.appendChild(contentDiv);

      chatBox.appendChild(msgDiv);
    });

    chatBox.scrollTop = chatBox.scrollHeight;
  });
}

// ✅ Typing indicator setup
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

// ✅ Create new group
function createGroup() {
  const groupName = prompt("Enter group name:");
  if (!groupName) return;

  const groupData = {
    name: groupName,
    owner: loggedInUser,
    members: [loggedInUser],
    createdAt: Timestamp.now()
  };

  addDoc(collection(db, "groups"), groupData)
    .then(() => alert("Group created!"))
    .catch(err => alert("Error creating group: " + err.message));
}

// ✅ Add members to a group
function openAddMembersModal(groupId, existingMembers) {
  const usernames = prompt("Enter usernames to add (comma separated):");
  if (!usernames) return;
  const newUsers = usernames.split(",").map(u => u.trim()).filter(Boolean);
  const updatedMembers = [...new Set([...existingMembers, ...newUsers])];

  updateDoc(doc(db, "groups", groupId), {
    members: updatedMembers
  }).then(() => {
    alert("Members added!");
  }).catch(err => {
    console.error("Error updating members:", err);
    alert("Failed to add members.");
  });
}
