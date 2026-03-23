/**
 * Tests for src/gallery/supabase-gallery.ts — SupabaseGallery
 * Mocks @supabase/supabase-js to avoid live network calls.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { defaultGenome } from "../src/engine/types";

// ---- Supabase mock --------------------------------------------------------
const mockSingle = vi.fn();
const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockOrder = vi.fn();
const mockRange = vi.fn();
const mockEq = vi.fn();
const mockRpc = vi.fn();

// Chain builder
function chain(finalMock: ReturnType<typeof vi.fn>) {
  const obj: Record<string, unknown> = {};
  ["select", "insert", "order", "range", "eq", "single"].forEach((method) => {
    obj[method] = vi.fn(() => obj);
  });
  obj["then"] = (resolve: (v: unknown) => unknown) => resolve(finalMock());
  return obj;
}

const mockFrom = vi.fn();

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    from: mockFrom,
    rpc: mockRpc,
  })),
}));

import { SupabaseGallery } from "../src/gallery/supabase-gallery";

function makeGallery() {
  return new SupabaseGallery("https://test.supabase.co", "test-anon-key");
}

describe("gallery/SupabaseGallery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Test 39
  it("constructor throws without credentials", () => {
    expect(() => new SupabaseGallery("", "")).toThrow("Supabase credentials required");
  });

  // Test 40
  it("constructor throws with missing URL", () => {
    expect(() => new SupabaseGallery(undefined as unknown as string, "key")).toThrow();
  });

  // Test 41
  it("save calls from().insert().select().single()", async () => {
    const fakeEntry = {
      id: "abc",
      genome: defaultGenome(),
      author: "tester",
      prompt: "test prompt",
      likes: 0,
      created_at: new Date().toISOString(),
    };
    const mockChain = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: fakeEntry, error: null }),
    };
    mockFrom.mockReturnValue(mockChain);

    const gallery = makeGallery();
    const result = await gallery.save({
      genome: fakeEntry.genome,
      author: "tester",
      prompt: "test prompt",
    });

    expect(mockFrom).toHaveBeenCalledWith("phyloid_gallery");
    expect(mockChain.insert).toHaveBeenCalled();
    expect(result.author).toBe("tester");
  });

  // Test 42
  it("save throws on supabase error", async () => {
    const mockChain = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: { message: "DB error" } }),
    };
    mockFrom.mockReturnValue(mockChain);

    const gallery = makeGallery();
    await expect(
      gallery.save({ genome: defaultGenome(), author: "x", prompt: "p" })
    ).rejects.toThrow("Gallery save failed: DB error");
  });

  // Test 43
  it("list calls from().select().order().range() with defaults", async () => {
    const mockChain = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValue({ data: [], error: null }),
    };
    mockFrom.mockReturnValue(mockChain);

    const gallery = makeGallery();
    const result = await gallery.list();
    expect(mockChain.select).toHaveBeenCalledWith("*");
    expect(mockChain.order).toHaveBeenCalledWith("created_at", { ascending: false });
    expect(mockChain.range).toHaveBeenCalledWith(0, 19);
    expect(result).toEqual([]);
  });

  // Test 44
  it("list applies custom filter options", async () => {
    const mockChain = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValue({ data: [], error: null }),
    };
    mockFrom.mockReturnValue(mockChain);

    const gallery = makeGallery();
    await gallery.list({ orderBy: "likes", limit: 5, offset: 10 });
    expect(mockChain.order).toHaveBeenCalledWith("likes", { ascending: false });
    expect(mockChain.range).toHaveBeenCalledWith(10, 14);
  });

  // Test 45
  it("list throws on supabase error", async () => {
    const mockChain = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValue({ data: null, error: { message: "list error" } }),
    };
    mockFrom.mockReturnValue(mockChain);

    const gallery = makeGallery();
    await expect(gallery.list()).rejects.toThrow("Gallery list failed: list error");
  });

  // Test 46
  it("like calls rpc increment_likes", async () => {
    mockRpc.mockResolvedValue({ error: null });
    const gallery = makeGallery();
    await gallery.like("entry-id-123");
    expect(mockRpc).toHaveBeenCalledWith("increment_likes", { entry_id: "entry-id-123" });
  });

  // Test 47
  it("like throws on rpc error", async () => {
    mockRpc.mockResolvedValue({ error: { message: "rpc fail" } });
    const gallery = makeGallery();
    await expect(gallery.like("id")).rejects.toThrow("Like failed: rpc fail");
  });

  // Test 48
  it("getById returns null on error", async () => {
    const mockChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: { message: "not found" } }),
    };
    mockFrom.mockReturnValue(mockChain);

    const gallery = makeGallery();
    const result = await gallery.getById("nonexistent");
    expect(result).toBeNull();
  });

  // Test 49
  it("getById returns entry on success", async () => {
    const fakeEntry = {
      id: "abc",
      genome: defaultGenome(),
      author: "user1",
      prompt: "blue",
      likes: 5,
      created_at: "2025-01-01T00:00:00Z",
    };
    const mockChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: fakeEntry, error: null }),
    };
    mockFrom.mockReturnValue(mockChain);

    const gallery = makeGallery();
    const result = await gallery.getById("abc");
    expect(result?.id).toBe("abc");
    expect(result?.author).toBe("user1");
  });
});
