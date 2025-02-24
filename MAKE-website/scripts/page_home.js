async function login() {
    const id = document.getElementById('college-id-input').value ?? "";

    let collegeID = parseCollegeID(id);

    if (collegeID !== null) {
        state.college_id = collegeID;

        const result = await updateUserInfo();

        if (result) {
            displayLoggedIn();
        } else {
            displayLoginError();
        }
    }
}

function displayLoginError() {
    const login_error = document.getElementById('login-error');

    login_error.classList.remove('hidden');
}

function hideLoginError() {
    const login_error = document.getElementById('login-error');

    login_error.classList.add('hidden');    
}

function logout() {
    state.user_object = null;
    state.college_id = null;

    saveState();

    displayLoggedOut();
}

const font_list = [
    "Edu VIC WA NT Beginner",
    "Libre Baskerville",
    "Dancing Script",
    "Varela Round",
    "Pacifico",
    "Abril Fatface",
    "Bree Serif",
    "Permanent Marker",
    "Alfa Slab One",
    "var(--title-font)"
];

function animateChangeFonts() {
    const el = document.getElementById('main-title-ani');

    for (let i = 0; i < font_list.length; i++) {
        setTimeout(() => {
            el.style.fontFamily = font_list[i];
        }, i * 200);
    }
}

//document.getElementById('main-title-ani').addEventListener('mouseover', hoverOnRandomFont);
//document.getElementById('main-title-ani').addEventListener('mouseout', hoverOffRandomFont);

function hoverOnRandomFont() {
    const el = document.getElementById('main-title-ani');

    el.style.fontFamily = font_list[Math.floor(Math.random() * font_list.length)];

    // Add timeout
    el.hoverTimeout = setTimeout(() => {
        hoverOnRandomFont();
    }, 500);
}

function hoverOffRandomFont() {
    const el = document.getElementById('main-title-ani');

    el.style.fontFamily = "var(--title-font)";
    
    // Remove timeout if it exists
    if (el.hoverTimeout) {
        clearTimeout(el.hoverTimeout);
    }
}