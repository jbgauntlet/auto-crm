/**
 * AITicketModal Component
 * 
 * A modal dialog for creating tickets using AI to interpret user prompts.
 * Uses GPT to analyze the prompt and generate appropriate ticket fields.
 * 
 * Features:
 * - Natural language prompt input
 * - AI-powered field generation
 * - Preview and edit capabilities
 * - All standard ticket fields supported
 * 
 * Props:
 * @param {boolean} open - Controls the visibility of the modal
 * @param {function} onClose - Callback function to close the modal
 * @param {string} workspaceId - The ID of the current workspace
 */

import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import OpenAI from 'openai';
import { trackedChatCompletion } from '../lib/langfuseClient';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Box,
  CircularProgress,
  Typography,
  Divider,
} from '@mui/material';

function AITicketModal({ open, onClose, workspaceId }) {
  const [loading, setLoading] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [generatedFields, setGeneratedFields] = useState(null);
  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    priority: 'normal',
    status: 'open',
  });
  const [error, setError] = useState(null);

  const generateTicketFields = async () => {
    if (!prompt.trim()) return;

    try {
      setLoading(true);

      const openai = new OpenAI({
        apiKey: import.meta.env.VITE_OPENAI_API_KEY,
        dangerouslyAllowBrowser: true
      });

      const systemPrompt = `You are an AI assistant helping to create support tickets. Based on the user's prompt, generate appropriate ticket fields.
Your response should be in JSON format with the following fields:
{
  "subject": "A clear, concise ticket subject",
  "description": "Detailed description of the issue or request",
  "priority": "low" | "normal" | "high" | "urgent" (choose based on urgency/impact),
  "analysis": "A brief explanation of why you chose these fields"
}

Guidelines:
1. Keep the subject clear and concise
2. Include relevant details in the description
3. Set priority based on:
   - urgent: critical system issues, major blockers
   - high: significant impact on business
   - normal: standard requests/issues
   - low: minor improvements, non-urgent requests
4. Provide a brief analysis of your choices`;

      // Get response from GPT with Langfuse tracking
      const completion = await trackedChatCompletion({
        name: 'ticket_generation',
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        openai,
        metadata: {
          promptLength: prompt.length,
          workspaceId
        }
      });

      const response = completion.choices[0].message.content;
      const fields = JSON.parse(response);

      setGeneratedFields(fields);
      setFormData({
        subject: fields.subject,
        description: fields.description,
        priority: fields.priority,
        status: 'open',
      });

    } catch (err) {
      console.error('Error generating ticket fields:', err);
      setError('Failed to generate ticket fields. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { error } = await supabase
        .from('tickets')
        .insert([
          {
            ...formData,
            workspace_id: workspaceId,
            creator_id: user.id,
            requestor_id: user.id,
          }
        ]);

      if (error) throw error;

      // Reset form and close modal
      setPrompt('');
      setGeneratedFields(null);
      setFormData({
        subject: '',
        description: '',
        priority: 'normal',
        status: 'open',
      });
      onClose();
    } catch (error) {
      console.error('Error creating ticket:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle sx={{ 
        color: 'primary.main',
        fontWeight: 600,
      }}>
        Create AI Ticket
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
            label="Describe your ticket"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            multiline
            rows={3}
            placeholder="Describe what you need in natural language..."
            fullWidth
          />
          <Button
            onClick={generateTicketFields}
            variant="outlined"
            disabled={loading || !prompt.trim()}
            sx={{ alignSelf: 'flex-end' }}
          >
            {loading ? <CircularProgress size={24} /> : 'Generate Ticket'}
          </Button>

          {generatedFields && (
            <>
              <Divider sx={{ my: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Generated Ticket
                </Typography>
              </Divider>

              <form onSubmit={handleSubmit}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField
                    required
                    label="Subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    fullWidth
                  />
                  <TextField
                    required
                    label="Description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    multiline
                    rows={4}
                    fullWidth
                  />
                  <TextField
                    select
                    label="Priority"
                    name="priority"
                    value={formData.priority}
                    onChange={handleChange}
                    fullWidth
                  >
                    <MenuItem value="low">Low</MenuItem>
                    <MenuItem value="normal">Normal</MenuItem>
                    <MenuItem value="high">High</MenuItem>
                    <MenuItem value="urgent">Urgent</MenuItem>
                  </TextField>

                  {generatedFields.analysis && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      AI Analysis: {generatedFields.analysis}
                    </Typography>
                  )}

                  <DialogActions sx={{ px: 0, pb: 0 }}>
                    <Button 
                      onClick={onClose}
                      sx={{ color: 'text.secondary' }}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit"
                      variant="contained"
                      disabled={loading}
                    >
                      Create Ticket
                    </Button>
                  </DialogActions>
                </Box>
              </form>
            </>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
}

export default AITicketModal; 
