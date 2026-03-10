const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
const { OpenAI } = require('openai')
const multer = require('multer')
const pdfParse = require('pdf-parse')
const { chunkText, findRelevantChunks } = require('./utils/chunker')

dotenv.config()

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

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true)
    } else {
      cb(new Error('Only PDF files are allowed'))
    }
  }
})

// In-memory store for chunks
// Why in-memory? Simple for now — good enough for single user demo
// Production would use a vector database like Pinecone or pgvector
let documentChunks = []

// Upload route
app.post('/api/upload', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    const data = await pdfParse(req.file.buffer)
    const extractedText = data.text

    if (!extractedText || extractedText.trim().length === 0) {
      return res.status(400).json({ error: 'Could not extract text from PDF' })
    }

    // Chunk the extracted text
    documentChunks = chunkText(extractedText)

    console.log(`✅ PDF parsed: ${extractedText.length} characters`)
    console.log(`✅ Created ${documentChunks.length} chunks`)

    res.json({
      success: true,
      pages: data.numpages,
      characters: extractedText.length,
      chunks: documentChunks.length
    })

  } catch (err) {
    console.error('PDF parse error:', err.message)
    res.status(500).json({ error: 'Failed to parse PDF' })
  }
})

// Chat route — now with document context
app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body

    if (!message) {
      return res.status(400).json({ error: 'Message is required' })
    }

    // Build context from relevant chunks
    let systemPrompt = `You are IntelliDoc, an AI-powered document assistant.
You help users understand and extract information from their uploaded documents.
Be concise, accurate and helpful.`

    // If document is uploaded — use it as context
    if (documentChunks.length > 0) {
      const relevantChunks = findRelevantChunks(documentChunks, message)

      if (relevantChunks.length > 0) {
        const context = relevantChunks.map(c => c.text).join('\n\n---\n\n')

        // Inject document context into system prompt
        systemPrompt = `You are IntelliDoc, an AI-powered document assistant.
Answer questions ONLY based on the document context provided below.
If the answer is not in the document, say "I couldn't find that in the uploaded document."
Be concise and accurate.

DOCUMENT CONTEXT:
${context}`
      }
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ]
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