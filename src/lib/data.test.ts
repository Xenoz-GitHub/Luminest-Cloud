import { describe, expect, it } from "vitest";
import { buildBreadcrumbs, folderDescendantIds } from "./data";
import type { FolderRecord } from "@/types";

function folder(
  id: string,
  name: string,
  parentId: string | null
): FolderRecord {
  return {
    id,
    user_id: "user-1",
    name,
    parent_id: parentId,
    color: "#B9A5EA",
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  };
}

const FOLDERS = [
  folder("root", "Root", null),
  folder("child", "Child", "root"),
  folder("grandchild", "Grandchild", "child"),
  folder("sibling", "Sibling", "root"),
];

describe("folder helpers", () => {
  it("builds ancestor breadcrumbs from the root down", () => {
    expect(buildBreadcrumbs(FOLDERS, "grandchild").map((item) => item.name)).toEqual([
      "Root",
      "Child",
      "Grandchild",
    ]);
    expect(buildBreadcrumbs(FOLDERS, null)).toEqual([]);
  });

  it("finds descendants without revisiting a cycle", () => {
    expect(folderDescendantIds(FOLDERS, "root").sort()).toEqual([
      "child",
      "grandchild",
      "root",
      "sibling",
    ]);
    expect(folderDescendantIds(FOLDERS, "grandchild")).toEqual(["grandchild"]);
  });

  it("survives a malformed parent cycle", () => {
    const cyclic = [
      folder("a", "A", "b"),
      folder("b", "B", "a"),
    ];
    expect(buildBreadcrumbs(cyclic, "a").length).toBeLessThanOrEqual(2);
    expect(folderDescendantIds(cyclic, "a").sort()).toEqual(["a", "b"]);
  });
});
