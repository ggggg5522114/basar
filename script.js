// Mobile menu
const menuBtn = document.getElementById("menuBtn");
const navLinks = document.getElementById("navLinks");

menuBtn?.addEventListener("click", () => {
  const isOpen = navLinks.classList.toggle("open");
  menuBtn.setAttribute("aria-expanded", String(isOpen));
});

// Close menu when clicking a link (mobile)
navLinks?.addEventListener("click", (e) => {
  const target = e.target;
  if (target && target.tagName === "A") {
    navLinks.classList.remove("open");
    menuBtn.setAttribute("aria-expanded", "false");
  }
});

// Reveal on scroll (animations)
const reveals = document.querySelectorAll(".reveal");
const io = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) entry.target.classList.add("is-visible");
  });
}, { threshold: 0.15 });

reveals.forEach(el => io.observe(el));

// Contact form: open mail client (no server needed)
const form = document.getElementById("contactForm");
form?.addEventListener("submit", (e) => {
  e.preventDefault();

  const name = form.querySelector('[name="name"]').value.trim();
  const email = form.querySelector('[name="email"]').value.trim();
  const message = form.querySelector('[name="message"]').value.trim();

  const subject = encodeURIComponent(`رسالة من موقع بصر - ${name}`);
  const body = encodeURIComponent(
    `الاسم: ${name}\nالبريد: ${email}\n\nالرسالة:\n${message}`
  );

  // غيّر البريد إلى بريدكم الحقيقي
  window.location.href = `mailto:info@basar.com?subject=${subject}&body=${body}`;
});
