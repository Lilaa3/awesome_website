function getBasePath() {
    const path = window.location.pathname;
    if (path.includes("/pages/blog_posts/")) return "../../";
    if (path.includes("/pages/")) return "../";
    return "./";
}

const BASE_PATH = getBasePath();

const CONFIG = {
    timezone: "Europe/London",
    birthDate: { year: 2006, month: 9, day: 14 },
    debugMode: false,
    debugTime: "03:00", // 24-hour format
    kofiUsername: "lilaa3",
    components: [
        ["head-placeholder", `${BASE_PATH}pages/templates/head.html`],
        ["header-placeholder", `${BASE_PATH}pages/templates/header.html`],
        ["footer-placeholder", `${BASE_PATH}pages/templates/footer.html`],
    ],
};

const state = {
    currentLanguage: null,
    clockInterval: null,
    popupTimers: new Map(),
};

// Component & Widget Loading
async function loadComponent(elementId, filePath) {
    try {
        const response = await fetch(filePath);
        if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);

        const element = document.getElementById(elementId);
        if (!element) throw new Error(`Target element #${elementId} not found`);

        element.innerHTML = await response.text();
        element.querySelectorAll("[data-root-src]").forEach((el) => {
            el.setAttribute("src", BASE_PATH + el.dataset.rootSrc);
            el.removeAttribute("data-root-src");
        });
        element.querySelectorAll("[data-root-href]").forEach((el) => {
            el.setAttribute("href", BASE_PATH + el.dataset.rootHref);
            el.removeAttribute("data-root-href");
        });
        document.dispatchEvent(new CustomEvent("component:loaded", { detail: { component: elementId } }));
    } catch (error) {
        console.error(`Failed to load component "${elementId}" from "${filePath}":`, error);
    }
}

function loadKofiWidget() {
    const script = document.createElement("script");
    script.src = "https://storage.ko-fi.com/cdn/scripts/overlay-widget.js";
    script.onload = () => {
        if (window.kofiWidgetOverlay) {
            kofiWidgetOverlay.draw(CONFIG.kofiUsername, {
                type: "floating-chat",
                "floating-chat.donateButton.text": "Support me",
                "floating-chat.donateButton.background-color": "#794bc4",
                "floating-chat.donateButton.text-color": "#fff",
            });
        }
    };
    document.body.appendChild(script);
}

// Localization (i18n)
async function setLanguage(lang) {
    if (state.currentLanguage === lang) return;

    try {
        const response = await fetch(`${BASE_PATH}locales/${lang}.json`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();

        state.currentLanguage = lang;
        document.title = data.page_title || document.title;

        document.querySelectorAll("[data-i18n]").forEach((element) => {
            const key = element.getAttribute("data-i18n");
            const translation = data[key];
            if (!translation) return;

            const attr = element.getAttribute("data-i18n-attr");
            if (attr === "alt") {
                element.setAttribute("alt", translation);
            } else if (attr === "clock") {
                element.setAttribute("clock-format-template", translation);
            } else {
                element.innerHTML = translation;
            }
        });

        localStorage.setItem("language", lang);
        updateClock();
        updateAge();

        document.dispatchEvent(new CustomEvent("language:updated"));
    } catch (error) {
        console.error(`Error loading language "${lang}":`, error);
    }
}

function initializeLanguage() {
    const langMap = { en: "en-us", pt: "pt-pt" };
    const saved = localStorage.getItem("language") || "en-us";
    setLanguage(langMap[saved] || saved);
}

// Dynamic UI (Clock, Age, Animations)
function getCurrentTime() {
    if (CONFIG.debugMode) {
        const [h, m] = CONFIG.debugTime.split(":").map(Number);
        const debugDate = new Date();
        debugDate.setHours(h, m, 0, 0);
        return debugDate;
    }
    return new Date(new Date().toLocaleString("en-US", { timeZone: CONFIG.timezone }));
}

function updateClock() {
    const clockEl = document.getElementById("clock");
    if (!clockEl) return;

    const now = getCurrentTime();
    const hours = now.getHours();
    const formattedTime = now.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
    });

    const isAwake = hours >= 7 && hours < 23;
    document.body.classList.toggle("sleeping", !isAwake);

    const template = clockEl.getAttribute("clock-format-template") || "{time}";
    clockEl.textContent = template.replace("{time}", formattedTime);
}

function startClock() {
    updateClock();
    if (state.clockInterval) clearInterval(state.clockInterval);
    state.clockInterval = setInterval(updateClock, 1000);
}

function updateAge() {
    const ageEl = document.getElementById("age");
    if (!ageEl) return;

    const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Lisbon" }));
    const { year, month, day } = CONFIG.birthDate;

    let age = now.getFullYear() - year;
    const currentMonth = now.getMonth() + 1;
    if (currentMonth < month || (currentMonth === month && now.getDate() < day)) {
        age--;
    }

    ageEl.textContent = age;
}

function setupSocialIcons() {
    document.querySelectorAll(".social_icons").forEach((icon) => {
        icon.addEventListener("mouseenter", () => {
            icon.style.animation = "scaleUpKeyframes 0.2s forwards";
        });
        icon.addEventListener("mouseleave", () => {
            icon.style.animation = "bobbingKeyframes 2s infinite steps(3)";
        });
    });
}

// Utilities & Initialization
async function copyPopup(textToCopy, name) {
    try {
        await navigator.clipboard.writeText(textToCopy);

        const sound = document.getElementById("copy-sound");
        if (sound) {
            sound.currentTime = 0;
            sound.play().catch(() => {}); // Ignore autoplay restriction errors
        }

        const popup = document.getElementById(`copy-popup-${name}`);
        if (!popup) return;

        if (state.popupTimers.has(name)) {
            clearTimeout(state.popupTimers.get(name));
        }

        popup.classList.add("show");
        const timerId = setTimeout(() => {
            popup.classList.remove("show");
            state.popupTimers.delete(name);
        }, 1500);

        state.popupTimers.set(name, timerId);
    } catch (error) {
        console.error("Failed to copy text:", error);
    }
}

async function initPage() {
    // Load all HTML
    await Promise.all(
        CONFIG.components.map(([id, path]) => loadComponent(id, path))
    );

    // Update footer copyright year after footer is guaranteed to be in the DOM
    const copyrightYear = document.getElementById("current-year");
    if (copyrightYear) {
        copyrightYear.textContent = new Date().getFullYear();
    }

    await initializeLanguage();
    setupSocialIcons();
    startClock();
    loadKofiWidget();

    document.body.classList.add("loaded");
}

document.addEventListener("DOMContentLoaded", initPage);