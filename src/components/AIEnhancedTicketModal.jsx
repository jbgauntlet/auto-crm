/**
 * AIEnhancedTicketModal Component
 * 
 * A modal dialog for getting a natural language prompt to pre-fill the create ticket form.
 * Uses GPT to analyze the prompt and generate appropriate ticket fields.
 * 
 * Features:
 * - Natural language prompt input
 * - AI-powered field generation
 * - Redirects to create ticket form with pre-filled values
 * 
 * Props:
 * @param {boolean} open - Controls the visibility of the modal
 * @param {function} onClose - Callback function to close the modal
 * @param {string} workspaceId - The ID of the current workspace
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import OpenAI from 'openai';
import { supabase } from '../lib/supabaseClient';
import { trackedChatCompletion } from '../lib/langfuseClient';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  TextField,
  Button,
  CircularProgress,
  Typography,
  Alert,
} from '@mui/material';

function AIEnhancedTicketModal({ open, onClose, workspaceId }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [error, setError] = useState(null);
  const [groups, setGroups] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [topicOptions, setTopicOptions] = useState([]);
  const [typeOptions, setTypeOptions] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUser(user);

        // Fetch workspace groups
        const { data: groupsData, error: groupsError } = await supabase
          .from('groups')
          .select('*')
          .eq('workspace_id', workspaceId);

        if (groupsError) throw groupsError;
        setGroups(groupsData);

        // Fetch topic options
        const { data: topicOptionsData, error: topicOptionsError } = await supabase
          .from('ticket_topic_options')
          .select('*')
          .eq('workspace_id', workspaceId);

        if (topicOptionsError) throw topicOptionsError;
        setTopicOptions(topicOptionsData);

        // Fetch type options
        const { data: typeOptionsData, error: typeOptionsError } = await supabase
          .from('ticket_type_options')
          .select('*')
          .eq('workspace_id', workspaceId);

        if (typeOptionsError) throw typeOptionsError;
        setTypeOptions(typeOptionsData);

      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load workspace data.');
      }
    };

    if (open && workspaceId) {
      fetchData();
    }
  }, [open, workspaceId]);

  const handleEnhance = async () => {
    if (!prompt.trim()) return;

    try {
      setLoading(true);
      setError(null);

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
  "type_id": "type_name" | null (suggest one of these types if appropriate: ${typeOptions?.map((t, i) => `[${i}] ${t.name}`).join(', ')}),
  "tags": ["relevant", "tags", "based", "on", "content"] (up to 5 tags),
  "suggested_group": "group_name" | null (suggest one of these groups if appropriate: ${groups.map((g, i) => `[${i}] ${g.name}`).join(', ')}),
  "topic_id": "topic_name" | null (suggest one of these topics if appropriate: ${topicOptions?.map((t, i) => `[${i}] ${t.name}`).join(', ')})
}

Guidelines:
1. Keep the subject clear and concise
2. Include relevant details in the description
3. Set priority based on:
   - urgent: critical system issues, major blockers
   - high: significant impact on business
   - normal: standard requests/issues
   - low: minor improvements, non-urgent requests
4. Only include fields you're confident about
5. For any field you're not sure about, use null
6. For suggested_group:
   - Analyze the ticket content and suggest the most appropriate group
   - Return null if no group seems clearly appropriate
   - Only suggest from the provided list of groups
   - Use the exact name as shown in the list
7. For topic_id:
   - Analyze the ticket content and suggest the most appropriate topic
   - Return null if no topic seems clearly appropriate
   - Only suggest from the provided list of topics
   - Use the exact name as shown in the list
8. For type_id:
   - Analyze the ticket content and suggest the most appropriate type
   - Return null if no type seems clearly appropriate
   - Only suggest from the provided list of types
   - Use the exact name as shown in the list`;

      // Get response from GPT with Langfuse tracking
      const completion = await trackedChatCompletion({
        name: 'enhanced_ticket_generation',
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        openai,
        metadata: {
          availableGroups: groups.map(g => g.name),
          availableTopics: topicOptions?.map(t => t.name),
          availableTypes: typeOptions?.map(t => t.name),
          promptLength: prompt.length,
          userId: currentUser?.id
        }
      });

      const response = completion.choices[0].message.content;
      const fields = JSON.parse(response);

      // Find the group ID if a group was suggested
      let suggestedGroupId = null;
      if (fields.suggested_group) {
        const group = groups.find(g => g.name === fields.suggested_group);
        if (group) {
          suggestedGroupId = group.id;
        }
      }

      // Find the topic ID if a topic was suggested
      let suggestedTopicId = null;
      if (fields.topic_id) {
        const topic = topicOptions?.find(t => t.name === fields.topic_id);
        if (topic) {
          suggestedTopicId = topic.id;
        }
      }

      // Find the type ID if a type was suggested
      let suggestedTypeId = null;
      if (fields.type_id) {
        const type = typeOptions?.find(t => t.name === fields.type_id);
        if (type) {
          suggestedTypeId = type.id;
        }
      }

      // Add debug logging
      console.log('Suggested values:', {
        topic: fields.topic_id,
        type: fields.type_id,
        group: fields.suggested_group
      });
      console.log('Found IDs:', {
        topicId: suggestedTopicId,
        typeId: suggestedTypeId,
        groupId: suggestedGroupId
      });
      console.log('Available options:', {
        topics: topicOptions,
        types: typeOptions,
        groups: groups
      });

      // Navigate to create ticket page with pre-filled values
      navigate(`/workspaces/${workspaceId}/tickets/create`, {
        state: {
          prefill: {
            ...fields,
            requestor_id: currentUser?.id,
            group_id: suggestedGroupId,
            topic_id: suggestedTopicId,
            type_id: suggestedTypeId,
            ai_enhanced: true
          }
        }
      });

      // Reset and close modal
      setPrompt('');
      onClose();

    } catch (err) {
      console.error('Error enhancing ticket:', err);
      setError('Failed to generate ticket fields. Please try again.');
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
        AI Enhanced Ticket (Beta)
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Describe your ticket and let AI help pre-fill the ticket form. You can review and modify all fields before creating the ticket.
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 1 }}>
              {error}
            </Alert>
          )}

          <TextField
            label="Describe your ticket"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            multiline
            rows={3}
            placeholder="Describe what you need in natural language..."
            fullWidth
          />

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Button
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEnhance}
              variant="contained"
              disabled={loading || !prompt.trim()}
            >
              {loading ? <CircularProgress size={24} /> : 'Enhance & Continue'}
            </Button>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

export default AIEnhancedTicketModal; 
