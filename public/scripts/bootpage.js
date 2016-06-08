var bootpage = {
    currentPage: ""
};

bootpage.show = function(page, callback) {
    if (bootpage.currentPage) {
        document.getElementById(bootpage.currentPage).style.display = "none"; // Hide the current page
    }

    document.getElementById(page).style.display = "block"; // Show the desired page
    bootpage.currentPage = page;

    if (callback) {
        callback();
    }
};
