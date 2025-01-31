import { Langfuse } from 'langfuse';

// Initialize Langfuse client
export const langfuse = new Langfuse({
  publicKey: import.meta.env.VITE_LANGFUSE_PUBLIC_KEY,
  secretKey: import.meta.env.VITE_LANGFUSE_SECRET_KEY,
  baseUrl: import.meta.env.VITE_LANGFUSE_BASE_URL // optional, defaults to cloud
});

// Wrapper for OpenAI chat completions with Langfuse tracking
export async function trackedChatCompletion({ 
  name, 
  prompt, 
  messages, 
  model = "gpt-3.5-turbo",
  temperature = 0.7,
  metadata = {},
  openai // OpenAI client instance
}) {
  const trace = await langfuse.trace({
    id: `${name}_${Date.now()}`,
    name: `${name}_completion`,
    input: {
      prompt,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      model,
      temperature
    },
    metadata: {
      ...metadata,
      model,
      temperature
    }
  });

  const span = await trace.span({
    name: "chat_completion",
    input: {
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      model,
      temperature
    }
  });

  try {
    const completion = await openai.chat.completions.create({
      model,
      messages,
      temperature,
    });

    const output = {
      message: completion.choices[0].message,
      usage: completion.usage,
      model: completion.model,
      finish_reason: completion.choices[0].finish_reason
    };

    await span.end({
      output,
      metadata: {
        usage: completion.usage,
        model: completion.model
      }
    });

    await trace.update({
      status: 'success',
      output
    });

    return completion;
  } catch (error) {
    const errorOutput = {
      error: error.message,
      code: error.code,
      type: error.type
    };

    await span.end({
      level: "error",
      output: errorOutput,
      statusMessage: error.message
    });

    await trace.update({
      status: 'error',
      statusMessage: error.message,
      output: errorOutput
    });

    throw error;
  }
}

// Wrapper for OpenAI embeddings with Langfuse tracking
export async function trackedEmbedding({
  name,
  input,
  model = "text-embedding-3-small",
  metadata = {},
  openai // OpenAI client instance
}) {
  const trace = await langfuse.trace({
    id: `${name}_${Date.now()}`,
    name: `${name}_embedding`,
    input: {
      text: input,
      model
    },
    metadata: {
      ...metadata,
      model,
      inputLength: input.length
    }
  });

  const span = await trace.span({
    name: "embedding",
    input: {
      text: input,
      model
    }
  });

  try {
    const embedding = await openai.embeddings.create({
      model,
      input,
    });

    const output = {
      dimensions: embedding.data[0].embedding.length,
      usage: embedding.usage,
      model: embedding.model,
      embeddingLength: embedding.data[0].embedding.length
    };

    await span.end({
      output,
      metadata: {
        usage: embedding.usage,
        model: embedding.model
      }
    });

    await trace.update({
      status: 'success',
      output
    });

    return embedding;
  } catch (error) {
    const errorOutput = {
      error: error.message,
      code: error.code,
      type: error.type
    };

    await span.end({
      level: "error",
      output: errorOutput,
      statusMessage: error.message
    });

    await trace.update({
      status: 'error',
      statusMessage: error.message,
      output: errorOutput
    });

    throw error;
  }
}

// Helper to create score observations
export async function trackScore({
  trace,
  name,
  score,
  comment = "",
  metadata = {}
}) {
  await trace.score({
    name,
    value: score,
    comment,
    metadata
  });
} 
