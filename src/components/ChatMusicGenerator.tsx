import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Play, Pause, Download, RefreshCw, Music, Clock, DollarSign, Plus, Trash2, Settings, Paperclip } from 'lucide-react';
import { lyriaChatService, type ChatSession, type MusicGenerationMessage, type ExtendedMusicRequest, type MusicGenerationResponse } from '../services/lyriaChatService';

interface ChatMusicGeneratorProps {
  className?: string;
}

export const ChatMusicGenerator: React.FC<ChatMusicGeneratorProps> = ({ className }) => {
  const initializeSession = useCallback((): ChatSession => {
    const newSession = lyriaChatService.createChatSession(`Music Session ${Date.now()}`);
    lyriaChatService.addMessageToSession(newSession.id, {
      role: 'assistant',
      content: "🎵 Welcome to Lyria Chat! I can generate up to 5 minutes of professional instrumental music. Describe the music you'd like to create, and I'll craft it using Google's Lyria-002 model. You can also ask me to modify, extend, or create variations of any generated music."
    });
    return lyriaChatService.getChatSession(newSession.id)!;
  }, []);

  // Chat State
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [inputText, setInputText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Audio State
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  // Advanced Settings
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [targetDuration, setTargetDuration] = useState(30);
  const [negativePrompt, setNegativePrompt] = useState('');
  const [seed, setSeed] = useState<number | undefined>();
  const [temperature, setTemperature] = useState(0.8);
  const [inspirationAudio, setInspirationAudio] = useState<File | null>(null);
  
  // UI State
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const existingSessions = lyriaChatService.getAllSessions();
    if (existingSessions.length > 0) {
      setSessions(existingSessions);
      setCurrentSession(existingSessions[0]);
    } else {
      const newSession = initializeSession();
      setSessions([newSession]);
      setCurrentSession(newSession);
    }
  }, [initializeSession]);

  const updateCurrentSessionState = useCallback((session: ChatSession) => {
    setCurrentSession(session);
    setSessions(lyriaChatService.getAllSessions());
  }, []);

  const handleGenerationResponse = useCallback((sessionId: string, response: MusicGenerationResponse, variation?: string) => {
    if (response.success) {
      const content = variation
        ? `🎵 **Variation created:** ${variation}\nDuration: ${response.metadata.duration}s | Cost: $${response.metadata.cost.toFixed(3)}`
        : `🎵 Generated ${response.metadata.duration}s of music! Cost: $${response.metadata.cost.toFixed(3)}`;
      
      lyriaChatService.addMessageToSession(sessionId, {
        role: 'assistant',
        content: content,
        musicUrl: response.fullAudioUrl,
        metadata: response.metadata
      });

      if (!variation && response.suggestions && response.suggestions.length > 0) {
        lyriaChatService.addMessageToSession(sessionId, {
          role: 'assistant',
          content: `💡 **Suggestions for improvement:**\n${response.suggestions.map(s => `• ${s}`).join('\n')}\n\n**Quick variations:**\n${response.continuationPrompts?.map(p => `• "${p}"`).join('\n') || ''}`
        });
      }
    } else {
      lyriaChatService.addMessageToSession(sessionId, {
        role: 'assistant',
        content: `❌ **Generation failed:** ${response.error}`
      });
    }
    const updatedSession = lyriaChatService.getChatSession(sessionId);
    if (updatedSession) {
      updateCurrentSessionState({ ...updatedSession });
    }
  }, [updateCurrentSessionState]);

  const createNewSession = useCallback(() => {
    const newSession = initializeSession();
    setSessions(s => [newSession, ...s]);
    setCurrentSession(newSession);
  }, [initializeSession]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentSession?.messages]);

  const switchSession = (session: ChatSession) => {
    setCurrentSession(session);
  };

  const deleteSession = (sessionId: string) => {
    lyriaChatService.deleteSession(sessionId);
    const updatedSessions = lyriaChatService.getAllSessions();
    setSessions(updatedSessions);
    if (currentSession?.id === sessionId) {
      const newCurrent = updatedSessions.length > 0 ? updatedSessions[0] : null;
      if (!newCurrent) {
        const newSession = initializeSession();
        setSessions([newSession]);
        setCurrentSession(newSession);
      } else {
        setCurrentSession(newCurrent);
      }
    }
  };

  const handleGenerateMusic = async () => {
    if ((!inputText.trim() && !inspirationAudio) || !currentSession || isGenerating) return;

    setIsGenerating(true);
    const sessionId = currentSession.id;
    
    try {
      const userMessage = inputText.trim() || `Generate music inspired by the uploaded audio.`;
      lyriaChatService.addMessageToSession(sessionId, { role: 'user', content: userMessage });
      const updatedSession = lyriaChatService.getChatSession(sessionId)!;
      updateCurrentSessionState({ ...updatedSession });

      const prompt = inputText.trim();
      setInputText('');

      const request: ExtendedMusicRequest = {
        prompt: prompt,
        negativePrompt: negativePrompt || undefined,
        seed: seed,
        targetDuration: targetDuration,
        chatHistory: updatedSession.messages,
        temperature: temperature,
        inspirationAudio: inspirationAudio || undefined,
      };

      const response = await lyriaChatService.generateExtendedMusic(request);
      handleGenerationResponse(sessionId, response);
      setInspirationAudio(null); // Clear after use

    } catch (error) {
      console.error('Error generating music:', error);
      lyriaChatService.addMessageToSession(sessionId, {
        role: 'assistant',
        content: `❌ **Error:** ${error instanceof Error ? error.message : 'Unknown error occurred'}`
      });
      const updatedSession = lyriaChatService.getChatSession(sessionId);
      if (updatedSession) updateCurrentSessionState({ ...updatedSession });
    } finally {
      setIsGenerating(false);
    }
  };

  const generateVariation = async (originalMessage: MusicGenerationMessage, variation: string) => {
    if (!currentSession || isGenerating) return;

    setIsGenerating(true);
    const sessionId = currentSession.id;
    
    try {
      const response = await lyriaChatService.generateVariation(originalMessage, variation, sessionId);
      handleGenerationResponse(sessionId, response, variation);
    } catch (error) {
      console.error('Error generating variation:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const togglePlayback = (message: MusicGenerationMessage) => {
    if (!message.musicUrl) return;

    if (playingMessageId === message.id) {
      audioRef.current?.pause();
      setPlayingMessageId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.src = message.musicUrl;
        audioRef.current.play().catch(e => console.error("Audio play failed:", e));
        setPlayingMessageId(message.id);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleGenerateMusic();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setInspirationAudio(e.target.files[0]);
    }
  };

  if (!currentSession) {
    return (
      <div className="flex h-screen bg-gray-900 text-white items-center justify-center">
        <div className="text-center">
          <Music size={48} className="text-blue-400 mx-auto mb-4" />
          <div className="text-xl">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex h-screen bg-gray-900 text-white overflow-hidden ${className}`}>
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <button
            onClick={createNewSession}
            className="w-full flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            <Plus size={16} />
            New Session
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {sessions.map((session) => (
            <div
              key={session.id}
              className={`p-3 m-2 rounded-lg cursor-pointer transition-colors group ${
                currentSession?.id === session.id 
                  ? 'bg-blue-600/20 border border-blue-500/50' 
                  : 'bg-gray-700/50 hover:bg-gray-600/50'
              }`}
              onClick={() => switchSession(session)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate text-sm">{session.title}</div>
                  <div className="text-xs text-gray-400 mt-1">{session.messages.length} messages</div>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                    <DollarSign size={12} />
                    ${session.totalCost.toFixed(3)}
                  </div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteSession(session.id); }}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded transition-all"
                >
                  <Trash2 size={14} className="text-red-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-700 bg-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <Music className="text-blue-400" />
                Lyria Music Chat
              </h1>
              <p className="text-sm text-gray-400 mt-1">AI-powered music generation • Up to 5 minutes per generation</p>
            </div>
            <button onClick={() => setShowAdvanced(!showAdvanced)} className="p-2 hover:bg-gray-700 rounded-lg transition-colors">
              <Settings size={20} />
            </button>
          </div>
          {showAdvanced && (
            <div className="mt-4 p-4 bg-gray-700/50 rounded-lg border border-gray-600">
              <h3 className="font-medium mb-3">Advanced Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Duration: {targetDuration}s</label>
                  <input type="range" min="30" max="300" step="30" value={targetDuration} onChange={(e) => setTargetDuration(Number(e.target.value))} className="w-full" />
                  <div className="text-xs text-gray-400 mt-1">
                    {Math.floor(targetDuration / 60)}:{(targetDuration % 60).toString().padStart(2, '0')} 
                    (${(targetDuration / 30 * 0.06).toFixed(3)} est. cost)
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Negative Prompt</label>
                  <input type="text" value={negativePrompt} onChange={(e) => setNegativePrompt(e.target.value)} placeholder="e.g., vocals" className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Seed</label>
                  <input type="number" value={seed ?? ''} onChange={(e) => setSeed(e.target.value ? Number(e.target.value) : undefined)} placeholder="Random" className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Temperature: {temperature.toFixed(2)}</label>
                  <input type="range" min="0" max="1.5" step="0.05" value={temperature} onChange={(e) => setTemperature(Number(e.target.value))} className="w-full" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {currentSession.messages.map((message) => (
            <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${message.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-100'}`}>
                <div className="whitespace-pre-wrap">{message.content}</div>
                {message.musicUrl && message.metadata && (
                  <div className="mt-3 p-3 bg-gray-800 rounded-lg border border-gray-600">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <button onClick={() => togglePlayback(message)} className="p-2 bg-blue-600 hover:bg-blue-700 rounded-full transition-colors">
                          {playingMessageId === message.id ? <Pause size={16} /> : <Play size={16} />}
                        </button>
                        <div>
                          <div className="font-medium text-sm">Generated Music ({message.metadata.model})</div>
                          <div className="text-xs text-gray-400 flex items-center gap-3">
                            <span className="flex items-center gap-1"><Clock size={10} />{message.metadata.duration}s</span>
                            <span className="flex items-center gap-1"><DollarSign size={10} />${message.metadata.cost.toFixed(3)}</span>
                          </div>
                        </div>
                      </div>
                      <a href={message.musicUrl} download={`lyria-music-${message.id}.wav`} className="p-1 hover:bg-gray-600 rounded text-xs" title="Download">
                        <Download size={14} />
                      </a>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {['More energetic', 'Add strings', 'Slower tempo', 'More dramatic'].map((variation) => (
                        <button key={variation} onClick={() => generateVariation(message, variation)} disabled={isGenerating} className="px-2 py-1 text-xs bg-gray-600 hover:bg-gray-500 rounded-full transition-colors disabled:opacity-50">
                          {variation}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
          {isGenerating && (
            <div className="flex justify-start">
              <div className="bg-gray-700 rounded-2xl px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="animate-spin"><Music size={16} className="text-blue-400" /></div>
                  <span className="text-gray-300">Generating music...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-gray-700 bg-gray-800">
          {inspirationAudio && (
            <div className="mb-2 flex items-center gap-2 p-2 bg-gray-700 rounded-lg">
              <Paperclip size={16} className="text-blue-400" />
              <span className="text-sm text-gray-300">{inspirationAudio.name}</span>
              <button onClick={() => setInspirationAudio(null)} className="ml-auto p-1 hover:bg-red-500/20 rounded">
                <Trash2 size={14} className="text-red-400" />
              </button>
            </div>
          )}
          <div className="flex gap-3">
            <label className="px-4 py-3 bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-xl transition-colors cursor-pointer flex items-center gap-2">
              <Paperclip size={18} />
              <input type="file" accept="audio/*" onChange={handleFileChange} className="hidden" />
            </label>
            <input type="text" value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyPress={handleKeyPress} placeholder="Describe the music or upload inspiration..." disabled={isGenerating} className="flex-1 px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 text-white placeholder-gray-400" />
            <button onClick={handleGenerateMusic} disabled={(!inputText.trim() && !inspirationAudio) || isGenerating} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors flex items-center gap-2">
              {isGenerating ? <RefreshCw size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {['Peaceful piano melody', 'Epic orchestral piece', 'Jazz improvisation', 'Ambient soundscape', 'Cinematic score'].map((prompt) => (
              <button key={prompt} onClick={() => setInputText(prompt)} disabled={isGenerating} className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 rounded-full transition-colors disabled:opacity-50">
                {prompt}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Hidden Audio Element */}
      <audio ref={audioRef} onEnded={() => setPlayingMessageId(null)} onError={() => setPlayingMessageId(null)} />
    </div>
  );
};

export default ChatMusicGenerator;