const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require('discord.js');
const OpenAI = require('@openai/openai');

// Replace these with your actual keys
const DISCORD_TOKEN = 'YOUR_DISCORD_TOKEN';
const GROK_API_KEY = 'YOUR_GROK_API_KEY';
const CLIENT_ID = 'YOUR_DISCORD_CLIENT_ID'; // From Discord Developer Portal > Application > General Information

// Set up Grok client
const grokClient = new OpenAI({
  apiKey: GROK_API_KEY,
  baseURL: 'https://api.x.ai/v1', // xAI's endpoint
});

// Bot setup
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// Slash command definition
const commands = [
  new SlashCommandBuilder()
    .setName('ask')
    .setDescription('Ask Grok anything!')
    .addStringOption(option =>
      option.setName('query')
        .setDescription('Your question for Grok')
        .setRequired(true)
    )
    .toJSON() // Ensure it's serialized for REST
];

// Sync commands on ready
client.once('ready', async () => {
  console.log(`Bot is online as ${client.user.tag}!`);

  const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);
  try {
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
    console.log('Slash commands synced successfully!');
  } catch (error) {
    console.error('Error syncing commands:', error);
  }
});

// Handle interactions (slash commands)
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'ask') {
    await interaction.deferReply(); // Acknowledge to avoid timeout
    const query = interaction.options.getString('query');

    try {
      // Call Grok API
      const response = await grokClient.chat.completions.create({
        model: 'grok-4', // Use the latest model
        messages: [{ role: 'user', content: query }]
      });
      const answer = response.choices[0].message.content;
      await interaction.followup(`**Grok says:** ${answer}`);
    } catch (error) {
      console.error('API error:', error);
      await interaction.followup(`Oops, something went wrong: ${error.message}`);
    }
  }
});

// Login
client.login(DISCORD_TOKEN)
  .then(() => console.log('Logged in successfully!'))
  .catch(error => console.error('Login error:', error));
