export interface AppEntry {
  id: string;
  title: string;
  version?: string;
  description: string;
  size?: string;
  temp?: string;
  users?: string;
  err?: string;
  missing?: boolean;
  queue?: string;
  image: string;
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
    size: "256 KB",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuA9hP3S71NxPzmq11pYND5sS55blzE31EaYHuZ4gqRPJY9k0FnKiRWJuHWaoLP3dchRRT_EmMq9wpBh6icOIzMhrfqLrPyaFIBN1l1XJ7WZ802jqCirWP_Ns34Xm6D0NXRf_ASyPx2CN-qGkrOeWXtX4xgXJriguDfJiGhTLCtNNmg58XoQeEQm8UVze-gBMVHErG0-hony3FQ1kug9xd2XCea9entlqltcicuLWM8QQZZ7kHJxBFDTA5Yvd2GmuMg9a6Q5sIb8lZW3",
    url: "/when-the-sun-died.html",
  },
];
