const express = require('express');
const admin = require('firebase-admin');
const session = require('express-session');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const path = require('path');
const request = require('request');
const crypto = require('crypto');
require('dotenv').config(); // Load environment variables

const serviceAccount = require('./package.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const app = express();
const PORT = 3001;

app.use(express.static(path.join(__dirname)));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(
  session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
  })
);

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Define routes
app.get('/', (req, res) => {
  res.render('login');
});

app.get('/login', (req, res) => {
  res.render('login');
});

app.get('/logout', (req, res) => {
  res.render('logout');
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const userSnapshot = await db.collection('user1').where('email', '==', email).get();
    if (userSnapshot.empty) {
      return res.status(400).send('User not found');
    }

    const user = userSnapshot.docs[0].data();
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).send('Invalid password');
    }

    // Initialize notifications if they do not exist
    const notifications = user.notifications || []; // Default to empty array if undefined

    // Set session data
    req.session.user = {
      email: user.email,
      name: user.name,
      phone: user.phone,
      address: user.address,
      bio: user.bio,
      dob: user.dob,
      role: user.role,
      notifications // Pass notifications to the session
    };

    res.redirect('/landing-page');
  } catch (error) {
    console.error('Error occurred', error);
    res.status(500).send('Error logging in');
  }
});

app.get('/signup', (req, res) => {
  res.render('signup');
});

app.post('/signup', async (req, res) => {
  const { name, email, password, phone, address, bio, dob } = req.body;

  try {
    const userSnapshot = await db.collection('user1').where('email', '==', email).get();
    if (!userSnapshot.empty) {
      return res.status(400).send('Email already in use');
    }

    const hashPassword = await bcrypt.hash(password, 10);
    await db.collection('user1').add({
      name,
      email,
      password: hashPassword,
      phone,
      address,
      bio,
      dob,
      role: 'user', // Default role; adjust as needed
      notifications: [] // Initialize notifications as an empty array
    });

    res.redirect('/login');
  } catch (error) {
    console.error('Error occurred', error);
    res.status(500).send('Error signing up');
  }
});
// ...

// ...

app.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send('Error during logout');
    }
    res.redirect('/logout');
  });
});

app.get('/main', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  res.render('main', { user: req.session.user });
});

// Route to serve User Portal
app.get('/user-portal', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  res.render('user-portal', { user: req.session.user });
});

// Route to serve Tutor Dashboard
app.get('/tutor-dashboard', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  res.render('tutor-dashboard', { user: req.session.user });
});

// Route to serve Admin Panel
app.get('/admin-panel', (req, res) => {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.redirect('/login');
  }
  res.render('admin-panel', { user: req.session.user });
});

// Route to serve Landing Page
app.get('/landing-page', (req, res) => {
  res.render('landing-page');
});

// Route to serve Blog
app.get('/blog', (req, res) => {
  res.render('blog');
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
