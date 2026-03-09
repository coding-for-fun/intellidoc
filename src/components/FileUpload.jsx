import { useState } from 'react'

function FileUpload({ onFileSelect, onTextExtracted }) {
  const [fileName, setFileName] = useState('')
  const [dragging, setDragging] = useState(false)

  const handleFile = async (file) => {
    if (!file || file.type !== 'application/pdf') {
      alert('Please upload a PDF file')
      return
    }

    setFileName(file.name)
    onFileSelect(file)

    // Send PDF to backend
    try {
      // FormData is how browsers send files over HTTP
      const formData = new FormData()
      formData.append('pdf', file)

      const res = await fetch('http://localhost:3001/api/upload', {
        method: 'POST',
        body: formData,
        // Note: Don't set Content-Type header manually
        // Browser sets it automatically with correct boundary for FormData
      })

      const data = await res.json()

      if (data.success) {
        console.log(
          `✅ Extracted ${data.characters} characters from ${data.pages} pages`
        )
        onTextExtracted(data.text)
      } else {
        alert(data.error || 'Failed to parse PDF')
      }
    } catch (err) {
      console.error('Upload error:', err)
      alert('Failed to upload PDF')
    }
  }

  const handleChange = (e) => {
    handleFile(e.target.files[0])
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    handleFile(e.dataTransfer.files[0])
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setDragging(true)
  }

  const handleDragLeave = () => setDragging(false)

  return (
    <div
      style={{
        ...styles.dropzone,
        borderColor: dragging ? '#00e5a0' : '#333',
        background: dragging ? '#0a2a1f' : '#1a1a1a',
      }}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      {fileName ? (
        <div style={styles.fileInfo}>
          <span style={styles.fileIcon}>📄</span>
          <span style={styles.fileName}>{fileName}</span>
          <span style={styles.ready}>Ready to chat!</span>
        </div>
      ) : (
        <div style={styles.placeholder}>
          <p style={styles.mainText}>Drag & drop your PDF here</p>
          <p style={styles.orText}>or</p>
          <label style={styles.browseBtn}>
            Browse file
            <input
              type="file"
              accept="application/pdf"
              onChange={handleChange}
              style={{ display: 'none' }}
            />
          </label>
        </div>
      )}
    </div>
  )
}

const styles = {
  dropzone: {
    border: '2px dashed #333',
    borderRadius: '12px',
    padding: '32px',
    textAlign: 'center',
    transition: 'all 0.2s ease',
    marginBottom: '24px',
    cursor: 'pointer',
  },
  placeholder: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
  },
  mainText: {
    color: '#888',
    fontSize: '14px',
  },
  orText: {
    color: '#444',
    fontSize: '12px',
  },
  browseBtn: {
    padding: '8px 20px',
    background: '#00e5a0',
    color: '#000',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '4px',
  },
  fileInfo: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
  },
  fileIcon: {
    fontSize: '20px',
  },
  fileName: {
    color: '#00e5a0',
    fontSize: '14px',
    fontWeight: '500',
  },
  ready: {
    color: '#666',
    fontSize: '12px',
  },
}

export default FileUpload
