import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

// Initialize the Gemini API
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

// AI Model Types and Capabilities
export type AIModel = 'lyria-002' | 'suno-v4' | 'udio-v2' | 'stable-audio-2' | 'musicgen-large' | 'audiocraft-plus';

export interface ModelCapabilities {
  name: string;
  provider: string;
  maxDuration: number; // in seconds
  supportsVocals: boolean;
  supportsInstrumental: boolean;
  audioFormat: string;
  sampleRate: string;
  apiCost: number; // per generation
  strengths: string[];
  limitations: string[];
  apiEndpoint?: string;
}

export const AI_MODELS: Record<AIModel, ModelCapabilities> = {
  'lyria-002': {
    name: 'Lyria-002',
    provider: 'Google (Vertex AI)',
    maxDuration: 30,
    supportsVocals: false,
    supportsInstrumental: true,
    audioFormat: 'WAV',
    sampleRate: '48kHz',
    apiCost: 0.06,
    strengths: [
      'Professional-grade quality',
      'Excellent for instrumental music',
      'Advanced negative prompting',
      'Precise BPM and key control',
      'SynthID watermarking for authenticity',
      'Superior for classical, jazz, orchestral'
    ],
    limitations: [
      'Instrumental only (no vocals)',
      '30-second limit per generation',
      'US English prompts only',
      'Requires Google Cloud setup'
    ],
    apiEndpoint: 'https://LOCATION-aiplatform.googleapis.com/v1/projects/PROJECT_ID/locations/LOCATION/publishers/google/models/lyria-002:predict'
  },
  'suno-v4': {
    name: 'Suno AI v4',
    provider: 'Suno AI',
    maxDuration: 240,
    supportsVocals: true,
    supportsInstrumental: true,
    audioFormat: 'MP3/WAV',
    sampleRate: '44.1kHz',
    apiCost: 0.10,
    strengths: [
      'Complete songs with vocals and lyrics',
      'Exceptional vocal synthesis',
      'Multi-genre versatility',
      'Verse-chorus-bridge structure',
      'Fast generation (10-20 seconds)',
      'Best for pop, rock, electronic'
    ],
    limitations: [
      'Less control over specific instruments',
      'Occasional lyric inconsistencies',
      'Limited classical/orchestral capabilities'
    ]
  },
  'udio-v2': {
    name: 'Udio v2',
    provider: 'Udio Music',
    maxDuration: 180,
    supportsVocals: true,
    supportsInstrumental: true,
    audioFormat: 'WAV/FLAC',
    sampleRate: '48kHz',
    apiCost: 0.08,
    strengths: [
      'Superior instrumental arrangements',
      'Complex musical structures',
      'Hierarchical musical understanding',
      'Excellent for jazz, classical, progressive',
      'Professional mixing quality',
      'Advanced harmonic progression'
    ],
    limitations: [
      'Slower generation times',
      'Less accessible for beginners',
      'Higher computational requirements'
    ]
  },
  'stable-audio-2': {
    name: 'Stable Audio 2.0',
    provider: 'Stability AI',
    maxDuration: 180,
    supportsVocals: false,
    supportsInstrumental: true,
    audioFormat: 'WAV/FLAC',
    sampleRate: '48kHz',
    apiCost: 0.07,
    strengths: [
      'Precise sonic control',
      'Advanced parameter system',
      'Excellent for sound design',
      'Style transfer capabilities',
      'High-fidelity diffusion model',
      'Best for ambient, electronic, experimental'
    ],
    limitations: [
      'No vocal generation',
      'More complex interface',
      'Resource-intensive generation'
    ]
  },
  'musicgen-large': {
    name: 'MusicGen Large',
    provider: 'Meta (Facebook)',
    maxDuration: 120,
    supportsVocals: false,
    supportsInstrumental: true,
    audioFormat: 'WAV',
    sampleRate: '32kHz',
    apiCost: 0.05,
    strengths: [
      'Multi-track generation',
      'Open-source model',
      'Good for research',
      'Controllable generation',
      'Free to use (self-hosted)'
    ],
    limitations: [
      'Requires significant compute',
      'No vocals',
      'Lower audio quality vs commercial models',
      'Complex setup'
    ]
  },
  'audiocraft-plus': {
    name: 'AudioCraft Plus',
    provider: 'Meta Research',
    maxDuration: 60,
    supportsVocals: false,
    supportsInstrumental: true,
    audioFormat: 'WAV',
    sampleRate: '32kHz',
    apiCost: 0.04,
    strengths: [
      'Research-grade model',
      'Compositional control',
      'Open weights available',
      'Good for experimentation'
    ],
    limitations: [
      'Research quality (not production)',
      'Limited commercial use',
      'Shorter generation length'
    ]
  }
};

export interface MusicGenerationRequest {
  textPrompt: string;
  inspirationFile?: File;
  // AI Model Selection
  selectedModel?: AIModel;
  // Advanced options like Suno AI
  genre?: string;
  mood?: string;
  tempo?: string;
  duration?: number; // in seconds
  instrumentalOnly?: boolean;
  vocals?: 'male' | 'female' | 'none';
  style?: string;
  energy?: 'low' | 'medium' | 'high';
  structure?: string; // verse-chorus-verse, etc.
  key?: string;
  lyricsStyle?: string;
  customInstructions?: string;
  // Lyria-002 specific
  negativePrompt?: string;
  seed?: number;
  // Advanced controls
  bpm?: number;
  keySignature?: string;
  timeSignature?: string;
  instruments?: string[];
}

export interface MusicGenerationResponse {
  success: boolean;
  musicUrl?: string;
  error?: string;
  modelUsed?: AIModel;
  generationTime?: number;
  metadata?: {
    duration?: number;
    format?: string;
    sampleRate?: string;
    hasVocals?: boolean;
    estimatedCost?: number;
    // Additional fields for error handling and extended response data
    errorType?: 'CONTENT_BLOCKED' | 'SERVICE_UNAVAILABLE' | 'GENERATION_FAILED';
    suggestions?: string[];
    userPrompt?: string;
    model?: string;
    continuationPrompts?: string[];
    segments?: number; // Number of segments generated
    concatenated?: boolean; // Whether audio was server-side concatenated
    totalSize?: number; // Size of concatenated audio file
  };
}

export interface AudioAnalysis {
  filename: string;
  size: number;
  type: string;
  duration: string;
  features: {
    tempo: string;
    key: string;
    genre: string;
  };
}

export class AIService {
  private model: GenerativeModel | null = null;

  constructor() {
    try {
      if (apiKey) {
        this.model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      }
    } catch (error) {
      console.warn('Failed to initialize AI model:', error);
      this.model = null;
    }
  }

  /**
   * Get available AI models with their capabilities
   */
  getAvailableModels(): Record<AIModel, ModelCapabilities> {
    return AI_MODELS;
  }

  /**
   * Get recommended model based on user requirements
   */
  getRecommendedModel(request: MusicGenerationRequest): AIModel {
    // If user wants vocals, recommend Suno or Udio
    if (request.vocals && request.vocals !== 'none') {
      return request.duration && request.duration > 120 ? 'suno-v4' : 'udio-v2';
    }
    
    // For instrumental-only music
    if (request.instrumentalOnly) {
      // Classical/orchestral -> Lyria-002
      if (request.genre?.toLowerCase().includes('classical') || 
          request.genre?.toLowerCase().includes('orchestral') ||
          request.genre?.toLowerCase().includes('jazz')) {
        return 'lyria-002';
      }
      
      // Electronic/experimental -> Stable Audio 2.0
      if (request.genre?.toLowerCase().includes('electronic') ||
          request.genre?.toLowerCase().includes('ambient') ||
          request.genre?.toLowerCase().includes('experimental')) {
        return 'stable-audio-2';
      }
    }
    
    // Default to Lyria-002 for high quality
    return 'lyria-002';
  }

  /**
   * Generate optimized prompt for specific AI models
   */
  private generateModelSpecificPrompt(request: MusicGenerationRequest, targetModel: AIModel): string {
    const basePrompt = request.textPrompt;
    
    // Add musical parameters based on model capabilities
    const musicalElements = [];
    
    if (request.genre) musicalElements.push(`Genre: ${request.genre}`);
    if (request.mood) musicalElements.push(`Mood: ${request.mood}`);
    if (request.tempo) musicalElements.push(`Tempo: ${request.tempo}`);
    if (request.energy) musicalElements.push(`Energy: ${request.energy}`);
    if (request.style) musicalElements.push(`Style: ${request.style}`);
    if (request.key) musicalElements.push(`Key: ${request.key}`);
    if (request.bpm) musicalElements.push(`BPM: ${request.bpm}`);
    if (request.keySignature) musicalElements.push(`Key Signature: ${request.keySignature}`);
    if (request.timeSignature) musicalElements.push(`Time Signature: ${request.timeSignature}`);
    if (request.instruments) musicalElements.push(`Instruments: ${request.instruments.join(', ')}`);
    
    // Model-specific optimizations
    switch (targetModel) {
      case 'lyria-002':
        // Lyria-002 excels with detailed, technical descriptions
        return `${basePrompt}. ${musicalElements.join(', ')}. Create a high-quality instrumental composition with professional production values.`;
        
      case 'suno-v4': {
        // Suno excels with complete song descriptions
        let sunoPrompt = basePrompt;
        if (request.structure) sunoPrompt += ` with ${request.structure} structure`;
        if (request.vocals !== 'none') sunoPrompt += ` featuring ${request.vocals} vocals`;
        if (request.lyricsStyle) sunoPrompt += ` with ${request.lyricsStyle} lyrics`;
        return sunoPrompt;
      }
        
      case 'udio-v2':
        // Udio excels with complex musical arrangements
        return `${basePrompt}. Focus on sophisticated musical arrangement with ${musicalElements.join(', ')}. Emphasize harmonic complexity and instrumental interplay.`;
        
      case 'stable-audio-2':
        // Stable Audio excels with sonic textures and experimental sounds
        return `${basePrompt}. Focus on sonic texture, timbre, and spatial audio design. ${musicalElements.join(', ')}.`;
        
      case 'musicgen-large':
        // MusicGen works well with structured descriptions
        return `${basePrompt}. Multi-track composition with ${musicalElements.join(', ')}.`;
        
      case 'audiocraft-plus':
        // AudioCraft for experimental compositions
        return `${basePrompt}. Experimental approach with ${musicalElements.join(', ')}.`;
        
      default:
        return `${basePrompt}. ${musicalElements.join(', ')}.`;
    }
  }

  /**
   * Generate music using the selected AI model with advanced customization
   */
  async generateMusic(request: MusicGenerationRequest): Promise<MusicGenerationResponse> {
    const startTime = Date.now();
    
    try {
      // Determine which model to use
      const selectedModel = request.selectedModel || this.getRecommendedModel(request);
      const modelInfo = AI_MODELS[selectedModel];
      
      // Validate request against model capabilities
      if (request.vocals && request.vocals !== 'none' && !modelInfo.supportsVocals) {
        return {
          success: false,
          error: `${modelInfo.name} does not support vocal generation. Consider using Suno AI or Udio for vocal tracks.`
        };
      }
      
      if (request.duration && request.duration > modelInfo.maxDuration) {
        return {
          success: false,
          error: `${modelInfo.name} supports maximum ${modelInfo.maxDuration}s duration. Requested: ${request.duration}s.`
        };
      }
      
      // Generate optimized prompt for the selected model
      const optimizedPrompt = this.generateModelSpecificPrompt(request, selectedModel);
      
      // For now, use Gemini to create detailed specifications for the chosen model
      if (!this.model) {
        return {
          success: false,
          error: 'AI model not initialized. Please check your API key configuration.'
        };
      }

      const inspirationText = request.inspirationFile 
        ? `The user has also provided an inspiration music file: ${request.inspirationFile.name}`
        : '';

      const detailedPrompt = `
        You are an expert AI music generation consultant. Create a comprehensive prompt for ${modelInfo.name} by ${modelInfo.provider}.
        
        Model Capabilities:
        - Max Duration: ${modelInfo.maxDuration}s
        - Supports Vocals: ${modelInfo.supportsVocals}
        - Audio Format: ${modelInfo.audioFormat}
        - Sample Rate: ${modelInfo.sampleRate}
        - Strengths: ${modelInfo.strengths.join(', ')}
        
        User Request: "${optimizedPrompt}"
        ${inspirationText}
        
        Advanced Parameters:
        ${request.negativePrompt ? `- Negative Prompt: ${request.negativePrompt}` : ''}
        ${request.seed ? `- Seed: ${request.seed}` : ''}
        ${request.customInstructions ? `- Custom Instructions: ${request.customInstructions}` : ''}
        
        Please provide:
        1. An optimized prompt for ${modelInfo.name}
        2. Specific technical recommendations
        3. Expected output characteristics
        4. Alternative approaches if needed
        5. Estimated generation cost: $${modelInfo.apiCost}
        
        Focus on leveraging ${modelInfo.name}'s strengths: ${modelInfo.strengths.slice(0, 3).join(', ')}.
      `;

      const result = await this.model.generateContent(detailedPrompt);
      const response = await result.response;
      const aiRecommendations = response.text();

      console.log(`Generated ${modelInfo.name} specifications:`, aiRecommendations);

      // Call the actual backend API for music generation
      try {
        const formData = new FormData();
        formData.append('prompt', optimizedPrompt);
        formData.append('duration', String(Math.min(request.duration || 30, modelInfo.maxDuration)));
        
        if (request.negativePrompt) {
          formData.append('negativePrompt', request.negativePrompt);
        }
        if (request.seed) {
          formData.append('seed', String(request.seed));
        }
        if (request.inspirationFile) {
          formData.append('inspirationAudio', request.inspirationFile);
        }
        
        // Add temperature for creativity control
        const temperature = request.energy === 'low' ? '0.2' : request.energy === 'high' ? '0.8' : '0.4';
        formData.append('temperature', temperature);

        const apiResponse = await fetch('http://localhost:3001/api/generate-music', {
          method: 'POST',
          body: formData,
        });

        const responseData = await apiResponse.json();

        if (!apiResponse.ok) {
          // Handle specific error types from backend
          if (responseData.error === 'CONTENT_BLOCKED') {
            return {
              success: false,
              error: responseData.message,
              modelUsed: selectedModel,
              metadata: {
                errorType: 'CONTENT_BLOCKED',
                suggestions: responseData.suggestions,
                userPrompt: responseData.userPrompt
              }
            };
          }
          
          if (responseData.error === 'SERVICE_UNAVAILABLE') {
            return {
              success: false,
              error: responseData.message,
              modelUsed: selectedModel,
              metadata: {
                errorType: 'SERVICE_UNAVAILABLE'
              }
            };
          }
          
          // Generic API error
          throw new Error(responseData.message || `API error: ${apiResponse.status}`);
        }

        if (responseData.success && (responseData.fullAudioUrl || responseData.audioSegments)) {
          const generationTime = Date.now() - startTime;
          
          // The server now concatenates segments, so we can use fullAudioUrl directly
          const isConcatenated = responseData.metadata?.concatenated || false;
          const segmentCount = responseData.metadata?.segments || 1;
          
          if (isConcatenated) {
            console.log(`🎵 Received concatenated audio with ${segmentCount} segments`);
          }
          
          return {
            success: true,
            musicUrl: responseData.fullAudioUrl,
            modelUsed: selectedModel,
            generationTime,
            metadata: {
              duration: responseData.metadata.duration,
              format: modelInfo.audioFormat,
              sampleRate: modelInfo.sampleRate,
              hasVocals: false, // Lyria-002 doesn't support vocals
              estimatedCost: responseData.metadata.cost,
              model: responseData.metadata.model,
              suggestions: responseData.suggestions,
              continuationPrompts: responseData.continuationPrompts,
              segments: segmentCount,
              concatenated: isConcatenated,
              totalSize: responseData.metadata?.totalSize
            }
          };
        } else {
          throw new Error(responseData.error || 'Unknown error from music generation API');
        }

      } catch (apiError) {
        console.error('Backend API Error:', apiError);
        throw apiError;
      }

    } catch (error) {
      console.error('Error generating music:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred during music generation'
      };
    }
  }

  /**
   * Compare multiple AI models for a specific use case
   */
  compareModelsForRequest(request: MusicGenerationRequest): Array<{model: AIModel, score: number, reasons: string[]}> {
    const comparisons = Object.keys(AI_MODELS).map(modelKey => {
      const model = modelKey as AIModel;
      const info = AI_MODELS[model];
      let score = 0;
      const reasons = [];
      
      // Vocal requirements
      if (request.vocals && request.vocals !== 'none') {
        if (info.supportsVocals) {
          score += 20;
          reasons.push(`Supports ${request.vocals} vocals`);
        } else {
          score -= 30;
          reasons.push(`No vocal support`);
        }
      }
      
      // Duration requirements
      if (request.duration) {
        if (request.duration <= info.maxDuration) {
          score += 10;
        } else {
          score -= 20;
          reasons.push(`Duration limit: ${info.maxDuration}s (need ${request.duration}s)`);
        }
      }
      
      // Genre matching
      if (request.genre) {
        const genre = request.genre.toLowerCase();
        if (info.strengths.some(strength => 
          strength.toLowerCase().includes(genre) ||
          genre.includes(strength.toLowerCase())
        )) {
          score += 15;
          reasons.push(`Excellent for ${request.genre}`);
        }
      }
      
      // Cost consideration
      score += (0.12 - info.apiCost) * 50; // Favor lower cost
      
      return { model, score, reasons };
    });
    
    return comparisons.sort((a, b) => b.score - a.score);
  }

  /**
   * Get detailed model information and API setup instructions
   */
  getModelSetupInstructions(model: AIModel): string {
    const info = AI_MODELS[model];
    
    switch (model) {
      case 'lyria-002':
        return `
Setup Instructions for ${info.name}:
1. Enable Vertex AI API in Google Cloud Console
2. Create a project and note your PROJECT_ID
3. Set up authentication (service account or ADC)
4. Install Google Cloud SDK
5. Set environment variables: VITE_VERTEX_AI_PROJECT_ID, VITE_VERTEX_AI_LOCATION
6. API Endpoint: ${info.apiEndpoint}
7. Cost: $${info.apiCost} per 30-second generation

Best for: ${info.strengths.slice(0, 3).join(', ')}
        `;
        
      case 'suno-v4':
        return `
Setup Instructions for ${info.name}:
1. Sign up at suno.ai
2. Get API key from dashboard
3. Set VITE_SUNO_API_KEY environment variable
4. Choose subscription plan (Pro recommended)
5. Cost: $${info.apiCost} per generation

Best for: ${info.strengths.slice(0, 3).join(', ')}
        `;
        
      case 'udio-v2':
        return `
Setup Instructions for ${info.name}:
1. Register at udio.com
2. Obtain API credentials
3. Set VITE_UDIO_API_KEY environment variable
4. Cost: $${info.apiCost} per generation

Best for: ${info.strengths.slice(0, 3).join(', ')}
        `;
        
      case 'stable-audio-2':
        return `
Setup Instructions for ${info.name}:
1. Sign up at stability.ai
2. Get API key from account dashboard
3. Set VITE_STABILITY_API_KEY environment variable
4. Cost: $${info.apiCost} per generation

Best for: ${info.strengths.slice(0, 3).join(', ')}
        `;
        
      default:
        return `Setup instructions for ${info.name} are not available yet.`;
    }
  }

  /**
   * Analyze uploaded music file to extract features
   */
  async analyzeMusicFile(file: File): Promise<AudioAnalysis> {
    // In a real implementation, this would:
    // 1. Upload the file to a service
    // 2. Extract audio features (tempo, key, genre, etc.)
    // 3. Return analysis results
    
    return {
      filename: file.name,
      size: file.size,
      type: file.type,
      duration: 'Unknown', // Would be extracted from audio analysis
      features: {
        tempo: 'Unknown',
        key: 'Unknown',
        genre: 'Unknown'
      }
    };
  }
}

export const aiService = new AIService();
