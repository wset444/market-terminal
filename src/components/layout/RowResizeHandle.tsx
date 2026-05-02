"use client";

import { useCallback, useRef } from "react";

export type RowResizeHandleProps = {
  ariaLabel: string;
  /**
   * 垂直位移（px）：向下为正，与 `MouseEvent.clientY` 增量一致。
   * 上方区域增高时通常 `onDragDelta(dy)` 增加上方面板高度。
   */
  onDragDelta: (deltaY: number) => void;
  onDragComplete?: () => void;
};

/**
 * 横向分隔条：上下拖拽调整相邻行区域高度。
 *
 * 步骤：
 * 1. `mousedown` 后在 `document` 上监听 `mousemove` / `mouseup`。
 * 2. 用 `clientY` 差调用 `onDragDelta`。
 * 3. `ArrowUp` / `ArrowDown` 小幅调节（`Shift` 大步）。
 */
export function RowResizeHandle({ ariaLabel, onDragDelta, onDragComplete }: RowResizeHandleProps) {
  const lastYRef = useRef(0);

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      lastYRef.current = e.clientY;
      const onMove = (ev: MouseEvent) => {
        const dy = ev.clientY - lastYRef.current;
        lastYRef.current = ev.clientY;
        if (dy !== 0) onDragDelta(dy);
      };
      const onUp = () => {
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
        document.body.style.removeProperty("cursor");
        document.body.style.removeProperty("user-select");
        onDragComplete?.();
      };
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
      document.body.style.cursor = "row-resize";
      document.body.style.userSelect = "none";
    },
    [onDragDelta, onDragComplete],
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const step = e.shiftKey ? 20 : 8;
      if (e.key === "ArrowUp") {
        e.preventDefault();
        onDragDelta(-step);
        onDragComplete?.();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        onDragDelta(step);
        onDragComplete?.();
      }
    },
    [onDragDelta, onDragComplete],
  );

  return (
    <div
      role="separator"
      aria-orientation="horizontal"
      aria-label={ariaLabel}
      tabIndex={0}
      onMouseDown={onMouseDown}
      onKeyDown={onKeyDown}
      className="border-border/60 hover:bg-primary/20 focus-visible:ring-primary/50 bg-muted/15 z-10 h-2 shrink-0 cursor-row-resize border-t border-b transition-colors focus-visible:outline-none focus-visible:ring-2"
    />
  );
}
