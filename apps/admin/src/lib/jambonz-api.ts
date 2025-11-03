/**
 * Jambonz REST API Client
 * Provides methods to interact with Jambonz API
 */

export interface JambonzApplication {
  application_sid: string;
  account_sid: string;
  name: string;
  call_hook?: {
    url: string;
    method: string;
  };
  messaging_hook?: {
    url: string;
    method: string;
  };
  call_status_hook?: {
    url: string;
    method: string;
  };
  speech_synthesis_vendor?: string;
  speech_synthesis_language?: string;
  speech_synthesis_voice?: string;
  speech_recognizer_vendor?: string;
  speech_recognizer_language?: string;
}

export interface JambonzApiConfig {
  apiBaseUrl: string;
  apiKey: string;
  accountSid: string;
}

export class JambonzApiClient {
  private config: JambonzApiConfig;

  constructor(config: JambonzApiConfig) {
    this.config = config;
  }

  /**
   * Fetch all applications for the account
   */
  async getApplications(): Promise<JambonzApplication[]> {
    try {
      const url = `${this.config.apiBaseUrl}/Accounts/${this.config.accountSid}/Applications`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch applications: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data as JambonzApplication[];
    } catch (error) {
      console.error('Error fetching Jambonz applications:', error);
      throw error;
    }
  }

  /**
   * Get a specific application by SID
   */
  async getApplication(applicationSid: string): Promise<JambonzApplication> {
    try {
      const url = `${this.config.apiBaseUrl}/Accounts/${this.config.accountSid}/Applications/${applicationSid}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch application: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data as JambonzApplication;
    } catch (error) {
      console.error('Error fetching Jambonz application:', error);
      throw error;
    }
  }
}
