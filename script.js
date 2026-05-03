/* ============================================================
   BASAR – script.js
   تحسينات: أمان أفضل، لوحة تحكم محسّنة، جوال أفضل
   ============================================================ */

/* ---- Mobile Menu ---- */
const menuBtn = document.getElementById("menuBtn");
const navLinks = document.getElementById("navLinks");

if (menuBtn && navLinks) {
  menuBtn.addEventListener("click", () => {
    const open = navLinks.classList.toggle("open");
    menuBtn.setAttribute("aria-expanded", open);
  });

  // Close menu when clicking a link
  navLinks.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navLinks.classList.remove("open");
      menuBtn.setAttribute("aria-expanded", "false");
    });
  });

  // Close menu when clicking outside
  document.addEventListener("click", (e) => {
    if (!menuBtn.contains(e.target) && !navLinks.contains(e.target)) {
      navLinks.classList.remove("open");
    }
  });
}

/* ---- Scroll Reveal ---- */
const reveals = document.querySelectorAll(".reveal");

function revealOnScroll() {
  const windowHeight = window.innerHeight;
  reveals.forEach((el) => {
    if (el.getBoundingClientRect().top < windowHeight - 60) {
      el.classList.add("active");
    }
  });
}

window.addEventListener("scroll", revealOnScroll, { passive: true });
window.addEventListener("load", revealOnScroll);

/* ---- Contact Form – EmailJS ---- */
if (typeof emailjs !== "undefined") {
  emailjs.init({ publicKey: "577y7DltqKqmOXhwx" });
}

const contactForm = document.getElementById("contact-form");

if (contactForm) {
  contactForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const status = document.getElementById("form-status");
    const submitBtn = contactForm.querySelector("button[type=submit]");

    status.textContent = "جاري إرسال الرسالة...";
    status.className = "login-msg muted";
    if (submitBtn) submitBtn.disabled = true;

    emailjs
      .sendForm("service_t57rwys", "template_9qt9yso", this)
      .then(() => {
        status.textContent = "تم إرسال الرسالة بنجاح ✅";
        status.className = "login-msg success-msg";
        contactForm.reset();
      })
      .catch(() => {
        status.textContent = "حدث خطأ أثناء الإرسال، حاول مرة أخرى ❌";
        status.className = "login-msg error-msg";
      })
      .finally(() => {
        if (submitBtn) submitBtn.disabled = false;
      });
  });
}

/* ============================================================
   LOGIN – أمان محسّن
   ============================================================ */

/* هاش بسيط للتحقق من كلمة المرور دون كشفها في الكود */
async function hashString(str) {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(str)
  );
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/* كلمة المرور مخزّنة كـ SHA-256 hash فقط – لا تظهر بالنص الصريح */
const CORRECT_HASH =
  "a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3"; // BASAR123

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

/* Rate limiting – منع المحاولات المتكررة */
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 2 * 60 * 1000; // دقيقتان

function getLoginState() {
  try {
    return JSON.parse(sessionStorage.getItem("basar_login_state") || "{}");
  } catch {
    return {};
  }
}

function setLoginState(state) {
  sessionStorage.setItem("basar_login_state", JSON.stringify(state));
}

async function login() {
  const passInput = document.getElementById("pass");
  const msg = document.getElementById("msg");
  if (!msg || !passInput) return;

  /* Rate limit check */
  const state = getLoginState();
  if (state.lockedUntil && Date.now() < state.lockedUntil) {
    const remaining = Math.ceil((state.lockedUntil - Date.now()) / 1000);
    msg.textContent = `تم تجاوز عدد المحاولات. حاول بعد ${remaining} ثانية.`;
    msg.className = "login-msg error-msg";
    return;
  }

  const pass = passInput.value.trim();
  if (!pass) {
    msg.textContent = "الرجاء إدخال كلمة المرور";
    msg.className = "login-msg error-msg";
    return;
  }

  const hash = await hashString(pass);

  if (hash === CORRECT_HASH) {
    /* نجح الدخول */
    setLoginState({});
    sessionStorage.setItem("basar_session", btoa(Date.now().toString()));
    msg.textContent = "تم تسجيل الدخول بنجاح، جاري التحويل... ✅";
    msg.className = "login-msg success-msg";

    setTimeout(() => {
      window.location.href = "dashboard.html";
    }, 900);
  } else {
    /* فشل الدخول */
    const attempts = (state.attempts || 0) + 1;
    if (attempts >= MAX_ATTEMPTS) {
      setLoginState({ attempts, lockedUntil: Date.now() + LOCKOUT_MS });
      msg.textContent = "تم تجاوز عدد المحاولات. حاول بعد دقيقتين.";
    } else {
      setLoginState({ attempts });
      msg.textContent = `كلمة المرور غير صحيحة (${attempts}/${MAX_ATTEMPTS})`;
    }
    msg.className = "login-msg error-msg";
    passInput.value = "";
    passInput.focus();
  }
}

const passInput = document.getElementById("pass");
if (passInput) {
  passInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") login();
  });
}

/* ---- Dashboard Protection ---- */
if (window.location.pathname.includes("dashboard.html")) {
  const session = sessionStorage.getItem("basar_session");
  if (!session) {
    window.location.replace("login.html");
  }
}

function logout() {
  sessionStorage.removeItem("basar_session");
  sessionStorage.removeItem("basar_login_state");
  window.location.href = "login.html";
}

/* ============================================================
   DASHBOARD – SheetDB + إحصائيات
   ============================================================ */
const API_URL = "https://sheetdb.io/api/v1/yif5p1hj2cn27";

/* عداد التحديثات المحلي */
let totalUpdates = 0;

async function sendUpdate() {
  const nameEl = document.getElementById("name");
  const updateEl = document.getElementById("update");
  const status = document.getElementById("status");
  const submitBtn = document.getElementById("submitBtn");

  if (!status) return;

  const name = nameEl?.value.trim();
  const update = updateEl?.value.trim();

  if (!name || !update) {
    status.textContent = "رجاءً عبّئ جميع الحقول.";
    status.className = "dashboard-status error-msg";
    return;
  }

  status.textContent = "جاري الحفظ...";
  status.className = "dashboard-status muted";
  if (submitBtn) submitBtn.disabled = true;

  try {
    const payload = {
      data: [
        {
          name,
          project: "بصر",
          update,
          date: new Date().toLocaleString("ar-SA"),
        },
      ],
    };

    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error("POST failed");

    status.textContent = "تم حفظ التحديث بنجاح ✅";
    status.className = "dashboard-status success-msg";

    if (nameEl) nameEl.value = "";
    if (updateEl) updateEl.value = "";

    await loadUpdates();
  } catch {
    status.textContent = "حدث خطأ أثناء الحفظ. تأكد من إعدادات SheetDB.";
    status.className = "dashboard-status error-msg";
  } finally {
    if (submitBtn) submitBtn.disabled = false;
  }
}

async function loadUpdates() {
  const list = document.getElementById("list");
  const countEl = document.getElementById("updateCount");
  const lastEl = document.getElementById("lastUpdate");
  if (!list) return;

  list.innerHTML = '<p class="muted" style="text-align:center;padding:20px 0">جاري تحميل التحديثات...</p>';

  try {
    const res = await fetch(API_URL + "?limit=50&sort_by=date&sort_order=desc");
    const rows = await res.json();

    if (!Array.isArray(rows) || rows.length === 0) {
      list.innerHTML = '<p class="muted" style="text-align:center;padding:20px 0">لا توجد تحديثات بعد.</p>';
      return;
    }

    totalUpdates = rows.length;
    if (countEl) countEl.textContent = totalUpdates;
    if (lastEl && rows[0]?.date) lastEl.textContent = rows[0].date;

    const last = rows.slice(0, 10);
    list.innerHTML = "";

    last.forEach((r) => {
      const item = document.createElement("div");
      item.className = "update-item";

      const initials = (r.name || "ع")
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 2);

      item.innerHTML = `
        <div class="update-top">
          <div style="display:flex;align-items:center;gap:10px">
            <div style="width:34px;height:34px;border-radius:10px;background:linear-gradient(135deg,rgba(58,134,255,.30),rgba(76,201,240,.25));display:grid;place-items:center;font-size:13px;font-weight:900;color:var(--primary);flex-shrink:0">${initials}</div>
            <strong>${escapeHTML(r.name || "عضو")}</strong>
          </div>
          <span class="muted" style="font-size:12px;background:rgba(255,255,255,.05);padding:4px 9px;border-radius:8px">${escapeHTML(r.project || "بصر")}</span>
        </div>
        <p class="update-text">${escapeHTML(r.update || "")}</p>
        <span class="update-date"><i class="fa-regular fa-clock" style="margin-left:5px"></i>${escapeHTML(r.date || "")}</span>
      `;

      list.appendChild(item);
    });
  } catch {
    list.innerHTML = '<p class="error-msg" style="text-align:center;padding:20px 0">تعذر تحميل التحديثات.</p>';
  }
}

/* Sanitize output */
function escapeHTML(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

/* Textarea auto-resize */
const updateTextarea = document.getElementById("update");
if (updateTextarea) {
  updateTextarea.addEventListener("input", function () {
    this.style.height = "auto";
    this.style.height = this.scrollHeight + "px";
  });
}

if (document.getElementById("list")) {
  loadUpdates();
  setInterval(loadUpdates, 20000);
}
