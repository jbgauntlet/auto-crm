import { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  Fab,
  CircularProgress,
} from '@mui/material';
import { Chat as ChatIcon, Close as CloseIcon, Send as SendIcon } from '@mui/icons-material';
import { supabase } from '../lib/supabaseClient';
import OpenAI from 'openai';

const calculateCosineSimilarity = (embedding1, embedding2) => {
  try {
    // Validate embeddings
    if (!Array.isArray(embedding1) || !Array.isArray(embedding2)) {
      console.error('Invalid embeddings:', { 
        embedding1: typeof embedding1, 
        embedding2: typeof embedding2 
      });
      return 0;
    }

    if (embedding1.length !== embedding2.length) {
      console.error('Embedding length mismatch:', {
        embedding1Length: embedding1.length,
        embedding2Length: embedding2.length
      });
      return 0;
    }

    // Check if embeddings contain valid numbers
    if (embedding1.some(isNaN) || embedding2.some(isNaN)) {
      console.error('Embeddings contain NaN values');
      return 0;
    }

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;
    
    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i];
      norm1 += embedding1[i] * embedding1[i];
      norm2 += embedding2[i] * embedding2[i];
    }

    // Avoid division by zero
    if (norm1 === 0 || norm2 === 0) {
      console.error('Zero magnitude embedding detected');
      return 0;
    }
    
    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  } catch (error) {
    console.error('Error calculating similarity:', error);
    return 0;
  }
};

function HelpBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'How can I help you?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;

    try {
      setLoading(true);
      const userMessage = input.trim();
      setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
      setInput('');

      // Generate embedding for the user's question
      const openai = new OpenAI({
        apiKey: import.meta.env.VITE_OPENAI_API_KEY,
        dangerouslyAllowBrowser: true
      });

      const embeddingResponse = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: userMessage,
      });

      const questionEmbedding = embeddingResponse.data[0].embedding;
      console.log('Question embedding length:', questionEmbedding.length);

      // Fetch knowledge base entries
      const { data: entries, error } = await supabase
        .from('knowledge_base')
        .select('*');

      if (error) throw error;

      console.log('Total knowledge base entries:', entries.length);
      
      // Debug first entry's embedding
      if (entries.length > 0) {
        const firstEntry = entries[0];
        console.log('First entry embedding type:', typeof firstEntry.embedding);
        console.log('First entry embedding is array?', Array.isArray(firstEntry.embedding));
        if (firstEntry.embedding) {
          console.log('First entry embedding length:', firstEntry.embedding.length);
        }
      }

      // Parse embeddings if they're stored as strings
      const entriesWithParsedEmbeddings = entries.map(entry => ({
        ...entry,
        embedding: typeof entry.embedding === 'string' ? 
          JSON.parse(entry.embedding) : 
          entry.embedding
      }));

      console.log('Entries with valid embeddings:', 
        entriesWithParsedEmbeddings.filter(entry => Array.isArray(entry.embedding)).length
      );

      // Find most similar entries
      const relevantEntries = entriesWithParsedEmbeddings
        .filter(entry => Array.isArray(entry.embedding)) // Only consider entries with valid embeddings
        .map(entry => {
          const similarity = calculateCosineSimilarity(questionEmbedding, entry.embedding);
          return {
            ...entry,
            similarity
          };
        })
        .filter(entry => entry.similarity >= 0.3) // Only keep entries with similarity >= 0.3
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 10); // Get up to 10 most relevant entries

      console.log('Relevant entries with similarity scores:', 
        relevantEntries.map(entry => ({
          topic: entry.topic,
          subtopic: entry.subtopic,
          text: entry.text,
          similarity: entry.similarity,
          hasEmbedding: !!entry.embedding,
          embeddingLength: entry.embedding ? entry.embedding.length : 0
        }))
      );

      if (relevantEntries.length === 0 || !relevantEntries.some(entry => entry.text)) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: "I apologize, but I don't have any properly formatted information in my knowledge base yet. Please make sure the knowledge base entries contain both embeddings and text content."
        }]);
        return;
      }

      // Format relevant knowledge base entries with more detail
      const contextEntries = relevantEntries
        .filter(entry => entry.text) // Only use entries that have text content
        .map(entry => `Topic: ${entry.topic || 'N/A'}
Subtopic: ${entry.subtopic || 'N/A'}
Content: ${entry.text || 'No content available'}
Relevance Score: ${entry.similarity.toFixed(4)}
---`)
        .join('\n\n');

      // Get recent chat history (last 6 messages)
      const recentMessages = messages.slice(-6);
      const chatHistory = recentMessages
        .map(msg => `${msg.role}: ${msg.content}`)
        .join('\n');

      // Create the prompt for GPT
      const systemPrompt = `You are a helpful assistant for a CRM application. Your role is to help users understand the app's features and functionality.

Rules:
1. Only answer questions about the app's features, functionality, interface, and usage
2. If a question is not about the app's features, functionality, interface, or usage, politely decline to answer
3. Primarily base your answers on the knowledge base entries provided below, but you can make reasonable inferences and provide helpful context
4. Be concise but friendly in your responses
5. Don't give generic responses
6. Include specific details from the knowledge base entries
7. Focus on answering the CURRENT question, not previous questions

Below are relevant entries from the knowledge base, ordered by relevance to the current question:

${contextEntries}

Note: Previous chat context is provided for reference only. Focus on answering the current question:
${chatHistory}

CURRENT QUESTION: "${userMessage}"

Please provide a direct answer to the current question, primarily using the knowledge base entries provided above but feel free to make reasonable inferences when needed. If none of the knowledge base entries are relevant to this specific question, say so clearly.`;

      // Get response from GPT
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage }
        ],
        temperature: 0.3, // Lower temperature for more focused responses
        max_tokens: 500
      });

      const response = completion.choices[0].message.content;

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response
      }]);

    } catch (err) {
      console.error('Error processing question:', err);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'I apologize, but I encountered an error while processing your question. Please try again.'
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating chat button */}
      <Fab
        color="primary"
        aria-label="help"
        sx={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          zIndex: 1000,
        }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <ChatIcon />
      </Fab>

      {/* Chat window */}
      {isOpen && (
        <Paper
          elevation={3}
          sx={{
            position: 'fixed',
            bottom: 90,
            right: 20,
            width: 350,
            height: 500,
            display: 'flex',
            flexDirection: 'column',
            zIndex: 1000,
            backgroundColor: 'background.paper',
          }}
        >
          {/* Header */}
          <Box
            sx={{
              p: 2,
              borderBottom: 1,
              borderColor: 'divider',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Typography variant="h6">Help Assistant</Typography>
            <IconButton onClick={() => setIsOpen(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Messages */}
          <Box
            sx={{
              flex: 1,
              overflow: 'auto',
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
            }}
          >
            {messages.map((message, index) => (
              <Box
                key={index}
                sx={{
                  alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '80%',
                }}
              >
                <Paper
                  elevation={1}
                  sx={{
                    p: 1,
                    backgroundColor: message.role === 'user' ? 'primary.main' : 'grey.100',
                    color: message.role === 'user' ? 'white' : 'text.primary',
                  }}
                >
                  <Typography variant="body2">{message.content}</Typography>
                </Paper>
              </Box>
            ))}
          </Box>

          {/* Input */}
          <Box
            sx={{
              p: 2,
              borderTop: 1,
              borderColor: 'divider',
              display: 'flex',
              gap: 1,
            }}
          >
            <TextField
              fullWidth
              size="small"
              placeholder="Ask about app features..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              disabled={loading}
            />
            <IconButton
              color="primary"
              onClick={handleSend}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : <SendIcon />}
            </IconButton>
          </Box>
        </Paper>
      )}
    </>
  );
}

export default HelpBot; 
