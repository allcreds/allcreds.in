document.addEventListener("DOMContentLoaded", () => {
  // Mobile menu toggle
  const hamburger = document.getElementById("hamburger");
  const navLinks = document.querySelector(".nav-links");

  if (hamburger && navLinks) {
    hamburger.addEventListener("click", () => {
      navLinks.classList.toggle("show");
    });
  }

  // Scroll to Top Button & Circular Progress
  const scrollBtn = document.getElementById("scrollToTopBtn");
  const progress = document.getElementById("scrollProgress");

  if (scrollBtn) {
    window.addEventListener("scroll", () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolled = (scrollTop / docHeight) * 283;

      // Toggle button visibility
      scrollBtn.style.display = scrollTop > 100 ? "flex" : "none";

      // Update circular progress if available
      if (progress) {
        progress.style.strokeDashoffset = 283 - scrolled;
      }
    });

    scrollBtn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }
});

import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";

// Firebase Init
const auth = getAuth();
const db = getFirestore();

document.getElementById("loginForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const mobile = document.getElementById("mobile").value.trim();
  const password = document.getElementById("password").value;

  // Step 1: Check if mobile number is allowed
  const docRef = doc(db, "allowedUsers", mobile);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    alert("Access Denied: Your number is not authorized.");
    return;
  }

  // Step 2: Try login (with fake domain style email)
  const email = `${mobile}@allcreds.internal`;

  signInWithEmailAndPassword(auth, email, password)
    .then(() => {
      window.location.href = "index.html";
    })
    .catch((error) => {
      console.error("Login error:", error.message);
      alert("Login failed. Check your credentials.");
    });
});

let allUsers = [];

async function loadUsers() {
  const querySnapshot = await getDocs(collection(db, "users"));
  allUsers = []; // reset user list
  querySnapshot.forEach((doc) => {
    const userData = doc.data();
    if (userData.name !== loggedInUser) {
      allUsers.push(userData.name);
    }
  });
  displayUsers(allUsers);
}

function displayUsers(users) {
  userList.innerHTML = "";
  users.forEach((name) => {
    const div = document.createElement("div");
    div.classList.add("user");
    div.textContent = name;
    div.onclick = () => selectUser(name);
    userList.appendChild(div);
  });
}

document.getElementById("searchInput").addEventListener("input", (e) => {
  const searchTerm = e.target.value.toLowerCase();
  const filtered = allUsers.filter(name => name.toLowerCase().includes(searchTerm));
  displayUsers(filtered);
});
let loggedInUser = localStorage.getItem("loggedInUser") || "Admin";
document.getElementById("loggedInUserDisplay").textContent = `Logged in as: ${loggedInUser}`;
