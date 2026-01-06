async function addInfoToGithubLinks() {
    const githubLinkPattern = /https?:\/\/github\.com\/([\w-]+)\/([\w-]+)(\/[\w-./?%&=]*)?/g;
    const links = document.querySelectorAll('a[href*="github.com"]');

    links.forEach(async link => {
        const match = link.href.match(githubLinkPattern);
        if (match) {
            const parts = match[0].split('/');
            const owner = parts[3];
            const repo = parts[4];
            const type = parts[5] || '';

            if (type.toLowerCase() === 'issues' || type.toLowerCase() === 'pull') {
                return;
            }

            let data = await fetchRepoData(owner, repo);
            try {
                if (typeof data.stargazerCount != undefined) {
                    if (link.innerText && link.innerText.trim()) {
                        const infoSpan = document.createElement('span');
                        infoSpan.className = 'gitsy-info-span';
                        let formattedStargazers = data.stargazerCount;
                        if (formattedStargazers >= 100000) {
                            formattedStargazers = (formattedStargazers / 1000).toFixed(0) + 'k';
                        } else if (formattedStargazers >= 1000) {
                            formattedStargazers = (formattedStargazers / 1000).toFixed(1) + 'k';
                        }
                        infoSpan.textContent = ` (⭐ ${formattedStargazers})`;
                        link.appendChild(infoSpan);
                    }

                    link.style.position = 'relative';
                    const linkWidth = link.offsetWidth;
                    const linkHeight = link.offsetHeight;
                    const tooltipContainer = document.createElement('span');
                    tooltipContainer.className = 'gitsy-tooltip-container';
                    link.appendChild(tooltipContainer);
                    tooltipContainer.style.width = `${linkWidth}px`;
                    tooltipContainer.style.height = `${linkHeight}px`;


                    const tooltip = document.createElement('div');
                    tooltip.className = 'gitsy-tooltip';
                    const tooltipWidth = 200;
                    const linkRect = link.getBoundingClientRect();
                    const spaceBelow = window.innerHeight - linkRect.bottom;
                    const estimatedTooltipHeight = 300;
                    if (spaceBelow >= estimatedTooltipHeight) {
                        tooltip.style.top = 'calc(100% + 10px)';
                    } else {
                        tooltip.style.bottom = 'calc(100% + 10px)';
                    }
                    const tooltipLeft = (linkWidth - tooltipWidth) / 2;
                    if (tooltipLeft >= 0) {
                        tooltip.style.left = `${tooltipLeft}px`;
                    } else {
                        const spaceOnLeft = linkRect.left;
                        const spaceOnRight = window.innerWidth - linkRect.right;
                        if (spaceOnLeft < Math.abs(tooltipLeft)) {
                            tooltip.style.left = `0px`;
                        } else if (spaceOnRight < Math.abs(tooltipLeft)) {
                            tooltip.style.right = `0px`;
                        } else {
                            tooltip.style.left = `${tooltipLeft}px`;
                        }
                    }
                    tooltip.style.width = `${tooltipWidth}px`;
                    tooltip.style.display = 'none';
                    tooltipContainer.appendChild(tooltip);

                    tooltipContainer.addEventListener('mouseenter', () => {
                        tooltip.style.display = 'flex';
                    });

                    link.addEventListener('mouseleave', () => {
                        tooltip.style.display = 'none';
                    });

                    const title = document.createElement('h4');
                    title.textContent = `${owner}/${repo}`;
                    tooltip.appendChild(title);

                    const description = document.createElement('p');
                    description.textContent = data.description || 'No description available.';
                    tooltip.appendChild(description);

                    const starsAndForks = document.createElement('p')
                    starsAndForks.innerHTML = `⭐ Stars ${data.stargazerCount.toLocaleString('en-US')}<br/>🍴 Forks: ${data.forkCount.toLocaleString('en-US')}`;
                    tooltip.appendChild(starsAndForks);

                    const issuesAndPRs = document.createElement('p');
                    issuesAndPRs.innerHTML = `🐛 Open Issues: ${data.issues.totalCount.toLocaleString('en-US')}<br/>🔃 Open PRs: ${data.pullRequests.totalCount.toLocaleString('en-US')}`;
                    tooltip.appendChild(issuesAndPRs);

                    const timeSinceLastPush = document.createElement('p');
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

if (window.location.hostname.includes('github.com')) {
    // Github pages seem to load content dynamically, so delay execution
    setTimeout(addInfoToGithubLinks, 1000);
} else {
    addInfoToGithubLinks();
}
