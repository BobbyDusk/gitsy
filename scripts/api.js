async function getRepoDataFromStorage(owner, repo) {
    const gitsyDateKey = `gitsy_date_${owner}_${repo}`;
    const savedDateResult = await chrome.storage.local.get(gitsyDateKey);
    const savedDate = savedDateResult[gitsyDateKey];
    if (savedDate != null) {
        const currentTime = Date.now();
        const elapsedTime = currentTime - parseInt(savedDate);
        const oneWeek = 7 * 24 * 60 * 60 * 1000;
        if (elapsedTime > oneWeek) {
            return null;
        }
    }
    const gitsyKey = `gitsy_${owner}_${repo}`;
    const dataResult = await chrome.storage.local.get(gitsyKey);
    const data = dataResult[gitsyKey];
    if (data == null) {
        return null;
    } else {
        return data;
    }
}

function saveRepoDataToStorage(owner, repo, data) {
    const gitsyKey = `gitsy_${owner}_${repo}`;
    const gitsyDateKey = `gitsy_date_${owner}_${repo}`;
    chrome.storage.local.set({ [gitsyKey]: data });
    chrome.storage.local.set({ [gitsyDateKey]: Date.now() });
}

async function getGithubApiKey() {
    const result = await chrome.storage.sync.get('gitsy_api_key');
    return result.gitsy_api_key;
}

function setGithubApiKey(newApiKey) {
    chrome.storage.sync.set({ gitsy_api_key: newApiKey }, function () {
    });
}

async function fetchRepoData(owner, repo, forceFresh = false, saveData=true) {
    let data = null;
    if (!forceFresh) {
        data = await getRepoDataFromStorage(owner, repo);
    }
    if (data == null) {
        try {
            const apiKey = await getGithubApiKey();
            if (!apiKey) {
                return null;
            }
            const apiUrl = `https://api.github.com/graphql`;
            const query = `{
                repository(owner:"${owner}", name:"${repo}") {
                    stargazerCount,
                    description,
                    pushedAt,
                    forkCount,
                    issues(states:[OPEN]) {
                        totalCount
                    },
                    pullRequests(states:[OPEN]) {
                        totalCount
                    }
                }
            }`;

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ query })
            })
            const rawData = await response.json();
            data = rawData.data.repository;
            if (saveData) {
                saveRepoDataToStorage(owner, repo, data);
            }
        } catch (error) {
            return null;
        }
    }

    return data;
}

export { getGithubApiKey, setGithubApiKey, fetchRepoData };