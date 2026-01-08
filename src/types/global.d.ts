export interface JwtPayload {
  id: string;
  email: string;
  provider: string;
}

export interface Operation {
  type: 'insert' | 'delete' | 'retain';
  position: number;
  content?: string;
  length?: number;
}

export interface DocumentContent {
  type: string;
  children: DocumentNode[];
}

export interface DocumentNode {
  type: string;
  content?: TextNode[];
  attrs?: Record<string, any>;
}

export interface TextNode {
  type: string;
  text: string;
  marks?: Mark[];
}

export interface Mark {
  type: string;
  attrs?: Record<string, any>;
}
