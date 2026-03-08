import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import OpenAI from 'openai'

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

app.post('/api/chat', async (req, res) => {
  const { message } = req.body

  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: message }]
  })

  res.json({ reply: response.choices[0].message.content })
})

app.listen(3001, () => {
  console.log('IntelliDoc server running on port 3001')
})