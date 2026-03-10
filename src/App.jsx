import { useState } from 'react'
import FileUpload from './components/FileUpload'

function App() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [_selectedFile, setSelectedFile] = useState(null)
  const [documentText, setDocumentText] = useState('')
  const sendMessage = async () => {
    if (!input.trim()) return

    console.log('documentText ==', documentText)

    const userMessage = { role: 'user', content: input }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input }),
      })

      const data = await res.json()
      const aiMessage = { role: 'ai', content: data.reply }
      setMessages((prev) => [...prev, aiMessage])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') sendMessage()
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.logo}>IntelliDoc</h1>
        <p style={styles.tagline}>AI-powered document assistant</p>
      </div>

      <FileUpload
        onFileSelect={(file) => setSelectedFile(file)}
        onTextExtracted={(text) => setDocumentText(text)}
      />

      {/* Messages */}
      <div style={styles.messages}>
        {messages.length === 0 && (
          <p style={styles.empty}>
            Upload a document and start asking questions...
          </p>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              ...styles.bubble,
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              background: msg.role === 'user' ? '#00e5a0' : '#1e1e2e',
              color: msg.role === 'user' ? '#000' : '#fff',
            }}
          >
            {msg.content}
          </div>
        ))}
        {loading && (
          <div
            style={{
              ...styles.bubble,
              background: '#1e1e2e',
              alignSelf: 'flex-start',
            }}
          >
            Thinking...
          </div>
        )}
      </div>

      {/* Input */}
      <div style={styles.inputRow}>
        <input
          style={styles.input}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question..."
        />
        <button style={styles.button} onClick={sendMessage} disabled={loading}>
          Send
        </button>
      </div>
    </div>
  )
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    maxWidth: '800px',
    margin: '0 auto',
    padding: '24px',
  },
  header: {
    marginBottom: '24px',
  },
  logo: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#00e5a0',
  },
  tagline: {
    fontSize: '13px',
    color: '#666',
    marginTop: '4px',
  },
  messages: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    overflowY: 'auto',
    paddingBottom: '16px',
  },
  empty: {
    color: '#444',
    textAlign: 'center',
    marginTop: '40px',
    fontSize: '14px',
  },
  bubble: {
    padding: '12px 16px',
    borderRadius: '12px',
    maxWidth: '70%',
    fontSize: '14px',
    lineHeight: '1.5',
  },
  inputRow: {
    display: 'flex',
    gap: '10px',
    paddingTop: '16px',
    borderTop: '1px solid #222',
  },
  input: {
    flex: 1,
    padding: '12px 16px',
    borderRadius: '8px',
    border: '1px solid #333',
    background: '#1a1a1a',
    color: '#fff',
    fontSize: '14px',
    outline: 'none',
  },
  button: {
    padding: '12px 24px',
    borderRadius: '8px',
    border: 'none',
    background: '#00e5a0',
    color: '#000',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '14px',
  },
}

export default App
