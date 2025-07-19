require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const { exec } = require('child_process');
const fs = require('fs');
const { promisify } = require('util');
const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);

const app = express();
const port = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

// Serve static files from the server directory
app.use(express.static(path.join(__dirname, '.')));

const upload = multer({ storage: multer.memoryStorage() });

// --- Google API Communication ---
async function getAccessToken() {
  try {
    console.log('Attempting to authenticate with Google Cloud...');
    
    // Try to use service account key file if available
    const fs = require('fs');
    const serviceKeyPath = path.join(__dirname, 'service-account-key.json');
    
    if (fs.existsSync(serviceKeyPath)) {
      console.log('Using service account key file for authentication');
      const { GoogleAuth } = require('google-auth-library');
      const auth = new GoogleAuth({
        keyFile: serviceKeyPath,
        scopes: ['https://www.googleapis.com/auth/cloud-platform']
      });
      
      const authClient = await auth.getClient();
      const tokenResponse = await authClient.getAccessToken();
      console.log('Access token obtained successfully via service account');
      return tokenResponse.token;
    }
    
    // Try application default credentials
    console.log('Attempting to use Application Default Credentials');
    const { GoogleAuth } = require('google-auth-library');
    const auth = new GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/cloud-platform']
    });
    
    const authClient = await auth.getClient();
    const tokenResponse = await authClient.getAccessToken();
    console.log('Access token obtained successfully via ADC');
    return tokenResponse.token;
    
  } catch (error) {
    console.error('Authentication failed:', error.message);
    throw new Error('Failed to authenticate with Google Cloud. Please set up service account credentials or ADC.');
  }
}

async function sendRequestToGoogleApi(apiEndpoint, data) {
  try {
    const accessToken = await getAccessToken();
    const https = require('https');
    const url = require('url');
    
    const parsedUrl = url.parse(apiEndpoint);
    const postData = JSON.stringify(data);
    
    console.log('Making API request to:', apiEndpoint);
    console.log('Request payload:', JSON.stringify(data, null, 2));
    
    return new Promise((resolve, reject) => {
      const options = {
        hostname: parsedUrl.hostname,
        port: 443,
        path: parsedUrl.path,
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const req = https.request(options, (res) => {
        let responseBody = '';
        
        res.on('data', (chunk) => {
          responseBody += chunk;
        });
        
        res.on('end', () => {
          try {
            console.log(`API response status: ${res.statusCode}`);
            if (res.statusCode >= 200 && res.statusCode < 300) {
              const jsonResponse = JSON.parse(responseBody);
              console.log('API request successful');
              resolve(jsonResponse);
            } else {
              console.error(`API request failed with status ${res.statusCode}: ${responseBody}`);
              reject(new Error(`API request failed with status ${res.statusCode}: ${responseBody}`));
            }
          } catch (parseError) {
            console.error('Failed to parse API response:', parseError.message);
            reject(new Error(`Failed to parse response: ${parseError.message}`));
          }
        });
      });

      req.on('error', (error) => {
        console.error('Request failed:', error.message);
        reject(new Error(`Request failed: ${error.message}`));
      });

      req.write(postData);
      req.end();
    });
    
  } catch (error) {
    console.error('Error sending request to Google API:', error);
    throw error;
  }
}
// --- End Google API Communication ---

function parseStructuredPrompt(prompt) {
  const segmentPrompts = [];
  // Regex to find "Part X ... Prompt: ..." and capture the text until the next "Part" or end of string.
  const regex = /Part \d+.*?Prompt:\s*([\s\S]*?)(?=Part \d+|$)/gi;
  let match;
  while ((match = regex.exec(prompt)) !== null) {
    segmentPrompts.push(match[1].trim());
  }
  return segmentPrompts;
}

// Simple WAV concatenation function
async function concatenateWAVFiles(audioSegments) {
  try {
    console.log(`Starting WAV concatenation for ${audioSegments.length} segments`);
    
    // Convert base64 segments to buffers
    const audioBuffers = [];
    
    for (let i = 0; i < audioSegments.length; i++) {
      const segment = audioSegments[i];
      const base64Data = segment.url.replace(/^data:audio\/wav;base64,/, '');
      const audioBuffer = Buffer.from(base64Data, 'base64');
      audioBuffers.push(audioBuffer);
      console.log(`Segment ${i + 1}: ${audioBuffer.length} bytes`);
    }
    
    // For WAV files, we need to combine the data portions and update the header
    // This is a simplified approach that works for WAV files with the same format
    
    if (audioBuffers.length === 1) {
      return audioBuffers[0];
    }
    
    // Get the first file's header (first 44 bytes for standard WAV)
    const firstBuffer = audioBuffers[0];
    const wavHeader = firstBuffer.subarray(0, 44);
    
    // Extract data portions from all segments (skip the 44-byte header)
    const dataParts = audioBuffers.map(buffer => buffer.subarray(44));
    
    // Calculate total data size
    const totalDataSize = dataParts.reduce((sum, part) => sum + part.length, 0);
    
    // Update the file size in header (bytes 4-7)
    const totalFileSize = 44 + totalDataSize - 8; // Total file size minus 8 bytes
    wavHeader.writeUInt32LE(totalFileSize, 4);
    
    // Update the data chunk size in header (bytes 40-43)
    wavHeader.writeUInt32LE(totalDataSize, 40);
    
    // Create the concatenated buffer
    const concatenatedBuffer = Buffer.concat([wavHeader, ...dataParts]);
    
    console.log(`✅ WAV concatenation complete: ${concatenatedBuffer.length} bytes total`);
    return concatenatedBuffer;
    
  } catch (error) {
    console.error('❌ WAV concatenation failed:', error);
    // Fallback: return the first segment
    const firstSegment = audioSegments[0];
    const base64Data = firstSegment.url.replace(/^data:audio\/wav;base64,/, '');
    return Buffer.from(base64Data, 'base64');
  }
}

app.post('/api/generate-music', upload.single('inspirationAudio'), async (req, res) => {
  try {
    const { prompt, duration, negativePrompt, seed, temperature } = req.body;
    const inspirationFile = req.file;

    console.log('Received music generation request:', {
      prompt,
      duration: duration || 30,
      negativePrompt,
      seed,
      temperature,
      hasInspirationAudio: !!inspirationFile
    });

    // Read project ID from service account key file
    const fs = require('fs');
    const serviceKeyPath = path.join(__dirname, 'service-account-key.json');
    let PROJECT_ID;
    
    if (fs.existsSync(serviceKeyPath)) {
      const serviceAccount = JSON.parse(fs.readFileSync(serviceKeyPath, 'utf8'));
      PROJECT_ID = serviceAccount.project_id;
      console.log('Using project ID from service account key:', PROJECT_ID);
    } else {
      PROJECT_ID = process.env.VITE_VERTEX_AI_PROJECT_ID;
      console.log('Using project ID from environment variable:', PROJECT_ID);
    }
    
    if (!PROJECT_ID) {
      throw new Error('Project ID not found in service account key or environment variables');
    }
    
    const LOCATION = process.env.VITE_VERTEX_AI_LOCATION || 'us-central1';
    const API_ENDPOINT = `https://us-central1-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/us-central1/publishers/google/models/lyria-002:predict`;

    const requestDuration = Math.min(parseInt(duration) || 30, 300);
    
    const isStructuredPrompt = /Part \d+.*?Prompt:/i.test(prompt);
    const segmentPrompts = isStructuredPrompt ? parseStructuredPrompt(prompt) : [];
    const numSegments = isStructuredPrompt && segmentPrompts.length > 0 ? segmentPrompts.length : Math.ceil(requestDuration / 30);
    const segmentDuration = isStructuredPrompt && segmentPrompts.length > 0 ? requestDuration / numSegments : 30;

    try {
      console.log(`Generating ${numSegments} segments of ~${Math.round(segmentDuration)}s each for total duration of ${requestDuration}s`);
      
      const audioSegments = [];
      let concatenatedAudioData = null; // This will store the final concatenated audio
      
      for (let i = 0; i < numSegments; i++) {
        const segmentStartTime = i * segmentDuration;
        const actualSegmentDuration = (i === numSegments - 1) ? requestDuration - segmentStartTime : segmentDuration;
        const segmentEndTime = segmentStartTime + actualSegmentDuration;

        let enhancedPrompt;
        let originalSegmentPrompt;

        if (isStructuredPrompt) {
          originalSegmentPrompt = segmentPrompts[i] || `Continue the musical piece in the same style.`;
          enhancedPrompt = originalSegmentPrompt; // For structured prompts, use them as-is
        } else if (i > 0) {
          originalSegmentPrompt = prompt;
          enhancedPrompt = `Continue the musical piece: ${prompt}. Maintain the same style, tempo, and key signature for seamless continuation.`;
        } else {
          originalSegmentPrompt = prompt;
          enhancedPrompt = `High-quality professional recording: ${prompt}. Rich instrumentation, clear sound, studio quality.`;
        }
        
        // Validate and truncate prompt if too long (Lyria API limit: 2000 characters)
        const MAX_PROMPT_LENGTH = 2000;
        if (enhancedPrompt.length > MAX_PROMPT_LENGTH) {
          console.log(`⚠️ Prompt for segment ${i + 1} is too long (${enhancedPrompt.length} chars), truncating to ${MAX_PROMPT_LENGTH} chars`);
          enhancedPrompt = enhancedPrompt.substring(0, MAX_PROMPT_LENGTH - 3) + '...';
        }
        
        const instances = [{
          prompt: enhancedPrompt,
          negative_prompt: negativePrompt || 'low quality, distorted, noise, static, poor audio quality',
          duration: Math.round(actualSegmentDuration),
          seed: seed ? parseInt(seed) + i : undefined,
          temperature: temperature ? parseFloat(temperature) : 0.7,
        }];
        
        const parameters = {};
        const requestData = { instances, parameters };

        console.log(`Generating segment ${i + 1}/${numSegments} (${segmentStartTime}s-${segmentEndTime}s)`);
        console.log('Sending request to Lyria API Endpoint:', API_ENDPOINT);
        console.log('Request data:', JSON.stringify(requestData, null, 2));

        const result = await sendRequestToGoogleApi(API_ENDPOINT, requestData);
        
        console.log(`Received response for segment ${i + 1}.`);

        if (!result.predictions || result.predictions.length === 0) {
          throw new Error(`No predictions received from Lyria API for segment ${i + 1}`);
        }

        const audioData = result.predictions[0].bytesBase64Encoded;
        
        if (!audioData) {
          throw new Error(`No audio data found in the API response for segment ${i + 1}`);
        }
        
        const audioUrl = `data:audio/wav;base64,${audioData}`;
        console.log(`Successfully decoded audio data for segment ${i + 1}.`);
        
        audioSegments.push({
          url: audioUrl,
          startTime: segmentStartTime,
          endTime: segmentEndTime,
          prompt: originalSegmentPrompt,
          seamlessTransition: i > 0
        });
      }
      
      // After all segments are generated, concatenate them into a single audio file
      console.log('🔄 Concatenating all audio segments...');
      const concatenatedBuffer = await concatenateWAVFiles(audioSegments);
      concatenatedAudioData = concatenatedBuffer.toString('base64');
      console.log('✅ Audio concatenation completed');
      
      const response = {
        success: true,
        fullAudioUrl: `data:audio/wav;base64,${concatenatedAudioData}`,
        audioSegments: audioSegments,
        metadata: {
          duration: requestDuration,
          model: 'lyria-002',
          prompt: prompt,
          negativePrompt: negativePrompt,
          seed: seed ? parseInt(seed) : Math.floor(Math.random() * 100000),
          version: 1,
          cost: (requestDuration / 30) * 0.08,
          segments: numSegments,
          segmentDuration: segmentDuration,
          concatenated: true, // Flag to indicate this is a concatenated multi-segment audio
          totalSize: concatenatedBuffer.length
        },
        suggestions: [
          "Try more specific musical terms (e.g., 'cinematic orchestral suite', 'heroic brass fanfare')",
          "Add tempo descriptors ('allegro', 'andante', 'presto')",  
          "Specify instruments ('full symphony orchestra', 'piano and strings', 'brass ensemble')",
          "Include mood descriptors ('triumphant', 'mysterious', 'uplifting', 'dramatic')",
          "Use professional terminology ('crescendo', 'fortissimo', 'legato')"
        ],
        continuationPrompts: [
          "Add dramatic crescendo and powerful brass section",
          "Include soaring violin melodies and timpani rolls", 
          "Build to an epic finale with full orchestra",
          "Add heroic themes with French horns and trumpets",
          "Create cinematic tension with rising dynamics"
        ]
      };

      console.log('Successfully processed music generation request.');
      res.status(200).json(response);

    } catch (apiError) {
      console.error('Lyria API Error:', apiError.message);
      
      // Check if it's a recitation/content safety error
      if (apiError.message.includes('recitation checks') || 
          apiError.message.includes('All responses were blocked') ||
          apiError.message.includes('blocked by recitation') ||
          apiError.message.includes('content safety')) {
        console.log('Content safety block detected - returning structured error response');
        return res.status(400).json({
          success: false,
          errorType: 'CONTENT_BLOCKED',
          error: 'Your prompt was blocked by content safety filters. This can happen when the prompt might generate music too similar to existing copyrighted works.',
          message: 'Your prompt was blocked by content safety filters. This can happen when the prompt might generate music too similar to existing copyrighted works. Try rephrasing your prompt to be more unique and creative.',
          suggestions: [
            'Try "cinematic orchestral composition" instead of "epic orchestral piece"',
            'Use specific instruments: "brass fanfare with timpani" or "string quartet with piano"',
            'Add technical terms: "allegro symphonic movement" or "dramatic crescendo with full orchestra"',
            'Focus on mood: "triumphant heroic theme" or "mysterious atmospheric soundscape"',
            'Avoid generic phrases - be more creative and specific with your descriptions',
            'Try "grand symphonic overture" or "powerful orchestral suite" instead'
          ],
          userPrompt: prompt
        });
      }
      
      // Check if it's a quota/authentication error
      if (apiError.message.includes('quota') || 
          apiError.message.includes('PERMISSION_DENIED') ||
          apiError.message.includes('exceeded') ||
          apiError.message.includes('rate limit')) {
        console.log('Service unavailable detected - returning structured error response');
        return res.status(503).json({
          success: false,
          errorType: 'SERVICE_UNAVAILABLE',
          error: 'The music generation service is temporarily unavailable.',
          message: 'The music generation service is temporarily unavailable. Please try again later.',
          userPrompt: prompt
        });
      }
      
      // For other API errors, return a generic error
      if (apiError.message.includes('status 4') || 
          apiError.message.includes('400') ||
          apiError.message.includes('INVALID_ARGUMENT')) {
        
        // Check for artist references, which often cause INVALID_ARGUMENT errors
        const artistPatterns = [
          /in the style of ([\w\s]+)/i,
          /by ([\w\s]+)/i,
          /sounds like ([\w\s]+)/i,
          /a mix of ([\w\s]+) and ([\w\s]+)/i,
          /inspired by ([\w\s]+)/i,
          /Ed Sheeran/i, /Taylor Swift/i, /The Beatles/i, /John Williams/i // Add common examples
        ];

        if (artistPatterns.some(pattern => pattern.test(prompt))) {
          console.log('Artist reference detected in prompt - returning specific content policy error');
          return res.status(400).json({
            success: false,
            errorType: 'ARTIST_REFERENCE_BLOCKED',
            error: 'Your prompt was blocked because it referenced a specific artist.',
            message: 'Prompts containing references to specific artists (e.g., "in the style of Ed Sheeran") are not allowed to protect artist rights. Please remove the artist\'s name and describe the musical style instead.',
            suggestions: [
              'Instead of "in the style of Ed Sheeran", try "modern acoustic pop with heartfelt lyrics and intricate guitar".',
              'Describe the instrumentation, tempo, and mood of the music you want.',
              'Focus on musical characteristics rather than artist names.'
            ],
            userPrompt: prompt
          });
        }

        console.log('Generation failed detected - returning structured error response');
        return res.status(400).json({
          success: false,
          errorType: 'GENERATION_FAILED',
          error: 'Music generation failed.',
          message: 'Music generation failed. Please try a different prompt or adjust your parameters.',
          suggestions: [
            'Try simplifying your prompt',
            'Reduce the duration if it\'s very long',
            'Check your temperature setting (0.1-1.0)',
            'Try a different creative approach'
          ],
          userPrompt: prompt
        });
      }
      
      console.log('Unexpected API error - returning structured error response instead of test tone fallback.');
      
      // Return a structured error for any remaining unexpected errors
      return res.status(500).json({
        success: false,
        errorType: 'UNEXPECTED_ERROR',
        error: 'An unexpected error occurred during music generation.',
        message: `Music generation failed due to an unexpected error: ${apiError.message}`,
        userPrompt: prompt
      });
    }

  } catch (error) {
    console.error('Error generating music:', error);
    res.status(500).json({ 
      success: false,
      errorType: 'SERVER_ERROR',
      error: 'Failed to generate music: ' + error.message,
      message: 'A server error occurred while processing your request.',
      metadata: {
        duration: 0,
        model: 'lyria-002 (error)',
        prompt: req.body.prompt || '',
        cost: 0,
        version: 0,
      }
    });
  }
});

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'Server is running', timestamp: new Date().toISOString() });
});

app.listen(port, () => {
  console.log(`🎵 Music AI Server listening on port ${port}`);
  console.log(`📊 Health check: http://localhost:${port}/api/health`);
});
