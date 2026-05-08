const axios = require('axios');

// OpenAI API call
async function callOpenAI(systemPrompt, history, userMessage, streamCallback = null) {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const messages = [];
  
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }

  history.forEach(h => {
    messages.push({ role: h.role, content: h.content });
  });

  messages.push({ role: 'user', content: userMessage });

  const requestBody = {
    model: 'gpt-4o-mini',
    messages,
    temperature: 0.2,
    max_tokens: 1200,
    stream: streamCallback !== null
  };

  if (streamCallback) {
    // Streaming response
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      requestBody,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        responseType: 'stream'
      }
    );

    return new Promise((resolve, reject) => {
      let buffer = '';

      response.data.on('data', (chunk) => {
        buffer += chunk.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop(); // Keep incomplete line in buffer

        lines.forEach(line => {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) return;

          if (trimmed === 'data: [DONE]') {
            streamCallback('[DONE]');
            resolve('');
            return;
          }

          const json = trimmed.substring(6);
          if (!json) return;

          try {
            const parsed = JSON.parse(json);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              streamCallback(content);
            }
          } catch (e) {
            // Ignore parse errors
          }
        });
      });

      response.data.on('error', (error) => {
        reject(error);
      });

      response.data.on('end', () => {
        if (!buffer.includes('[DONE]')) {
          streamCallback('[DONE]');
        }
        resolve('');
      });
    });
  } else {
    // Non-streaming response
    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        requestBody,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          timeout: 25000
        }
      );

      return response.data.choices[0].message.content;
    } catch (error) {
      if (error.response?.status === 429) {
        throw new Error('Rate limit exceeded. Please wait a moment and try again.');
      }
      throw new Error(error.response?.data?.error?.message || 'OpenAI API error');
    }
  }
}

// Google Gemini API call
async function callGemini(systemPrompt, history, userMessage, streamCallback = null) {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error('Gemini API key not configured');
  }

  const contents = [];

  // Add system prompt as first user message + model acknowledgment
  if (systemPrompt) {
    contents.push({
      role: 'user',
      parts: [{ text: systemPrompt }]
    });
    contents.push({
      role: 'model',
      parts: [{ text: 'Understood. I will follow the above system instructions.' }]
    });
  }

  // Add history (convert assistant to model)
  history.forEach(h => {
    contents.push({
      role: h.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: h.content }]
    });
  });

  // Add user message
  contents.push({
    role: 'user',
    parts: [{ text: userMessage }]
  });

  const requestBody = {
    contents,
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 1200
    }
  };

  const model = 'gemini-2.0-flash-exp';
  const url = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`;

  try {
    const response = await axios.post(url, requestBody, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 25000
    });

    const text = response.data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    if (streamCallback) {
      // Simulate streaming by chunking response
      const chars = text.split('');
      let currentChunk = '';
      
      for (const char of chars) {
        currentChunk += char;
        if (currentChunk.length >= 5 || /[\s\n]/.test(char)) {
          if (currentChunk.trim()) {
            streamCallback(currentChunk);
            await new Promise(resolve => setTimeout(resolve, 5));
          }
          currentChunk = '';
        }
      }
      
      if (currentChunk) {
        streamCallback(currentChunk);
      }
      
      streamCallback('[DONE]');
      return '';
    }

    return text;
  } catch (error) {
    if (error.response?.status === 429) {
      throw new Error('Rate limit exceeded. Please wait a moment and try again.');
    }
    throw new Error(error.response?.data?.error?.message || 'Gemini API error');
  }
}

module.exports = {
  callOpenAI,
  callGemini
};
