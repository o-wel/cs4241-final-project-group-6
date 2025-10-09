import express from "express";
import ViteExpress from "vite-express";
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import User from './models/User.js'
import session from 'express-session';
import passport from 'passport';
import LocalStrategy from 'passport-local';
import fs from 'fs';
import seedrandom from 'seedrandom';
import { MongoClient, ServerApiVersion, ObjectId} from 'mongodb';

dotenv.config()

const app = express();

app.use(express.json())

// connect to MongoDB
const mongoUri = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASS}@${process.env.MONGO_HOST}/${process.env.MONGO_DB}?retryWrites=true&w=majority&appName=a3-OwenHart`;
if (mongoUri) {
  mongoose.connect(mongoUri, {
  }).then(() => {
    console.log('Connected to MongoDB')
  }).catch(err => {
    console.error('MongoDB connection error:', err)
  })
} else {
  console.warn('No MongoDB connection string found')
}

// POST /login - authenticate user and return JWT on success
app.post('/login', async (req, res) => {
  const { username, password } = req.body || {}
  if (!username || !password) return res.status(400).json({ success: false, message: 'username and password required' })
  if (!mongoUri) return res.status(503).json({ success: false, message: 'Database is not configured' })

  try {
    const user = await User.findOne({ username }).exec()

    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' })

    const match = await bcrypt.compare(password, user.passwordHash)
    if (!match) return res.status(401).json({ success: false, message: 'Invalid credentials' })

    const secret = process.env.JWT_SECRET || 'dev_jwt_secret'
    const token = jwt.sign({ id: user._id.toString(), username: user.username }, secret, { expiresIn: '2h' })

    return res.json({ success: true, token, user: { username: user.username } })
  } catch (err) {
    console.error('Login error', err)
    return res.status(500).json({ success: false, message: 'Server error' })
  }
})

// GET /me - returns current user when provided a Bearer token
app.get('/me', async (req, res) => {
  const auth = req.headers.authorization
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ success: false, message: 'Missing token' })
  const token = auth.slice(7)
  const secret = process.env.JWT_SECRET || 'dev_jwt_secret'
  try {
    const payload = jwt.verify(token, secret)
    // payload should contain id and username
    const user = await User.findById(payload.id).exec()
    if (!user) return res.status(401).json({ success: false, message: 'Invalid token' })
    return res.json({ success: true, user: { username: user.username } })
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid token' })
  }
})

/* Passport.js as alternative to JWT auth


let userData = null;

// setting up passport
app.use(session({
    secret: "secret",
    resave: false,
    saveUninitialized: true
}))
app.use(passport.initialize());
app.use(passport.session());

const authUser = async (username, password, done) => {
    await client.connect(err => {
        console.log(err);
        client.close();
    });

    const user = await client.db("final-project-octurdle").collection('users').findOne({username: username, password: password});

    if (!user) {
        await client.close();
        return done(null, false, { message: 'Could not find user with this password' });
    } else {
        userData = client.db("final-project-octurdle").collection(username);
        await client.close();

        return done(null, user);
    }
}

const checkAuth = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    } else {
        res.redirect('/loginpage');
    }
}

const alreadyLoggedIn = (req, res, next) => {
    if (req.isAuthenticated()) {
        return res.redirect('/wishlist');
    }
    next()
}

passport.use(new LocalStrategy(authUser));

passport.serializeUser((user, done) => {
    console.log("serializing user:", user)
    done(null, user)
})
passport.deserializeUser((user, done) => {
    console.log("deserializing user:", user)
    done(null, user)
})

app.delete('/logout', (req, res) => {
    req.logOut(function (err) {
        if (err) {
            return next(err);
        }
        res.redirect('/loginpage');
    });
    console.log('logged out');
})

*/


// Word Setting
const text = fs.readFileSync('wordList.txt', 'utf8')
const words = text.split(/\s+/).filter(Boolean)

const now = new Date()
const seed = parseInt(`${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`, 10)

const rand = seedrandom(seed)
const index = Math.floor(rand() * words.length)
const chosenWord = words[index].toUpperCase()

console.log(`Seed: ${seed}`)
console.log(`Random word: ${chosenWord}`)

// Guess Handling
app.use(express.json())

app.post('/guess', (req, res) => {
  const {word} = req.body

  if(!word || word.length !== 8) {
    return res.status(400).json({error: 'Word must be 8 letters'})
  }

  const feedback = word.split('').map((letter, i) => {
    console.log('Current letter:', letter, 'at index', i)
    if (letter === chosenWord[i]) {
      console.log('1')
      return 1
    } else if (chosenWord.includes(letter)) {
      console.log('0')
      return 0
    } else {
      console.log('-1')
      return -1
    }
  })

  res.json({feedback})
})

ViteExpress.listen(app, process.env.PORT || 3000, () =>
  console.log("Server is listening on port 3000..."),
);
