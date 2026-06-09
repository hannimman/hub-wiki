"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
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

export default function MarkdownView({ content }: { content: string }) {
  return (
    <div className="markdown-body">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code(props) {
            const { className, children } = props;
            const match = /language-(\w+)/.exec(className || "");
            const text = String(children).replace(/\n$/, "");
            if (match && match[1] === "mermaid") {
              return <MermaidDiagram chart={text} />;
            }
            return <code className={className}>{children}</code>;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
