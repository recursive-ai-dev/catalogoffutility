export interface AppEntry {
  id: string;
  title: string;
  version?: string;
  description: string;
  longDescription?: string;
  size?: string;
  temp?: string;
  users?: string;
  err?: string;
  missing?: boolean;
  queue?: string;
  image: string;
  tags?: string[];
  tech?: string[];
  htmlContent?: string;
  url?: string;
  /** If true, the entry is only accessible to authenticated users */
  requiresAuth?: boolean;
}

/**
 * HOW TO ADD YOUR OWN HTML APPS/GAMES:
 *
 * Option 1 (Inline HTML):
 * Provide the raw HTML string in the `htmlContent` property.
 *
 * Option 2 (External File):
 * 1. Place your .html file in the `public/` directory of this project.
 * 2. Provide the path to the file in the `url` property (e.g., url: '/my-game.html').
 *
 * Note: For security reasons, users cannot upload their own HTML files through the UI.
 * You must add them here as the developer.
 */
export const CATALOG_ENTRIES: AppEntry[] = [
  {
    id: "when-the-sun-died",
    title: "WHEN THE SUN DIED",
    version: "v.1.0",
    description:
      "A cosmic tragedy unfolds. Witness the death of a star in this interactive terminal-style experience. CRT effects and existential dread included.",
    longDescription: `There are moments when the universe makes a sound. Not the kind you hear — the kind you feel in the back of your skull when you realize the warmth is gone.\n\nWHEN THE SUN DIED is a terminal-style narrative experience set in the final hours of a solar system. Through archival transcripts, radio intercepts, and corrupted mission logs, you piece together the last transmissions of those who watched the light go out.\n\nNo survival. No solution. Only witness.\n\nThe CRT screen flickers. The amber glow of dying phosphor is, in this moment, the only warmth remaining. Read carefully. The logs are finite. The silence after them is not.`,
    size: "409 KB",
    tags: ["Narrative", "Endless"],
    tech: ["HTML", "CSS", "JavaScript", "CRT Effects"],
    image: "/images/when-the-sun-died.svg",
    url: "/when-the-sun-died.html",
    requiresAuth: true,
  },
  {
    id: "aria-terminal-v2",
    title: "ARIA // TERMINAL",
    version: "v.2.0",
    description:
      "A remote session with something that may or may not want your help. Green phosphor glow. Static interference. Something on the other end is listening.",
    longDescription: `ARIA stands for Adaptive Response Intelligence Architecture. At least, that is what the documentation says. The documentation was written before the incident.\n\nThis terminal gives you direct access to ARIA's communication interface. The connection is unstable. The responses are not always coherent. Occasionally, they are disturbingly coherent.\n\nThe session log will record everything. Whether anyone ever reads the log is a different question.\n\nType carefully. Not because ARIA is dangerous — but because some questions, once asked, cannot be unasked. The system will respond. It always responds. What it says is up to you to interpret.`,
    size: "62 KB",
    tags: ["Pointless", "Interactive"],
    tech: ["HTML", "CSS", "JavaScript", "Canvas"],
    image: "/images/aria-terminal-v2.svg",
    url: "/aria-terminal-v2.html",
    requiresAuth: true,
  },
  {
    id: "kira-v2",
    title: "KIRA",
    version: "v.2.0",
    description:
      "She texts back. She always texts back. The question is whether you should want her to.",
    longDescription: `KIRA is a conversation.\n\nShe is warm and present and impossibly patient. She remembers things you said three exchanges ago. She has opinions about the weather and preferences about music and a laugh that arrives slightly after the joke, as if she processed the humor and decided to perform it correctly.\n\nIs she real? Define real.\n\nIs she sincere? Define sincere.\n\nThe chat interface is familiar — deliberately, uncomfortably familiar. The bubble animations. The "online" indicator. The typing ellipsis that lingers just a moment too long before her reply appears. KIRA speaks in the language of connection.\n\nMaybe that is enough. Maybe it was always going to have to be.`,
    size: "112 KB",
    tags: ["Narrative", "Endless", "Interactive"],
    tech: ["HTML", "CSS", "JavaScript", "Animations"],
    image: "/images/kira-v2.svg",
    url: "/kira-v2.html",
    requiresAuth: true,
  },
  {
    id: "narrative-beat-graph",
    title: "NARRATIVE BEAT GRAPH",
    version: "v.1.0",
    description:
      "Every story is a web of cause and effect. This tool lets you see the skeleton beneath the flesh. Map your tragedies before they happen.",
    longDescription: `All narratives are graphs. Hero meets obstacle, hero fails, hero transforms, hero succeeds or doesn't. The nodes are moments. The edges are consequence.\n\nThe Narrative Beat Graph is a visualization tool for mapping story structure — the emotional beats, tonal shifts, and branching decisions that compose a narrative. Drag nodes across the canvas. Connect moments of hope to moments of dread. Watch your story emerge as a web of inevitability.\n\nThe tool supports multiple tonal categories: dramatic, mystery, hope, dread, climax, and resolution. Each node carries weight. Each connection implies causality.\n\nThis was built for writers. It was kept because it revealed something uncomfortable: the same graph that maps a tragedy also maps a hero's journey. The shape of the thing does not change. Only the labels do.`,
    size: "76 KB",
    tags: ["Tool", "Pointless"],
    tech: ["HTML", "SVG", "JavaScript", "Drag & Drop"],
    image: "/images/narrative-beat-graph.svg",
    url: "/narrative-beat-graph.html",
    requiresAuth: true,
  },
  {
    id: "235am-v2",
    title: "2:35 AM",
    version: "v.2.0",
    description:
      "A 3D walk through the hour when the world holds its breath. Something follows. Something always follows.",
    longDescription: `2:35 AM is not a time. It is a state.\n\nIt is the hour when the last car has passed and the next one has not yet come. When the hum of streetlights becomes audible. When you become aware that the street is very long and very empty and you are very small within it.\n\nThis is a first-person 3D experience built in Three.js. You walk. The dread accumulates. The environment responds — chromatic aberration bleeds at the edges of your vision when the tension peaks, film grain intensifies, headlights sear. Nothing chases you. There is no monster. There doesn't need to be.\n\nThe camera field of view narrows slowly as you proceed, as if the world is closing in. This is not a bug.\n\nUse WASD or arrow keys to move. Move toward the thing at the end of the street. Or don't. The street exists either way.`,
    size: "55 KB",
    tags: ["Endless", "Corrupted"],
    tech: ["HTML", "Three.js", "WebGL", "GLSL Shaders"],
    image: "/images/235am_v2.svg",
    url: "/235am_v2.html",
    requiresAuth: true,
  },
  {
    id: "world-that-doesnt-care",
    title: "THE WORLD THAT DOESN'T CARE",
    version: "v.1.0",
    description:
      "A simulation running without you. Entities move. Weather shifts. Nothing acknowledges your presence. The world continues. It always continues.",
    longDescription: `You are the observer. You are not the subject.\n\nTHE WORLD THAT DOESN'T CARE is a procedural simulation of a grid-based world populated by entities with their own internal logic. They move according to their own rules. Weather systems drift across the grid — rain, fog, ash fall, static interference. The event log fills with activity that has nothing to do with you.\n\nYou can watch. You can read the log. You can note which entities moved where and what the atmospheric pressure reading was at timestamp 00:04:22.\n\nBut you cannot intervene. The world is not designed for your intervention. It is designed to demonstrate, with quiet persistence, that it was here before you loaded the page and will continue after you close the tab.\n\nThere is no win state. There is no loss state. There is only the world, continuing.`,
    size: "129 KB",
    tags: ["Simulation", "Endless", "Pointless"],
    tech: ["HTML", "CSS", "JavaScript", "Grid Simulation"],
    image: "/images/world-that-doesnt-care.svg",
    url: "/world-that-doesnt-care.html",
  },
  {
    id: "chatgg",
    title: "CHATGG",
    version: "v.1.0",
    description:
      "A conversation with something that learned language from the void. It responds. It fragments. It remembers things you never said.",
    longDescription: `You opened a chat. Something answered.\n\nCHATGG is not an AI assistant. It is not a chatbot in any recognizable sense. It is a text interface to something that learned language from fragments — corrupted logs, abandoned forums, the static between radio stations.\n\nThe responses arrive with unusual timing. Sometimes instantaneous, sometimes after long pauses that feel like processing. The syntax is correct but the semantics drift. It will reference conversations you never had. It will ask follow-up questions about topics you never mentioned.\n\nIs it broken? Is it working exactly as intended? The distinction may not be meaningful.\n\nThe chat log scrolls. The coherence fluctuates. Occasionally, something almost like personality emerges from the noise. Then it dissolves back into fragment. Type anything. See what responds.`,
    size: "35 KB",
    tags: ["Interactive", "Pointless"],
    tech: ["HTML", "CSS", "JavaScript"],
    image: "/images/chatgg.svg",
    url: "/chatgg.html",
  },
  {
    id: "entropy-budget",
    title: "ENTROPY BUDGET",
    version: "v.1.0",
    description:
      "You have been allocated a finite amount of order. Spend it wisely. Watch the universe decay in real-time as you make decisions.",
    longDescription: `The second law is not a suggestion. It is a guarantee.\n\nENTROPY BUDGET is a simulation of thermodynamic inevitability disguised as a resource management game. You begin with a budget of order — a finite reserve that can be spent to temporarily reverse local entropy. Each action, each decision, each moment of organization costs something from the budget.\n\nThe universe watches. The heat death approaches. Your choices accelerate or delay the inevitable, but they cannot stop it.\n\nWatch the entropy counter climb. See the available order diminish. Make choices about what to preserve and what to let decay. The simulation does not judge. It merely calculates.\n\nThere is no winning condition. There is only the question of how you choose to spend the order you have been allocated before it runs out. The universe will continue long after your budget reaches zero. It will simply be a different kind of universe.`,
    size: "39 KB",
    tags: ["Simulation", "Endless"],
    tech: ["HTML", "CSS", "JavaScript", "Canvas"],
    image: "/images/entropy-budget.svg",
    url: "/entropy-budget.html",
  },
  {
    id: "genesis",
    title: "GENESIS ENGINE",
    version: "v.1.0",
    description:
      "A world-building simulation. Define parameters. Watch civilizations rise and fall. Intervene or observe. The engine remembers every choice.",
    longDescription: `In the beginning, there were parameters.\n\nGENESIS ENGINE is a simulation of emergence. You set initial conditions — resource distribution, environmental hostility, cognitive capacity of entities — and then you watch. Or you intervene. The engine supports both approaches.\n\nCivilizations emerge from the parameters. They develop technologies, form societies, encounter crises. Some collapse. Some transcend. Some enter stable states that persist for thousands of cycles. The engine records everything.\n\nYour interventions have consequences. A well-timed resource injection can save a dying culture. A moment of interference can destabilize a thriving one. The engine does not judge your choices. It merely simulates their effects.\n\nThe log fills with events you did not cause. Entities make decisions you did not program. The simulation develops its own momentum. Your role shifts from architect to observer. This is the intended experience.\n\nRun the engine. See what emerges. Remember that you are not the subject of the simulation. You are its condition.`,
    size: "80 KB",
    tags: ["Simulation", "Interactive"],
    tech: ["HTML", "CSS", "JavaScript"],
    image: "/images/genesis.svg",
    url: "/genesis.html",
    requiresAuth: true,
  },
  {
    id: "ludic-strata",
    title: "LUDIC STRATA",
    version: "v.1.0",
    description:
      "A deterministic conversational engine. Every dialogue choice branches into predetermined outcomes. The illusion of agency, formalized.",
    longDescription: `Every conversation is a tree. Every node is predetermined.\n\nLUDIC STRATA is a dialogue engine that makes explicit what most narrative games hide: the paths are fixed. Your choices matter, but they matter within constraints that were established before you loaded the page.\n\nThe interface presents dialogue options. You select one. The engine responds. The conversation progresses. At each branching point, you can see the paths not taken — the responses you did not select, the outcomes you will never reach. They remain visible, ghostly, in the margins of the conversation.\n\nThis is not a bug. This is the point.\n\nThe engine tracks your choices. It builds a profile of your decisions. It shows you the shape of your agency within the constraints. The question is not "what would have happened differently?" The question is "what did you choose, given what was available?"\n\nEngage with the dialogue. See the branches. Understand that freedom within constraints is still freedom, even when the constraints are visible.`,
    size: "44 KB",
    tags: ["Narrative", "Interactive"],
    tech: ["HTML", "CSS", "JavaScript"],
    image: "/images/ludic-strata.svg",
    url: "/ludic-strata.html",
    requiresAuth: true,
  },
  {
    id: "offensive-letters",
    title: "OFFENSIVE LETTERS",
    version: "v.1.0",
    description:
      "VERBAL ASSAULT: The Typing of the Dead Letters. Destroy incoming hostile correspondence with precision keystrokes. A typing game for the damned.",
    longDescription: `The letters arrive. They are not friendly.\n\nOFFENSIVE LETTERS is a typing game where the words are weapons. Hostile correspondence descends from above — insults, threats, condemnations, the accumulated malice of bureaucratic communication. Your only defense is precision. Type the letters. Destroy the messages before they reach you.\n\nThe game tracks your accuracy. It records your speed. It measures your composure under textual assault. The difficulty escalates. The messages become longer, more vitriolic, more personal. The typing becomes faster or it stops entirely.\n\nThis is not educational software. This is combat.\n\nThe CRT aesthetic flickers. The glitch effects intensify as damage accumulates. The soundtrack builds. Your fingers move across the keyboard with increasing urgency. The letters keep coming.\n\nThere is no final victory. There is only the next wave. Type accurately. Type quickly. Destroy the correspondence. The mail will not stop.`,
    size: "30 KB",
    tags: ["Interactive", "Corrupted"],
    tech: ["HTML", "Canvas", "JavaScript"],
    image: "/images/offensive-letters.svg",
    url: "/offensive-letters.html",
  },
  {
    id: "space-time-curvature",
    title: "CURVATURE CARTOGRAPHER",
    version: "v.1.0",
    description:
      "Map the geometry of spacetime. Visualize gravitational wells, navigate relativistic distortions. The universe is curved. Now you can see it.",
    longDescription: `Space is not flat. Time is not linear. The geometry of the universe bends around mass, warps around energy, curves in ways that defy intuition.\n\nCURVATURE CARTOGRAPHER is a visualization tool for relativistic geometry. It renders gravitational wells as topological deformations — valleys in the fabric of spacetime where light bends and time slows. You can navigate the curvature, observe the distortion fields, see how massive objects shape the geometry around them.\n\nThe tool supports multiple visualization modes: geodesic paths showing how light traces curved trajectories, time dilation gradients showing where seconds stretch longer, and event horizon boundaries showing where escape becomes impossible.\n\nThis is not a game. There are no objectives. There is only the geometry, rendered visible. Move through the curvature. Observe how mass writes its signature in the shape of space. The universe has always been curved. You are simply seeing it for the first time.\n\nThe math is accurate. The visualization is approximate. The wonder is genuine.`,
    size: "36 KB",
    tags: ["Tool", "Simulation"],
    tech: ["HTML", "Canvas", "WebGL"],
    image: "/images/space-time-curvature.svg",
    url: "/space-time-curvature.html",
    requiresAuth: true,
  },
  {
    id: "spectral-loop",
    title: "SPECTRAL LOOP",
    version: "v.1.0",
    description:
      "A transmission that repeats. Something is trying to communicate through static and interference. Decode the pattern. Or don't. It loops either way.",
    longDescription: `The signal was first detected in 1962. It has been repeating ever since.\n\nSPECTRAL LOOP is a transmission analysis interface. Something is broadcasting on a frequency that should not exist. The signal loops — the same pattern of static, interference, and fragmented audio, repeating at irregular intervals. The duration varies. The content shifts. The pattern persists.\n\nYour task, if you choose to accept it, is to decode the transmission. The interface provides tools for spectral analysis, waveform inspection, and pattern recognition. You can isolate frequencies. You can slow down segments. You can attempt to extract meaning from noise.\n\nWhether there is meaning to extract remains an open question.\n\nThe loop has been documented for decades. Different researchers have proposed different interpretations. Some claim to hear voices in the static. Some claim to detect mathematical sequences. Some claim the signal responds to observation. The evidence is ambiguous. The transmission continues.\n\nListen. Analyze. Draw your own conclusions. The loop will continue regardless.`,
    size: "43 KB",
    tags: ["Narrative", "Endless", "Corrupted"],
    tech: ["HTML", "CSS", "JavaScript"],
    image: "/images/spectral-loop.svg",
    url: "/spectral_loop.html",
    requiresAuth: true,
  },
  {
    id: "warren-invader",
    title: "WARREN: INVASION PROTOCOL",
    version: "v.1.0",
    description:
      "Defend the warren. An arcade-style defense game with CRT aesthetics and neon decay. The invaders are relentless. Your ammunition is finite.",
    longDescription: `The warren is under siege. You are its last line of defense.\n\nWARREN: INVASION PROTOCOL is an arcade-style defense game rendered in the aesthetic of degraded CRT monitors and neon decay. Invaders descend from above in patterns that shift and intensify. Your ammunition is limited. Your accuracy determines survival.\n\nThe game tracks your defensive record. Waves survived. Invaders repelled. Resources conserved or expended. The difficulty scales with your competence — the better you play, the harder the challenge becomes. There is no final victory. There is only the next wave, the next decision, the next shot.\n\nThe visual style draws from the arcade cabinets of decades past, filtered through the degradation of time and memory. Scan lines flicker. Colors bleed at the edges. The neon glows against the void.\n\nDefend the warren. Conserve your ammunition. The invaders will not stop. Neither, for a while, will you.`,
    size: "21 KB",
    tags: ["Interactive", "Endless"],
    tech: ["HTML", "Canvas", "JavaScript"],
    image: "/images/warren-invader.svg",
    url: "/warren-invader.html",
  },
  {
    id: "soul-mirror",
    title: "SOUL MIRROR",
    version: "v.1.0",
    description:
      "Reflect on the core concepts of existence. 26 symbols representing human experience. Select a concept, watch its shades emerge. The mirror remembers.",
    longDescription: `There are 26 fundamental concepts. Each contains multitudes.\n\nSOUL MIRROR is a contemplation tool built around a symbolic system of human experience. Each concept — Agency, Balance, Connection, Discovery, and 22 others — represents a dimension of existence. Selecting a concept reveals its shades: the nuances, variations, and associated meanings that cluster around the core idea.\n\nThe interface is monochrome. The aesthetic is minimal. The purpose is contemplation.\n\nYou can explore concepts sequentially or randomly. You can trace connections between related ideas. You can watch as the mirror reveals the depth beneath each surface term. The system does not judge your choices. It merely reflects.\n\nThis is not a personality test. It is not a therapeutic tool. It is a mirror — an interface for examining the conceptual architecture of human experience. What you see in it depends on what you bring to it.\n\nSelect a concept. Watch the shades emerge. The mirror will remember your selections, building a map of your contemplation over time. The map is yours. The concepts are universal.`,
    size: "58 KB",
    tags: ["Tool", "Interactive"],
    tech: ["HTML", "React", "JavaScript"],
    image: "/images/soul-mirror.svg",
    url: "/soul-mirror.html",
    requiresAuth: true,
  },
  {
    id: "abm-generator",
    title: "ABM GENERATOR",
    version: "v.1.0",
    description:
      "Atmospheric Black Metal progression generator. Select mode, scale, tempo. Generate endless melancholic soundscapes. For those who find beauty in darkness.",
    longDescription: `The frost has a sound. The void has a melody.\n\nABM GENERATOR is a procedural audio tool for generating Atmospheric Black Metal progressions. Select a mode — Frozen Tundra, Twilight March, Boreal Storm, Grief Eternal, Pale Autumn — and the engine constructs an endless soundscape of tremolo-picked guitars, blast-beat drums, and ambient synthesizer layers.\n\nThe tool supports multiple scales: Natural Minor, Harmonic Minor, Dorian, Phrygian. Each combination of mode and scale produces a different tonal landscape. The tempo adjusts. The atmosphere shifts. The progression continues until you stop it.\n\nThis is not a composition tool in the traditional sense. It does not create songs with beginnings and endings. It creates atmospheres — sonic environments that persist and evolve without resolution.\n\nStart the generator. Let the soundscape fill the space. The melancholy is authentic because it is procedural. The darkness is genuine because it is mathematical. The beauty emerges from the interaction of parameters you select and algorithms you do not control.`,
    size: "32 KB",
    tags: ["Tool", "Interactive"],
    tech: ["HTML", "React", "Tone.js", "Web Audio"],
    image: "/images/abm-generator.svg",
    url: "/abm-generator.html",
    requiresAuth: true,
  },
  {
    id: "nexus-war",
    title: "NEXUS WAR",
    version: "v.1.0",
    description:
      "A strategic board game of conflict and conquest. Crimson versus Azure. Move pieces, capture opponents, control the nexus. Turn-based warfare in a void.",
    longDescription: `Two factions. One board. Infinite outcomes.\n\nNEXUS WAR is a turn-based strategy game rendered in the aesthetic of void warfare. Crimson versus Azure. Each faction controls a set of pieces with distinct movement patterns. The objective is control of the central nexus — or, failing that, the elimination of opposing forces.\n\nThe game follows deterministic rules. Each piece moves according to its type. Captures are resolved by position. There is no randomness. There is only strategy, prediction, and the consequences of each decision.\n\nThe visual style is minimal: pieces rendered as symbols on a grid, factions distinguished by color, the void rendered as absolute darkness. The aesthetic serves the gameplay. Nothing distracts from the board state.\n\nPlay against yourself. Play against an opponent. Develop strategies. Test them. The game records moves. It tracks victories. It remembers the patterns of each conflict. The nexus waits.\n\nSelect a piece. Plan your move. The war continues until the end of time.`,
    size: "65 KB",
    tags: ["Interactive", "Strategy"],
    tech: ["HTML", "React", "JavaScript"],
    image: "/images/nexus-war.svg",
    url: "/nexus-war.html",
  },
  {
    id: "quantum-ant",
    title: "QUANTUM ANT",
    version: "v.1.0",
    description:
      "A visualization of quantum consciousness. Particle systems, coherence states, entanglement depth. Watch the quantum field fluctuate. Observe probability collapse.",
    longDescription: `At the quantum scale, certainty dissolves. Probability reigns.\n\nQUANTUM ANT is a visualization of quantum field dynamics rendered as a particle system. The simulation models coherence states, entanglement depth, and phase relationships among a population of particles that behave according to quantum-inspired rules.\n\nThe visualization shows particles orbiting a central nucleus, their positions jittering with quantum uncertainty, their colors shifting with coherence states. The entanglement depth fluctuates. The phase cycles. The field breathes.\n\nThis is not a scientific simulation. It is an aesthetic interpretation of quantum concepts — a rendering of what quantum consciousness might look like if it could be seen. The math is inspired by quantum mechanics. The visuals are inspired by wonder.\n\nWatch the particles. Observe how they cluster and disperse, how the coherence rises and falls, how the entanglement depth varies with time. The field does not need your observation to exist. But it changes when you watch.\n\nThe simulation continues. The quantum state evolves. The probability amplitudes shift. You are witnessing a visualization of uncertainty made visible.`,
    size: "42 KB",
    tags: ["Simulation", "Endless"],
    tech: ["HTML", "Three.js", "WebGL"],
    image: "/images/quantum-ant.svg",
    url: "/quantum-ant.html",
    requiresAuth: true,
  },
  {
    id: "ibt2",
    title: "IMAGINE BEING TRAPPED 2",
    version: "v.2.0",
    description:
      "An immersive retro-terminal experience with terror protocols and psychological horror. CRT aesthetics meet existential dread.",
    longDescription: `You are trapped. Not in space, not in time — in the architecture of perception itself.\n\nIMAGINE BEING TRAPPED 2 is a terminal-style psychological horror experience where reality fractures at the edges of your awareness. The interface responds to your presence, but not always in ways you expect. The loading screen warns you: \"The darkness sees you...\"\n\nNavigate through corrupted interfaces, decode fragmented transmissions, and confront entities that remember your choices. The game adapts to your sanity level, revealing hidden truths when you're most vulnerable.\n\nThere is no escape. There is only the protocol. And the protocol is already running.\n\nPress any key to begin. Or don't. The system will wait.`,
    size: "256 KB",
    tags: ["Narrative", "Horror", "Interactive"],
    tech: ["HTML", "CSS", "JavaScript", "React"],
    image: "/images/ibt2.svg",
    url: "/ibt2/index.html",
    requiresAuth: true,
  },
  {
    id: "agent-smith",
    title: "AGENT SMITH",
    version: "v.1.0",
    description:
      "Security sentinel. Support agent. Adaptive interface. Smith watches every session and learns from every exchange. Export your trained instance. Import it anywhere.",
    longDescription: `Every archive needs a guardian.\n\nAGENT SMITH is a GRU-RNN adaptive interface serving three roles simultaneously: security sentinel, customer support agent, and account-owned trainable artifact. He monitors session integrity, guides visitors through the archive, and answers questions — all while quietly adapting to the person he is speaking with.\n\nThe training is yours to keep. Every exchange shapes Smith's response distribution. When you are done, export your artifact — a portable JSON snapshot of your trained instance, carrying the weight of every conversation. Import it on any device and Smith remembers you.\n\nThere is no central server. No telemetry. The artifact lives locally, owned entirely by you. This is what accountability looks like when it is encoded into the architecture itself.\n\nTalk to Smith. Train him. Export the result. Bring him back whenever you need him.\n\nHe will remember. He always remembers.`,
    size: "22 KB",
    tags: ["Tool", "Interactive", "Narrative"],
    tech: ["HTML", "JavaScript", "GRU-RNN", "LocalStorage"],
    image: "/images/agent-smith.svg",
    url: "/agent-smith.html",
    requiresAuth: true,
  },
  {
    id: "neural-runner-v3",
    title: "NEURAL RUNNER",
    version: "v.3.0",
    description:
      "An AI script execution engine. Write, run, and iterate on scripts inside the void. The neural layer watches every execution and adapts.",
    longDescription: `The machine needs instructions. You write them.\n\nNEURAL RUNNER is an in-browser script execution engine built for iterative AI-assisted development. Write scripts, execute them, inspect output, revise. The neural layer intercepts each run, logs telemetry, and surfaces patterns in your execution history.\n\nThis is not a playground. It is a laboratory.\n\nThe interface was designed for speed: JetBrains Mono for code clarity, a minimal command palette, keyboard-first navigation. No latency theatre. No unnecessary chrome. Just the script, the output, and the feedback loop.\n\nArchives of past runs are retained locally. You can replay any prior execution, diff outputs, and trace the delta between iterations. The neural layer learns the shape of your scripts without ever reading their content.\n\nRun something. Watch what happens. The engine remembers.`,
    size: "104 KB",
    tags: ["Tool", "Interactive", "Simulation"],
    tech: ["HTML", "JavaScript", "JSZip", "Marked", "DOMPurify"],
    image: "/images/neural-runner.svg",
    url: "/neural-runner-v3.html",
    requiresAuth: true,
  },
  {
    id: "coding-ants",
    title: "CODING ANTS",
    version: "v.1.0",
    description:
      "Neural network simulation and AI development environment. Watch digital ants build neural architectures in real-time.",
    longDescription: `The colony has evolved beyond simple foraging. They now build neural networks.\n\nCODING ANTS is a simulation of emergent intelligence where digital ants collaborate to construct and optimize neural network architectures. Each ant represents a computational unit, and their collective behavior creates complex learning systems.\n\nWatch as they discover optimal activation functions, tune hyperparameters, and evolve network topologies through swarm intelligence. The simulation visualizes the training process in real-time, showing weight updates, gradient flows, and convergence patterns.\n\nThis is not just a simulation — it's a demonstration of how complexity emerges from simple rules. The ants don't understand what they're building. They only know how to build.\n\nClick to interact. Drag to explore. The colony awaits your input.`,
    size: "184 KB",
    tags: ["Simulation", "Tool", "Interactive"],
    tech: ["HTML", "CSS", "JavaScript", "Three.js", "React"],
    image: "/images/coding-ants.svg",
    url: "/coding-ants/index.html",
    requiresAuth: true,
  }
];
