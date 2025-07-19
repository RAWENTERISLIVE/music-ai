import React, { useState } from 'react';
import { aiService, type MusicGenerationRequest } from '../services/aiService';

const MusicGenerator: React.FC = () => {
  const [textInput, setTextInput] = useState('');
  const [inspirationMusic, setInspirationMusic] = useState<File | null>(null);
  const [generatedMusic, setGeneratedMusic] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Advanced options like Suno AI
  const [genre, setGenre] = useState('');
  const [mood, setMood] = useState('');
  const [tempo, setTempo] = useState('medium');
  const [duration, setDuration] = useState(120);
  const [vocals, setVocals] = useState<'male' | 'female' | 'none'>('none');
  const [style, setStyle] = useState('');
  const [energy, setEnergy] = useState<'low' | 'medium' | 'high'>('medium');
  const [structure, setStructure] = useState('verse-chorus-verse');
  const [key, setKey] = useState('');
  const [instrumentalOnly, setInstrumentalOnly] = useState(false);
  const [lyricsStyle, setLyricsStyle] = useState('');
  const [customInstructions, setCustomInstructions] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleGenerateMusic = async () => {
    if (!textInput) {
      setError('Please provide a text description for your music.');
      return;
    }

    setIsLoading(true);
    setGeneratedMusic(null);
    setError(null);

    const request: MusicGenerationRequest = {
      textPrompt: textInput,
      inspirationFile: inspirationMusic || undefined,
      genre: genre || undefined,
      mood: mood || undefined,
      tempo,
      duration,
      vocals,
      style: style || undefined,
      energy,
      structure,
      key: key || undefined,
      instrumentalOnly,
      lyricsStyle: lyricsStyle || undefined,
      customInstructions: customInstructions || undefined,
    };

    try {
      const response = await aiService.generateMusic(request);
      
      if (response.success && response.musicUrl) {
        setGeneratedMusic(response.musicUrl);
        setError(null);
        
        // Log information about concatenated audio
        if (response.metadata?.concatenated && response.metadata?.segments > 1) {
          console.log(`🎵 Successfully generated ${response.metadata.segments}-part song (${response.metadata.duration}s total)`);
        }
      } else {
        // Handle specific error types with helpful feedback
        if (response.metadata?.errorType === 'CONTENT_BLOCKED') {
          const suggestions = response.metadata.suggestions || [];
          const errorMessage = `${response.error}\n\nSuggestions:\n${suggestions.map(s => `• ${s}`).join('\n')}`;
          setError(errorMessage);
        } else if (response.metadata?.errorType === 'SERVICE_UNAVAILABLE') {
          setError(response.error || 'The music generation service is temporarily unavailable. Please try again later.');
        } else {
          setError(response.error || 'Failed to generate music');
        }
      }
    } catch (error) {
      console.error('Error generating music:', error);
      setError('An error occurred while generating music. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white text-center">
        AI Music Generator
      </h1>
      <p className="text-gray-600 dark:text-gray-300 mb-8 text-center">
        Create professional-quality music with advanced AI customization
      </p>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Main Content */}
        <div className="space-y-6">
          <div>
            <label htmlFor="text-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Music Description *
            </label>
            <textarea
              id="text-input"
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white resize-none"
              rows={4}
              placeholder="Describe your music (e.g., 'An upbeat electronic dance track with heavy bass and synth melodies')"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
            />
          </div>
          
          <div>
            <label htmlFor="inspiration-music" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Inspiration Music File (Optional)
            </label>
            <input
              id="inspiration-music"
              type="file"
              accept="audio/*"
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              onChange={(e) => setInspirationMusic(e.target.files ? e.target.files[0] : null)}
            />
            {inspirationMusic && (
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Selected: {inspirationMusic.name}
              </p>
            )}
          </div>

          {/* Quick Settings */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Genre
              </label>
              <input
                type="text"
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Pop, Rock, Electronic..."
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Mood
              </label>
              <input
                type="text"
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Happy, Dark, Energetic..."
                value={mood}
                onChange={(e) => setMood(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 rounded-md">
              <div className="whitespace-pre-line">{error}</div>
            </div>
          )}
          
          <button
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold py-3 px-6 rounded-md transition duration-200 flex items-center justify-center"
            onClick={handleGenerateMusic}
            disabled={isLoading || !textInput}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating Music...
              </>
            ) : (
              '🎵 Generate Music'
            )}
          </button>
          
          {generatedMusic && (
            <div className="mt-6 p-4 bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-md">
              <h2 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-3">
                Generated Music:
              </h2>
              <audio 
                controls 
                src={generatedMusic} 
                className="w-full"
                preload="metadata"
              />
              <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                � Your AI-generated music is ready! This includes all segments seamlessly merged into one audio file.
              </p>
            </div>
          )}
        </div>

        {/* Advanced Settings Panel */}
        <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">
              Advanced Settings
            </h2>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              {showAdvanced ? 'Hide' : 'Show'} Advanced
            </button>
          </div>

          <div className="space-y-4">
            {/* Tempo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tempo
              </label>
              <select
                value={tempo}
                onChange={(e) => setTempo(e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="slow">Slow (60-80 BPM)</option>
                <option value="medium">Medium (90-120 BPM)</option>
                <option value="fast">Fast (130-160 BPM)</option>
                <option value="very-fast">Very Fast (170+ BPM)</option>
              </select>
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Duration: {duration}s
              </label>
              <input
                type="range"
                min="30"
                max="300"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>30s</span>
                <span>5min</span>
              </div>
            </div>

            {/* Energy */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Energy Level
              </label>
              <select
                value={energy}
                onChange={(e) => setEnergy(e.target.value as 'low' | 'medium' | 'high')}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="low">Low - Chill & Relaxed</option>
                <option value="medium">Medium - Balanced</option>
                <option value="high">High - Energetic & Intense</option>
              </select>
            </div>

            {/* Vocals */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Vocals
              </label>
              <select
                value={vocals}
                onChange={(e) => setVocals(e.target.value as 'male' | 'female' | 'none')}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="none">Instrumental Only</option>
                <option value="male">Male Vocals</option>
                <option value="female">Female Vocals</option>
              </select>
            </div>

            {showAdvanced && (
              <>
                {/* Style */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Style
                  </label>
                  <input
                    type="text"
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="80s synth, lo-fi, orchestral..."
                    value={style}
                    onChange={(e) => setStyle(e.target.value)}
                  />
                </div>

                {/* Key */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Key
                  </label>
                  <input
                    type="text"
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="C major, A minor, etc."
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                  />
                </div>

                {/* Structure */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Song Structure
                  </label>
                  <select
                    value={structure}
                    onChange={(e) => setStructure(e.target.value)}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="verse-chorus-verse">Verse-Chorus-Verse</option>
                    <option value="intro-verse-chorus-bridge-chorus-outro">Full Song Structure</option>
                    <option value="loop">Continuous Loop</option>
                    <option value="build-drop">Build-Up & Drop (EDM)</option>
                  </select>
                </div>

                {/* Lyrics Style */}
                {vocals !== 'none' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Lyrics Style
                    </label>
                    <input
                      type="text"
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Romantic, narrative, abstract..."
                      value={lyricsStyle}
                      onChange={(e) => setLyricsStyle(e.target.value)}
                    />
                  </div>
                )}

                {/* Instrumental Only Toggle */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="instrumental"
                    checked={instrumentalOnly}
                    onChange={(e) => setInstrumentalOnly(e.target.checked)}
                    className="mr-2"
                  />
                  <label htmlFor="instrumental" className="text-sm text-gray-700 dark:text-gray-300">
                    Force Instrumental Only
                  </label>
                </div>

                {/* Custom Instructions */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Custom Instructions
                  </label>
                  <textarea
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white resize-none"
                    rows={3}
                    placeholder="Additional creative directions..."
                    value={customInstructions}
                    onChange={(e) => setCustomInstructions(e.target.value)}
                  />
                </div>
              </>
            )}
          </div>

          {/* Quick Presets */}
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-md font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Quick Presets
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  setGenre('Pop');
                  setMood('Upbeat');
                  setTempo('medium');
                  setEnergy('high');
                  setVocals('female');
                }}
                className="p-2 text-sm bg-purple-100 hover:bg-purple-200 dark:bg-purple-900 dark:hover:bg-purple-800 rounded text-purple-800 dark:text-purple-200"
              >
                🎤 Pop Hit
              </button>
              <button
                onClick={() => {
                  setGenre('Electronic');
                  setMood('Energetic');
                  setTempo('fast');
                  setEnergy('high');
                  setVocals('none');
                  setStructure('build-drop');
                }}
                className="p-2 text-sm bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800 rounded text-blue-800 dark:text-blue-200"
              >
                🎛️ EDM Banger
              </button>
              <button
                onClick={() => {
                  setGenre('Ambient');
                  setMood('Peaceful');
                  setTempo('slow');
                  setEnergy('low');
                  setVocals('none');
                }}
                className="p-2 text-sm bg-green-100 hover:bg-green-200 dark:bg-green-900 dark:hover:bg-green-800 rounded text-green-800 dark:text-green-200"
              >
                🌙 Chill Vibes
              </button>
              <button
                onClick={() => {
                  setGenre('Rock');
                  setMood('Powerful');
                  setTempo('fast');
                  setEnergy('high');
                  setVocals('male');
                }}
                className="p-2 text-sm bg-red-100 hover:bg-red-200 dark:bg-red-900 dark:hover:bg-red-800 rounded text-red-800 dark:text-red-200"
              >
                🎸 Rock Anthem
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MusicGenerator;
