import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import OpenAI from 'openai'
import multer from 'multer'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const pdfParse = require('pdf-parse').default || require('pdf-parse')

dotenv.config()

// Safety check — fail loudly if API key missing
if (!process.env.OPENAI_API_KEY) {
  console.error('❌ OPENAI_API_KEY is missing in .env')
  process.exit(1)
}

const app = express()
app.use(cors())
app.use(express.json())

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

// Multer setup — store file in memory as buffer
// Why memory? We only need it temporarily to extract text
// We don't need to save PDFs to disk
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true)
    } else {
      cb(new Error('Only PDF files are allowed'))
    }
  }
})

// Upload route — receives PDF, extracts text
app.post('/api/upload', upload.single('pdf'), async (req, res) => {
  try {
    // req.file.buffer is the raw PDF bytes in memory
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    // Extract text from PDF buffer
    const data = await pdfParse(req.file.buffer)

    // data.text contains all extracted plain text
    const extractedText = data.text

    if (!extractedText || extractedText.trim().length === 0) {
      return res.status(400).json({ error: 'Could not extract text from PDF' })
    }

    console.log(`✅ PDF parsed: ${extractedText.length} characters extracted`)

    res.json({
      success: true,
      text: extractedText,
      pages: data.numpages,
      characters: extractedText.length
    })

  } catch (err) {
    console.error('PDF parse error:', err.message)
    res.status(500).json({ error: 'Failed to parse PDF' })
  }
})

// Chat route
app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body

    if (!message) {
      return res.status(400).json({ error: 'Message is required' })
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: message }]
    })

    res.json({ reply: response.choices[0].message.content })

  } catch (err) {
    console.error('OpenAI error:', err.message)
    res.status(500).json({ error: 'Something went wrong. Try again.' })
  }
})

app.listen(3001, () => {
  console.log('🚀 IntelliDoc server running on port 3001')
})