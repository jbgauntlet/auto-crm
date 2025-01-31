/**
 * GroupsSettings Component
 * 
 * Manages workspace groups and their configurations.
 * Provides interfaces for creating, editing, and deleting groups.
 * 
 * Features:
 * - Group listing
 * - Group creation
 * - Group deletion
 * - Member assignment
 * - Role-based access control
 * 
 * Props:
 * None - Uses React Router for workspace context
 */

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../../lib/supabaseClient';
import OpenAI from 'openai';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Alert,
  CircularProgress,
} from '@mui/material';

function GroupsSettings() {
  const { workspaceId } = useParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const generateEmbeddings = async () => {
    try {
      setProcessing(true);
      setError(null);
      setProgress(0);

      // Initialize OpenAI client
      const openai = new OpenAI({
        apiKey: import.meta.env.VITE_OPENAI_API_KEY,
        dangerouslyAllowBrowser: true  // Only for this temporary one-time operation
      });

      // Fetch all knowledge base entries
      const { data: entries, error: fetchError } = await supabase
        .from('knowledge_base')
        .select('*');

      if (fetchError) throw fetchError;

      // Process each entry
      for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        const combinedText = `${entry.topic || ''}\n${entry.subtopic || ''}\n${entry.text || ''}`.trim();
        
        // Log the first entry's format
        if (i === 0) {
          console.log('Example of combined text format:');
          console.log('---START OF TEXT---');
          console.log(combinedText);
          console.log('---END OF TEXT---');
        }
        
        // Generate embedding
        const embeddingResponse = await openai.embeddings.create({
          model: "text-embedding-3-small",
          input: combinedText,
        });

        // Update the entry with the new embedding
        const { error: updateError } = await supabase
          .from('knowledge_base')
          .update({ embedding: embeddingResponse.data[0].embedding })
          .eq('id', entry.id);

        if (updateError) throw updateError;

        // Update progress
        setProgress(Math.round(((i + 1) / entries.length) * 100));
      }

      alert('Successfully generated and updated all embeddings!');
    } catch (err) {
      console.error('Error generating embeddings:', err);
      setError(err.message);
    } finally {
      setProcessing(false);
      setProgress(0);
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" sx={{ color: 'primary.main', fontWeight: 600, mb: 4 }}>
        Groups Settings
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Knowledge Base Embeddings Generator
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Generate embeddings for all knowledge base entries using OpenAI's text-embedding-3-small model.
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button
              variant="contained"
              onClick={generateEmbeddings}
              disabled={processing}
            >
              {processing ? 'Processing...' : 'Generate Embeddings'}
            </Button>
            {processing && (
              <>
                <CircularProgress size={24} />
                <Typography variant="body2">{progress}% Complete</Typography>
              </>
            )}
          </Box>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          {/* TODO: Implement groups management interface */}
          <Typography>Groups management interface coming soon...</Typography>
        </CardContent>
      </Card>
    </Box>
  );
}

export default GroupsSettings; 