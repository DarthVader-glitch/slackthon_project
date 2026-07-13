require('dotenv').config();
const { App } = require('@slack/bolt');
const { connectMcp } = require('./mcpClient');
const { runAgent } = require('./agent');
const assistant = require('./assistant');

// Slack Bolt app setup

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN,
});

// Register the native Assistant panel handlers (threadStarted, userMessage, etc.)
app.assistant(assistant);

// Slash command: /ask <question>  (kept alongside the Assistant panel —
// a quick one-off way to use the agent from any channel)

app.command('/ask', async ({ command, ack, respond }) => {
  await ack();
  const query = command.text.trim();

  if (!query) {
    await respond(
      'Ask me something! Try:\n' +
        '• `/ask what is happening in AI news this week`\n' +
        '• `/ask add a task to review the PR, assign to Alex, due Friday`\n' +
        '• `/ask what tasks are still open`\n\n' +
        'Or open the *Assistant* panel from the top nav for a full chat experience.'
    );
    return;
  }

  await respond({
    response_type: 'in_channel',
    text: `:hourglass_flowing_sand: Working on *"${query}"*...`,
  });

  try {
    const answer = await runAgent(query);
    await respond({
      response_type: 'in_channel',
      blocks: [
        { type: 'section', text: { type: 'mrkdwn', text: `*:mag: ${query}*` } },
        { type: 'divider' },
        { type: 'section', text: { type: 'mrkdwn', text: answer } },
      ],
    });
  } catch (err) {
    console.error(err);
    await respond({
      response_type: 'in_channel',
      text: `:warning: Something went wrong: ${err.message}`,
    });
  }
});

// @mentions get the same agent treatment

app.event('app_mention', async ({ event, say }) => {
  const query = event.text.replace(/<@[^>]+>/, '').trim();
  if (!query) {
    await say('Mention me with a question or task, e.g. `@Search Agent list open tasks`');
    return;
  }

  await say(`:hourglass_flowing_sand: Working on *"${query}"*...`);

  try {
    const answer = await runAgent(query);
    await say({
      blocks: [
        { type: 'section', text: { type: 'mrkdwn', text: `*:mag: ${query}*` } },
        { type: 'divider' },
        { type: 'section', text: { type: 'mrkdwn', text: answer } },
      ],
    });
  } catch (err) {
    console.error(err);
    await say(`:warning: Something went wrong: ${err.message}`);
  }
});

// Start everything: connect to MCP server, then start Slack app

(async () => {
  await connectMcp();
  await app.start();
  console.log('⚡️ Slack Agent (search + MCP tasks + Assistant panel) is running!');
})();
