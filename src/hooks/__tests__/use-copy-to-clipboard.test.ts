import { act, renderHook, waitFor } from "@testing-library/react";

import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";

describe("useCopyToClipboard", () => {
  const originalClipboard = navigator.clipboard;

  function mockClipboard(impl: (value: string) => Promise<void>) {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: jest.fn(impl) },
    });
  }

  afterEach(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: originalClipboard,
    });
    jest.useRealTimers();
  });

  it("starts with copied=false and no error", () => {
    const { result } = renderHook(() => useCopyToClipboard());
    expect(result.current.copied).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("flips copied=true after a successful copy and resets after resetAfterMs", async () => {
    jest.useFakeTimers();
    mockClipboard(() => Promise.resolve());

    const { result } = renderHook(() =>
      useCopyToClipboard({ resetAfterMs: 1000 }),
    );

    await act(async () => {
      const ok = await result.current.copy("hello");
      expect(ok).toBe(true);
    });

    expect(result.current.copied).toBe(true);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("hello");

    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(result.current.copied).toBe(false);
  });

  it("returns false and stores the error when writeText rejects", async () => {
    mockClipboard(() => Promise.reject(new Error("denied")));

    const { result } = renderHook(() => useCopyToClipboard());

    let ok = true;
    await act(async () => {
      ok = await result.current.copy("hello");
    });

    expect(ok).toBe(false);
    expect(result.current.copied).toBe(false);
    await waitFor(() => {
      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe("denied");
    });
  });

  it("reset() clears copied immediately and cancels the pending auto-reset", async () => {
    jest.useFakeTimers();
    mockClipboard(() => Promise.resolve());

    const { result } = renderHook(() =>
      useCopyToClipboard({ resetAfterMs: 5000 }),
    );

    await act(async () => {
      await result.current.copy("hello");
    });
    expect(result.current.copied).toBe(true);

    act(() => {
      result.current.reset();
    });
    expect(result.current.copied).toBe(false);

    act(() => {
      jest.advanceTimersByTime(10000);
    });
    expect(result.current.copied).toBe(false);
  });

  it("falls back to execCommand when navigator.clipboard is unavailable", async () => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: undefined,
    });
    const execMock = jest.fn(() => true);
    Object.defineProperty(document, "execCommand", {
      configurable: true,
      value: execMock,
    });

    const { result } = renderHook(() => useCopyToClipboard());

    let ok = false;
    await act(async () => {
      ok = await result.current.copy("legacy");
    });

    expect(ok).toBe(true);
    expect(result.current.copied).toBe(true);
    expect(execMock).toHaveBeenCalledWith("copy");
  });

  it("surfaces a failure when execCommand returns false", async () => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: undefined,
    });
    Object.defineProperty(document, "execCommand", {
      configurable: true,
      value: jest.fn(() => false),
    });

    const { result } = renderHook(() => useCopyToClipboard());

    let ok = true;
    await act(async () => {
      ok = await result.current.copy("legacy");
    });

    expect(ok).toBe(false);
    expect(result.current.copied).toBe(false);
    await waitFor(() => expect(result.current.error).toBeInstanceOf(Error));
  });
});
