import { useEffect, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import { MonacoBinding } from "y-monaco";
import { NodeResizer } from "reactflow";
import { useWorkspaceStore } from "../../store/workspaceStore.js";

/**
 * A custom ReactFlow node that embeds a Monaco code editor.
 * Uses `y-monaco` to provide real-time collaborative text editing with presence awareness.
 */
export function CodeNode({ data, id, selected }) {
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const bindingRef = useRef(null);
  const deleteNode = useWorkspaceStore((state) => state.deleteNode);
  const [isEditorReady, setIsEditorReady] = useState(false);

  const handleDelete = (e) => {
    e.stopPropagation();
    if (window.confirm("Delete this code node?")) {
      deleteNode(id);
    }
  };

  useEffect(() => {
    if (
      !isEditorReady ||
      !editorRef.current ||
      !monacoRef.current ||
      !data.yDoc ||
      !data.docKey
    ) {
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
  }, [data.awareness, data.docKey, data.yDoc, isEditorReady]);

  return (
    <>
      <NodeResizer
        minWidth={0}
        minHeight={0}
        isVisible={selected}
        lineClassName="!border-amber-500 !border-2 !rounded-[20px]"
        handleClassName="!w-4 !h-4 !bg-white !border-2 !border-amber-500 !rounded-full !shadow-md hover:!scale-115 active:!scale-95 transition-transform duration-100"
      />
      
      <article
        className={`group relative w-full h-full overflow-hidden rounded-[20px] border-[5px] bg-slate-950 flex flex-col transition-all duration-200 select-none shadow-[0_20px_50px_rgba(19,32,51,0.2)] ${
          selected 
            ? "border-amber-500 ring-2 ring-amber-500/20 scale-[1.01]" 
            : "border-slate-800 hover:border-slate-700"
        }`}
      >
        <button
          onClick={handleDelete}
          className="absolute top-3 right-3 z-20 p-1.5 rounded-full bg-slate-950/80 hover:bg-red-600/90 text-white opacity-0 group-hover:opacity-100 transition-all shadow-md focus:outline-none"
          title="Delete code node"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>

        {/* Editor Container with border margin bounds for easy resize grabbing */}
        <div className="nodrag w-full flex-1 p-2.5 bg-slate-950 flex flex-col justify-stretch">
          <div className="w-full h-full rounded-[12px] overflow-hidden border border-slate-900 shadow-inner">
            <Editor
              height="100%"
              theme="vs-dark"
              defaultLanguage="javascript"
              defaultValue={data.code}
              onMount={(editor, monaco) => {
                editorRef.current = editor;
                monacoRef.current = monaco;
                setIsEditorReady(true);
              }}
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                fontFamily: "'Fira Code', 'Courier New', Courier, monospace",
                lineNumbersMinChars: 3,
                scrollBeyondLastLine: false,
                wordWrap: "on",
                padding: { top: 12, bottom: 12 },
                backgroundColor: "#020617",
                renderLineHighlight: "all",
                hideCursorInOverviewRuler: true,
                scrollbar: {
                  vertical: "visible",
                  horizontal: "visible",
                  verticalScrollbarSize: 8,
                  horizontalScrollbarSize: 8,
                }
              }}
            />
          </div>
        </div>
      </article>
    </>
  );
}
