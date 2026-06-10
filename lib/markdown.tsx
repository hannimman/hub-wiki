"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { useEffect, useRef, useState } from "react";

// 위키 마크다운 렌더러.
//  * react-markdown 은 기본적으로 원시 HTML 을 렌더하지 않음 → XSS 안전 (rehype-raw 미사용).
//  * ```mermaid 코드블록은 mermaid 다이어그램으로 렌더. mermaid 는 동적 import 로 지연 로드.
//  * mermaid securityLevel: "strict" → 다이어그램 내 스크립트/클릭 핸들러 차단.

let mermaidInitialized = false;

function MermaidDiagram({ chart }: { chart: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const mermaid = (await import("mermaid")).default;
        if (!mermaidInitialized) {
          mermaid.initialize({
            startOnLoad: false,
            securityLevel: "strict",
            theme: "default",
          });
          mermaidInitialized = true;
        }
        const id = "m" + Math.random().toString(36).slice(2);
        const { svg } = await mermaid.render(id, chart);
        if (!cancelled && ref.current) ref.current.innerHTML = svg;
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [chart]);

  if (error) {
    return (
      <pre
        style={{
          color: "#b71c1c",
          background: "#fdecea",
          padding: 12,
          borderRadius: 8,
          whiteSpace: "pre-wrap",
        }}
      >
        Mermaid 다이어그램 오류:{"\n"}
        {error}
      </pre>
    );
  }
  return <div ref={ref} style={{ textAlign: "center", margin: "16px 0" }} />;
}

// 코드블록 + 복사 버튼 (mermaid 제외)
function CodeBlock({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLPreElement>(null);
  const [copied, setCopied] = useState(false);
  async function copy() {
    const text = ref.current?.innerText ?? "";
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard 미지원 무시 */
    }
  }
  return (
    <div style={{ position: "relative" }}>
      <button
        type="button"
        onClick={copy}
        style={{
          position: "absolute",
          top: 6,
          right: 6,
          fontSize: 12,
          padding: "3px 9px",
          borderRadius: 6,
          border: "1px solid #d0d7de",
          background: "#fff",
          color: "#444",
          cursor: "pointer",
          opacity: 0.9,
        }}
      >
        {copied ? "복사됨 ✓" : "복사"}
      </button>
      <pre ref={ref}>{children}</pre>
    </div>
  );
}

// [[문서제목]] → 내부 링크로 변환.
//  * linkMap 에 있으면 해당 slug 로(파란 링크), 없으면 새 문서 작성 링크로(빨간 링크).
function preprocessWikiLinks(md: string, linkMap?: Record<string, string>): string {
  return md.replace(/\[\[([^\]\n]+)\]\]/g, (_m, raw: string) => {
    const t = raw.trim();
    const slug = linkMap?.[t];
    if (slug) return `[${t}](/wiki/${slug})`;
    return `[${t}](/wiki/new?title=${encodeURIComponent(t)})`;
  });
}

export default function MarkdownView({
  content,
  linkMap,
}: {
  content: string;
  linkMap?: Record<string, string>;
}) {
  const processed = preprocessWikiLinks(content, linkMap);
  return (
    <div className="markdown-body">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[
          [
            rehypeHighlight,
            {
              // 모르는 언어는 에러 없이 평문 처리
              ignoreMissing: true,
              // jsx/tsx/js/ts/java/csharp/bash/sql/xml/html 등은 기본 지원.
              // 추가 별칭: jsp·vue→xml, sql 방언→sql.
              aliases: {
                xml: ["jsp", "vue"],
                sql: ["tsql", "t-sql", "psql", "p-sql", "plsql"],
              },
            },
          ],
        ]}
        components={{
          pre(props) {
            const child = props.children as
              | { type?: unknown; props?: { className?: string } }
              | undefined;
            const cls = child?.props?.className ?? "";
            const isCodeBlock = child?.type === "code" || cls.includes("language-");
            // mermaid 다이어그램 등은 복사버튼 래퍼 없이 그대로
            if (!isCodeBlock) return <>{props.children}</>;
            return <CodeBlock>{props.children}</CodeBlock>;
          },
          code(props) {
            const { className, children } = props;
            const match = /language-(\w+)/.exec(className || "");
            const text = String(children).replace(/\n$/, "");
            if (match && match[1] === "mermaid") {
              return <MermaidDiagram chart={text} />;
            }
            return <code className={className}>{children}</code>;
          },
          a(props) {
            const href = props.href || "";
            const missing = href.startsWith("/wiki/new?title=");
            return (
              <a
                href={href}
                style={{ color: missing ? "#d9534f" : "#3b82f6" }}
                title={missing ? "없는 문서 — 클릭해서 새로 만들기" : undefined}
              >
                {props.children}
              </a>
            );
          },
        }}
      >
        {processed}
      </ReactMarkdown>
    </div>
  );
}
