function showTab(tabName) {
    var tabs = document.querySelectorAll('.container > div');
    tabs.forEach(function(tab) {
        if (tab.id === tabName) {
            tab.style.display = 'block';
        } else {
            tab.style.display = 'none';
        }
    });
}

function showSubTab(subTabName, callback) {
var subTabs = document.querySelectorAll('#blogs > div, #projects > div, #sessions > div');
subTabs.forEach(function(subTab) {
if (subTab.id === subTabName) {
    subTab.style.display = 'block';
    if (callback) {
        callback(); // Call the provided callback function
    }
} else {
    subTab.style.display = 'none';
}
});
}


function addLanguage() {
    const languageInputContainer = document.querySelector('.languageInputs');
    const newLanguageDiv = document.createElement('div');

    const languageSelect = document.createElement('select');
    languageSelect.name = 'languages[]';
    const languages = ["JavaScript", "Python", /*...other languages...*/];
    languages.forEach(language => {
        const option = document.createElement('option');
        option.value = language.toLowerCase();
        option.text = language;
        languageSelect.add(option);
    });
    newLanguageDiv.appendChild(languageSelect);

    const colorInput = document.createElement('input');
    colorInput.type = 'color';
    colorInput.name = 'colors[]';
    colorInput.value = '#000000';
    newLanguageDiv.appendChild(colorInput);

    const removeButton = document.createElement('button');
    removeButton.textContent = 'Remove';
    removeButton.type = 'button';
    removeButton.addEventListener('click', () => {
        newLanguageDiv.remove();
    });
    newLanguageDiv.appendChild(removeButton);

    languageInputContainer.appendChild(newLanguageDiv);
}


// Function to fetch and display existing blog posts when the "Edit" subtab is clicked
// Function to fetch and display existing blog posts when the "Edit" subtab is clicked
// Function to display existing blogs
async function displayExistingBlogs() {
    try {
        const response = await fetch('/edit-blogs');
        const data = await response.json();

        if (data && data.blogs) {
            const editBlogsContainer = document.getElementById('editBlogsContainer');
            editBlogsContainer.innerHTML = ''; // Clear existing content

            data.blogs.forEach(blog => {
                const blogDiv = document.createElement('div');
                blogDiv.classList.add('blog-entry'); // Add class 'blog-entry'
                blogDiv.dataset.id = blog._id; // Set the 'data-id' attribute to the unique blog ID

                // Title input
                const titleInput = document.createElement('input');
                titleInput.type = 'text';
                titleInput.value = blog.blogtitle;
                titleInput.id = `blogtitle-${blog._id}`;
                blogDiv.appendChild(titleInput);

                // Description textarea
                const descriptionTextarea = document.createElement('textarea');
                descriptionTextarea.rows = '5';
                descriptionTextarea.value = blog.blogdescription;
                descriptionTextarea.id = `blogdescription-${blog._id}`;
                blogDiv.appendChild(descriptionTextarea);

                // Date input (text box)
                const dateInput = document.createElement('input');
                dateInput.type = 'text'; // Change type to text
                dateInput.value = formatDate(blog.blogdate); // Use the formatDate function
                dateInput.id = `blogdate-${blog._id}`;
                blogDiv.appendChild(dateInput);

                // Time input
                const timeInput = document.createElement('input');
                timeInput.type = 'time';
                timeInput.value = blog.blogtime;
                timeInput.id = `blogtime-${blog._id}`;
                blogDiv.appendChild(timeInput);

                // Image display
                if (blog.blogimage) {
                    const image = document.createElement('img');
                    image.src = `/image/${blog.blogimage}`; // Assuming this is the route to fetch the image
                    image.alt = 'Blog Image';
                    image.style.width = '200px'; // Adjust image size as needed
                    blogDiv.appendChild(image);
                }

                // Image upload input and button
                const imageUploadInput = document.createElement('input');
                imageUploadInput.type = 'file';
                imageUploadInput.accept = 'image/*';
                imageUploadInput.addEventListener('change', (event) => {
                    const file = event.target.files[0];
                    if (file) {
                        uploadImage(blog._id, file);
                    }
                });
                blogDiv.appendChild(imageUploadInput);

                const uploadButton = document.createElement('button');
                uploadButton.textContent = 'Upload Image';
                uploadButton.addEventListener('click', () => {
                    imageUploadInput.click(); // Trigger file input click when the button is clicked
                });
                blogDiv.appendChild(uploadButton);

                // Update button
                const updateButton = document.createElement('button');
                updateButton.textContent = 'Update';
                updateButton.addEventListener('click', () => {
                    updateBlog(blog._id);
                });
                blogDiv.appendChild(updateButton);

                // Delete button
                const deleteButton = document.createElement('button');
                deleteButton.textContent = 'Delete';
                deleteButton.addEventListener('click', () => {
                    if (confirm('Are you sure you want to delete this blog post?')) {
                        deleteBlog(blog._id);
                    }
                });
                blogDiv.appendChild(deleteButton);

                // Append the dynamically created blog entry div to the editBlogsContainer
                editBlogsContainer.appendChild(blogDiv);

                initializeDateInputs();
            });
        }
    } catch (error) {
        console.error('Error fetching existing blogs:', error);
    }
}


async function updateBlog(blogId) {
    // Get updated data from input fields
    const blogtitle = document.getElementById(`blogtitle-${blogId}`).value;
    const blogdescription = document.getElementById(`blogdescription-${blogId}`).value;
    const blogdate = document.getElementById(`blogdate-${blogId}`).value;
    const blogtime = document.getElementById(`blogtime-${blogId}`).value;

    const blogData = { blogtitle, blogdescription, blogdate, blogtime };

    try {
        const response = await fetch(`/update-blog/${blogId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(blogData)
        });

        if (response.ok) {
            const updatedBlog = await response.json();
            console.log('Updated blog post:', updatedBlog);

            // Display success message
            const successMessage = document.createElement('p');
            successMessage.textContent = 'Blog post updated successfully!';
            successMessage.style.color = 'green';

            // Find the corresponding blog entry div and append the success message to it
            const blogEntry = document.querySelector(`.blog-entry[data-id="${blogId}"]`);
            if (blogEntry) {
                blogEntry.appendChild(successMessage);
                
                // Swap image with previous image
                const image = blogEntry.querySelector('img');
                const previousImageSrc = image.src;
                if (updatedBlog.blogimage) {
                    const imageUrl = `/image/${updatedBlog.blogimage}`;
                    image.src = imageUrl;
                }
                // If the previous image source was different, delete the previous image from the server
                if (previousImageSrc !== image.src) {
                    deletePreviousImage(previousImageSrc);
                }
            } else {
                console.error('Blog entry not found:', blogId);
            }
        } else {
            console.error('Failed to update blog post:', response.status);
        }
    } catch (error) {
        console.error('Error updating blog post:', error);
    }
}

// Other functions and code...
async function fetchEditBlogs(page) {
    const editBlogsContainer = document.getElementById('editBlogsContainer');
    editBlogsContainer.innerHTML = ''; // Clear previous content

    try {
        const response = await fetch(`/edit-blogs?page=${page}`);
        if (!response.ok) {
            throw new Error('Failed to fetch blog posts');
        }

        const data = await response.json();
        if (!data || !Array.isArray(data.blogs) || typeof data.totalPages !== 'number') {
            throw new Error('Invalid blog data received');
        }

        const { blogs, totalPages } = data;
        blogs.forEach(async blog => {
            // Create a container for each blog entry
            const blogEntryContainer = document.createElement('div');
            blogEntryContainer.classList.add('blog-entry-container');

            // Create title element
            const titleElement = document.createElement('h2');
            titleElement.textContent = blog.blogtitle;

            // Append title to the blog entry container
            blogEntryContainer.appendChild(titleElement);

            // Create description element
            const descriptionElement = document.createElement('p');
            descriptionElement.textContent = blog.blogdescription;

            // Append description to the blog entry container
            blogEntryContainer.appendChild(descriptionElement);

            // Create date element
            const dateElement = document.createElement('p');
            dateElement.textContent = formatDate(blog.blogdate);

            // Append date to the blog entry container
            blogEntryContainer.appendChild(dateElement);

            // Create time element
            const timeElement = document.createElement('p');
            timeElement.textContent = blog.blogtime;

            // Append time to the blog entry container
            blogEntryContainer.appendChild(timeElement);

            // Create image element
            const image = document.createElement('img');
            if (blog.blogimage) {
                try {
                    const imageUrl = await getImageUrl(blog.blogimage);
                    image.src = imageUrl;
                } catch (error) {
                    console.error('Error fetching image:', error);
                }
            } else {
                console.error('No image associated with the blog post:', blog._id);
            }
            image.alt = 'Blog Image';
            image.style.width = '200px';

            // Append image to the blog entry container
            blogEntryContainer.appendChild(image);

            // Append blog entry container to the main container
            editBlogsContainer.appendChild(blogEntryContainer);
        });

        updatePaginationControls(page, totalPages);
    } catch (error) {
        console.error('Error fetching edit blogs:', error);
    }
}

async function getImageUrl(imageId) {
    try {
        const response = await fetch(`/get-image/${imageId}`);
        if (!response.ok) {
            throw new Error('Failed to fetch image');
        }
        const blob = await response.blob();
        return URL.createObjectURL(blob);
    } catch (error) {
        console.error('Error fetching image URL:', error);
        throw error; // Rethrow the error to be caught by the caller
    }
}



// Add the deleteBlog function
async function deleteBlog(blogId) {
try {
const response = await fetch(`/delete-blog/${blogId}`, {
    method: 'DELETE'
});

if (response.ok) {
    const data = await response.json();
    console.log(data.message);
    // Refresh the list of blogs after deletion
    displayExistingBlogs();
} else {
    console.error('Failed to delete blog post:', response.status);
}
} catch (error) {
console.error('Error deleting blog post:', error);
}
}
// Function to handle image upload
async function uploadImage(blogId, file) {
    const formData = new FormData();
    formData.append('image', file);

    try {
        const response = await fetch(`/upload-image/${blogId}`, {
            method: 'POST',
            body: formData,
        });

        if (response.ok) {
            const data = await response.json();
            console.log('Image uploaded successfully:', data);
            // Refresh the blog entry to display the new image
            displayExistingBlogs();
        } else {
            console.error('Failed to upload image:', response.status);
        }
    } catch (error) {
        console.error('Error uploading image:', error);
    }
}



function updatePaginationControls(currentPage, totalPages) {
const paginationContainer1 = document.getElementById('pagination');
paginationContainer1.innerHTML = '';

// Add previous button
const prevButton = document.createElement('button');
prevButton.textContent = 'Previous';
prevButton.disabled = currentPage === 1;
prevButton.addEventListener('click', () => {
if (currentPage > 1) {
    fetchEditBlogs(currentPage - 1);
}
});
paginationContainer1.appendChild(prevButton);

// Add page numbers
for (let i = 1; i <= totalPages; i++) {
const pageButton = document.createElement('button');
pageButton.textContent = i;
pageButton.disabled = i === currentPage;
pageButton.addEventListener('click', () => {
    fetchEditBlogs(i);
});
paginationContainer1.appendChild(pageButton);
}

// Add next button
const nextButton = document.createElement('button');
nextButton.textContent = 'Next';
nextButton.disabled = currentPage === totalPages;
nextButton.addEventListener('click', () => {
if (currentPage < totalPages) {
    fetchEditBlogs(currentPage + 1);
}
});
paginationContainer1.appendChild(nextButton);
}
function setupPaginationAndDisplayBlogs() {
setupPagination();
displayExistingBlogs();
}

function setupPagination() {
    // Fetch the first page of edit blogs when the page loads
    fetchEditBlogs(1);
}

document.addEventListener("DOMContentLoaded", setupPaginationAndDisplayBlogs);