// Editor de código: Monaco (el editor de VS Code) desde CDN, con respaldo a <textarea> si no hay internet.
const MONACO_BASE = 'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min';
let monacoPromise = null;

function loadMonaco() {
  if (monacoPromise) return monacoPromise;
  monacoPromise = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('timeout')), 10000);
    const script = document.createElement('script');
    script.src = `${MONACO_BASE}/vs/loader.js`;
    script.onerror = () => reject(new Error('No se pudo cargar Monaco'));
    script.onload = () => {
      window.MonacoEnvironment = {
        getWorkerUrl: () =>
          `data:text/javascript;charset=utf-8,${encodeURIComponent(
            `self.MonacoEnvironment={baseUrl:'${MONACO_BASE}/'};importScripts('${MONACO_BASE}/vs/base/worker/workerMain.js');`,
          )}`,
      };
      window.require.config({ paths: { vs: `${MONACO_BASE}/vs` } });
      window.require(['vs/editor/editor.main'], () => {
        clearTimeout(timeout);
        setupMonaco(window.monaco);
        resolve(window.monaco);
      }, reject);
    };
    document.head.appendChild(script);
  });
  return monacoPromise;
}

function setupMonaco(monaco) {
  monaco.editor.defineTheme('coderush', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: '', foreground: 'ece6d8' },
      { token: 'comment', foreground: '7d766a', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'ff8a5c' },
      { token: 'string', foreground: 'c4d98a' },
      { token: 'number', foreground: 'ffd84d' },
      { token: 'type', foreground: '8fb8ff' },
      { token: 'type.identifier', foreground: '8fb8ff' },
    ],
    colors: {
      'editor.background': '#171512',
      'editor.foreground': '#ece6d8',
      'editor.lineHighlightBackground': '#211e1a',
      'editor.lineHighlightBorder': '#00000000',
      'editorLineNumber.foreground': '#4d473f',
      'editorLineNumber.activeForeground': '#ffd84d',
      'editorCursor.foreground': '#ff5a1f',
      'editor.selectionBackground': '#4a3f30',
      'editorIndentGuide.background1': '#2a2620',
      'editorError.foreground': '#ff6b5a',
      'editorWidget.background': '#211e1a',
      'editorWidget.border': '#4d473f',
      'editorHoverWidget.background': '#211e1a',
      'editorHoverWidget.border': '#ff5a1f',
      'editorSuggestWidget.background': '#211e1a',
      'editorSuggestWidget.border': '#4d473f',
      'editorSuggestWidget.selectedBackground': '#3a332a',
    },
  });
  // TS: comprobación de tipos en vivo, ignorando "falta return" mientras escribes y variables sin usar.
  const ts = monaco.languages.typescript;
  ts.typescriptDefaults.setDiagnosticsOptions({ diagnosticCodesToIgnore: [2355, 6133, 6196, 2393] });
  ts.typescriptDefaults.setCompilerOptions({ target: ts.ScriptTarget.ES2022, strict: true, allowNonTsExtensions: true, lib: ['es2022'] });
  ts.javascriptDefaults.setDiagnosticsOptions({ diagnosticCodesToIgnore: [2393] });
  ts.javascriptDefaults.setCompilerOptions({ target: ts.ScriptTarget.ES2022, allowNonTsExtensions: true, lib: ['es2022'] });
}

export async function createEditor(container, { language, value, onChange, onRun, onSubmit }) {
  try {
    const monaco = await loadMonaco();
    container.innerHTML = '';
    let model = monaco.editor.createModel(value, language);
    const editor = monaco.editor.create(container, {
      model,
      theme: 'coderush',
      fontFamily: "'IBM Plex Mono', Consolas, monospace",
      fontSize: 14,
      fontLigatures: true,
      minimap: { enabled: false },
      automaticLayout: true,
      scrollBeyondLastLine: false,
      tabSize: language === 'python' ? 4 : 2,
      padding: { top: 14, bottom: 14 },
      smoothScrolling: true,
      cursorBlinking: 'smooth',
      cursorSmoothCaretAnimation: 'on',
      renderLineHighlight: 'all',
      bracketPairColorization: { enabled: true },
      fixedOverflowWidgets: true,
      acceptSuggestionOnEnter: 'off', // Enter siempre es salto de línea; Tab acepta sugerencias
      wordBasedSuggestions: 'currentDocument',
    });
    const errorDeco = editor.createDecorationsCollection();
    const clearMarks = () => {
      monaco.editor.setModelMarkers(model, 'coderush', []);
      errorDeco.clear();
    };
    editor.onDidChangeModelContent(() => onChange?.(editor.getValue()));
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => onRun?.());
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.Enter, () => onSubmit?.());
    return {
      getValue: () => editor.getValue(),
      setValue: (v) => editor.setValue(v),
      setLanguage(lang, v) {
        const old = model;
        model = monaco.editor.createModel(v, lang);
        editor.setModel(model);
        editor.updateOptions({ tabSize: lang === 'python' ? 4 : 2 });
        old.dispose();
      },
      // Señala la línea del error: subrayado, fondo y mensaje al pasar el ratón.
      markError(line, message) {
        clearMarks();
        if (!line || line > model.getLineCount()) return;
        monaco.editor.setModelMarkers(model, 'coderush', [{
          startLineNumber: line,
          endLineNumber: line,
          startColumn: model.getLineFirstNonWhitespaceColumn(line) || 1,
          endColumn: model.getLineMaxColumn(line),
          message,
          severity: monaco.MarkerSeverity.Error,
        }]);
        errorDeco.set([{ range: new monaco.Range(line, 1, line, 1), options: { isWholeLine: true, className: 'err-line', linesDecorationsClassName: 'err-gutter' } }]);
      },
      clearMarks,
      goTo(line) {
        if (!line) return;
        editor.revealLineInCenter(line);
        editor.setPosition({ lineNumber: line, column: model.getLineMaxColumn(line) });
        editor.focus();
      },
      focus: () => editor.focus(),
      dispose() {
        editor.dispose();
        model.dispose();
      },
    };
  } catch {
    return createFallback(container, { value, onChange, onRun, onSubmit });
  }
}

function createFallback(container, { value, onChange, onRun, onSubmit }) {
  container.innerHTML = '<textarea class="fallback-editor" spellcheck="false"></textarea>';
  const ta = container.querySelector('textarea');
  ta.value = value;
  ta.addEventListener('input', () => onChange?.(ta.value));
  ta.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      e.shiftKey ? onSubmit?.() : onRun?.();
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const { selectionStart: s, selectionEnd: end } = ta;
      ta.setRangeText('    ', s, end, 'end');
      onChange?.(ta.value);
    }
  });
  return {
    getValue: () => ta.value,
    setValue: (v) => (ta.value = v),
    setLanguage: (_lang, v) => (ta.value = v),
    markError: () => {},
    clearMarks: () => {},
    goTo(line) {
      const lines = ta.value.split('\n');
      const start = lines.slice(0, line - 1).join('\n').length + (line > 1 ? 1 : 0);
      ta.focus();
      ta.setSelectionRange(start, start + (lines[line - 1] ?? '').length);
    },
    focus: () => ta.focus(),
    dispose: () => {},
  };
}
