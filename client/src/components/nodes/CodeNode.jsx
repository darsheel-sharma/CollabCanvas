import Editor from "@monaco-editor/react";

export function CodeNode({ data }) {
  return (
    <article className="workspace-node">
      <header className="node-drag-handle">
        <strong>{data.label}</strong>
        <span>Monaco + Yjs ready</span>
      </header>
      <div className="node-body nodrag">
        <Editor
          height="220px"
          defaultLanguage="javascript"
          value={data.code}
          onChange={(value) => data.onCodeChange?.(value ?? "", data.docKey)}
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
