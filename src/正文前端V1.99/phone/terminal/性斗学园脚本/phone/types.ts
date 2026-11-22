export type BackstreetMessageSender = 'user' | 'contact' | 'system';
export type BackstreetThreadKind = 'private' | 'group';
export type BackstreetMessageKind = 'text' | 'image';
export type BackstreetImageSource = 'user' | 'novelai';

export interface BackstreetMessage {
  id: string;
  sender: BackstreetMessageSender;
  kind?: BackstreetMessageKind;
  speaker?: string;
  date?: string;
  time: string;
  text: string;
  imageRef?: string;
  imagePrompt?: string;
  imageNegativePrompt?: string;
  imageSource?: BackstreetImageSource;
  imageHiddenFromPrompt?: boolean;
  imageError?: string;
  createdAt: number;
}

export interface BackstreetContact {
  id: string;
  name: string;
  lastMessage: string;
  lastTime: string;
  type?: BackstreetThreadKind;
  members?: string[];
  dissolved?: boolean;
}

export interface BackstreetThreadData {
  contact: string;
  kind?: BackstreetThreadKind;
  groupName?: string;
  members?: string[];
  dissolved?: boolean;
  dissolvedAt?: number;
  updatedAt: number;
  messages: BackstreetMessage[];
}

export interface BackstreetGroup {
  id: string;
  name: string;
  members: string[];
  dissolved?: boolean;
  dissolvedAt?: number;
  lastMessage: string;
  lastTime: string;
  updatedAt: number;
}

export interface PhoneMemoryQuery {
  app: 'backstreet';
  characters: string[];
  keywords: string[];
  locations: string[];
  limit: number;
}

export interface PhoneMemoryHit {
  title: string;
  content: string;
  contact?: string;
  source: string;
  score: number;
}

export interface WorldbookEntry {
  uid?: number | string;
  key?: string[];
  keysecondary?: string[];
  comment?: string;
  content?: string;
  disable?: boolean;
  disabled?: boolean;
  constant?: boolean;
  selective?: boolean;
  selectiveLogic?: number;
  position?: number;
  role?: number;
  depth?: number;
  order?: number;
  probability?: number;
  useProbability?: boolean;
  [key: string]: unknown;
}

export interface WorldbookData {
  entries?: WorldbookEntry[] | Record<string, WorldbookEntry>;
  [key: string]: unknown;
}
