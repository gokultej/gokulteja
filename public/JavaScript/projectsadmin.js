// Display existing projects
// Function to fetch and display existing projects when the "Edit" subtab is clicked
async function displayExistingProjects() {
    try {
        const response = await fetch('/edit-projects');
        const data = await response.json();

        if (data && data.projects) {
            const editProjectsContainer = document.getElementById('editProjectsContainer');
            editProjectsContainer.innerHTML = ''; // Clear existing content

            data.projects.forEach(project => {
                const projectDiv = document.createElement('div');
                projectDiv.classList.add('project-entry'); // Add class 'project-entry'
                projectDiv.dataset.id = project._id; // Set the 'data-id' attribute to the unique project ID

                // Add inputs for project details (title, description, date, etc.)
                const titleInput = document.createElement('input');
                titleInput.type = 'text';
                titleInput.value = project.projecttitle;
                titleInput.id = `projecttitle-${project._id}`;
                projectDiv.appendChild(titleInput);

                // Add more input elements for other project details (description, date, etc.)
                const descriptionTextarea = document.createElement('textarea');
                descriptionTextarea.rows = '5';
                descriptionTextarea.value = project.projectdescription;
                descriptionTextarea.id = `projectdescription-${project._id}`;
                projectDiv.appendChild(descriptionTextarea);

                // Date input (text box)
                const dateInput = document.createElement('input');
                dateInput.type = 'text'; // Change type to text
                dateInput.value = formatDate(project.projectdate); // Use the formatDate function
                dateInput.id = `projectdate-${project._id}`;
                projectDiv.appendChild(dateInput);

                const GithubInput = document.createElement('input');
                GithubInput.type = 'text';
                GithubInput.value = project.projectgithubUrl;
                GithubInput.id = `projectgithubUrl-${project._id}`;
                projectDiv.appendChild(GithubInput);

                // Display project image if available
                if (project.projectimage) {
                    const image = document.createElement('img');
                    image.src = `/image/${project.projectimage}`; // Assuming this is the route to fetch the image
                    image.alt = 'Project Image';
                    image.style.width = '200px'; // Adjust image size as needed
                    projectDiv.appendChild(image);
                }

                // Image input button for update
                const imageInput = document.createElement('input');
                imageInput.type = 'file';
                imageInput.accept = 'image/*'; // Allow only image files
                imageInput.addEventListener('change', (event) => {
                    const file = event.target.files[0];
                    const reader = new FileReader();
                    reader.onload = async function(event) {
                        const base64String = event.target.result.split(',')[1]; // Extract base64 string
                        // Implement logic to update the project image
                        await updateProjectImage(project._id, base64String);
                    };
                    reader.readAsDataURL(file);
                });
                projectDiv.appendChild(imageInput);

                // Add update button
                const updateButton = document.createElement('button');
                updateButton.textContent = 'Update';
                updateButton.addEventListener('click', () => {
                    updateProject(project._id);
                });

                // Add delete button
                const deleteButton = document.createElement('button');
                deleteButton.textContent = 'Delete';
                deleteButton.addEventListener('click', () => {
                    deleteProject(project._id);
                });

                // Append buttons to the projectDiv
                projectDiv.appendChild(updateButton);
                projectDiv.appendChild(deleteButton);

                // Append the project entry div to the editProjectsContainer
                editProjectsContainer.appendChild(projectDiv);
            });
        }
    } catch (error) {
        console.error('Error fetching existing projects:', error);
    }
}


// Function to update project image
async function updateProjectImage(projectId, imageFile) {
    try {
        const formData = new FormData();
        formData.append('image', imageFile);

        const response = await fetch(`/update-project-image/${projectId}`, {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            const imageData = await response.json();
            const imageUrl = imageData.imageUrl;

            // Update the displayed image
            const projectImage = document.querySelector(`#editProjectsContainer [data-id="${projectId}"] img`);
            if (projectImage) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    projectImage.src = event.target.result;
                };
                reader.readAsDataURL(imageFile);
            }
        } else {
            console.error('Failed to update project image:', response.status);
        }
    } catch (error) {
        console.error('Error updating project image:', error);
    }
}

// JavaScript function for updating projects
async function updateProject(projectId) {
    // Get updated data from input fields
    const projecttitle = document.getElementById(`projecttitle-${projectId}`).value;
    const projectdescription = document.getElementById(`projectdescription-${projectId}`).value;
    const projectdate = document.getElementById(`projectdate-${projectId}`).value;
    const projectgithubUrl = document.getElementById(`projectgithubUrl-${projectId}`).value;

    const projectData = { projecttitle, projectdescription, projectdate, projectgithubUrl };

    try {
        const response = await fetch(`/update-project/${projectId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(projectData)
        });

        if (response.ok) {
            const updatedProject = await response.json();
            console.log('Updated project:', updatedProject);

            // Display success message or handle the response accordingly
        } else {
            console.error('Failed to update project:', response.status);
            // Handle error response
        }
    } catch (error) {
        console.error('Error updating project:', error);
        // Handle fetch error
    }
}

// Fetch edit projects
async function fetchEditProjects(page) {
    const editProjectsContainer = document.getElementById('editProjectsContainer');
    editProjectsContainer.innerHTML = ''; // Clear previous content

    try {
        const response = await fetch(`/edit-projects?page=${page}`);
        if (!response.ok) {
            throw new Error('Failed to fetch project posts');
        }

        const data = await response.json();
        if (!data || !Array.isArray(data.projects) || typeof data.totalPages !== 'number') {
            throw new Error('Invalid project data received');
        }

        const { projects, totalPages } = data;
        projects.forEach(async project => {
            // Create a container for each project entry
            const projectEntryContainer = document.createElement('div');
            projectEntryContainer.classList.add('project-entry-container');

            // Create title element
            const titleElement = document.createElement('h2');
            titleElement.textContent = project.projecttitle;

            // Append title to the project entry container
            projectEntryContainer.appendChild(titleElement);

            // Create description element
            const descriptionElement = document.createElement('p');
            descriptionElement.textContent = project.projectdescription;

            // Append description to the project entry container
            projectEntryContainer.appendChild(descriptionElement);

            // Create date element
            const dateElement = document.createElement('p');
            dateElement.textContent = formatDate(project.projectdate);

            // Append date to the project entry container
            projectEntryContainer.appendChild(dateElement);

            // Create GitHub URL element
            const githubUrlElement = document.createElement('p');
            githubUrlElement.textContent = project.projectgithubUrl;

            // Append GitHub URL to the project entry container
            projectEntryContainer.appendChild(githubUrlElement);

            // Create image element
            const image = document.createElement('img');
            if (project.projectimage) {
                try {
                    const imageUrl = await getImageUrl(project.projectimage);
                    image.src = imageUrl;
                } catch (error) {
                    console.error('Error fetching image:', error);
                }
            } else {
                console.error('No image associated with the project:', project._id);
            }
            image.alt = 'Project Image';
            image.style.width = '200px';

            // Append image to the project entry container
            projectEntryContainer.appendChild(image);

            // Append project entry container to the main container
            editProjectsContainer.appendChild(projectEntryContainer);
        });

        updateProjectPaginationControls(page, totalPages);
    } catch (error) {
        console.error('Error fetching edit projects:', error);
    }
}

// Delete project
async function deleteProject(projectId) {
    try {
        const response = await fetch(`/delete-project/${projectId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            const data = await response.json();
            console.log(data.message);
            // Refresh the list of projects after deletion
            displayExistingProjects();
        } else {
            console.error('Failed to delete project:', response.status);
        }
    } catch (error) {
        console.error('Error deleting project:', error);
    }
}

// Setup pagination and display projects
function setupPaginationAndDisplayProjects() {
    setupProjectPagination();
    displayExistingProjects();
}

// Setup pagination
function setupProjectPagination() {
    // Fetch the first page of edit projects when the page loads
    fetchEditProjects(1);
}

// Initialize date inputs
function initializeDateInputs() {
    const dateInputs1 = document.querySelectorAll('input[type="text"][id^="blogdate-"]');
    dateInputs1.forEach(input => {
        const blogId = input.id.split('-')[1];
        input.value = formatDate(input.value); // Format date
    });
    const dateInputs = document.querySelectorAll('input[type="text"][id^="projectdate-"]');
    dateInputs.forEach(input => {
        const projectId = input.id.split('-')[1];
        input.value = formatDate(input.value); // Format date
    });
}

// Update pagination controls
function updateProjectPaginationControls(currentPage, totalPages) {
    const paginationContainer = document.getElementById('paginationProjects');
    paginationContainer.innerHTML = '';

    // Add previous button
    const prevButton = document.createElement('button');
    prevButton.textContent = 'Previous';
    prevButton.disabled = currentPage === 1;
    prevButton.addEventListener('click', () => {
        if (currentPage > 1) {
            fetchEditProjects(currentPage - 1);
        }
    });
    paginationContainer.appendChild(prevButton);

    // Add page numbers
    for (let i = 1; i <= totalPages; i++) {
        const pageButton = document.createElement('button');
        pageButton.textContent = i;
        pageButton.disabled = i === currentPage;
        pageButton.addEventListener('click', () => {
            fetchEditProjects(i);
        });
        paginationContainer.appendChild(pageButton);
    }

    // Add next button
    const nextButton = document.createElement('button');
    nextButton.textContent = 'Next';
    nextButton.disabled = currentPage === totalPages;
    nextButton.addEventListener('click', () => {
        if (currentPage < totalPages) {
            fetchEditProjects(currentPage + 1);
        }
    });
    paginationContainer.appendChild(nextButton);
}

// Format date function (replace with your actual date formatting function)
function formatDate(dateString) {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
        return "Invalid Date"; // Handle invalid date strings
    }
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    return `${year}-${month < 10 ? '0' + month : month}-${day < 10 ? '0' + day : day}`;
}

document.addEventListener("DOMContentLoaded", setupPaginationAndDisplayProjects);