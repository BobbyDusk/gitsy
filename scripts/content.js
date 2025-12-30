function getRepoDataFromStorage(owner, repo) {
    gitsyDateKey = `gitsy_date_${owner}_${repo}`;
    const savedDate = localStorage.getItem(gitsyDateKey);
    if (savedDate != null) {
        const currentTime = Date.now();
        const elapsedTime = currentTime - parseInt(savedDate);
        const oneWeek = 7 * 24 * 60 * 60 * 1000;
        if (elapsedTime > oneWeek) {
            return null;
        }
    }
    gitsyKey = `gitsy_${owner}_${repo}`;
    rawData = localStorage.getItem(gitsyKey);
    if (rawData == null) {
        return null;
    } else {
        return JSON.parse(rawData);
    }
}

function saveRepoDataToStorage(owner, repo, data) {
    gitsyKey = `gitsy_${owner}_${repo}`;
    gitsyDateKey = `gitsy_date_${owner}_${repo}`;
    localStorage.setItem(gitsyKey, JSON.stringify(data));
    localStorage.setItem(gitsyDateKey, Date.now());
}

function getGithubApiKey() {
    const apiKey = localStorage.getItem('gitsy_github_api_key');
    return apiKey;
}

async function addInfoToGithubLinks() {
    const githubLinkPattern = /https?:\/\/github\.com\/([\w-]+)\/([\w-]+)(\/[\w-./?%&=]*)?/g;
    const links = document.querySelectorAll('a[href*="github.com"]');

    links.forEach(async link => {
        const match = link.href.match(githubLinkPattern);
        if (match) {
            const owner = link.href.split('/')[3];
            const repo = link.href.split('/')[4];
            const apiUrl = `https://api.github.com/graphql`;
            const token = getGithubApiKey();
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

            let data = getRepoDataFromStorage(owner, repo);
            if (data == null) {
                try {
                    const response = await fetch(apiUrl, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ query })
                    })
                    const rawData = await response.json();
                    data = rawData.data.repository;
                    saveRepoDataToStorage(owner, repo, data);
                } catch (error) {
                    return;
                }
            }

            try {
                if (typeof data.stargazersCount != undefined) {
                    const infoSpan = document.createElement('span');
                    infoSpan.style.fontSize = '0.9em';
                    let formattedStargazers = data.stargazerCount;
                    if (formattedStargazers >= 100000) {
                        formattedStargazers = (formattedStargazers / 1000).toFixed(0) + 'k';
                    } else if (formattedStargazers >= 1000) {
                        formattedStargazers = (formattedStargazers / 1000).toFixed(1) + 'k';
                    }
                    infoSpan.textContent = ` (⭐ ${formattedStargazers})`;
                    link.style.position = 'relative';
                    link.appendChild(infoSpan);
                    const linkWidth = link.offsetWidth;
                    const linkHeight = link.offsetHeight;
                    const tooltipContainer = document.createElement('span');
                    tooltipContainer.className = 'github-tooltip';
                    tooltipContainer.style.position = 'absolute';
                    tooltipContainer.style.backgroundColor = 'transparent';
                    tooltipContainer.style.zIndex = '1000';
                    tooltipContainer.style.width = `${linkWidth}px`;
                    tooltipContainer.style.height = `${linkHeight}px`;
                    tooltipContainer.style.left = `0px`;
                    tooltipContainer.style.top = `0px`;
                    link.appendChild(tooltipContainer);

                    const tooltip = document.createElement('div');
                    const tooltipWidth = 200;
                    tooltip.style.display = 'none';
                    tooltip.style.position = 'absolute';
                    tooltip.style.background = '#333';
                    tooltip.style.color = '#fff';
                    tooltip.style.padding = '10px';
                    tooltip.style.borderRadius = '5px';
                    tooltip.style.boxShadow = '0 0 10px rgba(0,0,0,0.5)';
                    tooltip.style.fontSize = '0.8em';
                    tooltip.style.top = 'calc(100% + 10px)';
                    if (linkWidth < tooltipWidth) {
                        tooltip.style.left = `-${(tooltipWidth - linkWidth) / 2}px`;
                    } else {
                        tooltip.style.left = `${(linkWidth - tooltipWidth) / 2}px`;
                    }
                    tooltip.style.width = `${tooltipWidth}px`;
                    tooltip.style.pointerEvents = 'none';
                    tooltip.style.flexDirection = 'column';
                    tooltip.style.gap = '0.8em';
                    tooltipContainer.appendChild(tooltip);

                    tooltipContainer.addEventListener('mouseenter', () => {
                        tooltip.style.display = 'flex';
                    });

                    link.addEventListener('mouseleave', () => {
                        tooltip.style.display = 'none';
                    });

                    const title = document.createElement('h4');
                    title.style.fontSize = '1.0em';
                    title.style.margin = '0';
                    title.textContent = `${owner}/${repo}`;
                    tooltip.appendChild(title);

                    const description = document.createElement('p');
                    description.style.margin = '0';
                    description.style.fontSize = '0.9em';
                    description.textContent = data.description || 'No description available.';
                    tooltip.appendChild(description);

                    const starsAndForks = document.createElement('p')
                    starsAndForks.style.margin = '0';
                    starsAndForks.style.fontSize = '0.9em';
                    starsAndForks.innerHTML = `⭐ Stars ${data.stargazerCount.toLocaleString('en-US')}<br/>🍴 Forks: ${data.forkCount.toLocaleString('en-US')}`;
                    tooltip.appendChild(starsAndForks);

                    const issuesAndPRs = document.createElement('p');
                    issuesAndPRs.style.margin = '0';
                    issuesAndPRs.style.fontSize = '0.9em';
                    issuesAndPRs.innerHTML = `🐛 Open Issues: ${data.issues.totalCount.toLocaleString('en-US')}<br/>🔃 Open PRs: ${data.pullRequests.totalCount.toLocaleString('en-US')}`;
                    tooltip.appendChild(issuesAndPRs);

                    const timeSinceLastPush = document.createElement('p');
                    timeSinceLastPush.style.margin = '0';
                    timeSinceLastPush.style.fontSize = '0.9em';
                    const pushedDate = new Date(data.pushedAt);
                    const now = new Date();
                    const diffTime = Math.abs(now - pushedDate);
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    if (diffDays === 0) {
                        timeSinceLastPush.textContent = `⏱️ Last pushed: today`;
                    } else if (diffDays === 1) {
                        timeSinceLastPush.textContent = `⏱️ Last pushed: 1 day ago`;
                    } else if (diffDays < 7) {
                        timeSinceLastPush.textContent = `⏱️ Last pushed: ${diffDays} days ago`;
                    } else if (diffDays < 30) {
                        const diffWeeks = Math.ceil(diffDays / 7);
                        timeSinceLastPush.textContent = `⏱️ Last pushed: ${diffWeeks} week(s) ago`;
                    } else if (diffDays < 365) {
                        const diffMonths = Math.ceil(diffDays / 30);
                        timeSinceLastPush.textContent = `⏱️ Last pushed: ${diffMonths} month(s) ago`;
                    } else {
                        const diffYears = Math.ceil(diffDays / 365);
                        timeSinceLastPush.textContent = `⏱️ Last pushed: ${diffYears} year(s) ago`;
                    }
                    tooltip.appendChild(timeSinceLastPush);
                }
            } catch (e) {
                return
            }
        }
    });
}

window.onload = addInfoToGithubLinks;
