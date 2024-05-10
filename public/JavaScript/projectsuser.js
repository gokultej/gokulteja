// Function to generate random text color
function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

// Function to fetch total number of projects
async function fetchTotalProjects() {
    const response = await fetch('/total-projects');
    const { totalProjects } = await response.json();
    return totalProjects;
}

// Function to open a dialog box with complete project content
function openProjectModal(project) {
    const projectContent = `
        <!-- Project content -->
        <!-- ... -->
        <h2>${project.projecttitle}</h2>
        <div class="description-box">
            <p><strong>Description:</strong></p>
            <div class="description-value">${project.projectdescription}</div>
        </div>
        <div class="date-box">
            <p><strong>Date:</strong></p>
            <div class="date-value">${formatDate(new Date(project.projectdate))}</div>
        </div>
        <div class="github-url-box">
            <p><strong>Github URL:</strong></p>
            <div class="github-url-value"><a href="${project.projectgithubUrl}" target="_blank">${project.projectgithubUrl}</a></div>
        </div>
        <div class="image-box">
            <p><strong>Image:</strong></p>
            <div class="image-value"><img src="/get-image/${project.projectimage}" alt="Project Image" style="max-width: 100%; height: auto;"></div>
        </div>
        <div class="priority-box">
            <p><strong>Priority:</strong></p>
            <div class="priority-value">${project.priority}</div>
        </div>
    `;
    document.getElementById("projectContent").innerHTML = projectContent;
    document.getElementById("myModal").style.display = "block";
}

// Function to format date as dd-mm-yyyy
function formatDate(date) {
    const day = date.getDate();
    const month = date.getMonth() + 1; // Months are zero-indexed
    const year = date.getFullYear();

    // Ensure two digits for day and month
    const formattedDay = day < 10 ? '0' + day : day;
    const formattedMonth = month < 10 ? '0' + month : month;

    return `${formattedDay}-${formattedMonth}-${year}`;
}

// Function to fetch projects and render them
async function fetchProjectsAndRender(page = 1) {
    try {
        const response = await fetch(`/edit-projects?page=${page}`);
        const { projects, totalPages } = await response.json();

        // Sort projects by date (newest to oldest)
        projects.sort((a, b) => new Date(b.projectdate) - new Date(a.projectdate));

        // Map priority values to numerical values
        const priorityMap = {
            'high': 3,
            'medium': 2,
            'low': 1
        };

        projects.forEach(project => {
            project.priorityValue = priorityMap[project.priority.toLowerCase()] || 0; // Convert to lowercase to handle variations
        });

        // Sort projects by priority (high to low)
        projects.sort((a, b) => {
            // If dates are equal, sort by priority
            if (a.projectdate === b.projectdate) {
                return b.priorityValue - a.priorityValue;
            }
            return 0; // Preserve original order if dates are not equal
        });

        const projectListContainer = document.getElementById('project-list');
        projectListContainer.innerHTML = ''; // Clear existing content

        projects.forEach(project => {
            const projectItem = document.createElement('div');
            projectItem.classList.add('project-item');
            projectItem.style.color = getRandomColor(); // Set random text color
            projectItem.innerHTML = `
                <div class="image-box">
                    <img src="/get-image/${project.projectimage}" alt="Project Image">
                </div>
                <div class="project-details">
                    <h2>Project Title: ${project.projecttitle}</h2>
                    <p><strong>Description:</strong> ${project.projectdescription}</p>
                    <p><strong>Date:</strong> ${formatDate(new Date(project.projectdate))}</p>
                    
                    <div class="priority-box">
                        <p><strong>Priority: ${project.priority}</strong></p>
                       
                    </div>
                    <button class="github-button" data-url="${project.projectgithubUrl}" style="cursor: pointer;">
                    <img src="images/Github.png" alt="GitHub Icon" style="width: 20px; height: 20px; margin-right: 5px;">
                    View Source on GitHub
                    </button>


                </div>
            `;
        
            // Add event listener to the GitHub button
            const githubButton = projectItem.querySelector('.github-button');
            githubButton.addEventListener('click', () => {
                const githubUrl = githubButton.getAttribute('data-url');
                window.open(githubUrl, '_blank'); // Open GitHub URL in a new tab
            });
        
            projectListContainer.appendChild(projectItem);
        });

        // Render pagination buttons and info
        const totalProjects = await fetchTotalProjects();
        renderPaginationButtons(totalPages, page);
        renderProjectInfo(projects.length, totalProjects, totalPages, page);
    } catch (error) {
        console.error('Error fetching projects:', error);
    }
}

// Call the function to fetch and render projects when the page loads
window.onload = () => fetchProjectsAndRender();
// Function to render project info
function renderProjectInfo(numProjects, totalProjects, totalPages, currentPage) {
    const projectInfoContainer = document.getElementById('project-info');
    projectInfoContainer.innerHTML = `Showing ${numProjects} out of ${totalProjects} total projects`;

    const pageInfoContainer = document.getElementById('page-info');
    pageInfoContainer.innerHTML = `Page ${currentPage} of ${totalPages}`;
}

// Function to render pagination buttons
function renderPaginationButtons(totalPages, currentPage) {
    const paginationContainer = document.getElementById('pagination');
    paginationContainer.innerHTML = ''; // Clear existing pagination buttons

    // Previous button
    const prevButton = document.createElement('button');
    prevButton.textContent = 'Previous';
    prevButton.disabled = currentPage === 1;
    prevButton.addEventListener('click', () => fetchProjectsAndRender(currentPage - 1));
    paginationContainer.appendChild(prevButton);

    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        const button = document.createElement('button');
        button.textContent = i;
        button.addEventListener('click', () => fetchProjectsAndRender(i));
        if (i === currentPage) {
            button.disabled = true;
        }
        paginationContainer.appendChild(button);
    }

    // Next button
    const nextButton = document.createElement('button');
    nextButton.textContent = 'Next';
    nextButton.disabled = currentPage === totalPages;
    nextButton.addEventListener('click', () => fetchProjectsAndRender(currentPage + 1));
    paginationContainer.appendChild(nextButton);
}

// Call the function to fetch and render projects when the page loads
window.onload = () => fetchProjectsAndRender();

// Function to send email notification
function sendEmail(commentData) {
    // Implement your email sending logic here
}

document.getElementsByClassName("close")[0].onclick = function() {
    document.getElementById("myModal").style.display = "none";
}

// Close the modal when clicking outside of it
window.onclick = function(event) {
    const modal = document.getElementById("myModal");
    if (event.target === modal) {
        modal.style.display = "none";
    }
}

