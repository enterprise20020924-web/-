import { decodeGzipJson } from '../compressed-json';
import { BATTLE_DOCUMENT_GZIP } from './generated/battle-document';

let documentPromise: Promise<string> | undefined;
export function getBattleDocument() {
  documentPromise ??= decodeGzipJson<string>(BATTLE_DOCUMENT_GZIP).then(html =>
    html.replace(
      '</head>',
      '<link rel="stylesheet" href="https://testingcf.jsdelivr.net/npm/@fortawesome/fontawesome-free/css/all.min.css">' +
        '<style>html,body{margin:0;padding:0;overflow-x:hidden}#app{display:flow-root}</style></head>',
    ),
  );
  return documentPromise;
}
