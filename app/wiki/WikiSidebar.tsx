"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export type SidebarNode = {
  id: string;
  slug: string;
  title: string;
  parent_id: string | null;
  is_folder: boolean;
};
type TNode = SidebarNode & { children: TNode[] };

const LS_KEY = "hubwiki-expanded";

function buildForest(items: SidebarNode[]): TNode[] {
  const ids = new Set(items.map((i) => i.id));
  const byId = new Map<string, TNode>();
  items.forEach((i) => byId.set(i.id, { ...i, children: [] }));
  const roots: TNode[] = [];
  for (const i of items) {
    const n = byId.get(i.id)!;
    const pid = i.parent_id && ids.has(i.parent_id) ? i.parent_id : null;
    if (pid) byId.get(pid)!.children.push(n);
    else roots.push(n);
  }
  return roots;
}

function descendantIds(items: SidebarNode[], rootId: string): Set<string> {
  const childrenOf = new Map<string, string[]>();
  for (const i of items) {
    if (!i.parent_id) continue;
    if (!childrenOf.has(i.parent_id)) childrenOf.set(i.parent_id, []);
    childrenOf.get(i.parent_id)!.push(i.id);
  }
  const out = new Set<string>();
  const stack = [rootId];
  while (stack.length) {
    const cur = stack.pop()!;
    for (const c of childrenOf.get(cur) ?? []) {
      if (!out.has(c)) {
        out.add(c);
        stack.push(c);
      }
    }
  }
  return out;
}

export default function WikiSidebar({ nodes }: { nodes: SidebarNode[] }) {
  const router = useRouter();
  const pathname = usePathname();
  // 서버 트리(nodes)를 로컬 복사로 두고 이동 시 즉시(낙관적) 반영 → 서버 새로고침이 오면 동기화
  const [items, setItems] = useState<SidebarNode[]>(nodes);
  useEffect(() => setItems(nodes), [nodes]);
  const [justMovedId, setJustMovedId] = useState<string | null>(null);

  const forest = useMemo(() => buildForest(items), [items]);
  const folderIds = useMemo(
    () => items.filter((n) => n.is_folder).map((n) => n.id),
    [items]
  );

  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [creatingIn, setCreatingIn] = useState<string | "root" | null>(null);
  const [newName, setNewName] = useState("");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameVal, setRenameVal] = useState("");

  // ── 포인터 기반 드래그 상태 ──
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragTitle, setDragTitle] = useState("");
  const [dragOver, setDragOver] = useState<string | "__root__" | null>(null);
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);

  const blocked = useMemo(
    () =>
      dragId
        ? new Set<string>([dragId, ...descendantIds(items, dragId)])
        : new Set<string>(),
    [dragId, items]
  );

  // 리스너 클로저가 항상 최신값을 보도록 ref 동기화
  const dragIdRef = useRef<string | null>(null);
  const dragOverRef = useRef<string | "__root__" | null>(null);
  const blockedRef = useRef<Set<string>>(new Set());
  dragIdRef.current = dragId;
  dragOverRef.current = dragOver;
  blockedRef.current = blocked;

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) setExpanded(new Set(JSON.parse(raw)));
    } catch {
      /* ignore */
    }
  }, []);

  function persist(s: Set<string>) {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify([...s]));
    } catch {
      /* ignore */
    }
  }
  function setExp(s: Set<string>) {
    setExpanded(s);
    persist(s);
  }
  function toggle(id: string) {
    const n = new Set(expanded);
    if (n.has(id)) n.delete(id);
    else n.add(id);
    setExp(n);
  }
  function expandAll() {
    setExp(new Set(folderIds));
  }
  function collapseAll() {
    setExp(new Set());
  }

  // ── 드래그 동작 (mousedown → window mousemove/up) ──
  function startDrag(e: React.MouseEvent, node: SidebarNode) {
    if (e.button !== 0) return;
    e.preventDefault();
    setDragId(node.id);
    setDragTitle(node.title);
    setDragOver(null);
    setDragPos(null);
  }

  async function moveTo(id: string, parentId: string | null) {
    if (!id || id === parentId) return;

    // 1) 낙관적 즉시 반영 — 끌어 놓는 순간 트리에서 바로 이동(자손은 parent_id 그대로라 함께 따라옴)
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, parent_id: parentId } : n))
    );
    if (parentId) {
      setExpanded((prev) => {
        const n = new Set(prev);
        n.add(parentId);
        persist(n);
        return n;
      });
    }
    // 2) 방금 옮긴 항목 잠깐 강조
    setJustMovedId(id);
    window.setTimeout(() => setJustMovedId(null), 1200);

    // 3) 서버 반영
    const res = await fetch(`/api/pages/${id}/move`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ parentId }),
    });
    if (res.ok) {
      router.refresh();
    } else {
      const d = await res.json().catch(() => ({}));
      alert(d.error ?? "이동 실패");
      setItems(nodes); // 실패 시 서버 상태로 되돌림
    }
  }

  useEffect(() => {
    if (!dragId) return;
    function onMove(ev: MouseEvent) {
      setDragPos({ x: ev.clientX, y: ev.clientY });
      const el = document.elementFromPoint(
        ev.clientX,
        ev.clientY
      ) as HTMLElement | null;
      const row = el?.closest("[data-node-id]") as HTMLElement | null;
      if (row) {
        const id = row.getAttribute("data-node-id");
        const isFolder = row.getAttribute("data-folder") === "1";
        if (isFolder && id && !blockedRef.current.has(id)) {
          setDragOver(id);
          return;
        }
      }
      // 폴더 위가 아니면서 사이드바 안이면 목적지는 '최상위'
      if (el?.closest(".wiki-sidebar")) {
        setDragOver("__root__");
        return;
      }
      setDragOver(null);
    }
    function onUp() {
      const id = dragIdRef.current;
      const over = dragOverRef.current;
      setDragId(null);
      setDragOver(null);
      setDragPos(null);
      if (id && over === "__root__") moveTo(id, null);
      else if (id && over) moveTo(id, over);
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragId]);

  async function createFolder(parentId: string | null) {
    const title = newName.trim();
    if (!title) {
      setCreatingIn(null);
      return;
    }
    const res = await fetch("/api/folders", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title, parentId }),
    });
    if (res.ok) {
      if (parentId) {
        const n = new Set(expanded);
        n.add(parentId);
        setExp(n);
      }
      setCreatingIn(null);
      setNewName("");
      router.refresh();
    } else {
      const d = await res.json().catch(() => ({}));
      alert(d.error ?? "폴더 생성 실패");
    }
  }

  async function rename(id: string) {
    const title = renameVal.trim();
    if (!title) {
      setRenamingId(null);
      return;
    }
    const res = await fetch(`/api/folders/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title }),
    });
    setRenamingId(null);
    if (res.ok) router.refresh();
    else {
      const d = await res.json().catch(() => ({}));
      alert(d.error ?? "이름변경 실패");
    }
  }

  async function remove(node: SidebarNode) {
    const what = node.is_folder ? "폴더" : "문서";
    if (!confirm(`'${node.title}' ${what}를 삭제할까요?`)) return;
    const res = await fetch(`/api/pages/${node.id}`, { method: "DELETE" });
    if (res.ok) router.refresh();
    else {
      const d = await res.json().catch(() => ({}));
      alert(d.error ?? "삭제 실패");
    }
  }

  const activeSlug = pathname?.startsWith("/wiki/")
    ? decodeURIComponent(pathname.slice("/wiki/".length).split("/")[0])
    : "";

  // 드래그 칩에 표시할 목적지 이름
  const overTitle =
    dragOver === "__root__"
      ? "최상위"
      : dragOver
      ? items.find((n) => n.id === dragOver)?.title ?? null
      : null;

  function renderNodes(list: TNode[], depth: number): React.ReactNode {
    return (
      <ul className="tw-ul">
        {list.map((node) => {
          const isOpen = expanded.has(node.id);
          const active = node.slug === activeSlug;
          const indent = 8 + depth * 14;
          return (
            <li key={node.id}>
              <div
                className={`tree-row${active ? " active" : ""}${
                  dragOver === node.id ? " dnd-over" : ""
                }${dragId === node.id ? " dnd-dragging" : ""}${
                  justMovedId === node.id ? " tw-flash" : ""
                }`}
                style={{ paddingLeft: indent }}
                data-node-id={node.id}
                data-folder={node.is_folder ? "1" : "0"}
              >
                {node.is_folder ? (
                  <button
                    className="tw-chev"
                    onClick={() => toggle(node.id)}
                    aria-label="펼치기/접기"
                  >
                    {node.children.length ? (isOpen ? "▾" : "▸") : "·"}
                  </button>
                ) : (
                  <span className="tw-chev" />
                )}
                <span
                  className="tw-grip"
                  title="드래그하여 이동"
                  onMouseDown={(e) => startDrag(e, node)}
                >
                  ⠿
                </span>
                <span className="tw-icon">{node.is_folder ? "📁" : "📄"}</span>

                {renamingId === node.id ? (
                  <input
                    autoFocus
                    className="tw-input"
                    value={renameVal}
                    onChange={(e) => setRenameVal(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") rename(node.id);
                      if (e.key === "Escape") setRenamingId(null);
                    }}
                    onBlur={() => rename(node.id)}
                  />
                ) : node.is_folder ? (
                  <button className="tw-label" onClick={() => toggle(node.id)}>
                    {node.title}
                  </button>
                ) : (
                  <Link className="tw-label" href={`/wiki/${node.slug}`}>
                    {node.title}
                  </Link>
                )}

                <span className="tw-actions">
                  {node.is_folder && (
                    <>
                      <Link
                        href={`/wiki/new?parent=${node.id}`}
                        className="tw-act"
                        title="이 폴더에 새 글"
                      >
                        ＋글
                      </Link>
                      <button
                        className="tw-act"
                        title="새 하위 폴더"
                        onClick={() => {
                          const n = new Set(expanded);
                          n.add(node.id);
                          setExp(n);
                          setNewName("");
                          setCreatingIn(node.id);
                        }}
                      >
                        ＋폴더
                      </button>
                      <button
                        className="tw-act"
                        title="이름 변경"
                        onClick={() => {
                          setRenameVal(node.title);
                          setRenamingId(node.id);
                        }}
                      >
                        ✎
                      </button>
                    </>
                  )}
                  <button
                    className="tw-act"
                    title="삭제"
                    onClick={() => remove(node)}
                  >
                    🗑
                  </button>
                </span>
              </div>

              {creatingIn === node.id && (
                <div className="tree-row" style={{ paddingLeft: indent + 14 }}>
                  <span className="tw-chev" />
                  <span className="tw-icon">📁</span>
                  <input
                    autoFocus
                    className="tw-input"
                    placeholder="새 폴더 이름"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") createFolder(node.id);
                      if (e.key === "Escape") setCreatingIn(null);
                    }}
                    onBlur={() => createFolder(node.id)}
                  />
                </div>
              )}

              {node.is_folder &&
                isOpen &&
                node.children.length > 0 &&
                renderNodes(node.children, depth + 1)}
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <aside
      className="wiki-sidebar"
      style={dragId ? { userSelect: "none" } : undefined}
    >
      <div className="tw-toolbar">
        <span className="tw-title">📚 문서</span>
        <div className="tw-tools">
          <button className="tw-tool" title="모두 펼치기" onClick={expandAll}>
            ⊞ 펼치기
          </button>
          <button className="tw-tool" title="모두 접기" onClick={collapseAll}>
            ⊟ 접기
          </button>
          <button
            className="tw-tool"
            title="새 폴더"
            onClick={() => {
              setNewName("");
              setCreatingIn("root");
            }}
          >
            📁＋
          </button>
        </div>
      </div>

      {creatingIn === "root" && (
        <div className="tree-row" style={{ paddingLeft: 8 }}>
          <span className="tw-chev" />
          <span className="tw-icon">📁</span>
          <input
            autoFocus
            className="tw-input"
            placeholder="새 폴더 이름"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") createFolder(null);
              if (e.key === "Escape") setCreatingIn(null);
            }}
            onBlur={() => createFolder(null)}
          />
        </div>
      )}

      {forest.length === 0 ? (
        <p className="muted" style={{ padding: "10px 12px", fontSize: 13 }}>
          아직 문서가 없어요. 위 📁＋ 로 폴더를, 헤더의 ✏️ 새 글 버튼으로 글을 만들어보세요.
        </p>
      ) : (
        <div
          className={`tw-root${
            dragId && dragOver === "__root__" ? " dnd-rootover" : ""
          }`}
        >
          {renderNodes(forest, 0)}
        </div>
      )}

      {dragId && dragPos && (
        <div
          className="tw-dragchip"
          style={{ left: dragPos.x + 14, top: dragPos.y + 12 }}
        >
          {dragTitle}
          {overTitle && <span className="tw-dragchip-to"> → {overTitle}</span>}
        </div>
      )}
    </aside>
  );
}
