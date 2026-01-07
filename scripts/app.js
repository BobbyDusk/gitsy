async function validateStoredApiKey() {
    const data = await fetchRepoData('BobbyDusk', 'gitsy', true);
    const validationElement = document.getElementById("gitsy-api-validation");
    if (data) {
        validationElement.textContent = "API Key is valid!";
        validationElement.style.color = "green";
    } else {
        validationElement.textContent = "API Key is invalid or missing.";
        validationElement.style.color = "red";
    }
}

document.addEventListener("DOMContentLoaded", async function () {
    const apiKey = await getGithubApiKey();
    const apiKeyInput = document.getElementById("gitsy-api-key");
    if (apiKey) {
        apiKeyInput.value = apiKey;
    }
    validateStoredApiKey();


    let debounceDuration = 500;
    let debounceTimer;
    apiKeyInput.addEventListener("input", function () {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(async function () {
            const newApiKey = apiKeyInput.value;
            setGithubApiKey(newApiKey);
            validateStoredApiKey();
        }, debounceDuration);
    });
});
