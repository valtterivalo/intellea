**Project Design Document: Interactive LLM-Based Learning Interface**

---

### **Project Title:**
**Intellea**

---

### **1. Purpose & Vision**
Modern chat-based LLM interfaces are poorly suited for learning and comprehension, especially for neurodivergent users or those who struggle with reading long blocks of text. *Intellea* aims to replace the wall-of-text output with a visually interactive, **dynamically expanding 3D knowledge graph** and complementary components, creating a learning environment that improves understanding, retention, and usability.

We aren't building a dev tool. We're building an **AI-assisted thinking and learning interface**, designed for people who want to intuitively grasp complex topics by exploring structured information visually, rather than parsing verbose LLM outputs.

---

### **2. Core Use Case**
**Scenario:** A user wants to understand a technical or conceptual topic (e.g., decision trees, blockchain, GDP growth, regex). Instead of being served a scrollable chat, the AI breaks the topic into:
- Flowcharts
- Animations
- Key-term cards
- Interactive components
- Dynamic quizzes
- Live diagrams that evolve with further questions

The UI becomes the learning assistant, not the bottleneck.

---

### **3. Who It's For (Product-Market Fit)**
- **Neurodivergent learners** (ADHD, dyslexia, etc.)
- **Students** and autodidacts who use AI to learn new topics
- **Founders, PMs, designers** trying to understand tech without reading docs
- **Casual learners** who want better intuition around complex systems

**Primary frustrations we solve:**
- Can't remember what AI said
- Don't understand complex concepts from pure text
- Hate scrolling through slow, verbose output
- Want actionable or explorable information

---

### **4. Core Features**
- **Dynamic 3D Knowledge Graph:** The primary interaction mode. Instead of static outputs, the AI generates an initial 3D graph (nodes and links) representing core concepts **structured around a central root node derived from the initial prompt**. Users click nodes to trigger further LLM calls that dynamically expand the graph with related sub-concepts, allowing for user-driven exploration. This serves as the **visual semantic map** of the topic. Rendered via `react-force-graph-3d`.
- **Unified Multi-Facet Response:** The AI still provides complementary components alongside the graph (explanation, Knowledge Cards, quiz) for a richer context, derived from the initial prompt.
- **Interactive Knowledge Cards:** Detailed cards corresponding to each node in the graph. They contain concise explanations, definitions, and potentially relationships to other concepts. These serve as the **primary source for deeper learning** about individual concepts within the map. Includes a button to **focus the 3D graph** on the corresponding node **and its immediate neighbors (path focusing)**, visually emphasizing related concepts while dimming others.
- **Lightweight Quizzing:** Interactive MCQ for concept checks based on the explored topic.
- **Contextual Memory:** Key ideas, terms, and the *state of the explored graph* persist across sessions (**Implemented via Supabase backend**). Session titles are **automatically generated** based on the root node label.
- **Non-linear Exploration:** The dynamic graph inherently facilitates non-linear navigation driven by user curiosity.

---

### **5. Competitive Differentiators**
- **Not chat-based:** Replaces the linear chat with an **explorable 3D knowledge space** tightly integrated with detailed **Knowledge Cards**.
- **Visually structured:** Information hierarchy and relationships are explicit and navigable in 3D.
- **Custom-built for learning and memory:** The graph structure aids understanding connections, and dynamic expansion caters to individual learning paths.
- Supports **incremental, user-driven exploration** over time, revealing complexity progressively rather than delivering flat, one-shot answers.

---

### **6. Marketing & Distribution Strategy**
#### Channels:
- Twitter/X (via demos, short clips, ADHD-friendly content)
- YouTube ("How I learned X in 3 minutes with this AI tool")
- Product Hunt launch
- Developer and startup communities (IndieHackers, Hacker News)
- Reddit (especially ADHD, productivity, edtech, and explainlikeimfive subreddits)

#### Hooks:
- "ChatGPT is great. Until you forget what it just said."
- "Learning something new? Don't read it. **See it.**"
- "The anti-chat interface for AI learning."

---

### **7. Future Possibilities**
- Multi-user collaborative whiteboards
- AI-curated learning journeys with saved progress
- Integration with note-taking tools (Obsidian, Notion, etc.)
- On-device or privacy-first model hosting
- Support for multiple LLMs with comparative outputs

---

### **Summary**
*Intellea* rethinks how people engage with LLMs to learn new concepts. By shifting from text to visual interactivity, we help users understand faster, remember longer, and stay engaged. This is a visual language for AI assistance—built for the way humans actually learn.

