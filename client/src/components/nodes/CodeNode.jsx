import { useEffect, useRef } from "react";
import Editor from "@monaco-editor/react";
import { MonacoBinding } from "y-monaco";

export function CodeNode({ data }) {
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const bindingRef = useRef(null);

  useEffect(() => {
    if (!editorRef.current || !monacoRef.current || !data.yDoc || !data.docKey) {
      return undefined;
    }

    const model = editorRef.current.getModel();
    if (!model) {
      return undefined;
    }

    const yText = data.yDoc.getText(data.docKey);
    bindingRef.current?.destroy();
    bindingRef.current = new MonacoBinding(
      yText,
      model,
      new Set([editorRef.current]),
      data.awareness ?? undefined,
    );

    return () => {
      bindingRef.current?.destroy();
      bindingRef.current = null;
    };
  }, [data.awareness, data.docKey, data.yDoc]);

  return (
    <article className="overflow-hidden rounded-[18px] border border-slate-900/15 bg-white/96 shadow-[0_14px_32px_rgba(19,32,51,0.12)]">
      <header className="flex cursor-grab items-center justify-between gap-3 bg-slate-950 px-3.5 py-3 text-slate-50 active:cursor-grabbing">
        <strong>{data.label}</strong>
        <span className="text-xs opacity-80">Monaco + Yjs ready</span>
      </header>
      <div className="nodrag p-3.5">
        <Editor
          height="220px"
          defaultLanguage="javascript"
          defaultValue={data.code}
          onMount={(editor, monaco) => {
            editorRef.current = editor;
            monacoRef.current = monaco;
          }}
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            lineNumbersMinChars: 3,
            scrollBeyondLastLine: false,
            wordWrap: "on",
          }}
        />
      </div>
    </article>
  );
}
