import { editor, languages } from 'monaco-editor/esm/vs/editor/editor.api.js';
import { registerMarkerDataProvider } from 'monaco-marker-data-provider';
import { createWorkerManager } from 'monaco-worker-manager';
import { LanguageServiceDefaults } from 'monaco-yaml';

import { languageId } from './constants';
import {
  createCodeActionProvider,
  createCompletionItemProvider,
  createDefinitionProvider,
  createDocumentFormattingEditProvider,
  createDocumentSymbolProvider,
  createHoverProvider,
  createLinkProvider,
  createMarkerDataProvider,
} from './languageFeatures';
import { CreateData, YAMLWorker } from './yaml.worker';

const richEditConfiguration: languages.LanguageConfiguration = {
  comments: {
    lineComment: '#',
  },
  brackets: [
    ['{', '}'],
    ['[', ']'],
    ['(', ')'],
  ],
  autoClosingPairs: [
    { open: '{', close: '}' },
    { open: '[', close: ']' },
    { open: '(', close: ')' },
    { open: '"', close: '"' },
    { open: "'", close: "'" },
  ],
  surroundingPairs: [
    { open: '{', close: '}' },
    { open: '[', close: ']' },
    { open: '(', close: ')' },
    { open: '"', close: '"' },
    { open: "'", close: "'" },
  ],

  onEnterRules: [
    {
      beforeText: /:\s*$/,
      action: { indentAction: languages.IndentAction.Indent },
    },
  ],
};

export function setupMode(defaults: LanguageServiceDefaults): void {
  const worker = createWorkerManager<YAMLWorker, CreateData>(
    { editor },
    {
      label: 'yaml',
      moduleId: 'monaco-yaml/yaml.worker',
      createData: {
        languageSettings: defaults.diagnosticsOptions,
        enableSchemaRequest: defaults.diagnosticsOptions.enableSchemaRequest,
      },
    },
  );

  defaults.onDidChange(() => {
    worker.updateCreateData({
      languageSettings: defaults.diagnosticsOptions,
      enableSchemaRequest: defaults.diagnosticsOptions.enableSchemaRequest,
    });
  });

  languages.registerCompletionItemProvider(
    languageId,
    createCompletionItemProvider(worker.getWorker),
  );
  languages.registerHoverProvider(languageId, createHoverProvider(worker.getWorker));
  languages.registerDefinitionProvider(languageId, createDefinitionProvider(worker.getWorker));
  languages.registerDocumentSymbolProvider(
    languageId,
    createDocumentSymbolProvider(worker.getWorker),
  );
  languages.registerDocumentFormattingEditProvider(
    languageId,
    createDocumentFormattingEditProvider(worker.getWorker),
  );
  languages.registerLinkProvider(languageId, createLinkProvider(worker.getWorker));
  languages.registerCodeActionProvider(languageId, createCodeActionProvider(worker.getWorker));
  languages.setLanguageConfiguration(languageId, richEditConfiguration);

  let markerDataProvider = registerMarkerDataProvider(
    { editor },
    languageId,
    createMarkerDataProvider(worker.getWorker),
  );
  defaults.onDidChange(() => {
    markerDataProvider.dispose();
    markerDataProvider = registerMarkerDataProvider(
      { editor },
      languageId,
      createMarkerDataProvider(worker.getWorker),
    );
  });
}
