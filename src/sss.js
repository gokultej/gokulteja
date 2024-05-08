User
// Import required modules
const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const mongoose = require('mongoose');
const MongoStore = require('connect-mongo'); // Import connect-mongo and initialize it with session
const { GridFsStorage } = require('multer-gridfs-storage');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
// Create an Express application
const app = express();

const flash = require('connect-flash');
app.use(flash());

// Serve the static files (index.html and others)
app.use(express.static('public'));
app.use(bodyParser.json());
// Middleware to parse incoming request bodies
app.use(bodyParser.urlencoded({ extended: true }));
const sessionMongoURI = 'mongodb+srv://Gokul_Teja:Gokulteja12$@cluster0.chrbcva.mongodb.net/FinalDB';

mongoose.connect(sessionMongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => console.log('Session MongoDB connected'))
  .catch(err => console.error('Session MongoDB connection error:', err));

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

// Route to handle form submission with image upload
const storage = new GridFsStorage({
    url: sessionMongoURI,
    file: (req, file) => {
        return new Promise((resolve, reject) => {
            crypto.randomBytes(16, (err, buf) => {
                if (err) {
                    return reject(err);
                }
                const filename = buf.toString('hex') + path.extname(file.originalname);
                const fileInfo = {
                    filename: filename,
                    bucketName: 'uploads' // Bucket name
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
const upload = multer({ storage: storage });
// Middleware function to check if the user is logged in
const requireLogin = (req, res, next) => {
    console.log('Checking authentication...');
    // Check if the user is logged in
    if (req.session.username === 'gokulteja786') {
        console.log('User is logged in.');
        // If the user is logged in, proceed to the next middleware
        next();
    } else {
        console.log('User is not logged in. Redirecting to login page.');
        // If the user is not logged in, redirect to the login page
        res.redirect('/login');
    }
};

// Route for the logout page
app.get('/logout', (req, res) => {
    // Render the logout page
    res.sendFile(__dirname + '/public/logout.html');
});

// Route for handling logout
app.post('/logout', (req, res) => {
    // Destroy the session to log out the user
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
        } else {
            // Redirect the user to the login page after logout
            res.redirect('/login');
        }
    });
});

// Route for the login page
app.get('/login', (req, res) => {
    res.sendFile(__dirname + '/public/login.html');
});

// Route for handling login form submission
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    // Check if username and password match
    if (username === 'gokulteja786' && password === 'Gokulteja12$') {
        // Set a session variable to indicate the user is logged in
        req.session.username = username;
        // Redirect to the adminhouse page
        res.redirect('/adminhouse');
    } else {
        // If authentication fails, redirect back to the login page
        res.redirect('/login');
    }
});

// Route for the adminhouse page
app.get('/adminhouse', requireLogin, (req, res) => {
    // If the middleware allows reaching this point, serve the admin page
    res.sendFile(__dirname + '/public/admin.html');
});

// Route for the projects page
app.get('/projects', (req, res) => {
    // Serve the projects HTML file
    res.sendFile(__dirname + '/public/projects.html');
});

// Route for the blogs page
app.get('/blogs', (req, res) => {
    // Serve the blogs HTML file
    res.sendFile(__dirname + '/public/blogs.html');
});
app.post('/create-blog', upload.single('blogimage'), async (req, res) => {
    try {
        const { blogtitle, blogdescription, blogdate, blogtime } = req.body;
        const blogimage = req.file.id;

        const newBlog = new Blog({
            blogtitle,
            blogdescription,
            blogdate,
            blogtime, // Include the blogtime field in the new Blog object
            blogimage
        });

        await newBlog.save();

        req.flash('success', 'Blog created successfully');
        res.redirect('/adminhouse');
    } catch (err) {
        console.error(err);
        req.flash('error', 'Internal server error');
        res.status(500).json({ error: 'Internal server error' });
    }
});


// Route for the contact page
app.get('/contact', (req, res) => {
    // Serve the contact HTML file
    res.sendFile(__dirname + '/public/contact.html');
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});