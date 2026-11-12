/** A Seattle Services Portal record, shared by the server source and the report UI. */
export interface PortalRecord {
  number: string;
  type: string;
  status: string;
  date: string;
  description: string;
  /** The record's own page on the official portal, where the portal has stable record links. */
  url?: string;
}

/** Statuses that mean the record is finished. Anything else is still open. */
export const CLOSED = /complete|closed|finaled|final|issued|expired|withdrawn|cancel|void|approved/i;
