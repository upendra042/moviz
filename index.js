const express = require('express');
const app = express();
const admin = require('firebase-admin');
const session = require('express-session');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const path = require('path');
const request = require('request');
const crypto = require('crypto');

const credentials = require('./package.json');

admin.initializeApp({
  credential: admin.credential.cert(credentials),
});

const db = admin.firestore();
const PORT = 3000;

app.use(express.static(path.join(__dirname)));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const secretKey = crypto.randomBytes(32).toString('hex');

app.use(
  session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
  })
);

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.get('/', (req, res) => {
  res.render('login');
});

app.get('/login', (req, res) => {
  res.render('login');
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const userSnapshot = await db.collection('users').where('email', '==', email).get();
    if (userSnapshot.empty) {
      return res.status(400).send('User not found');
    }

    const user = userSnapshot.docs[0].data();
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).send('Invalid password');
    }

    req.session.user = { email: user.email };
    res.redirect('/main');
  } catch (error) {
    console.error('Error occurred', error);
    res.status(500).send('Error logging in');
  }
});

app.get('/signup', (req, res) => {
  res.render('signup');
});

app.post('/signup', async (req, res) => {
  const { name, email, password } = req.body; // Ensure 'name' is correctly extracted

  try {
    const hashPassword = await bcrypt.hash(password, 10);
    await db.collection('user').add({
      name: name, // Make sure 'name' is used correctly
      email: email,
      password: hashPassword,
    });

    res.redirect('/main');
  } catch (error) {
    console.error('Error occurred', error);
    res.status(500).send('Error signing up');
  }
});

app.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send('Error during logout');
    }
    res.redirect('/logout');
  });
});

app.get('/movie', (req, res) => {
  const movieName = req.query.title;

  request(`http://www.omdbapi.com/?apikey=6152b771&t=${movieName}`, function(err, response, body) {
    if (!err && response.statusCode === 200) {
      res.json(JSON.parse(body));
    } else {
      res.status(response.statusCode || 500).send(err || 'Error fetching movie details');
    }
  });
});

app.get('/main', (req, res) => {
  res.render('main');
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
