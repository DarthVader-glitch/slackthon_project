// A simple MCP server that exposes team task-management tools.
// This is what proves "MCP server integration" for the hackathon —
// our Slack agent will call these tools over the MCP protocol.

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TASKS_FILE = path.join(__dirname, 'tasks.json');


// Tiny file-based storage 

function loadTasks() {
  if (!fs.existsSync(TASKS_FILE)) return [];
  return JSON.parse(fs.readFileSync(TASKS_FILE, 'utf-8'));
}

function saveTasks(tasks) {
  fs.writeFileSync(TASKS_FILE, JSON.stringify(tasks, null, 2));
}


// Tool definitions

const TOOLS = [
  {
    name: 'add_task',
    description: 'Add a new task to the team task list.',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'What the task is' },
        assignee: { type: 'string', description: 'Who it is assigned to (optional)' },
        due_date: { type: 'string', description: 'Due date, e.g. "2026-07-20" (optional)' },
      },
      required: ['title'],
    },
  },
  {
    name: 'list_tasks',
    description: 'List all current tasks, optionally filtered by status.',
    inputSchema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['open', 'completed', 'all'],
          description: 'Filter by status (default: all)',
        },
      },
    },
  },
  {
    name: 'complete_task',
    description: 'Mark a task as completed by its id.',
    inputSchema: {
      type: 'object',
      properties: {
        task_id: { type: 'string', description: 'The id of the task to complete' },
      },
      required: ['task_id'],
    },
  },
];

// MCP server setup

const server = new Server(
  { name: 'team-task-mcp-server', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: TOOLS,
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const tasks = loadTasks();

  if (name === 'add_task') {
    const task = {
      id: Date.now().toString(36),
      title: args.title,
      assignee: args.assignee || null,
      due_date: args.due_date || null,
      status: 'open',
      created_at: new Date().toISOString(),
    };
    tasks.push(task);
    saveTasks(tasks);
    return {
      content: [{ type: 'text', text: `Task added: "${task.title}" (id: ${task.id})` }],
    };
  }

  if (name === 'list_tasks') {
    const status = args?.status || 'all';
    const filtered = status === 'all' ? tasks : tasks.filter((t) => t.status === status);
    if (filtered.length === 0) {
      return { content: [{ type: 'text', text: 'No tasks found.' }] };
    }
    const lines = filtered.map(
      (t) =>
        `- [${t.status}] (${t.id}) ${t.title}${t.assignee ? ` — assigned to ${t.assignee}` : ''}${t.due_date ? ` — due ${t.due_date}` : ''}`
    );
    return { content: [{ type: 'text', text: lines.join('\n') }] };
  }

  if (name === 'complete_task') {
    const task = tasks.find((t) => t.id === args.task_id);
    if (!task) {
      return { content: [{ type: 'text', text: `No task found with id ${args.task_id}` }] };
    }
    task.status = 'completed';
    saveTasks(tasks);
    return { content: [{ type: 'text', text: `Task "${task.title}" marked as completed.` }] };
  }

  throw new Error(`Unknown tool: ${name}`);
});

const transport = new StdioServerTransport();
await server.connect(transport);
