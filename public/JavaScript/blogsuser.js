    // Function to generate random text color
    function getRandomColor() {
      const letters = '0123456789ABCDEF';
      let color = '#';
      for (let i = 0; i < 6; i++) {
          color += letters[Math.floor(Math.random() * 16)];
      }
      return color;
  }
// Function to check if the user has already commented
function hasUserCommented(blogTitle) {
const commentKey = `comment_${blogTitle}`;
return localStorage.getItem(commentKey) === 'true';
}
  // Fetch total number of blogs
  async function fetchTotalBlogs() {
      const response = await fetch('/total-blogs');
      const { totalBlogs } = await response.json();
      return totalBlogs;
  }

  // Function to open a dialog box with complete blog content
  // Inside the openBlogModal function
  function openBlogModal(blog) {
const blogContent = `
  <!-- Blog content -->
  <!-- ... -->
  <h2>${blog.blogtitle}</h2>
  <div class="description-box">
      <p><strong>Description:</strong></p>
      <div class="description-value">${blog.blogdescription}</div>
  </div>
  <div class="date-time-box">
      <div class="date-box">
          <p><strong>Date:</strong></p>
          <div class="date-value">${formatDate(new Date(blog.blogdate))}</div> <!-- Format date here -->
      </div>
      <div class="time-box">
          <p><strong>Time:</strong></p>
          <div class="time-value">${blog.blogtime}</div>
      </div>
  </div>
  <div class="comment-box">
      <h3>Comments on this blog:</h3>
      <form id="commentForm">
          <input type="hidden" id="blogTitle" value="${blog.blogtitle}">
          <label for="comment">Your Comment:</label><br>
          <textarea id="comment" name="comment" rows="4" cols="50"></textarea><br>
          <input type="submit" value="Submit">
      </form>
  </div>
`;
document.getElementById("blogContent").innerHTML = blogContent;
document.getElementById("myModal").style.display = "block";

// Attach event listener to the comment form
document.getElementById("commentForm").addEventListener("submit", function(event) {
  event.preventDefault(); // Prevent default form submission
  const commentData = {
      title: document.getElementById("blogTitle").value,
      comment: document.getElementById("comment").value
  };
  sendComment(commentData); // Send comment data to the server
  disableCommentForm(); // Disable the comment form after submission
});
}

function formatDate(date) {
const day = date.getDate();
const month = date.getMonth() + 1; // Months are zero-indexed
const year = date.getFullYear();

// Ensure two digits for day and month
const formattedDay = day < 10 ? '0' + day : day;
const formattedMonth = month < 10 ? '0' + month : month;

return `${formattedDay}-${formattedMonth}-${year}`;
}
function sendComment(commentData) {
      fetch('/submit-comment', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify(commentData)
      })
      .then(response => {
          if (!response.ok) {
              throw new Error('Failed to submit comment');
          }
          console.log('Comment sent successfully!');
          // Optionally, you can perform additional actions after successful submission
      })
      .catch(error => {
          console.error('Error sending comment:', error.message);
      });
  }
function markUserAsCommented(blogTitle) {
const commentKey = `comment_${blogTitle}`;
localStorage.setItem(commentKey, 'true');
}

// Function to disable the comment form after submission
function disableCommentForm() {
const commentForm = document.getElementById("commentForm");
commentForm.innerHTML = "<p>You've already commented on this blog.</p>";
}
// Function to fetch blogs and render them
  async function fetchBlogsAndRender(page = 1) {
      const response = await fetch(`/edit-blogs?page=${page}`);
      const { blogs, totalPages } = await response.json();

      const blogListContainer = document.getElementById('blog-list');
      blogListContainer.innerHTML = ''; // Clear existing content

      blogs.sort((a, b) => {
          // Compare dates
          const dateComparison = new Date(b.blogdate) - new Date(a.blogdate);
          if (dateComparison !== 0) {
              return dateComparison; // Sort by date
          } else {
              // If dates are equal, sort by time in descending order
              return b.blogtime.localeCompare(a.blogtime);
          }
      });

      blogs.forEach((blog, index) => {
          const blogElement = document.createElement('div');
          blogElement.classList.add('blog-container');
          blogElement.id = `blog-${index}`; // Add unique identifier
          blogElement.style.color = localStorage.getItem(`textColor_${index}`) || getRandomColor();

          // Convert date format to dd-mm-yyyy
          const blogDate = new Date(blog.blogdate).toLocaleDateString('en-GB');

          // Split the description into words and take the first 5 words
          const descriptionWords = blog.blogdescription.split(' ');
          const shortDescription = descriptionWords.slice(0, 5).join(' ');

          blogElement.innerHTML = `
              <div class="blog">
                  <img src="/get-image/${blog.blogimage}" alt="${blog.blogtitle}" class="blog-image">
                  <h2><strong>Title:</strong> ${blog.blogtitle}</h2>
                  <p>Description: ${shortDescription}...</p> <!-- Display only the first 5 words -->
                  <p>Date: ${blogDate}</p> <!-- Converted date format -->
                  <p>Time: ${blog.blogtime}</p>
              </div>
          `;

          blogElement.addEventListener('click', () => openBlogModal(blog)); // Open modal on click

          blogListContainer.appendChild(blogElement);
      });

      // Render pagination buttons and info
      const totalBlogs = await fetchTotalBlogs();
      renderPaginationButtons(totalPages, page);
      renderBlogInfo(blogs.length, totalBlogs, totalPages, page);
  }

  // Function to render blog info
  function renderBlogInfo(numBlogs, totalBlogs, totalPages, currentPage) {
      const blogInfoContainer = document.getElementById('blog-info');
      blogInfoContainer.innerHTML = `Showing ${numBlogs} out of ${totalBlogs} total blogs`;

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
      prevButton.addEventListener('click', () => fetchBlogsAndRender(currentPage - 1));
      paginationContainer.appendChild(prevButton);

      // Page numbers
      for (let i = 1; i <= totalPages; i++) {
          const button = document.createElement('button');
          button.textContent = i;
          button.addEventListener('click', () => fetchBlogsAndRender(i));
          if (i === currentPage) {
              button.disabled = true;
          }
          paginationContainer.appendChild(button);
      }

      // Next button
      const nextButton = document.createElement('button');
      nextButton.textContent = 'Next';
      nextButton.disabled = currentPage === totalPages;
      nextButton.addEventListener('click', () => fetchBlogsAndRender(currentPage + 1));
      paginationContainer.appendChild(nextButton);
  }

  // Call the function to fetch and render blogs when the page loads
  window.onload = () => fetchBlogsAndRender();

  // Set random text color and store it in local storage
  document.querySelectorAll('.blog-container').forEach((container, index) => {
      const textColor = localStorage.getItem(`textColor_${index}`) || getRandomColor();
      container.style.color = textColor;
      localStorage.setItem(`textColor_${index}`, textColor);
  });

  function sendEmail(commentData) {
const mailOptions = {
  from: 'your_email@gmail.com',
  to: 'gokulteja95@gmail.com',
  subject: `Comment on Blog: ${commentData.title}`,
  text: `New comment on the blog "${commentData.title}": ${commentData.comment}`
};

transporter.sendMail(mailOptions, function(error, info) {
  if (error) {
      console.error('Error sending email:', error);
  } else {
      console.log('Email sent:', info.response);
  }
});
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

