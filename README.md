# 🎵 AI Music Generation Platform

A sophisticated **AI-powered music generation platform** built with React, TypeScript, and Node.js. Generate professional-quality instrumental music using Google's Lyria-002 model through an intuitive interface with advanced controls and multi-segment audio concatenation.

![Powered by Lyria-002](https://img.shields.io/badge/Powered%20by-Google%20Lyria--002-4285F4?style=for-the-badge&logo=google)
![React](https://img.shields.io/badge/React-18+-61DAFB?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=for-the-badge&logo=typescript)
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=nodedotjs)

## ✨ Key Features

### 🎼 **Professional Music Generation**
- **Google Lyria-002 Integration**: State-of-the-art AI model for high-quality instrumental music
- **48kHz WAV Output**: Professional studio-grade audio quality
- **Multi-Genre Support**: Classical, jazz, orchestral, ambient, cinematic, and more
- **SynthID Watermarking**: Built-in authenticity verification

### 🎛️ **Advanced Audio Controls**
- **Extended Duration**: Generate up to 5 minutes (300 seconds) of continuous music
- **Multi-Segment Generation**: Automatically creates and concatenates 30-second segments
- **Structured Prompts**: Support for complex multi-part compositions (verse, chorus, bridge)
- **Negative Prompting**: Exclude unwanted elements from your music
- **Seed-Based Reproducibility**: Consistent results with optional seed values
- **Temperature Control**: Fine-tune creativity vs. consistency (0.1 - 2.0)

### 🔧 **Smart Audio Processing**
- **Server-Side Concatenation**: Seamlessly merges multiple segments into single audio files
- **WAV File Optimization**: Automatic header updates for proper playback
- **Error Handling**: Intelligent fallbacks and detailed error messages
- **Content Safety**: Built-in artist reference detection and content filtering

### 💬 **Chat-Based Interface**
- **Conversational Music Creation**: Natural language interaction for music requests
- **Session Management**: Multiple chat sessions with full conversation history
- **Context Awareness**: AI understands your musical preferences over time
- **Iteration Support**: Easily modify, extend, or create variations

## 🏗️ Architecture

### Frontend (React + TypeScript)
- **Modern UI Components**: Clean, responsive interface with Tailwind CSS
- **Advanced Form Controls**: Comprehensive music generation parameters
- **Real-Time Audio Playback**: Integrated audio player with progress tracking
- **Error Handling**: User-friendly error messages with actionable suggestions

### Backend (Node.js + Express)
- **Google Cloud Integration**: Vertex AI API communication with service account authentication
- **Audio Processing**: Server-side WAV concatenation and optimization
- **API Rate Limiting**: Intelligent request handling and quota management
- **Structured Prompt Parsing**: Support for complex multi-part song structures

### AI Services Integration
- **Lyria-002 API**: Direct integration with Google's music generation model
- **Gemini AI**: Intelligent prompt optimization and recommendations
- **Multiple Model Support**: Extensible architecture for additional AI models

## 🚀 Quick Start

### Prerequisites
- **Node.js 18+** - [Download](https://nodejs.org/)
- **Google Cloud Platform Account** - [Setup Guide](https://cloud.google.com/gcp/getting-started)
- **Vertex AI API Enabled** - [Enable API](https://console.cloud.google.com/flows/enableapi?apiid=aiplatform.googleapis.com)
- **Gemini API Key** - [Get API Key](https://aistudio.google.com/app/apikey)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/RAWENTERISLIVE/music-ai.git
   cd music-ai
   ```

2. **Install frontend dependencies**
   ```bash
   npm install
   ```

3. **Install server dependencies**
   ```bash
   cd server
   npm install
   cd ..
   ```

4. **Configure environment variables**
   
   Create `.env` in the root directory:
   ```env
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   VITE_VERTEX_AI_PROJECT_ID=your_gcp_project_id
   VITE_VERTEX_AI_LOCATION=us-central1
   ```

   Create `server/.env`:
   ```env
   PORT=3001
   VITE_VERTEX_AI_PROJECT_ID=your_gcp_project_id
   VITE_VERTEX_AI_LOCATION=us-central1
   ```

5. **Set up Google Cloud authentication**
   ```bash
   # Place your service account key in server/service-account-key.json
   # OR use Application Default Credentials:
   gcloud auth application-default login
   ```

6. **Start the development servers**
   ```bash
   # Terminal 1: Start backend server
   cd server
   npm start

   # Terminal 2: Start frontend development server
   npm run dev
   ```

7. **Open your browser**
   Navigate to `http://localhost:5173`

## 🎯 Usage Examples

### Basic Music Generation
```text
Create a peaceful piano melody with gentle dynamics
```

### Advanced Structured Prompts
```text
Part 1 (0:00 - 0:30) - Intro
Prompt: Delicate fingerpicked acoustic guitar with soft strings

Part 2 (0:30 - 1:00) - Build
Prompt: Add drums and bass, building energy progressively

Part 3 (1:00 - 1:30) - Climax  
Prompt: Full orchestral arrangement with powerful brass section
```

### Negative Prompting
```text
Prompt: Epic cinematic orchestral piece
Negative Prompt: electronic, vocals, distorted guitar, lo-fi
```

## 🛠️ Development

### Project Structure
```
music-ai/
├── src/                    # Frontend React application
│   ├── components/         # React components
│   ├── services/          # API services and utilities
│   └── assets/            # Static assets
├── server/                # Backend Node.js server
│   ├── index.js          # Main server file
│   └── package.json      # Server dependencies
├── public/               # Static public files
└── docs/                # Documentation files
```

### Key Technologies
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **Backend**: Node.js, Express, Multer
- **AI Integration**: Google Vertex AI, Gemini API
- **Audio Processing**: Custom WAV concatenation
- **Authentication**: Google Cloud Service Accounts

## 🎼 Advanced Features

### Multi-Segment Audio Generation
The platform automatically handles long-form music generation by:
1. Splitting requests into 30-second segments (Lyria-002 limit)
2. Generating each segment with appropriate continuation prompts
3. Server-side concatenation into seamless audio files
4. Proper WAV header management for optimal playback

### Intelligent Error Handling
- **Artist Reference Detection**: Prevents copyright issues
- **Content Safety Filtering**: Automatic prompt sanitization  
- **Service Availability**: Graceful handling of API downtime
- **Quota Management**: Smart rate limiting and cost estimation

### Cost Optimization
- **Transparent Pricing**: $0.06 per 30-second segment
- **Duration Controls**: Prevent accidental over-generation
- **Smart Segmentation**: Efficient use of API calls
- **Batch Processing**: Optimal request grouping

## 📊 Performance & Limitations

### Capabilities
- ✅ **Maximum Duration**: 5 minutes (300 seconds)
- ✅ **Audio Quality**: 48kHz WAV, professional grade
- ✅ **Concurrent Users**: Scalable architecture
- ✅ **Response Time**: 10-20 seconds per 30s segment

### Current Limitations
- ⚠️ **Instrumental Only**: No vocal generation (Lyria-002 limitation)
- ⚠️ **English Prompts**: US English prompts only
- ⚠️ **30s Segments**: Individual segments limited to 30 seconds
- ⚠️ **Google Cloud Dependency**: Requires GCP setup and billing

## 🔒 Security

- **Service Account Authentication**: Secure Google Cloud API access
- **Content Filtering**: Built-in safety checks and artist reference blocking
- **Environment Variables**: Secure credential management
- **CORS Configuration**: Controlled cross-origin access

## 🧪 Testing

Run the test suite:
```bash
npm test
```

For server tests:
```bash
cd server
npm test
```

## 📋 API Documentation

### Generate Music Endpoint
```http
POST /api/generate-music
Content-Type: multipart/form-data

Parameters:
- prompt (string): Music description
- duration (number): Duration in seconds (30-300)
- negativePrompt (string, optional): Elements to exclude
- seed (number, optional): For reproducible results
- temperature (number, optional): Creativity control (0.1-2.0)
- inspirationAudio (file, optional): Reference audio file
```

### Response Format
```json
{
  "success": true,
  "fullAudioUrl": "data:audio/wav;base64,..",
  "audioSegments": [...],
  "metadata": {
    "duration": 180,
    "segments": 6,
    "cost": 0.36,
    "concatenated": true
  }
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Google DeepMind** - Lyria-002 music generation model
- **Google Cloud** - Vertex AI platform and infrastructure
- **React Team** - Frontend framework
- **Vite** - Build tool and development server

## 📞 Support

For support, email [your-email] or create an issue in this repository.

---

**Built with ❤️ for musicians, creators, and AI enthusiasts**

# 🎵 AI Music Chat Generator

A sophisticated **chat-based AI music generation platform** powered by Google's Lyria-002 and multiple cutting-edge AI music models. Generate up to **5 minutes** of professional instrumental music through intuitive conversation, with iterative improvements, variations, and seamless extension capabilities.

## ✨ Key Features

### 🗣️ **Chat-Based Music Generation**
- **Conversational Interface**: Natural language music requests with context awareness
- **Session Management**: Multiple chat sessions with full conversation history
- **Iterative Improvements**: Ask for modifications, variations, and enhancements
- **Context-Aware Prompts**: AI understands your musical preferences over time

### � **Extended Music Generation (Up to 5 Minutes)**
- **Seamless Segments**: Automatically creates 30-second segments that flow together
- **Progressive Composition**: Intro → Development → Climax → Resolution structure
- **Cost Optimization**: Transparent pricing ($0.06 per 30-second segment)
- **Professional Quality**: 48kHz WAV output with studio-grade audio

### 🔄 **Music Variation System**
- **One-Click Variations**: Instantly create energetic, contemplative, or orchestral versions
- **Custom Modifications**: "Make it more dynamic", "Add strings", "Slower tempo"
- **Version Control**: Track all variations with parent-child relationships
- **Seed-Based Reproducibility**: Consistent results with optional seed values

### 🎛️ **Advanced Controls**
- **Duration Control**: 30 seconds to 5 minutes (300 seconds)
- **Negative Prompting**: Exclude unwanted elements (vocals, electronic sounds)
- **Temperature Settings**: Control creativity vs. consistency (0.1 - 2.0)
- **Real-time Cost Estimation**: Know costs before generation

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Google Cloud Platform account
- Vertex AI API enabled
- Gemini API key

### 1. Clone and Install

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
