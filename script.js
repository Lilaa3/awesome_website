async function loadComponent(elementId, filePath) {
    try {
        const response = await fetch(filePath);
        if (!response.ok) {
            throw new Error(`Failed to load ${filePath}: ${response.statusText}`);
        }
        const html = await response.text();
        document.getElementById(elementId).innerHTML = html;

        document.dispatchEvent(new CustomEvent('component:loaded', { detail: { component: elementId } }));

    } catch (error) {
        console.error("Error loading component:", error);
    }
}


const TIMEZONE = "Europe/London";
const DEBUG_MODE = false;
const DEBUG_TIME = "03:00"; // 24 hour format

let gCurrentLanguage = null;

/*Load from json and apply language*/
async function setLanguage(lang) {
    if (gCurrentLanguage === lang) return; // skip if already loaded

    let data;
    // get the translation data from json
    try {
        const response = await fetch(`locales/${lang}.json`);
        data = await response.json();
        console.log(`Loaded translations for ${lang}`);
    } catch (error) {
        console.error(`Error loading language ${lang}:`, error);
        return;
    }

    gCurrentLanguage = lang;

    document.title = data.page_title;
    document.querySelectorAll('[data-i18n]').forEach(element => { // all localized elements
        const key = element.getAttribute('data-i18n');
        if (data[key]) {
            const attr = element.getAttribute('data-i18n-attr');
            if (attr === 'alt') { // special case for alt
                element.setAttribute('alt', data[key]);
            }
            else if (attr === 'clock') {
                element.setAttribute('clock-format-template', data[key]);
            }
            else {
                element.innerHTML = data[key];
            }
        }
    });

    // save the preference
    localStorage.setItem('language', lang);

    updateClock(); // update clock since this resets it
}

function initializeLanguage() {
    const savedLang = localStorage.getItem('language') || 'en';
    setLanguage(savedLang);
}

// Social icons, animations!
// Basic hover can be done in css butttt i wanted the bob animation to pause on hover
function setupSocialIcons() {
    const icons = document.querySelectorAll(".social_icons");

    for (const icon of icons) {
        icon.addEventListener("mouseenter", () => {
            icon.style.animation = "scaleUpKeyframes 0.2s forwards";
        });

        icon.addEventListener("mouseleave", () => {
            icon.style.animation = "bobbingKeyframes 2s infinite steps(3)";
        });
    }
}

function getCurrentTime() {
    if (DEBUG_MODE) {
        // Parse debug time manually
        const [h, m] = DEBUG_TIME.split(":").map(Number);
        const now = new Date();
        now.setHours(h, m, 0, 0);
        return now;
    }

    return new Date(
        new Date().toLocaleString("en-US", { timeZone: TIMEZONE })
    );
}

function updateClock() {
    const clockEl = document.getElementById("clock");
    if (!clockEl) {
        console.log("Clock element not found");
        return;
    }
    const now = getCurrentTime();
    const hours = now.getHours();
    const formattedTime = now.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
    });

    // Simple day/night logic
    const isAwake = hours >= 7 && hours < 23;
    document.body.classList.toggle("sleeping", !isAwake);

    const template = clockEl.getAttribute("clock-format-template");
    clockEl.textContent = template.replace("{time}", formattedTime);
}



function main() {
    // Set the footer
    loadComponent('head-placeholder', 'head.html')
    loadComponent("language-placeholder", "language_options.html")
    loadComponent('footer-placeholder', 'footer.html')

    initializeLanguage();
    setupSocialIcons();
    updateClock();
    setInterval(updateClock, 1000);

    const copyrightYear = document.getElementById("copyright-year");
    if (copyrightYear) {
        copyrightYear.textContent = new Date().getFullYear();
    }
    setTimeout(() => {
        document.body.classList.add('loaded');
    }, 120); // wow lila thats such a high number! its noticable lila! aha firefox you're fucking my css. you piece of absolute garbage
}

const popupTimers = {};

function copyPopup(textToCopy, name) {
    // This is how I find out js doesn´t have asserts, WTF
    const popup = document.getElementById('copy-popup-' + name);
    const sound = document.getElementById('copy-sound');

    navigator.clipboard.writeText(textToCopy)
        .then(() => {
            if (sound) {
                sound.currentTime = 0;
                sound.play();
            }

            if (popup) {
                if (popupTimers[name]) {
                    clearTimeout(popupTimers[name]);
                    popupTimers[name] = null; // why can't i use delete as stated in mdn
                    console.log('clearing timer')
                }
                popup.classList.add('show');
                popupTimers[name] = setTimeout(() => {
                    popup.classList.remove('show');
                }, 1500);
            }
        })
}

document.addEventListener("DOMContentLoaded", main);
