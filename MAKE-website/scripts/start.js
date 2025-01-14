async function start() {
    if (state.college_id !== null) {
        displayLoggedIn();
        await updateUserInfo();
    } else {
        displayLoggedOut();
    }

    //animateChangeFonts();

    renderQuizInfo();
    renderCheckouts();

    setInterval(fetchInventory, 100000);
    setInterval(fetchStudentStorage, 10000);
    setInterval(fetchPrinters, 10000);

    fetchInventory().then(() => {
        submitSearch();
        document.getElementById("inventory-search-input").addEventListener("keyup", submitSearch);
        document.getElementById("inventory-in-stock").addEventListener("change", submitSearch);
        document.getElementById("room-select").addEventListener("change", submitSearch);
        document.getElementById("tool-material-select").addEventListener("change", submitSearch);
    });
    fetchStudentStorage();
    fetchPrinters();
}

start();