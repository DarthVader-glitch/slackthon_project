const axios = require('axios');
const { GoogleGenAI } = require('@google/genai');
const { callMcpTool, getMcpTools } = require('./mcpClient');

// Gemini client (the orchestrator "brain") — free tier friendly

if (!process.env.GEMINI_API_KEY) {
  throw new Error(
    'GEMINI_API_KEY is not set. Check that your .env file exists in the project root, ' +
      'contains a line like GEMINI_API_KEY=your-key-here, and that app.js is being run ' +
      'from that same folder.'
  );
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const MODEL = 'gemini-3.1-flash-lite';

// Tool 1: Real-time web search (Tavily)

async function realTimeSearch(query) {
  const response = await axios.post('https://api.tavily.com/search', {
    api_key: process.env.TAVILY_API_KEY,
    query,
    search_depth: 'basic',
    include_answer: true,
    max_results: 4,
  });
  const data = response.data;
  const sources = (data.results || [])
    .slice(0, 4)
    .map((r) => `${r.title}: ${r.url}`)
    .join('\n');
  return `${data.answer || ''}\n\nSources:\n${sources}`;
}

const SEARCH_TOOL_DEF = {
  name: 'web_search',
  description:
    'Search the live web for current information — news, prices, facts, anything time-sensitive or outside general knowledge.',
  parameters: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'The search query' },
    },
    required: ['query'],
  },
};

// Build the full tool list: web search + MCP server's tools,
// converted into Gemini's functionDeclarations format

function buildToolDefs() {
  const mcpToolDefs = getMcpTools().map((t) => ({
    name: t.name,
    description: t.description,
    parameters: t.inputSchema,
  }));
  return [SEARCH_TOOL_DEF, ...mcpToolDefs];
}

// Execute whichever tool the model decided to call
async function executeTool(name, args) {
  if (name === 'web_search') {
    return await realTimeSearch(args.query);
  }
  // anything else is assumed to be an MCP tool
  return await callMcpTool(name, args);
}

// Retry helper for transient errors (503 overloaded, 429 rate limited)
async function generateWithRetry(params, maxRetries = 3) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await ai.models.generateContent(params);
    } catch (err) {
      const status = err?.status || err?.error?.code;
      const isTransient = status === 503 || status === 429 || status === 'UNAVAILABLE';
      if (!isTransient || attempt === maxRetries) throw err;
      const waitMs = 1000 * Math.pow(2, attempt); // 1s, 2s, 4s
      console.log(`Gemini busy (${status}), retrying in ${waitMs}ms...`);
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }
  }
}

// Agent loop: ask Gemini, let it call tools, feed results back,
// repeat until it gives a final text answer.
//
// Optionally accepts prior conversation history (for the Assistant panel,
// which is a real multi-turn thread) as an array of {role, text} objects.

async function runAgent(userQuery, history = []) {
  const functionDeclarations = buildToolDefs();

  let contents = history.map((h) => ({
    role: h.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: h.text }],
  }));
  contents.push({ role: 'user', parts: [{ text: userQuery }] });

  for (let turn = 0; turn < 5; turn++) {
    const response = await generateWithRetry({
      model: MODEL,
      contents,
      config: { tools: [{ functionDeclarations }] },
    });

    const candidate = response.candidates[0];
    const parts = candidate.content.parts || [];
    const functionCalls = parts.filter((p) => p.functionCall);

    // No function calls → this is the final answer
    if (functionCalls.length === 0) {
      return parts.map((p) => p.text || '').join('') || '(no response)';
    }

    // Model wants to call one or more tools
    contents.push({ role: 'model', parts });

    const functionResponseParts = [];
    for (const fc of functionCalls) {
      const { name, args } = fc.functionCall;
      let resultText;
      try {
        resultText = await executeTool(name, args || {});
      } catch (err) {
        resultText = `Error running ${name}: ${err.message}`;
      }
      functionResponseParts.push({
        functionResponse: { name, response: { result: resultText } },
      });
    }
    contents.push({ role: 'user', parts: functionResponseParts });
  }

  return "I wasn't able to finish that request — try rephrasing it.";
}

module.exports = { runAgent };
