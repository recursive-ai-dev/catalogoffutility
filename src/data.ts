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
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuA9hP3S71NxPzmq11pYND5sS55blzE31EaYHuZ4gqRPJY9k0FnKiRWJuHWaoLP3dchRRT_EmMq9wpBh6icOIzMhrfqLrPyaFIBN1l1XJ7WZ802jqCirWP_Ns34Xm6D0NXRf_ASyPx2CN-qGkrOeWXtX4xgXJriguDfJiGhTLCtNNmg58XoQeEQm8UVze-gBMVHErG0-hony3FQ1kug9xd2XCea9entlqltcicuLWM8QQZZ7kHJxBFDTA5Yvd2GmuMg9a6Q5sIb8lZW3",
    url: "/when-the-sun-died.html",
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
    image:
      "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=800&auto=format&fit=crop",
    url: "/aria-terminal-v2.html",
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
    image:
      "https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=800&auto=format&fit=crop",
    url: "/kira-v2.html",
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
    image:
      "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=800&auto=format&fit=crop",
    url: "/narrative-beat-graph.html",
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
    image:
      "https://images.unsplash.com/photo-1519669556878-63bdad8a1a49?q=80&w=800&auto=format&fit=crop",
    url: "/235am_v2.html",
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
    image:
      "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?q=80&w=800&auto=format&fit=crop",
    url: "/world-that-doesnt-care.html",
  },
];
