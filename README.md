# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

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
