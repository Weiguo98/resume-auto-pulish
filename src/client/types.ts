export interface Note {
  at: number;
  kind: "ai" | "error";
  text: string;
  link?: string;
}

export interface PendingMessage {
  message: string;
  file?: string;
  status?: string;
  startedAt: number;
}
