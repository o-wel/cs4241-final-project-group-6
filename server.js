import express from "express";
import ViteExpress from "vite-express";
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import User from './models/User.js'

dotenv.config()

const app = express();

app.use(express.json())

// connect to MongoDB
const mongoUri = process.env.MONGO_URI || process.env.MONGO_URL || process.env.MONGO_CONNECTION_STRING
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

ViteExpress.listen(app, process.env.PORT || 3000, () =>
  console.log("Server is listening on port 3000..."),
);
