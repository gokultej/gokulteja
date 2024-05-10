// Import required modules
const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const mongoose = require('mongoose');
const MongoStore = require('connect-mongo');
const { GridFsStorage } = require('multer-gridfs-storage');
const multer = require('multer');
const { GridFSBucket } = require('mongodb');
const path = require('path');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const open = require('open');
// Create an Express application
const app = express();

const flash = require('connect-flash');
app.use(flash());
require('dotenv').config();


const routeVisits = {};
const sessionSecret = process.env.SESSION_SECRET;
const AdminUsername=process.env.ADMIN_USERNAME;
const AdminPassword=process.env.ADMIN_PASSWORD;
const gmailUser = process.env.GMAIL_USER;
const gmailPass = process.env.GMAIL_PASS;
const portapp= process.env.PORT_APP;
const logRouteVisits = (req, res, next) => {
    const route = req.path; // Get the current route
    if (!routeVisits[route]) {
        routeVisits[route] = 1;
    } else {
        routeVisits[route]++;
    }
    console.log(`Route ${route} visited ${routeVisits[route]} times`);
    next(); // Continue to the next middleware
};
// Serve the static files (index.html and others)
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
// Middleware to parse incoming request bodies
app.use(bodyParser.urlencoded({ extended: true }));
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
// MongoDB connection URI
const sessionMongoURI =sessionSecret;
app.use(logRouteVisits);
// Connect to MongoDB
mongoose.connect(sessionMongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

let bucket;

mongoose.connection.on('connected', () => {
    console.log('Session MongoDB connected');
    // Now that the connection is established, create the GridFSBucket
    const db = mongoose.connection.db;
    if (!db) {
        console.error('Error: MongoDB connection is not established');
        return;
    }
    bucket = new GridFSBucket(db, { bucketName: 'uploads' });
});

mongoose.connection.on('error', err => {
    console.error('Session MongoDB connection error:', err);
});

// Initialize session middleware
app.use(session({
    secret: 'SESSION_SECRET',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ 
        mongoUrl: sessionMongoURI, // Provide the MongoDB connection URL
        ttl: 7 * 24 * 60 * 60, // Session TTL (optional)
    }),
}));

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'gokulalpha12@gmail.com',
        pass: AdminPassword
    }
});

// Route to handle form submission with image upload
const storage = new GridFsStorage({
    url: sessionMongoURI,
    options: { useNewUrlParser: true, useUnifiedTopology: true },
    file: (req, file) => {
        return new Promise((resolve, reject) => {
            crypto.randomBytes(16, (err, buf) => {
                if (err) {
                    return reject(err);
                }
                const filename = buf.toString('hex') + path.extname(file.originalname);
                const fileInfo = {
                    filename: filename,
                    bucketName: 'uploads'
                };
                resolve(fileInfo);
            });
        });
    }
});

const blogSchema = new mongoose.Schema({
    blogtitle: String,
    blogdescription: String,
    blogdate: Date,
    blogtime: String, // Add the blogtime field
    blogimage: { type: mongoose.Schema.Types.ObjectId, ref: 'File' }
});
const Blog = mongoose.model('Blog', blogSchema);
const upload = multer({
    storage: storage,
    // Allow all files to be uploaded
    fileFilter: (req, file, cb) => {
        cb(null, true);
    }
});
// Middleware function to check if the user is logged in
const requireLogin = (req, res, next) => {
    console.log('Checking authentication...');
    // Check if the user is logged in
    if (req.session.username === AdminUsername) {
        console.log('User is logged in.');
        // If the user is logged in, proceed to the next middleware
        next();
    } else {
        console.log('User is not logged in. Redirecting to login page.');
        // If the user is not logged in, redirect to the login page
        res.redirect('/randa');
    }
};

// Route for the logout page
app.get('/logout', (req, res) => {
    // Render the logout page
    res.sendFile(path.join(__dirname, '/public/logout.html'));
});

// Route for handling logout
app.post('/logout', (req, res) => {
    // Destroy the session to log out the user
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
        } else {
            // Redirect the user to the login page after logout
            res.redirect('/randa');
        }
    });
});

// Route for the login page
app.get('/randa', (req, res) => {
    res.sendFile(path.join(__dirname, '/public/login.html'));
});

// Route for handling login form submission
app.post('/randa', async (req, res) => {
    const { username, password } = req.body;

    // Check if username and password match
    if (username === AdminUsername && password === AdminPassword) {
        // Set a session variable to indicate the user is logged in
        req.session.username = username;
        // Redirect to the pasirandahouse page
        res.redirect('/pasirandahouse');
    } else {
        // If authentication fails, redirect back to the login page
        res.redirect('/randa');
    }
});

// Route for the pasirandahouse page
app.get('/pasirandahouse', requireLogin, (req, res) => {
    // If the middleware allows reaching this point, serve the pasiranda page
    res.sendFile(path.join(__dirname, '/public/admin.html'));
});

// Route for the projects page
app.get('/projects', (req, res) => {
    // Serve the projects HTML file
    res.sendFile(path.join(__dirname, '/public/projects.html'));
});

app.get('/blogs', (req, res) => {
    // Serve the blogs HTML file
    res.sendFile(path.join(__dirname, '/public/blogs.html'));
    
});

app.get('/resume-visits', (req, res) => {
    res.json(routeVisits);
});
app.post('/create-blog', upload.single('blogimage'), async (req, res) => {
    try {
        if (!req.file) {
            console.error('No file uploaded');
            return res.status(400).send('No file uploaded');
        }

        console.log('File uploaded:', req.file);

        const { blogtitle, blogdescription, blogdate, blogtime } = req.body;
        const blogimage = req.file.filename; // Get the uploaded file's filename

        // Create a new Blog document
        const newBlog = new Blog({
            blogtitle,
            blogdescription,
            blogdate,
            blogtime,
            blogimage: req.file.id
        });

        // Save the new Blog document to MongoDB
        await newBlog.save();

        // Redirect to pasirandahouse page
        res.redirect('/pasirandahouse');
    } catch (err) {
        console.error('Error creating blog:', err);
        res.status(500).send('Internal server error');
    }
});
app.get('/edit-blogs', async (req, res) => {
    const page = parseInt(req.query.page) || 1; // Default to page 1 if no query parameter is provided
    const perPage = 12; // Number of blogs per page
    const skip = (page - 1) * perPage;

    try {
        const totalBlogsCount = await Blog.countDocuments({});
        const totalPages = Math.ceil(totalBlogsCount / perPage);

        const blogs = await Blog.find({}).sort({ blogdate: -1 }).skip(skip).limit(perPage).exec();
        res.json({ blogs, totalPages });
    } catch (error) {
        console.error('Error fetching blog posts:', error);
        res.status(500).send('Error fetching blog posts');
    }
});

app.post('/update-blog/:id', upload.single('blogimage'), async (req, res) => {
    const blogId = req.params.id;
    const { blogtitle, blogdescription, blogdate, blogtime } = req.body;
    let updateData = {
        blogtitle,
        blogdescription,
        blogdate,
        blogtime
    };

    // Check if an image was uploaded and update the updateData accordingly
    if (req.file) {
        updateData.blogimage = req.file.filename;

        // Delete previous image from the database
        try {
            const prevBlog = await Blog.findById(blogId);
            if (prevBlog && prevBlog.blogimage) {
                // Remove previous image from GridFS
                await bucket.delete(new mongoose.Types.ObjectId(prevBlog.blogimage));
            }
        } catch (error) {
            console.error('Error deleting previous image:', error);
        }
    }

    try {
        const updatedBlog = await Blog.findByIdAndUpdate(blogId, updateData, { new: true });

        res.json(updatedBlog);
    } catch (error) {
        console.error('Error updating blog post:', error);
        res.status(500).send('Error updating blog post');
    }
});
// Route to fetch the total number of blogs
app.get('/total-blogs', async (req, res) => {
    try {
        const totalBlogs = await Blog.countDocuments({});
        res.json({ totalBlogs });
    } catch (error) {
        console.error('Error fetching total number of blogs:', error);
        res.status(500).send('Error fetching total number of blogs');
    }
});

// Route for deleting a blog post
app.delete('/delete-blog/:id', async (req, res) => {
    const blogId = req.params.id;

    try {
        // Find the blog post by ID and delete it from the database
        const deletedBlog = await Blog.findByIdAndDelete(blogId);

        if (deletedBlog) {
            // If the blog post was successfully deleted, send a success message
            res.json({ message: 'Blog post deleted successfully' });
        } else {
            // If the blog post was not found, send a 404 error response
            res.status(404).json({ error: 'Blog post not found' });
        }
    } catch (error) {
        // If an error occurs during deletion, send a 500 error response
        console.error('Error deleting blog post:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Define the project schema
const projectSchema = new mongoose.Schema({
    projecttitle: String,
    projectdescription: String,
    projectdate: Date,
    projectgithubUrl: String,
    projectimage: { type: mongoose.Schema.Types.ObjectId, ref: 'File' },
    priority: String // Add the projectpriority field
});

// Create the Project model
const Project = mongoose.model('Project', projectSchema);

// Route for creating a new project
app.post('/create-project', upload.single('projectimage'), async (req, res) => {
    try {
        if (!req.file) {
            console.error('No file uploaded');
            return res.status(400).send('No file uploaded');
        }

        console.log('File uploaded:', req.file);

        const { projecttitle, projectdescription, projectdate, projectgithubUrl, priority } = req.body;
        const projectimage = req.file.filename; // Get the uploaded file's filename

        // Create a new Project document
        const newProject = new Project({
            projecttitle,
            projectdescription,
            projectdate,
            projectgithubUrl,
            priority,
            projectimage: req.file.id
        });

        // Save the new Project document to MongoDB
        await newProject.save();

        // Redirect to pasirandahouse page
        res.redirect('/pasirandahouse');
    } catch (err) {
        console.error('Error creating project:', err);
        res.status(500).send('Internal server error');
    }
});

// Route for updating a project
app.post('/update-project/:id', upload.single('projectimage'), async (req, res) => {
    const projectId = req.params.id;
    const { projecttitle, projectdescription, projectdate, projectgithubUrl,priority } = req.body;
    let updateData = {
        projecttitle,
        projectdescription,
        projectdate,
        projectgithubUrl,
        priority
    };

    // Check if an image was uploaded and update the updateData accordingly
    if (req.file) {
        updateData.projectimage = req.file.filename;
    }

    try {
        const updatedProject = await Project.findByIdAndUpdate(projectId, updateData, { new: true });

        res.json(updatedProject);
    } catch (error) {
        console.error('Error updating project:', error);
        res.status(500).send('Error updating project');
    }
});

// Route for deleting a project
app.delete('/delete-project/:id', async (req, res) => {
    const projectId = req.params.id;

    try {
        // Find the project by ID and delete it from the database
        const deletedProject = await Project.findByIdAndDelete(projectId);

        if (deletedProject) {
            // If the project was successfully deleted, send a success message
            res.json({ message: 'Project deleted successfully' });
        } else {
            // If the project was not found, send a 404 error response
            res.status(404).json({ error: 'Project not found' });
        }
    } catch (error) {
        // If an error occurs during deletion, send a 500 error response
        console.error('Error deleting project:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


// Route for editing projects
app.get('/edit-projects', async (req, res) => {
    const page = req.query.page || 1; // Default to page 1 if no query parameter is provided
    const perPage = 10;
    const skip = (page - 1) * perPage;

    try {
        const totalProjectsCount = await Project.countDocuments({});
        const totalPages = Math.ceil(totalProjectsCount / perPage);

        const projects = await Project.find({}).sort({ projectdate: -1 }).skip(skip).limit(perPage).exec();
        res.json({ projects, totalPages });
    } catch (error) {
        console.error('Error fetching projects:', error);
        res.status(500).send('Error fetching projects');
    }
});
// Route to fetch the total number of projects
app.get('/total-projects', async (req, res) => {
    try {
        const totalProjects = await Project.countDocuments({});
        res.json({ totalProjects });
    } catch (error) {
        console.error('Error fetching total number of projects:', error);
        res.status(500).send('Error fetching total number of projects');
    }
});

// Route to fetch image data by imageId
app.get('/get-image/:imageId', async (req, res) => {
    const imageId = req.params.imageId;

    try {
        // Check if bucket is defined
        if (!bucket) {
            return res.status(500).json({ error: 'Internal server error: GridFSBucket is not defined' });
        }

        // Fetch the image data using the bucket
        const imageData = bucket.openDownloadStream(new mongoose.Types.ObjectId(imageId));

        if (!imageData) {
            return res.status(404).json({ error: 'Image data not found' });
        }

        // Set the appropriate content type for the response
        res.set('Content-Type', imageData.contentType);

        // Pipe the image data to the response stream
        imageData.pipe(res);
    } catch (error) {
        console.error('Error fetching image data:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});



// Route for the contact page
app.get('/contact', (req, res) => {
    // Serve the contact HTML file
    res.sendFile(path.join(__dirname, '/public/contact.html'));
});

app.get('/home', (req, res) => {
    // Redirect to the root path
    res.redirect('/');
});

app.get('/resume', (req, res) => {
    // Serve the contact HTML file
    res.sendFile(path.join(__dirname, '/public/resume.html'));
});app.post('/submit-comment', (req, res) => {
    // Extract comment data from the request body
    const { title, comment, date } = req.body;

    // Here you can add your logic to handle the comment data, such as saving it to a database
    // For now, let's just log the comment data
    console.log('Received comment:', { title, comment, date });

    // Send an email notification about the new comment
    sendEmailNotification({ title, comment, date });

    // Send a response to the client
    res.status(200).send('Comment submitted successfully');
});
// Function to send email notification
function sendEmailNotification(commentData) {
    // Create a transporter for sending emails
    const transporter = nodemailer.createTransport({
        // Add your email configuration here
        service: 'gmail',
        auth: {
            user: gmailUser, // Your email address
            pass: gmailPass, // Your email password
        }
    });

    // Define email options
    const mailOptions = {
        from: gmailUser, // Sender address (your email address)
        to: 'gokulteja95@gmail.com', // Recipient address
        subject: `New Comment on ${commentData.title}`, // Email subject
        text: `New comment on the blog "${commentData.title}" (${commentData.date}): ${commentData.comment}` // Email body
    };
    // Send the email
    transporter.sendMail(mailOptions, function(error, info) {
        if (error) {
            console.error('Error sending email:', error);
        } else {
            console.log('Email sent:', info.response);
        }
    });
}

app.post('/submit-contact', (req, res) => {
    const { name, email, message } = req.body;
  
    // Create transporter
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: gmailUser, // Your Gmail address
          pass: gmailPass // Your Gmail password
        }
      });
  
    // Setup email data
    let mailOptions = {
      from: 'gokulalpha12@gmail.com', // Sender address
      to: 'gokulteja95@gmail.com', // Recipient address
      subject: 'New Message from Contact Form', // Subject line
      text: `Name: ${name}\nEmail: ${email}\nMessage: ${message}` // Plain text body
    };
  
    // Send email
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
        res.status(500).send('Error sending email');
      } else {
        console.log('Email sent: ' + info.response);
        res.redirect('/contact'); // Redirect to the root route
      }
    });
});
app.get('/hacker', (req, res) => {
    // Serve the contact HTML file
    res.sendFile(path.join(__dirname, '/public/hacker.html'));
});
app.use((req, res) => {
    // Redirect to hacker.html for undefined routes
    res.status(404).redirect('/hacker');
});
app.get('/', (req, res) => {
    // Serve index.html
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use((req, res, next) => {
    if (req.hostname === 'mern-portfolio-owdg.onrender.com') {
        // Open the URL and render index.html
        open('https://mern-portfolio-owdg.onrender.com/');
    }
    next(); // Continue to the next middleware
});
// Start the server
const PORT = process.env.PORT || portapp;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
