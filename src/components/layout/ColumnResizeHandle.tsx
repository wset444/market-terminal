"use client";

import { useCallback, useRef } from "react";

export type ColumnResizeHandleProps = {
  /** 屏幕阅读器标签 */
  ariaLabel: string;
  /**
   * 指针水平位移（px）：向右为正，与 `MouseEvent` 的 `clientX` 增量一致。
   * 左栏分隔条：`leftWidth += delta`；右栏分隔条：`rightWidth -= delta` 由父组件处理。
   */
  onDragDelta: (deltaX: number) => void;
  /** 鼠标松开时调用（例如写入 `localStorage`） */
  onDragComplete?: () => void;
};

/**
 * 纵向分隔条：左右拖拽调整相邻列宽。
 *
 * 步骤：
 * 1. `mousedown` 在条上开始，在 `document` 上监听 `mousemove` / `mouseup`，避免快速划出条后丢失跟踪。
 * 2. 每次 `mousemove` 用与上次 `clientX` 的差调用 `onDragDelta`。
 * 3. `mouseup` 时移除监听、恢复 `body` 光标与选中，并触发 `onDragComplete`。
 * 4. 键盘 `ArrowLeft` / `ArrowRight`（`Shift` 大步）模拟小幅拖拽，便于无障碍调节。
 */
export function ColumnResizeHandle({ ariaLabel, onDragDelta, onDragComplete }: ColumnResizeHandleProps) {
  const lastXRef = useRef(0);

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      lastXRef.current = e.clientX;
      const onMove = (ev: MouseEvent) => {
        const dx = ev.clientX - lastXRef.current;
        lastXRef.current = ev.clientX;
        if (dx !== 0) onDragDelta(dx);
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
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    },
    [onDragDelta, onDragComplete],
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const step = e.shiftKey ? 24 : 10;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        onDragDelta(-step);
        onDragComplete?.();
      } else if (e.key === "ArrowRight") {
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
      aria-orientation="vertical"
      aria-label={ariaLabel}
      tabIndex={0}
      onMouseDown={onMouseDown}
      onKeyDown={onKeyDown}
      className="border-border/60 hover:bg-primary/20 focus-visible:ring-primary/50 bg-muted/10 w-2 shrink-0 cursor-col-resize border-l border-r transition-colors focus-visible:outline-none focus-visible:ring-2"
    />
  );
}
