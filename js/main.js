// CURSOR - merged into single rAF
const ring = document.getElementById("cursorRing"),
    dot = document.getElementById("cursorDot");
let rx = 0,
    ry = 0,
    cdx = 0,
    cdy = 0;
document.addEventListener("mousemove", (e) => {
    cdx = e.clientX;
    cdy = e.clientY;
    dot.style.transform = `translate(${cdx - 0.5}px,${cdy - 0.5}px) translate(-50%,-50%)`;
    ring.classList.add("visible");
    dot.classList.add("visible");
});
(function ac() {
    rx += (cdx - rx) * 0.12;
    ry += (cdy - ry) * 0.12;
    ring.style.transform = `translate(${rx - 0.5}px,${ry - 0.5}px) translate(-50%,-50%)`;
    requestAnimationFrame(ac);
})();
document
    .querySelectorAll("a,.btn,button,.svc-card,.test-card,.price-card")
    .forEach((el) => {
        el.addEventListener("mouseenter", () => ring.classList.add("hover"));
        el.addEventListener("mouseleave", () =>
            ring.classList.remove("hover"),
        );
    });
// NAV + BACK TO TOP - throttled scroll
const nav = document.getElementById("nav");
const backToTop = document.getElementById("backToTop");
const serviciosSection = document.getElementById("servicios");
let scrollTick = false;
addEventListener("scroll", () => {
    if (!scrollTick) {
        scrollTick = true;
        requestAnimationFrame(() => {
            nav.classList.toggle("scrolled", scrollY > 60);
            if (backToTop && serviciosSection) {
                const show = scrollY >= serviciosSection.offsetTop - 200;
                backToTop.classList.toggle("visible", show);
            }
            scrollTick = false;
        });
    }
});
if (backToTop) {
    backToTop.addEventListener("click", (e) => {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: "smooth" });
    });
}
const hb = document.getElementById("hamburger"),
    nm = document.getElementById("navMenu");
hb.addEventListener("click", () => {
    hb.classList.toggle("open");
    nm.classList.toggle("open");
    document.body.classList.toggle("menu-open");
});
nm.querySelectorAll("a").forEach((a) =>
    a.addEventListener("click", () => {
        hb.classList.remove("open");
        nm.classList.remove("open");
        document.body.classList.remove("menu-open");
    }),
);
// SCROLL REVEAL
const obs = new IntersectionObserver(
    (en) => {
        en.forEach((e) => {
            if (e.isIntersecting) {
                e.target.classList.add("vis");
                obs.unobserve(e.target);
            }
        });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
);
document.querySelectorAll(".sr").forEach((el) => obs.observe(el));
// FAQ
document.querySelectorAll(".faq-q").forEach((q) => {
    q.addEventListener("click", () => {
        const item = q.parentElement;
        const o = item.classList.contains("open");
        document.querySelectorAll(".faq-item").forEach((i) => i.classList.remove("open"));
        document.querySelectorAll(".faq-q").forEach((b) => b.setAttribute("aria-expanded", "false"));
        if (!o) {
            item.classList.add("open");
            q.setAttribute("aria-expanded", "true");
        }
    });
});
// COUNTER
const cObs = new IntersectionObserver(
    (en) => {
        en.forEach((e) => {
            if (e.isIntersecting) {
                document.querySelectorAll("[data-count]").forEach((el) => {
                    const tgt = +el.dataset.count;
                    let cur = 0;
                    const inc = tgt / 35;
                    const tm = setInterval(() => {
                        cur += inc;
                        if (cur >= tgt) {
                            el.textContent = tgt + "+";
                            clearInterval(tm);
                        } else el.textContent = Math.floor(cur) + "+";
                    }, 40);
                });
                cObs.unobserve(e.target);
            }
        });
    },
    { threshold: 0.5 },
);
const sb = document.querySelector(".stats-bar");
if (sb) cObs.observe(sb);
// SMOOTH SCROLL
document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", function (e) {
        e.preventDefault();
        const t = document.querySelector(this.getAttribute("href"));
        if (t) t.scrollIntoView({ behavior: "smooth", block: "start" });
    });
});
// 3D TILT - throttled with rAF
document
    .querySelectorAll(".svc-card,.price-card,.test-card")
    .forEach((card) => {
        let tiltRaf = 0,
            rect = null;
        card.addEventListener("mousemove", (e) => {
            if (tiltRaf) return;
            tiltRaf = requestAnimationFrame(() => {
                if (!rect) rect = card.getBoundingClientRect();
                const x = (e.clientX - rect.left) / rect.width - 0.5;
                const y = (e.clientY - rect.top) / rect.height - 0.5;
                card.style.transform = `translateY(-6px) perspective(600px) rotateX(${-y * 8}deg) rotateY(${x * 8}deg)`;
                tiltRaf = 0;
            });
        });
        card.addEventListener("mouseleave", () => {
            rect = null;
            card.style.transform = "";
            card.style.transition = "all .5s cubic-bezier(.22,1,.36,1)";
        });
        card.addEventListener("mouseenter", () => {
            rect = card.getBoundingClientRect();
            card.style.transition = "transform .1s";
        });
    });

// COOKIE CONSENT BANNER
(function () {
    const banner = document.getElementById("cookieBanner");
    const acceptBtn = document.getElementById("cookieAccept");
    const rejectBtn = document.getElementById("cookieReject");
    const settingsLink = document.getElementById("cookieSettings");
    if (!banner) return;

    function showBanner() {
        banner.classList.add("visible");
    }

    function hideBanner() {
        banner.classList.remove("visible");
    }

    // Check consent status on load
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) {
        setTimeout(showBanner, 800);
    }

    if (acceptBtn) {
        acceptBtn.addEventListener("click", function () {
            localStorage.setItem("cookie-consent", "accepted");
            hideBanner();
            if (typeof loadGTM === "function") loadGTM();
        });
    }

    if (rejectBtn) {
        rejectBtn.addEventListener("click", function () {
            localStorage.setItem("cookie-consent", "rejected");
            hideBanner();
        });
    }

    if (settingsLink) {
        settingsLink.addEventListener("click", function (e) {
            e.preventDefault();
            localStorage.removeItem("cookie-consent");
            showBanner();
        });
    }
})();