const TIMEZONE = "Europe/London";
const DEBUG_MODE = false;
const DEBUG_TIME = "03:00"; // 24 hour format

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

    const clockEl = document.getElementById("clock");
    clockEl.textContent = `It’s ${formattedTime} for me!! :O`;;
}



function main() {
    setupSocialIcons();
    updateClock();
    setInterval(updateClock, 1000);
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
