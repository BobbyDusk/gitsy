document.addEventListener("DOMContentLoaded", function () {
    chrome.storage.sync.get(["gitsy_api_key"], function (result) {
        const apiKeyInput = document.getElementById("gitsy-api-key");
        if (result.gitsy_api_key) {
            apiKeyInput.value = result.gitsy_api_key;
        }

        function setApiKey(newApiKey) {
            chrome.storage.sync.set({ gitsy_api_key: newApiKey }, function () {
            });
        }

        let debounceDuration = 500;
        let debounceTimer;
        apiKeyInput.addEventListener("input", function () {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(function () {
                const newApiKey = apiKeyInput.value;
                setApiKey(newApiKey);
            }, debounceDuration);
        });
    });
});
