// Signin画面遷移
document.getElementById("sign-in-btn").addEventListener("click", () => {
  window.location.href = "../Auth/signIn/signin.html";
});

// Lucide icons
lucide.createIcons();

/* ===== Navbar Scroll ===== */
const navbar = document.getElementById('navbar');

window.addEventListener('scroll', () => {
  if (window.scrollY > 50) {
    navbar.classList.remove('bg-transparent', 'py-6');
    navbar.classList.add(
      'bg-[#050505]/80',
      'backdrop-blur-md',
      'py-4',
      'border-b',
      'border-white/5'
    );
  } else {
    navbar.classList.add('bg-transparent', 'py-6');
    navbar.classList.remove(
      'bg-[#050505]/80',
      'backdrop-blur-md',
      'py-4',
      'border-b',
      'border-white/5'
    );
  }
});

/* ===== Mobile Menu ===== */
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const mobileMenu = document.getElementById('mobile-menu');

mobileMenuBtn.addEventListener('click', () => {
  mobileMenu.classList.toggle('hidden');
  mobileMenu.classList.toggle('flex');
});

/* ===== Chat Animation ===== */
let chatStep = 0;
const totalSteps = 4;
const typingIndicator = document.getElementById('typing-indicator');

function updateChat() {
  chatStep = (chatStep + 1) % totalSteps;

  for (let i = 0; i < totalSteps; i++) {
    const msg = document.getElementById(`msg-${i}`);
    if (i <= chatStep) {
      msg.classList.remove('chat-hidden');
      msg.classList.add('chat-visible');
    } else {
      msg.classList.add('chat-hidden');
      msg.classList.remove('chat-visible');
    }
  }

  if (chatStep === 0 || chatStep === 2) {
    setTimeout(() => {
      typingIndicator.classList.remove('opacity-0');
    }, 800);
  } else {
    typingIndicator.classList.add('opacity-0');
  }
}

setInterval(updateChat, 3000);