import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TelegramClient, Api, helpers } from 'telegram';
import { StringSession } from 'telegram/sessions';
import { NotificationChannel } from '../entities/notification-channel.entity';

@Injectable()
export class TelegramService implements OnModuleInit {
  private readonly logger = new Logger(TelegramService.name);
  private client: TelegramClient | null = null;
  private isConnected = false;

  // In-memory cache to hold active client authorization handshakes
  private pendingAuths = new Map<
    string,
    { client: TelegramClient; phoneCodeHash: string; apiId: number; apiHash: string }
  >();

  constructor(
    @InjectRepository(NotificationChannel)
    private readonly channelRepo: Repository<NotificationChannel>,
  ) {}

  async onModuleInit() {
    try {
      // 1. Try loading settings from Database first
      const channel = await this.channelRepo.findOne({ where: { channelCode: 'TELEGRAM' } });
      if (channel && channel.telegramApiId && channel.telegramApiHash && channel.telegramSessionString) {
        this.logger.log('Found Telegram credentials in Database. Attempting connection...');
        const res = await this.connectClient(
          channel.telegramApiId,
          channel.telegramApiHash,
          channel.telegramSessionString
        );
        if (res.success) {
          return;
        }
      }
    } catch (e) {
      this.logger.warn('Failed to load Telegram settings from DB: ' + e.message);
    }

    // 2. Fallback to Environment Variables
    const apiIdStr = process.env.TELEGRAM_API_ID;
    const apiHash = process.env.TELEGRAM_API_HASH;
    const sessionString = process.env.TELEGRAM_SESSION_STRING;

    if (apiIdStr && apiHash && sessionString) {
      const apiId = parseInt(apiIdStr, 10);
      if (!isNaN(apiId)) {
        this.logger.log('Found Telegram credentials in Env variables. Attempting fallback connection...');
        await this.connectClient(apiId, apiHash, sessionString);
        return;
      }
    }

    this.logger.warn(
      'Telegram credentials not found in Database or Env. Running in mock simulation mode.'
    );
  }

  async connectClient(apiId: number, apiHash: string, sessionString: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (this.client) {
        try {
          await this.client.disconnect();
        } catch (e) {
          this.logger.warn('Error disconnecting old Telegram client: ' + e.message);
        }
      }

      this.logger.log(`Initializing Telegram Client with API ID: ${apiId}...`);
      const session = new StringSession(sessionString);
      const newClient = new TelegramClient(session, apiId, apiHash, {
        connectionRetries: 3,
      });

      await newClient.connect();
      const authorized = await newClient.checkAuthorization();

      if (authorized) {
        this.client = newClient;
        this.isConnected = true;
        this.logger.log('Telegram client successfully connected and authorized!');
        return { success: true };
      } else {
        await newClient.disconnect();
        this.isConnected = false;
        this.client = null;
        return { success: false, error: 'Connection succeeded but session string is unauthorized.' };
      }
    } catch (error) {
      this.logger.error('Failed to dynamically connect Telegram Client:', error);
      this.isConnected = false;
      this.client = null;
      return { success: false, error: error.message || 'Authentication failed.' };
    }
  }

  // --- UI Wizard Handshake Methods ---

  async requestAuthCode(apiId: number, apiHash: string, phoneNumber: string): Promise<{ success: boolean; error?: string }> {
    try {
      this.logger.log(`UI Wizard: Requesting Telegram verification code for: ${phoneNumber}`);
      
      const session = new StringSession('');
      const client = new TelegramClient(session, apiId, apiHash, {
        connectionRetries: 3,
      });

      await client.connect();

      const { phoneCodeHash } = await client.sendCode({
        apiId,
        apiHash,
      }, phoneNumber);

      this.pendingAuths.set(phoneNumber, {
        client,
        phoneCodeHash,
        apiId,
        apiHash,
      });

      this.logger.log(`UI Wizard: Verification code successfully requested and cached for ${phoneNumber}.`);
      return { success: true };
    } catch (err) {
      this.logger.error(`UI Wizard: Failed to request Telegram code for ${phoneNumber}:`, err);
      return { success: false, error: err.message || 'Failed to dispatch verification code.' };
    }
  }

  async verifyAuthCode(phoneNumber: string, code: string, password?: string): Promise<{ success: boolean; error?: string }> {
    const pending = this.pendingAuths.get(phoneNumber);
    if (!pending) {
      return { success: false, error: 'No active verification request found. Please request code again.' };
    }

    const { client, phoneCodeHash, apiId, apiHash } = pending;

    try {
      this.logger.log(`UI Wizard: Verifying verification code for ${phoneNumber}...`);
      
      try {
        await client.invoke(
          new Api.auth.SignIn({
            phoneNumber,
            phoneCodeHash,
            phoneCode: code,
          })
        );
      } catch (err) {
        if (err.message?.includes('SESSION_PASSWORD_NEEDED') && password) {
          this.logger.log(`UI Wizard: 2FA required for ${phoneNumber}. Attempting SRP login...`);
          await client.signInWithPassword(
            { apiId, apiHash },
            {
              password: () => Promise.resolve(password),
              onError: async () => true,
            }
          );
        } else {
          throw err;
        }
      }

      const sessionString = (client.session as StringSession).save();

      // Update configuration settings in DB
      const channel = await this.channelRepo.findOne({ where: { channelCode: 'TELEGRAM' } });
      if (channel) {
        channel.telegramApiId = apiId;
        channel.telegramApiHash = apiHash;
        channel.telegramSessionString = sessionString;
        await this.channelRepo.save(channel);
      }

      this.client = client;
      this.isConnected = true;
      this.pendingAuths.delete(phoneNumber);

      this.logger.log(`UI Wizard: Telegram client successfully authorized and saved in database for ${phoneNumber}!`);
      return { success: true };
    } catch (err) {
      this.logger.error(`UI Wizard: Verification failed for ${phoneNumber}:`, err);
      return { success: false, error: err.message || 'Code verification failed.' };
    }
  }

  getStatus() {
    return {
      isConnected: this.isConnected && !!this.client,
      isSimulation: !this.client || !this.isConnected,
    };
  }

  async sendDirectMessage(recipient: string, message: string): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      this.logger.log(`[Telegram Simulation] DM to "${recipient}": ${message}`);
      return true;
    }

    try {
      this.logger.log(`Sending Telegram DM to: ${recipient}`);

      // Ensure the recipient is in the userbot contact list to solve "entity not found" error
      if (recipient.startsWith('+') || /^\d+$/.test(recipient)) {
        try {
          this.logger.log(`Importing recipient phone contact dynamically: ${recipient}`);
          await this.client.invoke(
            new Api.contacts.ImportContacts({
              contacts: [
                new Api.InputPhoneContact({
                  clientId: helpers.generateRandomLong(),
                  phone: recipient,
                  firstName: 'Ihsan',
                  lastName: 'Client',
                })
              ]
            })
          );
        } catch (contactErr) {
          this.logger.warn(`Failed to dynamically import contact ${recipient}: ${contactErr.message}`);
        }
      }

      await this.client.sendMessage(recipient, { message });
      this.logger.log(`Telegram DM successfully sent to: ${recipient}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send Telegram DM to "${recipient}":`, error);
      return false;
    }
  }
}
