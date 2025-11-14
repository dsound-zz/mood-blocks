🎨 MoodBlocks
=============

**A tiny server-driven generative mood visualizer.**Users answer _“How are you?”_ and the backend creates a visual + audio experience based on emotion.The UI is fully driven by JSON from an AI model.

🌈 What is MoodBlocks?
----------------------

MoodBlocks is a small experiment that mixes:

*   **Next.js + server-driven components**
    
*   **AI-generated UI parameters**
    
*   **Canvas and CSS animations**
    
*   **Binaural audio synthesis**
    
*   **Emotion-based design**
    

The user enters how they’re feeling.The server interprets the mood using an LLM and returns a schema that describes:

*   a color palette
    
*   an animation effect (gradient, splatter, pulse, haze, particles, ripple)
    
*   an intensity level
    
*   an audio experience (sine tone or binaural beat)
    

The frontend renders a full-screen “mood block” that reacts to the schema.

This project is intentionally small, experimental, and expressive — like a design toy you can build on.

🚀 Demo Flow
------------

1.  App asks: **“How are you?”**
    
2.  User types “anxious”, “happy”, “tired”, “calm”, etc.
    
3.  Client POSTs mood → /api/mood
    
4.  Server calls an LLM prompt that returns:
    

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   {    "type": "mood_display",    "color": "#4A6CF7",    "effect": "pulse",    "intensity": 0.7,    "sound": {      "type": "binaural",      "leftHz": 4,      "rightHz": 6,      "volume": 0.6    }  }   `

1.  The renderer interprets that JSON and builds the visual/sound experience.
    
2.  User sees drifting gradients, pulsing circles, fog haze, splatter art, or soft particles.
    
3.  If the sound is binaural, an informational overlay explains how it works.
    
4.  User presses **End** to return to the mood prompt.
    

🧠 Key Concept: Server-Driven UI
--------------------------------

The AI **doesn’t generate components or code**.Instead, it returns a small **schema** that describes what to render.

The UI is just a renderer that takes JSON → visual/audio.

This keeps the system safe, predictable, and extendable.

🧩 The Schema (DSL)
-------------------

app/types/schema.ts:

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   export type MoodComponentSchema = {    type: "mood_display";    color: string;    effect: "gradient" | "splatter" | "pulse" | "haze" | "particles" | "ripple";    intensity: number; // 0–1    sound: {      type: "none" | "sine" | "binaural";      leftHz?: number;      rightHz?: number;      volume?: number; // 0–1    };  };   `

This JSON completely defines the animation and sound.

🧬 Technologies Used
--------------------

### **Frontend**

*   **React** (Next.js client components)
    
*   **CSS keyframe animations** (gradient drift, pulse, haze, ripple)
    
*   **HTML5 Canvas** (splatter, particles)
    
*   **State-driven rendering** from schema
    
*   **Layered DOM effects**
    
*   **Floating info overlays** for binaural beats
    

### **Audio**

*   **Web Audio API**
    
    *   OscillatorNode
        
    *   GainNode
        
    *   ChannelMergerNode
        
    *   Custom fade-in/fade-out
        
    *   Gesture-unlocked AudioContext
        

Binaural beats are rendered using:

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   leftFrequency  = carrier + leftHz  rightFrequency = carrier + rightHz   `

Where carrier = 200 Hz for audible output.

### **Backend**

*   **Next.js API Routes**
    
*   **LLM inference (OpenAI or Anthropic)**
    
*   **Server-driven schema generation**
    

🎧 Why Some Beats Are Felt, Not Heard
-------------------------------------

If the schema returns:

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   leftHz: 4  rightHz: 6   `

These are _below_ human hearing range — but the brain perceives the **difference** (2 Hz) as a rhythmic neural pattern.

This is why the app displays:

> “Your ears can’t hear this frequency, but your brain does. Best with headphones.”

The app automatically converts these into audible carriers (204 Hz vs 206 Hz), while preserving the beat difference.

✨ Visual Effects
----------------

Each effect is a separate component:

### **Gradient**

*   Soft drifting radial gradients
    
*   Mood-friendly, calming
    

### **Splatter**

*   Generative canvas art
    
*   Great for energetic moods
    

### **Pulse**

*   Breathing circle animation
    
*   Grounding + meditative
    

### **Haze**

*   Blurred fog layers
    
*   Reflective or melancholic moods
    

### **Particles**

*   Upward drifting spark dots
    
*   Hopeful or energetic
    

### **Ripple**

*   Concentric water-like ripples
    
*   Good for anxiety / grounding
    

Intensity controls speed, opacity, and number of elements.

🧭 File Structure
-----------------

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   app/    api/      mood/        route.ts          # LLM call → schema    components/      MoodRenderer.tsx    # visual/audio renderer      BinauralInfoOverlay.tsx      effects/        Gradient.tsx        Splatter.tsx        Pulse.tsx        Haze.tsx        Particles.tsx        Ripple.tsx    types/      schema.ts    utils/      sound.ts            # Web Audio engine   `

🏗 How It Works (High-Level Architecture)
-----------------------------------------

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   User → "How are you?"            ↓       /api/mood            ↓    LLM returns JSON schema            ↓    MoodRenderer(schema)            ↓    • Background color    • Visual effect    • Sound synthesis    • Binaural overlay (if needed)            ↓         Experience            ↓        End → reset   `

🛠 Running the Project
----------------------

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   npm install  npm run dev   `

Create .env.local with your AI provider key:

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   OPENAI_API_KEY=xxxx   `

Visit:

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   http://localhost:3000   `

🔮 Future Ideas
---------------

*   Shader-based nebula cloud
    
*   Touch-reactive ripples
    
*   Mood journaling
    
*   Soundscapes (rain, wind, soft pads)
    
*   A “compose your own mood block” mode
    
*   Export mood blocks as GIF/video
    

❤️ Why This Exists
------------------

This app is meant to explore a simple idea:

> _What happens when feelings generate art?_

MoodBlocks mixes creativity, emotion, animation, and sound in a way that’s easy to extend and fun to build on.It’s a playground for experimenting with AI-driven design and browser-native generative effects.