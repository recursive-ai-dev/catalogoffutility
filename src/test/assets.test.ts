import { describe, expect, it } from "vitest";
import { resolvePublicAssetUrl } from "../lib/assets";

describe("packaged public asset paths", () => {
  it("keeps packaged images within the directory containing the app entry point", () => {
    expect(resolvePublicAssetUrl("/images/entry.svg", "file:///opt/catalog/dist/index.html"))
      .toBe("file:///opt/catalog/dist/images/entry.svg");
  });
  it("preserves encoded install directories, query strings and fragments", () => {
    expect(resolvePublicAssetUrl("/images/entry.svg?v=2#preview", "file:///C:/Program%20Files/Catalog/dist/index.html#entry"))
      .toBe("file:///C:/Program%20Files/Catalog/dist/images/entry.svg?v=2#preview");
  });
  it.each(["https://catalog.example/index.html", "https://catalog.example/subpath/index.html"])("preserves web root paths under %j", (base) => {
    expect(resolvePublicAssetUrl("/images/entry.svg", base)).toBe("/images/entry.svg");
  });
  it.each(["https://images.example/entry.svg", "images/entry.svg", "//images.example/entry.svg"])("preserves non-public asset reference %j", (source) => {
    expect(resolvePublicAssetUrl(source, "file:///opt/catalog/dist/index.html")).toBe(source);
  });
  it("leaves source paths intact when the document base is malformed", () => {
    expect(resolvePublicAssetUrl("/images/entry.svg", "invalid base")).toBe("/images/entry.svg");
  });
});
