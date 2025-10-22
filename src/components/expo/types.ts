export type BoothStatus = 'available' | 'booked' | 'unavailable';

export interface Booth {
  id: string;
  status: BoothStatus;
  company?: string;
  contact?: string;
  price?: string;
  size?: string;
}

export interface BoothPosition {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
}

export interface Event {
  id: string;
  name: string;
  date: string;
  location: string;
  mapUrl: string;
  sheetId: string;
}

export interface Grid {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  rows: number;
  cols: number;
}
