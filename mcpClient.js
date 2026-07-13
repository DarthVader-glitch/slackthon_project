// MCP client wrapper. This spawns our custom MCP server as a subprocess
// and talks to it over stdio using the Model Context Protocol.
// Written as CommonJS but dynamically imports the ESM-only MCP SDK.

const path = require('path');

let mcpClient = null;
let mcpTools = [];

async function connectMcp() {
  const { Client } = await import('@modelcontextprotocol/sdk/client/index.js');
  const { StdioClientTransport } = await import('@modelcontextprotocol/sdk/client/stdio.js');

  const serverPath = path.join(__dirname, 'mcp-server', 'server.js');

  const transport = new StdioClientTransport({
    command: 'node',
    args: [serverPath],
  });

  mcpClient = new Client(
    { name: 'slack-search-agent', version: '1.0.0' },
    { capabilities: {} }
  );

  await mcpClient.connect(transport);

  const { tools } = await mcpClient.listTools();
  mcpTools = tools;

  console.log(
    `🔌 Connected to MCP server. Available tools: ${tools.map((t) => t.name).join(', ')}`
  );

  return mcpTools;
}

async function callMcpTool(name, args) {
  if (!mcpClient) throw new Error('MCP client not connected yet');
  const result = await mcpClient.callTool({ name, arguments: args });
  // MCP tool results come back as a content array; flatten to text
  return result.content.map((c) => c.text || '').join('\n');
}

function getMcpTools() {
  return mcpTools;
}

module.exports = { connectMcp, callMcpTool, getMcpTools };
