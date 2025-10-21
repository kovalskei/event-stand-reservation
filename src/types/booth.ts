export type BoothStatus = 'available' | 'booked' | 'unavailable';

export interface Booth {
  id: string;
  number: string;
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
}

export interface Event {
  id: string;
  name: string;
  date: string;
  location: string;
  mapUrl: string;
  sheetId: string;
}

export const mockEvents: Event[] = [
  {
    id: '1',
    name: 'Выставка 2025',
    date: '15-20 марта 2025',
    location: 'Павильон 1',
    mapUrl: 'https://cdn.poehali.dev/files/84989299-cef8-4fc0-a2cd-b8106a39b96d.png',
    sheetId: '',
  },
  {
    id: '2',
    name: 'Tech Forum 2025',
    date: '5-10 апреля 2025',
    location: 'Павильон 2',
    mapUrl: 'https://cdn.poehali.dev/files/84989299-cef8-4fc0-a2cd-b8106a39b96d.png',
    sheetId: '',
  },
];

export const initialBooths: Booth[] = [
  { id: 'A1', number: 'A1', status: 'available' },
  { id: 'A2', number: 'A2', status: 'booked', company: 'ТехноПром', contact: 'Иванов И.И.', price: '50 000 ₽', size: '3x3 м' },
  { id: 'A3', number: 'A3', status: 'available' },
  { id: 'A4', number: 'A4', status: 'available' },
  { id: 'A5', number: 'A5', status: 'booked', company: 'ИнноВейт', contact: 'Петрова А.С.', price: '50 000 ₽', size: '3x3 м' },
  { id: 'A6', number: 'A6', status: 'available' },
  { id: 'A7', number: 'A7', status: 'available' },
  { id: 'A8', number: 'A8', status: 'available' },
  { id: 'A9', number: 'A9', status: 'available' },
  { id: 'A10', number: 'A10', status: 'booked', company: 'МегаСтрой', contact: 'Сидоров П.П.', price: '50 000 ₽', size: '3x3 м' },
  { id: 'A11', number: 'A11', status: 'available' },
  { id: 'A12', number: 'A12', status: 'available' },
  { id: 'B1', number: 'B1', status: 'available' },
  { id: 'B2', number: 'B2', status: 'available' },
  { id: 'B3', number: 'B3', status: 'booked', company: 'ЭкоЛайн', contact: 'Морозова Е.В.', price: '75 000 ₽', size: '4x4 м' },
];

export const defaultPositions: BoothPosition[] = [
  { id: 'A1', x: 19, y: 18, width: 5, height: 10.5 },
  { id: 'A2', x: 24.15, y: 18, width: 5, height: 10.5 },
  { id: 'A3', x: 29.3, y: 18, width: 5, height: 10.5 },
  { id: 'A4', x: 34.45, y: 18, width: 5, height: 10.5 },
  { id: 'A5', x: 39.6, y: 18, width: 5, height: 10.5 },
  { id: 'A6', x: 44.75, y: 18, width: 5, height: 10.5 },
  { id: 'A7', x: 49.9, y: 18, width: 5, height: 10.5 },
  { id: 'A8', x: 55.05, y: 18, width: 5, height: 10.5 },
  { id: 'A9', x: 60.2, y: 18, width: 5, height: 10.5 },
  { id: 'A10', x: 65.35, y: 18, width: 5, height: 10.5 },
  { id: 'A11', x: 70.5, y: 18, width: 5, height: 10.5 },
  { id: 'A12', x: 75.65, y: 18, width: 5, height: 10.5 },
  { id: 'B1', x: 43, y: 50.5, width: 4.5, height: 10.5 },
  { id: 'B2', x: 47.8, y: 50.5, width: 4.5, height: 10.5 },
  { id: 'B3', x: 52.6, y: 50.5, width: 4.5, height: 10.5 },
];