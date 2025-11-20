import { useState, useEffect } from 'react';
import '../styles/lembrand.css';

// Configuration interface
interface Config {
  analysisWebhook: string;
  strategyWebhook: string;
  analysisDuration: number; // seconds
  strategyDuration: number; // seconds
  // Testing mode
  testMode: boolean;
  testBrandId: string | null;
  testAnalysisId: string | null;
  baserowToken: string | null;
  // Advanced options
  alwaysShowStrategyButton: boolean;
}

// App state interface
interface AppState {
  brandId: string | null;
  analysisId: string | null;
  strategyId: string | null;
  isAnalyzing: boolean;
  isGeneratingStrategy: boolean;
}

// Analysis data interface
interface AnalysisData {
  score_overall: number;
  score_visual_consistency: number;
  score_tone_consistency: number;
  score_regularity: number;
  score_diversity: number;
  score_engagement: number;
  score_positioning: number;
}

// Strategy data interfaces
interface Pillar {
  title: string;
  description: string;
  examples: string[];
  frequency: string;
}

interface ActionItem {
  action: string;
  why: string;
  effort: string;
}

interface StrategyData {
  summary: string;
  editorial_pillars: {
    pillars: Pillar[];
  };
  key_messages: string[];
  recommended_frequency: number;
  action_plan: {
    immediate: ActionItem[];
    medium_term: ActionItem[];
    long_term: ActionItem[];
  };
}

// Helper function for sleep/delay
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// ========================================
// Baserow API Client
// ========================================
class BaserowClient {
  baseUrl: string;
  apiKey: string;
  databaseId: number;
  tables: Record<string, number>;

  constructor(config: { baseUrl: string; apiKey: string; databaseId: number; tables?: Record<string, number> }) {
    this.baseUrl = config.baseUrl;
    this.apiKey = config.apiKey;
    this.databaseId = config.databaseId;
    this.tables = config.tables || {};
  }

  async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Authorization': `Token ${this.apiKey}`,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    try {
      const response = await fetch(url, { ...options, headers });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Baserow API error (${response.status}): ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Baserow request failed:', error);
      throw error;
    }
  }

  async getTables(): Promise<any[]> {
    try {
      const data = await this.request(`/api/database/tables/database/${this.databaseId}/`);
      return data.results || data || [];
    } catch (error) {
      console.error('❌ Failed to get tables:', error);
      return [];
    }
  }

  async discoverTables(): Promise<void> {
    try {
      console.log('🔍 Discovering tables in database', this.databaseId);
      const tables = await this.getTables();

      const tableMap: Record<string, number> = {};
      tables.forEach((table: any) => {
        const normalizedName = table.name.toLowerCase().replace(/\s+/g, '_');
        tableMap[normalizedName] = table.id;
        console.log(`  ✓ Found table: "${table.name}" (ID: ${table.id})`);
      });

      this.tables = tableMap;
      console.log('✅ Table discovery complete:', this.tables);
    } catch (error) {
      console.error('❌ Table discovery failed:', error);
    }
  }

  async getRow(tableName: string, rowId: string | number): Promise<any> {
    const tableId = this.tables[tableName];
    if (!tableId) {
      throw new Error(`Table "${tableName}" not found. Available tables: ${Object.keys(this.tables).join(', ')}`);
    }

    try {
      return await this.request(`/api/database/rows/table/${tableId}/${rowId}/`);
    } catch (error) {
      console.error(`❌ Failed to get row ${rowId} from table "${tableName}":`, error);
      throw error;
    }
  }

  async listRows(tableName: string, filters: Record<string, any> = {}): Promise<any[]> {
    const tableId = this.tables[tableName];
    if (!tableId) {
      throw new Error(`Table "${tableName}" not found. Available tables: ${Object.keys(this.tables).join(', ')}`);
    }

    try {
      const queryParams = new URLSearchParams();

      // Add filters as query parameters
      Object.entries(filters).forEach(([key, value]) => {
        queryParams.append(`filter__${key}__equal`, String(value));
      });

      const queryString = queryParams.toString();
      const endpoint = `/api/database/rows/table/${tableId}/${queryString ? '?' + queryString : ''}`;

      const data = await this.request(endpoint);
      return data.results || data || [];
    } catch (error) {
      console.error(`❌ Failed to list rows from table "${tableName}":`, error);
      throw error;
    }
  }

  async getAnalysis(analysisId: string | number): Promise<AnalysisData> {
    try {
      console.log('📊 Fetching analysis from Baserow:', analysisId);
      const data = await this.getRow('analysis', analysisId);

      return {
        score_overall: data.score_overall || 0,
        score_visual_consistency: data.score_visual_consistency || 0,
        score_tone_consistency: data.score_tone_consistency || 0,
        score_regularity: data.score_regularity || 0,
        score_diversity: data.score_diversity || 0,
        score_engagement: data.score_engagement || 0,
        score_positioning: data.score_positioning || 0
      };
    } catch (error) {
      console.error('❌ Failed to get analysis:', error);
      throw error;
    }
  }

  async getStrategyByAnalysisId(analysisId: string | number): Promise<StrategyData> {
    try {
      console.log('🎯 Fetching strategy for analysis ID:', analysisId);
      const rows = await this.listRows('strategy', { analysis_id: analysisId });

      if (!rows || rows.length === 0) {
        throw new Error(`No strategy found for analysis ID ${analysisId}`);
      }

      const data = rows[0]; // Get first matching strategy

      // Parse JSON fields if they are strings
      const parseField = (field: any) => {
        if (typeof field === 'string') {
          try {
            return JSON.parse(field);
          } catch {
            return field;
          }
        }
        return field;
      };

      return {
        summary: data.summary || '',
        editorial_pillars: parseField(data.editorial_pillars) || { pillars: [] },
        key_messages: parseField(data.key_messages) || [],
        recommended_frequency: data.recommended_frequency || 0,
        action_plan: parseField(data.action_plan) || {
          immediate: [],
          medium_term: [],
          long_term: []
        }
      };
    } catch (error) {
      console.error('❌ Failed to get strategy:', error);
      throw error;
    }
  }
}

// Initialize Baserow client (will be updated with token from config)
let baserow = new BaserowClient({
  baseUrl: 'https://baserow.okta-solutions.com',
  apiKey: '', // Will be set from config
  databaseId: 216
});

const LemBrand = () => {
  // State management
  const [config, setConfig] = useState<Config>({
    analysisWebhook: 'https://n8n.okta-solutions.com/webhook-test/lembrand-start',
    strategyWebhook: 'https://n8n.okta-solutions.com/webhook-test/lembrand-strategy',
    analysisDuration: 120, // 2 minutes in seconds
    strategyDuration: 120, // 2 minutes in seconds
    // Testing mode
    testMode: false,
    testBrandId: null,
    testAnalysisId: null,
    baserowToken: null,
    // Advanced options
    alwaysShowStrategyButton: false
  });

  const [appState, setAppState] = useState<AppState>({
    brandId: null,
    analysisId: null,
    strategyId: null,
    isAnalyzing: false,
    isGeneratingStrategy: false
  });

  const [websiteUrl, setWebsiteUrl] = useState('');
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [currentStage, setCurrentStage] = useState(0);
  const [showProgress, setShowProgress] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showStrategy, setShowStrategy] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [strategyData, setStrategyData] = useState<StrategyData | null>(null);
  const [activeTab, setActiveTab] = useState<'immediate' | 'medium' | 'long'>('immediate');
  const [manualBrandId, setManualBrandId] = useState('');

  // Load config from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('lembrand_config');
    if (saved) {
      const loadedConfig = { ...config, ...JSON.parse(saved) };
      setConfig(loadedConfig);

      // Debug logging for Testing Mode
      if (loadedConfig.testMode) {
        console.log('🧪 Testing Mode is ENABLED');
        console.log('   Brand ID:', loadedConfig.testBrandId);
        console.log('   Analysis ID:', loadedConfig.testAnalysisId);
        console.log('   Baserow Token:', loadedConfig.baserowToken ? '***configured***' : 'not set');
      }
    }
  }, []);

  // Auto-discover Baserow tables on component mount
  useEffect(() => {
    const initializeBaserow = async () => {
      // Update API key from config
      if (config.baserowToken) {
        baserow.apiKey = config.baserowToken;

        try {
          console.log('🔍 Initializing Baserow integration...');
          await baserow.discoverTables();
          console.log('✅ Baserow initialized successfully');
        } catch (error) {
          console.error('❌ Failed to initialize Baserow:', error);
        }
      } else {
        console.warn('⚠️ Baserow token not configured. Please set it in settings to use Baserow integration.');
      }
    };

    initializeBaserow();
  }, [config.baserowToken]);

  // Save config to localStorage
  const saveConfigToStorage = (newConfig: Config) => {
    localStorage.setItem('lembrand_config', JSON.stringify(newConfig));
    setConfig(newConfig);

    // Debug logging
    console.log('💾 Configuration saved:', {
      testMode: newConfig.testMode,
      testBrandId: newConfig.testBrandId,
      testAnalysisId: newConfig.testAnalysisId,
      hasBaserowToken: !!newConfig.baserowToken
    });
  };

  // Mock analysis data
  const MOCK_ANALYSIS_DATA: AnalysisData = {
    score_overall: 58,
    score_visual_consistency: 72,
    score_tone_consistency: 64,
    score_regularity: 28,
    score_diversity: 62,
    score_engagement: 45,
    score_positioning: 49
  };

  // Mock strategy data
  const MOCK_STRATEGY_DATA: StrategyData = {
    summary: `Your brand occupies a unique position in the healthy food sector, standing out with genuine care for local suppliers and production transparency. Visual consistency (72/100) and an authentic friendly tone (64/100) create a recognizable image that resonates with your target audience of young professionals.\n\nHowever, irregular posting (28/100) reduces visibility in the feed, and weak competitive positioning (49/100) misses opportunities to emphasize your uniqueness — unlike competitors, no one highlights personalized recipes for customers.\n\nStrategic direction: Increase frequency to 4 posts/week with focus on educational content (recipes, tips) and strengthen messaging about the local supplier ecosystem.`,
    editorial_pillars: {
      pillars: [
        {
          title: 'Recipes & Tips',
          description: 'Simple, healthy recipes with your products and cooking tips for busy people',
          examples: ['5-minute smoothie bowl', 'How to store greens for 2 weeks', '3 ways to cook quinoa'],
          frequency: '2 posts/week'
        },
        {
          title: 'Behind the Scenes',
          description: 'Production process, team stories, supplier visits — show the real kitchen',
          examples: ['Morning at production', 'Meet farmer Ivan', 'How we choose ingredients'],
          frequency: '1 post/week'
        },
        {
          title: 'Customer Stories',
          description: 'Real stories, customer photos with your products, results',
          examples: ['Repost: Anna lost 5kg', 'Review from regular customer', 'Customer lunch photo with tag'],
          frequency: '2-3 posts/month'
        },
        {
          title: 'Values & Mission',
          description: 'Your healthy eating philosophy, environmental care, supporting local businesses',
          examples: ["Why we don't use plastic", 'Our mission: health through food', 'Local = fresh = healthy'],
          frequency: '1-2 posts/month'
        },
        {
          title: 'Food Trends',
          description: 'Expert content about new research, superfoods, nutrition myths',
          examples: ['What are adaptogens?', 'Debunking gluten myths', 'Why probiotics matter in winter'],
          frequency: '1 post/week'
        }
      ]
    },
    key_messages: [
      'Only local ingredients from trusted farmers',
      'Ready healthy food without taste compromises',
      'Transparency from farm to your plate',
      'Personalized nutrition for your lifestyle'
    ],
    recommended_frequency: 4.5,
    action_plan: {
      immediate: [
        {
          action: 'Create content calendar for 4 weeks ahead with clear dates',
          why: 'Eliminate irregularity, boost score from 28 to 50+',
          effort: 'Low'
        },
        {
          action: 'Create series of 3 Stories about local suppliers with geotags',
          why: 'Quickly emphasize uniqueness and locality',
          effort: 'Low'
        }
      ],
      medium_term: [
        {
          action: 'Launch weekly "Recipe of the Week" series every Monday',
          why: 'Create audience anticipation, boost engagement',
          effort: 'Medium'
        },
        {
          action: 'Film 5 short videos about production process',
          why: 'Strengthen transparency and trust (visual storytelling)',
          effort: 'High'
        }
      ],
      long_term: [
        {
          action: 'Develop UGC campaign #MyHealthyKitchen with prizes',
          why: 'Boost community engagement and get user-generated content',
          effort: 'High'
        },
        {
          action: 'Partner with 3 local farmers for cross-promotion',
          why: 'Expand reach and strengthen "local = quality" positioning',
          effort: 'Medium'
        }
      ]
    }
  };

  // Progress animation - Smooth 2-minute countdown
  const animateProgress = async (durationSeconds: number, isStrategy = false) => {
    const totalSteps = 100;
    const stepDuration = (durationSeconds * 1000) / totalSteps;

    const stages = isStrategy
      ? [
          { threshold: 0, message: 'Initializing strategy generation...', step: 1 },
          { threshold: 20, message: 'Analyzing brand positioning...', step: 2 },
          { threshold: 40, message: 'Creating editorial pillars...', step: 3 },
          { threshold: 60, message: 'Developing key messages...', step: 4 },
          { threshold: 80, message: 'Finalizing action plan...', step: 5 }
        ]
      : [
          { threshold: 0, message: 'Analyzing website structure...', step: 1 },
          { threshold: 20, message: 'Collecting Instagram data...', step: 2 },
          { threshold: 40, message: 'Analyzing Facebook posts...', step: 3 },
          { threshold: 60, message: 'Finding competitors...', step: 4 },
          { threshold: 80, message: 'Calculating LemBrand Score...', step: 5 }
        ];

    for (let i = 0; i <= totalSteps; i++) {
      setProgress(i);

      const currentStageData = stages.filter(s => s.threshold <= i).pop();
      if (currentStageData) {
        setProgressMessage(currentStageData.message);
        setCurrentStage(currentStageData.step);
      }

      await sleep(stepDuration);
    }
  };

  // Fetch analysis data from Baserow (for testing mode)
  const fetchAnalysisFromBaserow = async (analysisId: string): Promise<AnalysisData> => {
    try {
      console.log('📊 Fetching analysis from Baserow using BaserowClient');
      return await baserow.getAnalysis(analysisId);
    } catch (error) {
      console.warn('⚠️ Failed to fetch from Baserow, using mock data:', error);
      return MOCK_ANALYSIS_DATA;
    }
  };

  // Fetch strategy data from Baserow (for testing mode)
  const fetchStrategyFromBaserow = async (analysisId: string): Promise<StrategyData> => {
    try {
      console.log('🎯 Fetching strategy from Baserow using BaserowClient');
      return await baserow.getStrategyByAnalysisId(analysisId);
    } catch (error) {
      console.warn('⚠️ Failed to fetch strategy from Baserow, using mock data:', error);
      return MOCK_STRATEGY_DATA;
    }
  };

  // Call analysis webhook and wait for response
  const callAnalysisWebhook = async (websiteUrl: string) => {
    console.log('📡 Calling analysis webhook:', config.analysisWebhook);

    try {
      const response = await fetch(config.analysisWebhook, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ websiteUrl })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Webhook response:', data);

      // Validate response format
      if (!data.success || !data.brandId || !data.analysisId || !data.data) {
        throw new Error('Invalid webhook response format');
      }

      return data;
    } catch (error) {
      console.error('❌ Webhook error:', error);
      throw error;
    }
  };

  // Call strategy webhook and wait for response
  const callStrategyWebhook = async (brandId: string, analysisId: string) => {
    console.log('📡 Calling strategy webhook:', config.strategyWebhook);
    console.log('📦 Request body:', { brandId, analysisId });

    try {
      const response = await fetch(config.strategyWebhook, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ brandId, analysisId })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Webhook response:', data);

      // Validate response format
      if (!data.success || !data.data) {
        throw new Error('Invalid webhook response format');
      }

      return data;
    } catch (error) {
      console.error('❌ Webhook error:', error);
      throw error;
    }
  };

  // Run progress timer with updates (returns a promise that rejects on timeout)
  const runProgressTimer = async (durationSeconds: number, isStrategy: boolean = false): Promise<never> => {
    return new Promise((_, reject) => {
      const startTime = Date.now();
      const totalSteps = 100;
      const stepDuration = (durationSeconds * 1000) / totalSteps;

      const stages = isStrategy
        ? [
            { threshold: 0, message: 'Initializing strategy generation...', step: 1 },
            { threshold: 20, message: 'Analyzing brand positioning...', step: 2 },
            { threshold: 40, message: 'Creating editorial pillars...', step: 3 },
            { threshold: 60, message: 'Developing key messages...', step: 4 },
            { threshold: 80, message: 'Finalizing action plan...', step: 5 }
          ]
        : [
            { threshold: 0, message: 'Analyzing website structure...', step: 1 },
            { threshold: 20, message: 'Collecting Instagram data...', step: 2 },
            { threshold: 40, message: 'Analyzing Facebook posts...', step: 3 },
            { threshold: 60, message: 'Finding competitors...', step: 4 },
            { threshold: 80, message: 'Calculating LemBrand Score...', step: 5 }
          ];

      let currentStep = 0;

      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min((elapsed / (durationSeconds * 1000)) * 100, 100);

        setProgress(progress);

        // Update stage message
        const currentStageData = stages.filter(s => s.threshold <= progress).pop();
        if (currentStageData) {
          setProgressMessage(currentStageData.message);
          if (currentStageData.step !== currentStep) {
            setCurrentStage(currentStageData.step);
            currentStep = currentStageData.step;
          }
        }

        // Check if time's up
        if (elapsed >= durationSeconds * 1000) {
          clearInterval(interval);
          reject(new Error(`Timeout after ${durationSeconds} seconds`));
        }
      }, stepDuration);
    });
  };

  // Start analysis with REAL webhook integration
  const startAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!websiteUrl.trim()) {
      alert('Please enter a valid website URL');
      return;
    }

    try {
      // Check if testing mode is enabled
      if (config.testMode && config.testBrandId && config.testAnalysisId) {
        console.log('🧪 Testing mode: Skipping analysis, loading data directly');

        setShowProgress(true);
        setShowResults(false);
        setShowStrategy(false);
        setProgress(0);
        setCurrentStage(5); // Show last step

        setAppState(prev => ({
          ...prev,
          brandId: config.testBrandId,
          analysisId: config.testAnalysisId,
          isAnalyzing: true
        }));

        // Show quick progress (1 second)
        for (let i = 0; i <= 100; i += 20) {
          setProgress(i);
          await sleep(200);
        }

        // Fetch real data from Baserow
        const data = await fetchAnalysisFromBaserow(config.testAnalysisId);

        setAnalysisData(data);
        setAppState(prev => ({ ...prev, isAnalyzing: false }));
        setShowProgress(false);
        setShowResults(true);

        return;
      }

      // Normal flow: start analysis with real webhook
      setAppState(prev => ({ ...prev, isAnalyzing: true }));
      setShowProgress(true);
      setShowResults(false);
      setShowStrategy(false);
      setProgress(0);
      setCurrentStage(0);

      // Race webhook call against timer - whichever finishes first wins
      const result = await Promise.race([
        callAnalysisWebhook(websiteUrl),
        runProgressTimer(config.analysisDuration, false)
      ]);

      // Webhook returned successfully
      console.log('✅ Analysis complete:', {
        brandId: result.brandId,
        analysisId: result.analysisId,
        processingTime: result.processingTime
      });

      // Jump progress to 100% and pause briefly
      setProgress(100);
      setProgressMessage('Analysis complete!');
      await sleep(500);

      // Save IDs and data
      setAppState(prev => ({
        ...prev,
        isAnalyzing: false,
        brandId: result.brandId,
        analysisId: result.analysisId
      }));
      setAnalysisData(result.data);
      setShowProgress(false);
      setShowResults(true);

    } catch (error) {
      console.error('Analysis error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Analysis failed';

      if (errorMessage.includes('Timeout')) {
        alert('Analysis is taking longer than expected. Please try again or contact support.');
      } else {
        alert('Analysis failed: ' + errorMessage);
      }

      setAppState(prev => ({ ...prev, isAnalyzing: false }));
      setShowProgress(false);
    }
  };

  // Generate strategy with FIXED 2-minute timer
  const generateStrategy = async () => {
    // FIX Bug #1: Determine which IDs to use
    let brandId: string | null;
    let analysisId: string | null;

    // Priority 1: Manual Brand ID input (if provided)
    if (manualBrandId.trim()) {
      brandId = manualBrandId.trim();
      analysisId = appState.analysisId || null;
      console.log('🔧 Using manual Brand ID:', { brandId, analysisId });
    }
    // Priority 2: Testing Mode IDs
    else if (config.testMode && config.testBrandId && config.testAnalysisId) {
      brandId = config.testBrandId;
      analysisId = config.testAnalysisId;
      console.log('🧪 Testing Mode: Using provided IDs', { brandId, analysisId });
    }
    // Priority 3: Analysis flow IDs
    else if (appState.brandId && appState.analysisId) {
      brandId = appState.brandId;
      analysisId = appState.analysisId;
      console.log('📊 Using Analysis IDs', { brandId, analysisId });
    }
    // No IDs available
    else {
      alert('Please specify a Brand ID or run analysis first.');
      return;
    }

    try {
      // Normal flow: start strategy generation with real webhook
      setAppState(prev => ({ ...prev, isGeneratingStrategy: true }));
      setShowProgress(true);
      setShowResults(false);
      setProgress(0);
      setCurrentStage(0);

      // Race webhook call against timer - whichever finishes first wins
      const result = await Promise.race([
        callStrategyWebhook(brandId, analysisId),
        runProgressTimer(config.strategyDuration, true)
      ]);

      // Webhook returned successfully
      console.log('✅ Strategy complete:', {
        strategyId: result.strategyId,
        processingTime: result.processingTime
      });

      // Jump progress to 100% and pause briefly
      setProgress(100);
      setProgressMessage('Strategy generation complete!');
      await sleep(500);

      // Save strategy data
      setAppState(prev => ({
        ...prev,
        isGeneratingStrategy: false,
        strategyId: result.strategyId
      }));
      setStrategyData(result.data);
      setShowProgress(false);
      setShowResults(true);
      setShowStrategy(true);

    } catch (error) {
      console.error('Strategy error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Strategy generation failed';

      if (errorMessage.includes('Timeout')) {
        alert('Strategy generation is taking longer than expected. Please try again or contact support.');
      } else {
        alert('Strategy generation failed: ' + errorMessage);
      }

      setAppState(prev => ({ ...prev, isGeneratingStrategy: false }));
      setShowProgress(false);
      setShowResults(true);
    }
  };

  // Force load strategy from Baserow by Brand ID
  const forceLoadStrategyFromBaserow = async () => {
    const brandId = manualBrandId.trim();

    if (!brandId) {
      alert('Please enter a Brand ID first.');
      return;
    }

    if (!config.baserowToken) {
      alert('Baserow API token not configured. Please set it in Settings (⚙️) to use Baserow integration.');
      return;
    }

    try {
      console.log('📥 Force loading strategy from Baserow for Brand ID:', brandId);

      setAppState(prev => ({ ...prev, isGeneratingStrategy: true }));
      setShowProgress(true);
      setShowResults(false);
      setProgress(0);
      setCurrentStage(5); // Show last step

      // Show quick progress (1 second)
      for (let i = 0; i <= 100; i += 20) {
        setProgress(i);
        await sleep(200);
      }

      // Fetch real strategy data from Baserow by Brand ID
      const strategy = await fetchStrategyFromBaserow(brandId);

      setStrategyData(strategy);
      setAppState(prev => ({
        ...prev,
        isGeneratingStrategy: false,
        strategyId: 'strategy-baserow-' + Date.now(),
        brandId: brandId
      }));
      setShowProgress(false);
      setShowResults(true);
      setShowStrategy(true);

      console.log('✅ Strategy loaded from Baserow successfully');

    } catch (error) {
      console.error('❌ Failed to load strategy from Baserow:', error);
      alert('Failed to load strategy from Baserow. Please check Brand ID and try again.');
      setAppState(prev => ({ ...prev, isGeneratingStrategy: false }));
      setShowProgress(false);
    }
  };

  // Get score message
  const getScoreMessage = (score: number): string => {
    if (score >= 80) return '🎉 Excellent! Your social media presence is strong';
    if (score >= 60) return '👍 Good work! Some room for improvement';
    if (score >= 40) return '💪 Solid foundation with growth opportunities';
    return '🚀 Great potential to improve your presence';
  };

  // Get score class
  const getScoreClass = (score: number): string => {
    if (score >= 80) return 'score-excellent';
    if (score >= 60) return 'score-good';
    if (score >= 40) return 'score-fair';
    return 'score-needs-work';
  };

  // SVG Icons Components
  const IconTarget = () => (
    <svg className="icon-target" width="48" height="48" viewBox="0 0 48 48">
      <circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" strokeWidth="2"/>
      <circle cx="24" cy="24" r="12" fill="none" stroke="currentColor" strokeWidth="2"/>
      <circle cx="24" cy="24" r="4" fill="currentColor"/>
    </svg>
  );

  const IconSpeed = () => (
    <svg className="icon-speed" width="48" height="48" viewBox="0 0 48 48">
      <path d="M26 8L12 28h12l-4 12 14-20H22l4-12z" fill="currentColor"/>
    </svg>
  );

  const IconChart = () => (
    <svg className="icon-chart" width="48" height="48" viewBox="0 0 48 48">
      <rect x="8" y="28" width="8" height="12" fill="currentColor" rx="2"/>
      <rect x="20" y="18" width="8" height="22" fill="currentColor" rx="2"/>
      <rect x="32" y="12" width="8" height="28" fill="currentColor" rx="2"/>
    </svg>
  );

  const IconGlobe = () => (
    <svg className="icon-globe" width="24" height="24" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2"/>
      <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"
            fill="none" stroke="currentColor" strokeWidth="2"/>
    </svg>
  );

  const IconCheck = () => (
    <svg className="icon-check" width="20" height="20" viewBox="0 0 20 20">
      <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            fill="currentColor"/>
    </svg>
  );

  const IconStar = () => (
    <svg className="icon-star" width="64" height="64" viewBox="0 0 64 64">
      <path d="M32 4l4 24h24l-20 16 8 24-16-12-16 12 8-24-20-16h24z" fill="currentColor"/>
    </svg>
  );

  const LogoShape = () => (
    <svg className="logo-shape" width="32" height="32" viewBox="0 0 32 32">
      <path d="M16 2L30 16L16 30L2 16Z"
            fill="#2B5F75"
            stroke="#D97757"
            strokeWidth="3"/>
    </svg>
  );

  const SpinnerIcon = () => (
    <svg className="spinner-small rotating" width="20" height="20" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="8" fill="none"
              stroke="currentColor" strokeWidth="2"
              strokeDasharray="50" strokeDashoffset="25"/>
    </svg>
  );

  return (
    <div className="lembrand-page">
      {/* Header */}
      <header className="header">
        <div className="container">
          <div className="logo">
            <LogoShape />
            <span className="logo-text">LemBrand</span>
          </div>
          <nav className="nav">
            <a href="#how-it-works" className="nav-link">How It Works</a>
            <a href="#features" className="nav-link">Features</a>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <h1 className="hero-title">
              Professional Content Strategy<br />
              for Your Brand in 5 Minutes
            </h1>

            <p className="hero-description">
              We analyze your social media, study your competitors, and create
              a personalized strategy with ready-to-use editorial pillars
            </p>

            {/* URL Input Form */}
            <form className="url-form" onSubmit={startAnalysis}>
              <div className="input-wrapper">
                <IconGlobe />
                <input
                  type="url"
                  className="url-input"
                  placeholder="https://your-website.com"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  required
                  disabled={appState.isAnalyzing}
                />
                <button type="submit" className="btn-primary" disabled={appState.isAnalyzing}>
                  {appState.isAnalyzing ? 'Analyzing...' : 'Analyze Now'}
                </button>
              </div>

              <div className="trust-badges">
                <span className="badge">
                  <IconCheck />
                  No Sign-Up Required
                </span>
                <span className="badge">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71V3.5z" />
                    <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0z" />
                  </svg>
                  3-5 Minutes
                </span>
                <span className="badge">
                  <IconCheck />
                  100% Free
                </span>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features" id="features">
        <div className="container">
          <h2 className="section-title">Why LemBrand?</h2>

          <div className="features-grid">
            <div className="feature-card">
              <IconTarget />
              <h3 className="feature-title">Deep Analysis</h3>
              <p className="feature-description">
                We analyze your Instagram and Facebook for the last 3 months,
                study up to 3 competitors, and identify opportunities
              </p>
            </div>

            <div className="feature-card">
              <IconSpeed />
              <h3 className="feature-title">Fast Results</h3>
              <p className="feature-description">
                Get a professional strategy with editorial pillars and
                action plan in just 3-5 minutes
              </p>
            </div>

            <div className="feature-card">
              <IconChart />
              <h3 className="feature-title">Data + AI</h3>
              <p className="feature-description">
                GPT-4 analyzes your content in the context of industry
                benchmarks and creates personalized recommendations
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Analysis Progress */}
      {showProgress && (
        <section className="analysis-progress">
          <div className="container">
            <div className="progress-card">
              <div className="progress-header">
                <svg className="progress-spinner" width="64" height="64" viewBox="0 0 64 64">
                  <circle cx="32" cy="32" r="28" fill="none" stroke="var(--border)" strokeWidth="4"/>
                  <circle cx="32" cy="32" r="28" fill="none" stroke="var(--primary)" strokeWidth="4"
                          strokeDasharray="175" strokeDashoffset="175"
                          className="spinner-circle"/>
                </svg>
                <h3 className="progress-title">
                  {appState.isGeneratingStrategy ? 'Generating your strategy...' : 'Analyzing your brand...'}
                </h3>
                <p className="progress-subtitle">
                  {appState.isGeneratingStrategy
                    ? 'Creating personalized content pillars and action plan'
                    : 'This will take approximately 2 minutes'}
                </p>
              </div>

              <div className="progress-bar-container">
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${progress}%` }}></div>
                </div>
                <span className="progress-text">{Math.round(progress)}%</span>
              </div>

              <div className="progress-steps">
                {(appState.isGeneratingStrategy
                  ? [
                      'Initializing strategy generation...',
                      'Analyzing brand positioning...',
                      'Creating editorial pillars...',
                      'Developing key messages...',
                      'Finalizing action plan...'
                    ]
                  : [
                      'Analyzing website structure...',
                      'Collecting Instagram data...',
                      'Analyzing Facebook posts...',
                      'Finding competitors...',
                      'Calculating LemBrand Score...'
                    ]
                ).map((stepText, index) => {
                  const stepNumber = index + 1;
                  const isCompleted = currentStage > stepNumber;
                  const isActive = currentStage === stepNumber;

                  return (
                    <div
                      key={index}
                      className={`step ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}`}
                    >
                      <span className="step-icon">
                        {isCompleted ? '✓' : isActive ? '⏳' : '○'}
                      </span>
                      <span className="step-text">{stepText}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Results Section */}
      {showResults && analysisData && (
        <section className="results-section">
          <div className="container">
            {/* Success Header */}
            <div className="results-header">
              <IconStar />
              <h2 className="results-title">Your Strategy is Ready!</h2>
              <p className="results-subtitle">Here's what we found about your brand</p>
            </div>

            {/* Overall Score Card */}
            <div className={`score-card ${getScoreClass(analysisData.score_overall)}`}>
              <div className="score-header">
                <span className="score-label">LemBrand Score</span>
              </div>

              <div className="score-display">
                <span className="score-value">{analysisData.score_overall}</span>
                <span className="score-max">/100</span>
              </div>

              <div className="score-gauge">
                <div className="gauge-background"></div>
                <div className="gauge-fill" style={{ width: `${analysisData.score_overall}%` }}></div>
              </div>

              <p className="score-message">{getScoreMessage(analysisData.score_overall)}</p>
            </div>

            {/* Dimensions Breakdown */}
            <div className="dimensions-section">
              <h3 className="section-subtitle">📊 Detailed Breakdown</h3>

              <div className="dimensions-grid">
                {[
                  { name: 'Visual Consistency', score: analysisData.score_visual_consistency },
                  { name: 'Tone Consistency', score: analysisData.score_tone_consistency },
                  { name: 'Publishing Regularity', score: analysisData.score_regularity },
                  { name: 'Content Diversity', score: analysisData.score_diversity },
                  { name: 'Engagement', score: analysisData.score_engagement },
                  { name: 'Competitive Positioning', score: analysisData.score_positioning }
                ].map((dimension, index) => (
                  <div key={index} className="dimension-item">
                    <div className="dimension-header">
                      <span className="dimension-name">{dimension.name}</span>
                      <span className="dimension-score">{dimension.score}</span>
                    </div>
                    <div className="dimension-bar">
                      <div className="dimension-fill" style={{ width: `${dimension.score}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Generate Strategy CTA */}
            {!showStrategy && (
              <div className="strategy-cta">
                <div className="cta-content">
                  <h3 className="cta-title">Ready for Your Full Strategy?</h3>
                  <p className="cta-description">
                    Get 5 editorial pillars, key messages, recommended posting
                    frequency, and a detailed action plan in 2 minutes
                  </p>

                  {/* Brand ID Input */}
                  <div className="brand-id-input-wrapper" style={{ marginBottom: '24px' }}>
                    <label htmlFor="manualBrandIdInput" style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '600',
                      marginBottom: '8px',
                      color: 'var(--text-primary)'
                    }}>
                      Brand ID (optional)
                    </label>
                    <input
                      type="text"
                      id="manualBrandIdInput"
                      className="form-input"
                      placeholder="Enter Brand ID from Baserow (e.g., 123)"
                      value={manualBrandId}
                      onChange={(e) => setManualBrandId(e.target.value)}
                      disabled={appState.isGeneratingStrategy}
                      style={{
                        width: '100%',
                        maxWidth: '400px',
                        padding: '12px 16px',
                        fontSize: '16px',
                        border: '2px solid var(--border)',
                        borderRadius: '8px',
                        fontFamily: 'DM Sans, sans-serif'
                      }}
                    />
                    <small style={{
                      display: 'block',
                      marginTop: '6px',
                      fontSize: '13px',
                      color: 'var(--text-muted)'
                    }}>
                      {manualBrandId.trim()
                        ? `Using Brand ID: ${manualBrandId.trim()}`
                        : appState.brandId
                        ? `Using Brand ID from analysis: ${appState.brandId}`
                        : 'No Brand ID specified'}
                    </small>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <button
                      className="btn-generate-strategy"
                      onClick={generateStrategy}
                      disabled={appState.isGeneratingStrategy}
                    >
                      {appState.isGeneratingStrategy ? (
                        <>
                          <SpinnerIcon />
                          <span>Generating...</span>
                        </>
                      ) : (
                        <>
                          <span>Generate Full Strategy</span>
                          <svg className="btn-arrow" width="20" height="20" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" fill="currentColor" />
                          </svg>
                        </>
                      )}
                    </button>

                    <button
                      className="btn-secondary"
                      onClick={forceLoadStrategyFromBaserow}
                      disabled={appState.isGeneratingStrategy || !manualBrandId.trim()}
                      style={{
                        padding: '16px 24px',
                        fontSize: '17px',
                        fontWeight: '600',
                        borderRadius: '12px',
                        border: '3px solid var(--primary)',
                        background: 'transparent',
                        color: 'var(--primary)',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                      title="Load strategy directly from Baserow (skip webhook)"
                    >
                      📥 Load from Baserow
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Strategy Results */}
            {showStrategy && strategyData && (
              <div className="strategy-results">
                {/* Strategic Summary */}
                <div className="strategy-section">
                  <div className="section-icon">🎯</div>
                  <h3 className="section-subtitle">Strategic Summary</h3>
                  <div className="section-content">
                    <p className="summary-text">{strategyData.summary}</p>
                  </div>
                </div>

                {/* Editorial Pillars */}
                <div className="strategy-section">
                  <div className="section-icon">📋</div>
                  <h3 className="section-subtitle">Editorial Pillars (5)</h3>
                  <div className="pillars-grid">
                    {strategyData.editorial_pillars.pillars.map((pillar, index) => (
                      <div key={index} className="pillar-card">
                        <h4 className="pillar-title">{pillar.title}</h4>
                        <div className="pillar-frequency">{pillar.frequency}</div>
                        <p className="pillar-description">{pillar.description}</p>
                        <div className="pillar-examples">
                          {pillar.examples.map((example, idx) => (
                            <span key={idx} className="example-badge">{example}</span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Key Messages */}
                <div className="strategy-section">
                  <div className="section-icon">💬</div>
                  <h3 className="section-subtitle">Key Messages</h3>
                  <div className="messages-list">
                    {strategyData.key_messages.map((message, index) => (
                      <div key={index} className="message-item">
                        <IconCheck />
                        <span className="message-text">{message}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recommended Frequency */}
                <div className="strategy-section">
                  <div className="section-icon">📅</div>
                  <h3 className="section-subtitle">Recommended Posting Frequency</h3>
                  <div className="frequency-display">
                    <div className="frequency-value">{strategyData.recommended_frequency}</div>
                    <div className="frequency-label">posts per week</div>
                    <p className="frequency-reasoning">
                      Based on your sector benchmark and competitor analysis
                    </p>
                  </div>
                </div>

                {/* Action Plan */}
                <div className="strategy-section">
                  <div className="section-icon">🚀</div>
                  <h3 className="section-subtitle">Action Plan</h3>

                  <div className="action-plan-tabs">
                    <button
                      className={`tab-btn ${activeTab === 'immediate' ? 'active' : ''}`}
                      onClick={() => setActiveTab('immediate')}
                    >
                      ⚡ Immediate (1-2 weeks)
                    </button>
                    <button
                      className={`tab-btn ${activeTab === 'medium' ? 'active' : ''}`}
                      onClick={() => setActiveTab('medium')}
                    >
                      📅 Medium-term (1-3 months)
                    </button>
                    <button
                      className={`tab-btn ${activeTab === 'long' ? 'active' : ''}`}
                      onClick={() => setActiveTab('long')}
                    >
                      🎯 Long-term (3-6 months)
                    </button>
                  </div>

                  <div className="action-plan-content">
                    <div className={`tab-content ${activeTab === 'immediate' ? 'active' : ''}`}>
                      {strategyData.action_plan.immediate.map((action, index) => (
                        <div key={index} className="action-card">
                          <div className="action-header">
                            <h4 className="action-title">{action.action}</h4>
                            <span className={`effort-badge effort-${action.effort.toLowerCase()}`}>
                              {action.effort} effort
                            </span>
                          </div>
                          <p className="action-reason">{action.why}</p>
                        </div>
                      ))}
                    </div>

                    <div className={`tab-content ${activeTab === 'medium' ? 'active' : ''}`}>
                      {strategyData.action_plan.medium_term.map((action, index) => (
                        <div key={index} className="action-card">
                          <div className="action-header">
                            <h4 className="action-title">{action.action}</h4>
                            <span className={`effort-badge effort-${action.effort.toLowerCase()}`}>
                              {action.effort} effort
                            </span>
                          </div>
                          <p className="action-reason">{action.why}</p>
                        </div>
                      ))}
                    </div>

                    <div className={`tab-content ${activeTab === 'long' ? 'active' : ''}`}>
                      {strategyData.action_plan.long_term.map((action, index) => (
                        <div key={index} className="action-card">
                          <div className="action-header">
                            <h4 className="action-title">{action.action}</h4>
                            <span className={`effort-badge effort-${action.effort.toLowerCase()}`}>
                              {action.effort} effort
                            </span>
                          </div>
                          <p className="action-reason">{action.why}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Standalone Strategy Generation (when always show is enabled) */}
      {config.alwaysShowStrategyButton && !showResults && !showStrategy && (
        <section className="standalone-strategy-section" style={{
          padding: '80px 0',
          background: 'var(--surface)',
          borderTop: '3px solid var(--border)'
        }}>
          <div className="container">
            <div className="strategy-cta">
              <div className="cta-content">
                <h3 className="cta-title">Generate Brand Strategy</h3>
                <p className="cta-description">
                  Create a personalized content strategy with editorial pillars, key messages,
                  and action plan using your Brand ID
                </p>

                {/* Brand ID Input */}
                <div className="brand-id-input-wrapper" style={{ marginBottom: '24px' }}>
                  <label htmlFor="standaloneBrandIdInput" style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '600',
                    marginBottom: '8px',
                    color: 'var(--text-primary)'
                  }}>
                    Brand ID (required)
                  </label>
                  <input
                    type="text"
                    id="standaloneBrandIdInput"
                    className="form-input"
                    placeholder="Enter Brand ID from Baserow (e.g., 123)"
                    value={manualBrandId}
                    onChange={(e) => setManualBrandId(e.target.value)}
                    disabled={appState.isGeneratingStrategy}
                    style={{
                      width: '100%',
                      maxWidth: '400px',
                      padding: '12px 16px',
                      fontSize: '16px',
                      border: '2px solid var(--border)',
                      borderRadius: '8px',
                      fontFamily: 'DM Sans, sans-serif'
                    }}
                  />
                  <small style={{
                    display: 'block',
                    marginTop: '6px',
                    fontSize: '13px',
                    color: 'var(--text-muted)'
                  }}>
                    {manualBrandId.trim()
                      ? `Using Brand ID: ${manualBrandId.trim()}`
                      : 'Please enter a Brand ID to generate strategy'}
                  </small>
                </div>

                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <button
                    className="btn-generate-strategy"
                    onClick={generateStrategy}
                    disabled={appState.isGeneratingStrategy || !manualBrandId.trim()}
                  >
                    {appState.isGeneratingStrategy ? (
                      <>
                        <SpinnerIcon />
                        <span>Generating...</span>
                      </>
                    ) : (
                      <>
                        <span>Generate Full Strategy</span>
                        <svg className="btn-arrow" width="20" height="20" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" fill="currentColor" />
                        </svg>
                      </>
                    )}
                  </button>

                  <button
                    className="btn-secondary"
                    onClick={forceLoadStrategyFromBaserow}
                    disabled={appState.isGeneratingStrategy || !manualBrandId.trim()}
                    style={{
                      padding: '16px 24px',
                      fontSize: '17px',
                      fontWeight: '600',
                      borderRadius: '12px',
                      border: '3px solid var(--primary)',
                      background: 'transparent',
                      color: 'var(--primary)',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                    title="Load strategy directly from Baserow (skip webhook)"
                  >
                    📥 Load from Baserow
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="modal">
          <div className="modal-overlay" onClick={() => setShowSettings(false)}></div>
          <div className="modal-content">
            <div className="modal-header">
              <h3>⚙️ Configuration</h3>
              <button className="modal-close" onClick={() => setShowSettings(false)}>×</button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="analysisWebhookInput">Analysis Webhook URL</label>
                <input
                  type="url"
                  id="analysisWebhookInput"
                  className="form-input"
                  value={config.analysisWebhook}
                  onChange={(e) => setConfig({ ...config, analysisWebhook: e.target.value })}
                />
                <small className="form-hint">POST endpoint for starting analysis</small>
              </div>

              <div className="form-group">
                <label htmlFor="strategyWebhookInput">Strategy Webhook URL</label>
                <input
                  type="url"
                  id="strategyWebhookInput"
                  className="form-input"
                  value={config.strategyWebhook}
                  onChange={(e) => setConfig({ ...config, strategyWebhook: e.target.value })}
                />
                <small className="form-hint">POST endpoint for generating strategy</small>
              </div>

              <div className="form-group">
                <label htmlFor="analysisDurationInput">Analysis Duration (seconds)</label>
                <input
                  type="number"
                  id="analysisDurationInput"
                  className="form-input"
                  value={config.analysisDuration}
                  onChange={(e) => setConfig({ ...config, analysisDuration: parseInt(e.target.value) })}
                  min="30"
                  max="300"
                />
                <small className="form-hint">Duration for analysis (default: 120 seconds = 2 minutes)</small>
              </div>

              <div className="form-group">
                <label htmlFor="strategyDurationInput">Strategy Duration (seconds)</label>
                <input
                  type="number"
                  id="strategyDurationInput"
                  className="form-input"
                  value={config.strategyDuration}
                  onChange={(e) => setConfig({ ...config, strategyDuration: parseInt(e.target.value) })}
                  min="30"
                  max="300"
                />
                <small className="form-hint">Duration for strategy generation (default: 120 seconds = 2 minutes)</small>
              </div>

              {/* Testing Mode Section */}
              <div style={{ borderTop: '2px solid var(--border)', margin: '32px 0', paddingTop: '24px' }}>
                <div style={{ marginBottom: '24px' }}>
                  <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    🧪 Testing Mode
                  </h4>
                  <p className="form-hint" style={{ marginTop: 0 }}>
                    Skip analysis timer and load data directly from Baserow
                  </p>
                </div>

                <div className="form-group">
                  <label htmlFor="testBrandIdInput">
                    Brand ID (from Baserow)
                    <span style={{
                      marginLeft: '8px',
                      padding: '2px 8px',
                      background: 'var(--surface)',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '500',
                      color: 'var(--text-muted)'
                    }}>
                      Optional
                    </span>
                  </label>
                  <input
                    type="text"
                    id="testBrandIdInput"
                    className="form-input"
                    placeholder="e.g., 123"
                    value={config.testBrandId || ''}
                    onChange={(e) => setConfig({ ...config, testBrandId: e.target.value || null })}
                  />
                  <small className="form-hint">Enter Brand ID to skip analysis timer</small>
                </div>

                <div className="form-group">
                  <label htmlFor="testAnalysisIdInput">
                    Analysis ID (from Baserow)
                    <span style={{
                      marginLeft: '8px',
                      padding: '2px 8px',
                      background: 'var(--surface)',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '500',
                      color: 'var(--text-muted)'
                    }}>
                      Optional
                    </span>
                  </label>
                  <input
                    type="text"
                    id="testAnalysisIdInput"
                    className="form-input"
                    placeholder="e.g., 456"
                    value={config.testAnalysisId || ''}
                    onChange={(e) => setConfig({ ...config, testAnalysisId: e.target.value || null })}
                  />
                  <small className="form-hint">Enter Analysis ID to load scores from Baserow</small>
                </div>

                <div className="form-group">
                  <label htmlFor="baserowTokenInput">
                    Baserow API Token
                    <span style={{
                      marginLeft: '8px',
                      padding: '2px 8px',
                      background: 'var(--surface)',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '500',
                      color: 'var(--text-muted)'
                    }}>
                      Optional
                    </span>
                  </label>
                  <input
                    type="password"
                    id="baserowTokenInput"
                    className="form-input"
                    placeholder="Enter your Baserow API token"
                    value={config.baserowToken || ''}
                    onChange={(e) => setConfig({ ...config, baserowToken: e.target.value || null })}
                  />
                  <small className="form-hint">Required only for fetching real data from Baserow</small>
                </div>

                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      id="testModeCheckbox"
                      checked={config.testMode}
                      onChange={(e) => setConfig({ ...config, testMode: e.target.checked })}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    <span style={{ fontWeight: '500' }}>Enable Testing Mode</span>
                  </label>
                  <small className="form-hint" style={{ marginLeft: '30px' }}>
                    Skip 2-minute timers and load results immediately (requires Brand ID and Analysis ID)
                  </small>
                </div>

                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      id="alwaysShowStrategyCheckbox"
                      checked={config.alwaysShowStrategyButton}
                      onChange={(e) => setConfig({ ...config, alwaysShowStrategyButton: e.target.checked })}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    <span style={{ fontWeight: '500' }}>Always show "Generate Strategy" button</span>
                  </label>
                  <small className="form-hint" style={{ marginLeft: '30px' }}>
                    Show strategy generation button even without running analysis first
                  </small>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowSettings(false)}>Cancel</button>
              <button className="btn-primary" onClick={() => {
                saveConfigToStorage(config);
                setShowSettings(false);
                alert('Settings saved successfully!');
              }}>
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Button (Floating) */}
      <button
        className="settings-btn"
        onClick={() => setShowSettings(true)}
        title="Configuration"
      >
        ⚙️
      </button>
    </div>
  );
};

export default LemBrand;
