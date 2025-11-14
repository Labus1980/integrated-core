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

export interface JambonzPhoneNumber {
  phone_number_sid: string;
  account_sid: string;
  application_sid?: string;
  number: string;
  voip_carrier_sid?: string;
}

export interface JambonzApiConfig {
  apiBaseUrl: string;
  apiKey: string;
  accountSid: string;
}

export class JambonzApiClient {
  private config: JambonzApiConfig;
  // Cache for application names by GUID (to avoid repeated API calls)
  private applicationNameCache: Map<string, string> = new Map();
  // Cache for all applications (to avoid repeated API calls)
  private applicationsCache: JambonzApplication[] | null = null;
  private applicationsCacheTime: number = 0;
  // Cache TTL: 5 minutes
  private readonly CACHE_TTL_MS = 5 * 60 * 1000;

  constructor(config: JambonzApiConfig) {
    this.config = config;
  }

  /**
   * Fetch all applications for the account (with caching)
   */
  async getApplications(useCache: boolean = true): Promise<JambonzApplication[]> {
    try {
      // Check cache first
      const now = Date.now();
      if (useCache && this.applicationsCache && (now - this.applicationsCacheTime) < this.CACHE_TTL_MS) {
        return this.applicationsCache;
      }

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
      const applications = data as JambonzApplication[];

      // Update cache
      this.applicationsCache = applications;
      this.applicationsCacheTime = now;

      // Update application name cache
      applications.forEach(app => {
        this.applicationNameCache.set(app.application_sid, app.name);
      });

      return applications;
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

  /**
   * Get application name by SID (GUID) with caching
   * @param applicationSid - Application GUID
   * @returns Application name or undefined if not found
   */
  async getApplicationName(applicationSid: string): Promise<string | undefined> {
    try {
      // Check cache first
      if (this.applicationNameCache.has(applicationSid)) {
        return this.applicationNameCache.get(applicationSid);
      }

      // Try to get from full applications list
      const applications = await this.getApplications(true);
      const app = applications.find(a => a.application_sid === applicationSid);

      if (app) {
        this.applicationNameCache.set(applicationSid, app.name);
        return app.name;
      }

      // If not found in list, try direct API call
      try {
        const application = await this.getApplication(applicationSid);
        this.applicationNameCache.set(applicationSid, application.name);
        return application.name;
      } catch {
        // Application not found
        return undefined;
      }
    } catch (error) {
      console.error(`Error fetching application name for ${applicationSid}:`, error);
      return undefined;
    }
  }

  /**
   * Get application name from target URI
   * Extracts GUID from URI like "sip:0397dc5f-2f8f-4778-8499-0af934dd1196@..."
   * and returns the application name
   * @param targetUri - Target SIP URI
   * @returns Application name or undefined if not found
   */
  async getApplicationNameFromUri(targetUri: string): Promise<string | undefined> {
    try {
      // Extract GUID from URI (pattern: UUID format)
      const guidMatch = targetUri.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);

      if (!guidMatch) {
        return undefined;
      }

      const guid = guidMatch[1];
      return await this.getApplicationName(guid);
    } catch (error) {
      console.error(`Error extracting application name from URI ${targetUri}:`, error);
      return undefined;
    }
  }

  /**
   * Clear the application name cache
   */
  clearCache(): void {
    this.applicationNameCache.clear();
    this.applicationsCache = null;
    this.applicationsCacheTime = 0;
  }

  /**
   * Update call metadata (to make customerData available in webhooks)
   * @param callSid - Call SID from jambonz
   * @param metadata - Metadata object to attach to the call
   */
  async updateCallMetadata(callSid: string, metadata: Record<string, unknown>): Promise<void> {
    try {
      const url = `${this.config.apiBaseUrl}/Accounts/${this.config.accountSid}/Calls/${callSid}`;
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          call_hook: {
            // Preserve existing webhook but add metadata
            metadata
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update call metadata: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error(`Error updating call metadata for ${callSid}:`, error);
      throw error;
    }
  }

  /**
   * Get call details including metadata
   * @param callSid - Call SID from jambonz
   */
  async getCall(callSid: string): Promise<any> {
    try {
      const url = `${this.config.apiBaseUrl}/Accounts/${this.config.accountSid}/Calls/${callSid}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch call: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error fetching call ${callSid}:`, error);
      throw error;
    }
  }

  /**
   * Fetch all phone numbers for the account
   * Note: This endpoint may not be available on all Jambonz instances
   */
  async getPhoneNumbers(): Promise<JambonzPhoneNumber[]> {
    try {
      const url = `${this.config.apiBaseUrl}/Accounts/${this.config.accountSid}/PhoneNumbers`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          console.warn('Phone numbers endpoint not available (404). Returning empty array.');
          return [];
        }
        throw new Error(`Failed to fetch phone numbers: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data as JambonzPhoneNumber[];
    } catch (error) {
      console.error('Error fetching Jambonz phone numbers:', error);
      // Return empty array instead of throwing to allow graceful degradation
      return [];
    }
  }
}
