const { TelegramClient } = require('telegram');
const { StringSession } = require('telegram/sessions');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const askQuestion = (query) => new Promise((resolve) => rl.question(query, resolve));

async function main() {
  console.log('=== Telegram MTProto String Session Generator ===');
  const apiIdInput = await askQuestion('1. Enter your Telegram API ID: ');
  const apiHash = await askQuestion('2. Enter your Telegram API Hash: ');
  const phoneNumber = await askQuestion('3. Enter your Phone Number (with country code, e.g. +251911...): ');

  const apiId = parseInt(apiIdInput.trim(), 10);
  if (isNaN(apiId)) {
    console.error('API ID must be an integer.');
    rl.close();
    return;
  }

  const stringSession = new StringSession(''); // Empty session to start login
  const client = new TelegramClient(stringSession, apiId, apiHash.trim(), {
    connectionRetries: 5,
  });

  await client.start({
    phoneNumber: async () => phoneNumber.trim(),
    password: async () => await askQuestion('Enter 2FA Password (if enabled, otherwise press Enter): '),
    phoneCode: async () => await askQuestion('Enter the verification code sent to your Telegram Mobile App: '),
    onError: (err) => console.log('Login error:', err.message),
  });

  console.log('\n--- Successfully Authenticated! ---');
  console.log('Copy the following string session token (including any trailing = characters):\n');
  console.log(client.session.save());
  console.log('\n----------------------------------');
  
  rl.close();
}

main().catch(err => {
  console.error('An error occurred:', err);
  rl.close();
});
