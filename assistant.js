const { Assistant } = require('@slack/bolt');
const { runAgent } = require('./agent');

// Slack's native Assistant panel: a side-panel AI chat experience with
// suggested prompts, a "thinking..." status indicator, and thread-aware
// context — distinct from the /ask slash command.

const assistant = new Assistant({
  // Fired when a user opens the Assistant panel (DM or top-nav entry point)
  threadStarted: async ({ event, say, setSuggestedPrompts, saveThreadContext }) => {
    const { context } = event.assistant_thread;

    await say(
      "Hi! I'm your team agent. I can search the live web for current " +
        "information, or manage your team's task list. What do you need?"
    );

    // Thread context (which channel the user was viewing) must be saved
    // explicitly, since it isn't included on later message events
    await saveThreadContext();

    await setSuggestedPrompts({
      title: 'Try one of these:',
      prompts: [
        {
          title: 'Catch up on news',
          message: "What's the latest news in AI this week?",
        },
        {
          title: 'Add a task',
          message: 'Add a task to review the pull request, due Friday',
        },
        {
          title: 'Check open tasks',
          message: 'What tasks are still open for the team?',
        },
        context.channel_id
          ? {
              title: 'Summarize this channel',
              message: 'Summarize the recent activity in this channel',
            }
          : {
              title: 'What can you do?',
              message: 'What kinds of things can you help me with?',
            },
      ],
    });
  },

  // Fired when the user switches channels while the Assistant panel is open
  threadContextChanged: async ({ saveThreadContext }) => {
    await saveThreadContext();
  },

  // Fired for every message the user sends in the Assistant panel
  userMessage: async ({ message, say, setStatus, setTitle, getThreadContext }) => {
    const userText = message.text || '';

    // Give the thread a readable title in the sidebar
    await setTitle(userText.slice(0, 50));

    // Native "thinking..." indicator while the agent works
    await setStatus('is thinking...');

    try {
      const context = await getThreadContext();
      const contextNote = context?.channel_id
        ? `\n\n(User is currently viewing channel <#${context.channel_id}>.)`
        : '';

      const answer = await runAgent(userText + contextNote);
      await say(answer);
    } catch (err) {
      console.error(err);
      await say(`:warning: Something went wrong: ${err.message}`);
    }
  },
});

module.exports = assistant;
