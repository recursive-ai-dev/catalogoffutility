import { describe, expect, it } from "vitest";
import { isSafeCatalogUrl, validateCatalog, type AppEntry } from "../data";

const validEntry: AppEntry = {
  id: "reliable-entry",
  title: "Reliable Entry",
  description: "A complete catalog entry.",
  image: "/images/reliable.svg",
  url: "/reliable.html",
  tags: ["Tool"],
  tech: ["HTML"],
};

describe("catalog runtime schema validation", () => {
  it("reports malformed records without throwing away the remaining validation", () => {
    const defects = validateCatalog([null, [], "entry", { ...validEntry, title: " " }]);
    expect(defects).toHaveLength(4);
    expect(defects[3]).toContain("requires non-empty title");
  });

  it.each(["id", "title", "description", "image"] as const)("rejects blank or incorrectly typed %s", (key) => {
    expect(validateCatalog([{ ...validEntry, [key]: "  " }]).join(" ")).toContain(`requires non-empty ${key}`);
    expect(validateCatalog([{ ...validEntry, [key]: 12 }]).join(" ")).toContain(`requires non-empty ${key}`);
  });

  it.each(["UPPERCASE", "white space", "../entry", "", " leading"])("rejects unsafe routing identifier %j", (id) => {
    expect(validateCatalog([{ ...validEntry, id }]).join(" ")).toContain("invalid id");
  });

  it.each(["requiresAuth", "missing"] as const)("rejects non-boolean %s", (key) => {
    expect(validateCatalog([{ ...validEntry, [key]: "false" }]).join(" ")).toContain(`invalid ${key} flag`);
  });

  it("rejects malformed metadata and collection elements", () => {
    const defects = validateCatalog([{ ...validEntry, size: 12, version: " ", tags: "Tool", tech: ["HTML", "HTML", " ", 12] }]).join(" ");
    expect(defects).toContain("invalid size");
    expect(defects).toContain("invalid version");
    expect(defects).toContain("invalid tags list");
    expect(defects).toContain('duplicate tech value "HTML"');
    expect(defects).toContain("invalid tech value");
  });

  it("rejects duplicate tags that would render duplicate controls and inflate counts", () => {
    expect(validateCatalog([{ ...validEntry, tags: ["Tool", "Tool"] }]).join(" ")).toContain('duplicate tags value "Tool"');
  });

  it("requires a nonblank source and rejects ambiguous source precedence", () => {
    expect(validateCatalog([{ ...validEntry, url: undefined, htmlContent: " " }]).join(" ")).toContain("neither url nor htmlContent");
    expect(validateCatalog([{ ...validEntry, htmlContent: "<html></html>" }]).join(" ")).toContain("conflicting url and htmlContent");
    expect(validateCatalog([{ ...validEntry, url: undefined, missing: true }])).toEqual([]);
    expect(validateCatalog([{ ...validEntry, url: undefined, htmlContent: "<html></html>" }])).toEqual([]);
  });

  it("reports unsafe source and thumbnail URLs", () => {
    const defects = validateCatalog([{ ...validEntry, image: "data:image/svg+xml,test", url: "javascript:alert(1)" }]).join(" ");
    expect(defects).toContain("unsafe image");
    expect(defects).toContain("unsafe url");
  });
});

describe("catalog URL boundaries", () => {
  it.each(["/entry.html", "/nested/index.html?version=2#start", "/images/entry.svg", "https://example.com/entry.html"])("accepts documented public or HTTPS assets %j", (url) => {
    expect(isSafeCatalogUrl(url)).toBe(true);
  });

  it.each([
    "//evil.example/entry.html", "http://example.com/entry.html", "javascript:alert(1)", "data:text/html,test",
    "https://user:secret@example.com/entry.html", "/../entry.html", "/a/./entry.html", "/%2e%2e/entry.html",
    "/a%2fb/entry.html", "/a%5cb/entry.html", "/entry%00.html", "/entry%.html", "/entry\n.html", "entry.html",
  ])("rejects unsafe or malformed asset URL %j", (url) => {
    expect(isSafeCatalogUrl(url)).toBe(false);
  });
});
