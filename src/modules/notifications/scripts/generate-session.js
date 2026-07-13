const { TelegramClient } = require('telegram');
const { StringSession } = require('telegram/sessions');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const askQuestion = (query) => new Promise((resolve) => rl.question(query, resolve));

(async () => {
  console.log('==================================================');
  console.log('    IHSAN REMS - Telegram Session Generator       ');
  console.log('==================================================\n');

  try {
    const apiIdStr = await askQuestion('1. Enter your Telegram API ID: ');
    const apiHash = await askQuestion('2. Enter your Telegram API Hash: ');
    const phoneNumber = await askQuestion('3. Enter your Phone Number (with country code, e.g., +251912345678): ');

    const apiId = parseInt(apiIdStr, 10);
    if (isNaN(apiId)) {
      console.error('Error: API ID must be a number.');
      rl.close();
      return;
    }

    console.log('\nConnecting to Telegram servers...');
    const client = new TelegramClient(new StringSession(''), apiId, apiHash, {
      connectionRetries: 5,
    });

    await client.start({
      phoneNumber: async () => phoneNumber,
      phoneCode: async () => await askQuestion('Enter the verification code sent to your Telegram account: '),
      onError: (err) => console.error('\nTelegram Authentication Error:', err),
    });

    console.log('\n==================================================');
    console.log('              AUTHENTICATION SUCCESS              ');
    console.log('==================================================');
    console.log('Copy the string below and save it in your .env file as:');
    console.log('TELEGRAM_SESSION_STRING\n');
    console.log(client.session.save());
    console.log('==================================================\n');
  } catch (err) {
    console.error('An error occurred during session generation:', err);
  } finally {
    rl.close();
    process.exit(0);
  }
})();
