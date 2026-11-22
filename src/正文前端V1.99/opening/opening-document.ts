import { decodeGzipJson } from '../compressed-json';
import { OPENING_DOCUMENT_GZIP } from './generated/opening-document';

let documentPromise: Promise<string> | undefined;
export function getOpeningDocument() {
  documentPromise ??= decodeGzipJson<string>(OPENING_DOCUMENT_GZIP).then(html =>
    html.replace(
      '</head>',
      '<link rel="stylesheet" href="https://testingcf.jsdelivr.net/npm/@fortawesome/fontawesome-free/css/all.min.css">' +
        '<style>html,body{margin:0;padding:0;overflow-x:hidden}#app{display:flow-root}</style></head>',
    ),
  );
  return documentPromise;
}
