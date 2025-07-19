import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

// Initialize APIs
const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(geminiApiKey);

// Vertex AI Configuration
export interface VertexAIConfig {
  projectId: string;
  location: string;
  apiEndpoint: string;
}

// Chat-based Music Generation Types
export interface MusicGenerationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  musicUrl?: string;
  metadata?: MusicMetadata;
}

export interface MusicMetadata {
  duration: number;
  model: string;
  prompt: string;
  negativePrompt?: string;
  seed?: number;
  version: number;
  parentId?: string;
  cost: number;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: MusicGenerationMessage[];
  currentSeed?: number;
  totalCost: number;
  createdAt: Date;
}

// Enhanced Music Generation Request
export interface ExtendedMusicRequest {
  // Core parameters
  prompt: string;
  negativePrompt?: string;
  seed?: number;
  inspirationAudio?: File;
  
  // Extension parameters
  extendFromAudio?: string; // Base64 audio data or URL
  targetDuration?: number; // 30s to 300s (5 minutes)
  segmentLength?: number; // 30s segments for Lyria-002
  
  // Chat context
  chatHistory?: MusicGenerationMessage[];
  parentMessageId?: string;
  
  // Advanced controls
  temperature?: number;
  guidance?: number;
  style?: string;
  mood?: string;
  genre?: string;
  instruments?: string[];
  key?: string;
  bpm?: number;
  
  // Version control
  createVariation?: boolean;
  improvementInstructions?: string;
}

export interface MusicGenerationResponse {
  success: boolean;
  audioSegments?: AudioSegment[];
  fullAudioUrl?: string;
  error?: string;
  metadata: MusicMetadata;
  suggestions?: string[];
  continuationPrompts?: string[];
}

export interface AudioSegment {
  url: string;
  startTime: number;
  endTime: number;
  prompt: string;
  seamlessTransition: boolean;
}

export class LyriaChatService {
  private geminiModel: GenerativeModel | null = null;
  private vertexConfig: VertexAIConfig | null = null;
  private chatSessions: Map<string, ChatSession> = new Map();

  constructor() {
    this.initializeServices();
  }

  private async initializeServices() {
    try {
      if (geminiApiKey) {
        this.geminiModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      }
      
      // Initialize Vertex AI config
      // @ts-expect-error vertexConfig is declared but its value is never read.
      this.vertexConfig = {
        projectId: import.meta.env.VITE_VERTEX_AI_PROJECT_ID || '',
        location: import.meta.env.VITE_VERTEX_AI_LOCATION || 'us-central1',
        apiEndpoint: import.meta.env.VITE_VERTEX_AI_ENDPOINT || 'aiplatform.googleapis.com'
      };
    } catch (error) {
      console.warn('Failed to initialize services:', error);
    }
  }

  /**
   * Create a new chat session
   */
  createChatSession(title?: string): ChatSession {
    const session: ChatSession = {
      id: crypto.randomUUID(),
      title: title || 'New Music Session',
      messages: [],
      totalCost: 0,
      createdAt: new Date()
    };
    
    this.chatSessions.set(session.id, session);
    return session;
  }

  /**
   * Get chat session by ID
   */
  getChatSession(sessionId: string): ChatSession | null {
    return this.chatSessions.get(sessionId) || null;
  }

  /**
   * Get all chat sessions
   */
  getAllSessions(): ChatSession[] {
    return Array.from(this.chatSessions.values()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Delete a chat session
   */
  deleteSession(sessionId: string): void {
    this.chatSessions.delete(sessionId);
  }

  /**
   * Add a message to a session
   */
  addMessageToSession(
    sessionId: string,
    messageData: Omit<MusicGenerationMessage, 'id' | 'timestamp'>
  ): ChatSession | null {
    const session = this.getChatSession(sessionId);
    if (!session) return null;

    const message: MusicGenerationMessage = {
      ...messageData,
      id: crypto.randomUUID(),
      timestamp: new Date(),
    };

    session.messages.push(message);

    if (message.role === 'assistant' && message.metadata?.cost) {
      session.totalCost += message.metadata.cost;
    }
    
    this.chatSessions.set(sessionId, session);
    return session;
  }

  /**
   * Generate extended music (up to 5 minutes) by calling the backend server.
   */
  async generateExtendedMusic(
    request: ExtendedMusicRequest
  ): Promise<MusicGenerationResponse> {
    const {
      prompt,
      negativePrompt,
      seed,
      inspirationAudio,
      targetDuration,
      temperature,
    } = request;

    const formData = new FormData();
    formData.append('prompt', prompt);
    if (negativePrompt) formData.append('negativePrompt', negativePrompt);
    if (seed) formData.append('seed', seed.toString());
    if (inspirationAudio) {
      formData.append('inspirationAudio', inspirationAudio);
    }
    if (targetDuration) formData.append('duration', targetDuration.toString());
    if (temperature) formData.append('temperature', temperature.toString());

    try {
      const response = await fetch('http://localhost:3001/api/generate-music', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate music');
      }

      const result = await response.json();
      return result;

    } catch (error) {
      console.error('Error calling backend service:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown server error',
        metadata: {
          duration: 0,
          model: 'lyria-002',
          prompt: prompt,
          cost: 0,
          version: 0,
        },
      };
    }
  }

  /**
   * Generate a variation of an existing music piece.
   */
  async generateVariation(
    originalMessage: MusicGenerationMessage,
    variationPrompt: string,
    sessionId: string
  ): Promise<MusicGenerationResponse> {
    if (!originalMessage.metadata) {
      throw new Error('Original message has no metadata');
    }

    const variationRequest: ExtendedMusicRequest = {
      prompt: `${originalMessage.metadata.prompt}. ${variationPrompt}`,
      negativePrompt: originalMessage.metadata.negativePrompt,
      seed: originalMessage.metadata.seed ? originalMessage.metadata.seed + 1 : undefined,
      targetDuration: originalMessage.metadata.duration,
      createVariation: true,
      parentMessageId: originalMessage.id,
      chatHistory: this.getChatSession(sessionId)?.messages || [],
      improvementInstructions: variationPrompt
    };

    const response = await this.generateExtendedMusic(variationRequest);

     // Override response for variation
     const cost = (originalMessage.metadata.duration / 30) * 0.03; // Variations might be cheaper
     response.metadata.cost = cost;
     response.metadata.version = (originalMessage.metadata.version || 1) + 1;
     response.metadata.parentId = originalMessage.id;

    return response;
  }
}

export const lyriaChatService = new LyriaChatService();

