// chunker.js
// Splits large text into overlapping chunks
// Why overlap? To avoid cutting sentences at boundaries
// Example: chunk1 ends mid-sentence, chunk2 starts slightly before
// so the sentence appears complete in at least one chunk

function chunkText(text, chunkSize = 1000, overlap = 200) {
  const chunks = []
  let start = 0

  while (start < text.length) {
    const end = start + chunkSize

    // Extract chunk
    const chunk = text.slice(start, end)

    // Only add non-empty chunks
    if (chunk.trim().length > 0) {
      chunks.push({
        text: chunk,
        startIndex: start,
        endIndex: Math.min(end, text.length)
      })
    }

    // Move start forward by chunkSize minus overlap
    // This creates the overlap between consecutive chunks
    start += chunkSize - overlap
  }

  return chunks
}

// Find relevant chunks based on keyword matching
// Why keyword matching? Simple, fast, no extra API calls
// Good enough for most document Q&A use cases
function findRelevantChunks(chunks, question, maxChunks = 3) {
  // Extract keywords from question
  // Remove common words (stop words) that don't carry meaning
  const stopWords = new Set([
    'what', 'is', 'the', 'a', 'an', 'in', 'on', 'at', 'to',
    'for', 'of', 'and', 'or', 'but', 'how', 'why', 'when',
    'where', 'who', 'which', 'are', 'was', 'were', 'be', 'been',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
    'can', 'could', 'should', 'may', 'might', 'this', 'that',
    'these', 'those', 'it', 'its', 'me', 'my', 'we', 'our'
  ])

  const keywords = question
    .toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word))

  // Score each chunk by how many keywords it contains
  const scored = chunks.map(chunk => {
    const chunkLower = chunk.text.toLowerCase()
    const score = keywords.reduce((acc, keyword) => {
      // Count occurrences of each keyword in chunk
      const matches = (chunkLower.match(new RegExp(keyword, 'g')) || []).length
      return acc + matches
    }, 0)

    return { ...chunk, score }
  })

  // Sort by score descending, take top N chunks
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, maxChunks)
    .filter(chunk => chunk.score > 0) // Only return chunks with matches
}

module.exports = { chunkText, findRelevantChunks }