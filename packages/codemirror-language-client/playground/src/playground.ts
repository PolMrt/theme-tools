import { basicSetup } from 'codemirror';
import { EditorView } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import MarkdownIt from 'markdown-it';
// import { oneDark } from '@codemirror/theme-one-dark';
// import { liquid, liquidHighLightStyle } from '@shopify/lang-liquid';

import { CodeMirrorLanguageClient } from '@shopify/codemirror-language-client';
import * as SetFileTreeNotification from './SetFileTreeNotification';
import * as SetDefaultTranslationsNotification from './SetDefaultTranslationsNotification';
import { MarkupContent } from 'vscode-languageserver-protocol';

const md = new MarkdownIt();

const exampleTemplate = `<!doctype html>
<html class="no-js" lang="{{ request.locale.iso_code }}">
  <head>
    {{ 'theme.js' | asset_url | script_tag }}
    {{ content_for_header }}
  </head>

  <body class="gradient">
    {{ content_for_layout }}
  </body>
</html>`;

async function main() {
  const worker = new Worker(new URL('./language-server-worker.ts', import.meta.url));

  const client = new CodeMirrorLanguageClient(
    worker,
    {},
    {
      infoRenderer: (completionItem) => {
        if (!completionItem.documentation || typeof completionItem.documentation === 'string') {
          return null;
        }
        const node = document.createElement('div');
        const htmlString = md.render(completionItem.documentation.value);
        node.innerHTML = htmlString;
        return node;
      },
      hoverRenderer: (_, hover) => {
        const node = document.createElement('div');
        if (MarkupContent.is(hover.contents)) {
          const htmlString = md.render(hover.contents.value);
          node.innerHTML = htmlString;
        }
        return {
          dom: node,
        };
      },
      onDocumentLinkClick: (target) => {
        debugger;
      }
    },
  );

  await client.start();

  // Mock "main-thread-provided" value for the filetree
  worker.postMessage({
    jsonrpc: '2.0',
    method: SetFileTreeNotification.method,
    params: [
      '/snippets/article-card.liquid',
      '/snippets/product-card.liquid',
      '/snippets/product.liquid',
    ],
  } as SetFileTreeNotification.type);

  // Mock "main-thread-provided" value for the default translations
  worker.postMessage({
    jsonrpc: '2.0',
    method: SetDefaultTranslationsNotification.method,
    params: {
      product: {
        price: 'Price',
        size: 'Size',
      },
      footer: {
        subscribe: 'Subscribe to our newsletter',
      },
    },
  } as SetDefaultTranslationsNotification.type);

  new EditorView({
    state: EditorState.create({
      doc: exampleTemplate,
      extensions: [
        basicSetup,
        // liquid(),
        // liquidHighLightStyle,
        // oneDark,
        client.extension('browser:///input.liquid'),
      ],
    }),
    parent: document.getElementById('editor')!,
  });
}

main();
