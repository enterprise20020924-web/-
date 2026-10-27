import { decodeGzipJson } from '../compressed-json';
import { AMAMI_VECTOR_DATA_GZIP } from './generated/amami-vector-data';

export interface AmamiVectorData {
  transform: string;
  layers: Array<{ opacity: number; d: string }>;
}

// Lossless text compression of vector geometry, not an encoded bitmap.
export const amamiVector = await decodeGzipJson<AmamiVectorData>(AMAMI_VECTOR_DATA_GZIP);
