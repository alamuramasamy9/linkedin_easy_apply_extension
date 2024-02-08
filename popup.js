document.getElementById('triggerButton').addEventListener('click', () => {
    activateSearch();
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.action === "updateData") {
        document.getElementById('listingNumberContainer').textContent = request.data.CurrentJobListingNumber;
    }
    if (request.action === "totalData") {
        document.getElementById('listingTotalContainer').textContent = request.data.CurrentJobListingTotal;
    }
});


function activateSearch() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            function: performJobSearch,
        });
    });
}


function performJobSearch() {

    setTimeout(clickThroughJobListings, 5000); // Delay to allow filters to apply

    function clickThroughJobListings() {
        console.log('Clicking through job listings...');
        const listings = document.querySelectorAll('.jobs-search-results__list-item a');
        console.log(`Found ${listings.length} job listings`);
        iterateJobListings(listings, 0);
    }

    function iterateJobListings(listings, currentIndex) {
        // Inside performJobSearch or any other relevant function
        if (currentIndex < listings.length) {
            chrome.runtime.sendMessage({
                action: "updateData",
                data: {
                    CurrentJobListingNumber: currentIndex + 1,
                }
            });
        }
        else {
            chrome.runtime.sendMessage({
                action: "updateData",
                data: {
                    CurrentJobListingNumber: currentIndex,
                }
            });
        }

        chrome.runtime.sendMessage({
            action: "totalData",
            data: {
                CurrentJobListingTotal: listings.length,
            }
        });

        if (currentIndex >= listings.length) {
            console.log('Finished clicking through all job listings.');
            return;
        }
        simulateJobClick(listings[currentIndex], currentIndex, () => iterateJobListings(listings, currentIndex + 1));
    }

    function simulateJobClick(jobElement, currentIndex, callback) {
        jobElement.click();
        console.log(`Clicked job ${currentIndex + 1}`);
        setTimeout(() => attemptEasyApplyInDetails(callback), 5000);
    }

    async function attemptEasyApplyInDetails(callback) {
        const easyApplyButton = document.querySelector('.jobs-apply-button');
        if (!easyApplyButton) {
            console.error('Easy Apply button not found inside job details.');
            callback(); // Move to the next job if Easy Apply button isn't found
            return;
        }
        easyApplyButton.click();
        console.log('Clicked Easy Apply inside job details.');

        // Replace this with a more accurate check for submission success
        const isSubmitted = await checkForSubmission(); // You need to implement this
        if (isSubmitted) {
            console.log('Job applied successfully.');
            callback(); // Call the callback only after successful submission
        }
    }

    // Mockup of submission check, implement according to your app's logic
    async function checkForSubmission() {
        // This function should implement the logic to check for a successful submission
        // Could wait for a message, a specific button to appear, or a change in the page
        return new Promise((resolve, reject) => {
            // Example: Wait for "Submit Application" button and click it
            const checkInterval = setInterval(async () => {
                const buttonSelector_text = '.artdeco-button.artdeco-button--2.artdeco-button--primary.ember-view';
                const button_text = document.querySelector(buttonSelector_text).textContent.trim().toLowerCase();

                if (button_text === "submit application") {
                    console.log("last stage of the application");
                    await clickOnNextButton(true);
                    clearInterval(checkInterval);
                    resolve(true);
                }
                else {
                    await clickOnNextButton();

                }
            }, 2000); // Check every second, adjust as needed
        });
    }

    async function clickOnNextButton(lastStage = false) {
        return new Promise((resolve, reject) => {
            const buttonSelector = '.artdeco-button.artdeco-button--2.artdeco-button--primary.ember-view';
            const button = document.querySelector(buttonSelector);
            if (lastStage) {
                let company_check_box = document.getElementById('follow-company-checkbox');
                console.log("inside last stage");
                if (company_check_box) {
                    company_check_box.checked = false;
                    company_check_box.dispatchEvent(new Event('change', { bubbles: true }));
                }

            }
            if (button) {
                button.click();
                console.log('Button clicked successfully.');
                resolve(true);
            } else {
                console.error('Button not found');
                reject(false);
            }
        });
    }

}
