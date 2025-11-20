import { useState, useEffect } from 'react';
import '../styles/lembrand.css';

// Configuration interface
interface Config {
  analysisWebhook: string;
  strategyWebhook: string;
  pollingInterval: number;
  maxPollingAttempts: number;
}

// App state interface
interface AppState {
  brandId: string | null;
  analysisId: string | null;
  strategyId: string | null;
  currentStep: number;
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

const LemBrand = () => {
  // State management
  const [config, setConfig] = useState<Config>({
    analysisWebhook: 'https://n8n.okta-solutions.com/webhook-test/lembrand-start',
    strategyWebhook: 'https://n8n.okta-solutions.com/webhook-test/lembrand-strategy',
    pollingInterval: 3000,
    maxPollingAttempts: 100
  });

  const [appState, setAppState] = useState<AppState>({
    brandId: null,
    analysisId: null,
    strategyId: null,
    currentStep: 0,
    isAnalyzing: false,
    isGeneratingStrategy: false
  });

  const [websiteUrl, setWebsiteUrl] = useState('');
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [showProgress, setShowProgress] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showStrategy, setShowStrategy] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [strategyData, setStrategyData] = useState<StrategyData | null>(null);
  const [activeTab, setActiveTab] = useState<'immediate' | 'medium' | 'long'>('immediate');

  // Load config from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('lembrand_config');
    if (saved) {
      setConfig({ ...config, ...JSON.parse(saved) });
    }
  }, []);

  // Save config to localStorage
  const saveConfig = (newConfig: Config) => {
    localStorage.setItem('lembrand_config', JSON.stringify(newConfig));
    setConfig(newConfig);
  };

  // Get step message based on progress
  const getStepMessage = (progress: number): string => {
    if (progress < 20) return 'Analyzing website...';
    if (progress < 40) return 'Collecting Instagram data...';
    if (progress < 60) return 'Finding competitors...';
    if (progress < 80) return 'Calculating LemBrand Score...';
    return 'Finalizing analysis...';
  };

  // Mock status check (replace with actual API call)
  const checkAnalysisStatus = async (): Promise<any> => {
    // Simulate progress
    const newProgress = Math.min(appState.currentStep * 20, 100);
    setAppState(prev => ({ ...prev, currentStep: prev.currentStep + 1 }));

    if (newProgress >= 100) {
      // Simulate completed status with mock data
      return {
        status: 'completed',
        progress: 100,
        data: {
          score_overall: 58,
          score_visual_consistency: 72,
          score_tone_consistency: 64,
          score_regularity: 28,
          score_diversity: 62,
          score_engagement: 45,
          score_positioning: 49
        }
      };
    }

    return {
      status: 'in_progress',
      progress: newProgress,
      currentStep: getStepMessage(newProgress)
    };
  };

  // Poll analysis status
  const pollAnalysisStatus = async () => {
    let attempts = 0;

    const poll = setInterval(async () => {
      attempts++;

      if (attempts > config.maxPollingAttempts) {
        clearInterval(poll);
        alert('Analysis timeout. Please try again.');
        setAppState(prev => ({ ...prev, isAnalyzing: false }));
        return;
      }

      try {
        const status = await checkAnalysisStatus();

        if (status.status === 'completed') {
          clearInterval(poll);
          setAppState(prev => ({ ...prev, isAnalyzing: false }));
          setAnalysisData(status.data);
          setShowProgress(false);
          setShowResults(true);
        } else if (status.status === 'failed') {
          clearInterval(poll);
          setAppState(prev => ({ ...prev, isAnalyzing: false }));
          alert('Analysis failed. Please try again.');
        } else {
          setProgress(status.progress);
          setProgressMessage(status.currentStep);
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, config.pollingInterval);
  };

  // Start analysis
  const startAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!websiteUrl.trim()) {
      alert('Please enter a valid website URL');
      return;
    }

    try {
      setAppState(prev => ({ ...prev, isAnalyzing: true, currentStep: 0 }));
      setShowProgress(true);
      setShowResults(false);
      setProgress(0);
      setProgressMessage('Starting analysis...');

      // Call analysis webhook
      const response = await fetch(config.analysisWebhook, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          websiteUrl: websiteUrl
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      setAppState(prev => ({
        ...prev,
        brandId: data.brandId,
        analysisId: data.analysisId
      }));

      // Start polling
      await pollAnalysisStatus();

    } catch (error) {
      console.error('Analysis error:', error);
      alert('Failed to start analysis. Please check webhook configuration.');
      setAppState(prev => ({ ...prev, isAnalyzing: false }));
      setShowProgress(false);
    }
  };

  // Mock strategy status check
  const checkStrategyStatus = async (): Promise<any> => {
    // Simulate delay
    await new Promise(resolve => setTimeout(resolve, 3000));

    return {
      status: 'completed',
      data: {
        summary: 'Your brand occupies a strong position in the healthy food sector with clear visual identity and engaging content. The main areas for improvement are publishing regularity and competitive differentiation.',
        editorial_pillars: {
          pillars: [
            {
              title: 'Recipes & Tips',
              description: 'Simple, healthy recipes with your products',
              examples: ['5-min smoothie bowl', 'How to store greens', '3 ways to cook quinoa'],
              frequency: '2 posts/week'
            },
            {
              title: 'Behind the Scenes',
              description: 'Show your production process and team',
              examples: ['Meet our farmers', 'From farm to table', 'Quality control process'],
              frequency: '1 post/week'
            },
            {
              title: 'Customer Stories',
              description: 'Real stories from your customers',
              examples: ['Transformation stories', 'Customer testimonials', 'Before & after'],
              frequency: '1 post/week'
            },
            {
              title: 'Educational Content',
              description: 'Health tips and nutritional information',
              examples: ['Benefits of organic food', 'How to read labels', 'Seasonal eating guide'],
              frequency: '2 posts/week'
            },
            {
              title: 'Community & Events',
              description: 'Engage with your community',
              examples: ['Local events', 'Challenges', 'Q&A sessions'],
              frequency: '1 post/week'
            }
          ]
        },
        key_messages: [
          'Only local ingredients from trusted farmers',
          'Ready healthy food without taste compromises',
          'Transparency from farm to your plate',
          'Supporting local communities and sustainable farming',
          'Quality you can trust, taste you will love'
        ],
        recommended_frequency: 7,
        action_plan: {
          immediate: [
            {
              action: 'Create content calendar for 4 weeks ahead',
              why: 'Eliminate irregularity, boost score from 28 to 50+',
              effort: 'Low'
            },
            {
              action: 'Set up Instagram Stories highlights for each pillar',
              why: 'Better content organization and discoverability',
              effort: 'Low'
            },
            {
              action: 'Create templates for each editorial pillar',
              why: 'Improve visual consistency and save time',
              effort: 'Medium'
            }
          ],
          medium_term: [
            {
              action: 'Launch user-generated content campaign',
              why: 'Increase engagement and build community',
              effort: 'Medium'
            },
            {
              action: 'Develop unique hashtag strategy',
              why: 'Improve discoverability and brand recognition',
              effort: 'Low'
            },
            {
              action: 'Create video content series',
              why: 'Video content gets 3x more engagement',
              effort: 'High'
            }
          ],
          long_term: [
            {
              action: 'Build partnerships with micro-influencers',
              why: 'Expand reach and credibility',
              effort: 'High'
            },
            {
              action: 'Launch educational blog series',
              why: 'Position as thought leader in healthy eating',
              effort: 'High'
            },
            {
              action: 'Implement comprehensive analytics dashboard',
              why: 'Data-driven content optimization',
              effort: 'Medium'
            }
          ]
        }
      }
    };
  };

  // Generate strategy
  const generateStrategy = async () => {
    if (!appState.brandId || !appState.analysisId) {
      alert('Analysis data not found');
      return;
    }

    try {
      setAppState(prev => ({ ...prev, isGeneratingStrategy: true }));

      // Call strategy webhook
      const response = await fetch(config.strategyWebhook, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          brandId: appState.brandId,
          analysisId: appState.analysisId
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setAppState(prev => ({ ...prev, strategyId: data.strategyId }));

      // Poll for strategy completion
      const status = await checkStrategyStatus();

      if (status.status === 'completed') {
        setStrategyData(status.data);
        setShowStrategy(true);
        setAppState(prev => ({ ...prev, isGeneratingStrategy: false }));
      }

    } catch (error) {
      console.error('Strategy generation error:', error);
      alert('Failed to generate strategy. Please check webhook configuration.');
      setAppState(prev => ({ ...prev, isGeneratingStrategy: false }));
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

  return (
    <div className="lembrand-page">
      {/* Header */}
      <header className="header">
        <div className="container">
          <div className="logo">
            <span className="logo-icon">🔷</span>
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
                <span className="input-icon">🌐</span>
                <input
                  type="url"
                  className="url-input"
                  placeholder="https://your-website.com"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  required
                />
                <button type="submit" className="btn-primary" disabled={appState.isAnalyzing}>
                  {appState.isAnalyzing ? 'Analyzing...' : 'Analyze Now'}
                </button>
              </div>

              <div className="trust-badges">
                <span className="badge">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z" />
                  </svg>
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
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M2.5 8a5.5 5.5 0 0 1 8.25-4.764.5.5 0 0 0 .5-.866A6.5 6.5 0 1 0 14.5 8a.5.5 0 0 0-1 0 5.5 5.5 0 1 1-11 0z" />
                    <path d="M15.354 3.354a.5.5 0 0 0-.708-.708L8 9.293 5.354 6.646a.5.5 0 1 0-.708.708l3 3a.5.5 0 0 0 .708 0l7-7z" />
                  </svg>
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
              <div className="feature-icon">🎯</div>
              <h3 className="feature-title">Deep Analysis</h3>
              <p className="feature-description">
                We analyze your Instagram and Facebook for the last 3 months,
                study up to 3 competitors, and identify opportunities
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <h3 className="feature-title">Fast Results</h3>
              <p className="feature-description">
                Get a professional strategy with editorial pillars and
                action plan in just 3-5 minutes
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">📊</div>
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
                <div className="spinner"></div>
                <h3 className="progress-title">Analyzing your brand...</h3>
                <p className="progress-subtitle">This usually takes 3-5 minutes</p>
              </div>

              <div className="progress-bar-container">
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${progress}%` }}></div>
                </div>
                <span className="progress-text">{Math.round(progress)}%</span>
              </div>

              <div className="progress-steps">
                {[
                  'Analyzing website...',
                  'Collecting Instagram data...',
                  'Finding competitors...',
                  'Calculating LemBrand Score...',
                  'Generating strategy...'
                ].map((step, index) => {
                  const stepProgress = (index + 1) * 20;
                  const isCompleted = progress >= stepProgress;
                  const isActive = progress >= (index * 20) && progress < stepProgress;

                  return (
                    <div
                      key={index}
                      className={`step ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}`}
                    >
                      <span className="step-icon">{isCompleted ? '✓' : '⏳'}</span>
                      <span className="step-text">{step}</span>
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
              <div className="sparkle">✨</div>
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
                    frequency, and a detailed action plan
                  </p>
                  <button
                    className="btn-generate-strategy"
                    onClick={generateStrategy}
                    disabled={appState.isGeneratingStrategy}
                  >
                    {appState.isGeneratingStrategy ? (
                      <>
                        <span className="spinner-small"></span>
                        Generating Strategy...
                      </>
                    ) : (
                      <>
                        Generate Full Strategy
                        <svg className="btn-icon" width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </>
                    )}
                  </button>
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
                        <svg className="message-icon" width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
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
                <label htmlFor="pollingIntervalInput">Polling Interval (ms)</label>
                <input
                  type="number"
                  id="pollingIntervalInput"
                  className="form-input"
                  value={config.pollingInterval}
                  onChange={(e) => setConfig({ ...config, pollingInterval: parseInt(e.target.value) })}
                  min="1000"
                  max="10000"
                />
                <small className="form-hint">How often to check status (default: 3000ms)</small>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowSettings(false)}>Cancel</button>
              <button className="btn-primary" onClick={() => {
                saveConfig(config);
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
