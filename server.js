import express from "express";
import ViteExpress from "vite-express";
import session from 'express-session';
import passport from 'passport';
import LocalStrategy from 'passport-local';
import fs from 'fs';
import seedrandom from 'seedrandom';
import { MongoClient, ServerApiVersion, ObjectId} from 'mongodb';

const uri = `mongodb+srv://${process.env.USR}:${process.env.PASS}@${process.env.HOST}/?retryWrites=true&w=majority&appName=a3-OwenHart`;
const app = express();

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

//Word Setting
const text = fs.readFileSync('wordList.txt', 'utf8')
const words = text.split(/\s+/).filter(Boolean)

const now = new Date()
const seed = parseInt(`${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`, 10)

const rand = seedrandom(seed)
const index = Math.floor(rand() * words.length)
const chosenWord = words[index].toUpperCase()

console.log(`Seed: ${seed}`)
console.log(`Random word: ${chosenWord}`)

//Guess Handling

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

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function connectExample() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect(err => {
            console.log(err);
            client.close();
        });
        // Send a ping to confirm a successful connection
        await client.db("final-project-octurdle").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");


    } finally {
        await client.close();
    }
}

connectExample();

app.delete('/logout', (req, res) => {
    req.logOut(function (err) {
        if (err) {
            return next(err);
        }
        res.redirect('/loginpage');
    });
    console.log('logged out');
})

ViteExpress.listen(app, process.env.PORT || 3000, () =>
  console.log("Server is listening on port 3000..."),
);