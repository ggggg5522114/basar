const menuBtn = document.getElementById("menuBtn");
const navLinks = document.getElementById("navLinks");

if (menuBtn && navLinks) {
  menuBtn.addEventListener("click", () => {
    navLinks.classList.toggle("open");
  });
}

const reveals = document.querySelectorAll(".reveal");

function revealOnScroll() {
  reveals.forEach((element) => {
    const windowHeight = window.innerHeight;
    const elementTop = element.getBoundingClientRect().top;

    if (elementTop < windowHeight - 100) {
      element.classList.add("active");
    }
  });
}

window.addEventListener("scroll", revealOnScroll);
window.addEventListener("load", revealOnScroll);

// Counter animation
const counters = document.querySelectorAll("[data-target]");
let countersStarted = false;

function animateCounters() {
  if (countersStarted) return;

  const statsSection = document.querySelector(".stats-section");
  if (!statsSection) return;

  const sectionTop = statsSection.getBoundingClientRect().top;
  if (sectionTop < window.innerHeight - 100) {
    countersStarted = true;

    counters.forEach(counter => {
      const target = +counter.dataset.target;
      let current = 0;
      const step = Math.max(1, Math.ceil(target / 40));

      const timer = setInterval(() => {
        current += step;
        if (current >= target) {
          counter.textContent = target + "+";
          clearInterval(timer);
        } else {
          counter.textContent = current;
        }
      }, 35);
    });
  }
}

window.addEventListener("scroll", animateCounters);
window.addEventListener("load", animateCounters);

// Lightbox
const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightboxImg");
const lightboxClose = document.getElementById("lightboxClose");
const openButtons = document.querySelectorAll(".open-lightbox");

openButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    const imgSrc = btn.dataset.img;
    if (!lightbox || !lightboxImg) return;
    lightboxImg.src = imgSrc;
    lightbox.classList.add("show");
  });
});

if (lightboxClose && lightbox) {
  lightboxClose.addEventListener("click", () => {
    lightbox.classList.remove("show");
  });

  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) {
      lightbox.classList.remove("show");
    }
  });
}

// EmailJS
if (typeof emailjs !== "undefined") {
  emailjs.init({
    publicKey: "577y7DltqKqmOXhwx"
  });
}

const contactForm = document.getElementById("contact-form");
if (contactForm) {
  contactForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const status = document.getElementById("form-status");
    status.textContent = "جاري إرسال الرسالة...";

    emailjs.sendForm(
      "service_t57rwys",
      "template_9qt9yso",
      this
    ).then(function () {
      status.textContent = "تم إرسال الرسالة بنجاح ✅";
      contactForm.reset();
    }, function () {
      status.textContent = "حدث خطأ أثناء الإرسال ❌";
    });
  });
}

// Login
function togglePassword() {
  const passInput = document.getElementById("pass");
  const toggleBtn = document.querySelector(".toggle-pass");

  if (!passInput || !toggleBtn) return;

  if (passInput.type === "password") {
    passInput.type = "text";
    toggleBtn.textContent = "إخفاء";
  } else {
    passInput.type = "password";
    toggleBtn.textContent = "إظهار";
  }
}

function login() {
  const pass = document.getElementById("pass")?.value.trim();
  const msg = document.getElementById("msg");

  if (!msg) return;

  const MEMBER_PASSWORD = "BASAR123";

  if (pass === MEMBER_PASSWORD) {
    localStorage.setItem("basar_logged", "yes");
    msg.textContent = "تم تسجيل الدخول بنجاح، جاري التحويل...";
    msg.className = "login-msg success-msg";
    window.location.href = "dashboard.html";
  } else {
    msg.textContent = "كلمة المرور غير صحيحة";
    msg.className = "login-msg error-msg";
  }
}

const passInput = document.getElementById("pass");
if (passInput) {
  passInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      login();
    }
  });
}

// Dashboard protection
if (window.location.pathname.includes("dashboard.html")) {
  if (localStorage.getItem("basar_logged") !== "yes") {
    window.location.href = "login.html";
  }
}

function logout() {
  localStorage.removeItem("basar_logged");
  window.location.href = "login.html";
}

// SheetDB
const API_URL = "https://sheetdb.io/api/v1/yif5p1hj2cn27";

async function sendUpdate() {
  const name = document.getElementById("name")?.value.trim();
  const project = document.getElementById("project")?.value.trim();
  const update = document.getElementById("update")?.value.trim();
  const status = document.getElementById("status");

  if (!status) return;

  if (!name || !project || !update) {
    status.textContent = "رجاءً عبّئ جميع الحقول.";
    status.className = "dashboard-status error-msg";
    return;
  }

  status.textContent = "جاري الحفظ...";
  status.className = "dashboard-status muted";

  try {
    const payload = {
      data: [{
        name,
        project,
        update,
        date: new Date().toLocaleString("ar-SA")
      }]
    };

    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error("POST failed");

    status.textContent = "تم حفظ التحديث بنجاح ✅";
    status.className = "dashboard-status success-msg";

    document.getElementById("name").value = "";
    document.getElementById("project").value = "";
    document.getElementById("update").value = "";

    await loadUpdates();
  } catch (e) {
    status.textContent = "حدث خطأ أثناء الحفظ. تأكد من إعدادات SheetDB وأسماء الأعمدة.";
    status.className = "dashboard-status error-msg";
  }
}

async function loadUpdates() {
  const list = document.getElementById("list");
  if (!list) return;

  list.innerHTML = '<p class="muted">جاري تحميل التحديثات...</p>';

  try {
    const res = await fetch(API_URL);
    const rows = await res.json();

    if (!Array.isArray(rows) || rows.length === 0) {
      list.innerHTML = '<p class="muted">لا توجد تحديثات بعد.</p>';
      return;
    }

    const last = rows.slice(-12).reverse();

    list.innerHTML = "";
    last.forEach(r => {
      const item = document.createElement("div");
      item.className = "update-item";

      item.innerHTML = `
        <div class="update-top">
          <strong>${r.name || "عضو"}</strong>
          <span class="muted">${r.project || "مشروع"}</span>
        </div>
        <p class="update-text">${r.update || ""}</p>
        <span class="update-date">${r.date || ""}</span>
      `;

      list.appendChild(item);
    });
  } catch (e) {
    list.innerHTML = '<p class="error-msg">تعذر تحميل التحديثات.</p>';
  }
}

if (document.getElementById("list")) {
  loadUpdates();
  setInterval(loadUpdates, 20000);
}
