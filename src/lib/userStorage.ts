interface BoothPosition {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
}

interface UserEventData {
  boothPositions: BoothPosition[];
  sheetUrl: string;
  lastSync?: string;
  deletedBoothIds?: string[];
}

interface UserData {
  events: Record<string, UserEventData>;
}

const STORAGE_PREFIX = 'booth_app_';

export const userStorage = {
  getUserKey(email: string): string {
    return `${STORAGE_PREFIX}${email.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
  },

  getUserData(email: string): UserData {
    const key = this.getUserKey(email);
    const data = localStorage.getItem(key);
    if (!data) {
      return { events: {} };
    }
    try {
      return JSON.parse(data);
    } catch {
      return { events: {} };
    }
  },

  saveUserData(email: string, data: UserData): void {
    const key = this.getUserKey(email);
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.warn('localStorage quota exceeded, using minimal storage');
      const minimalData: UserData = { events: {} };
      Object.entries(data.events).forEach(([eventId, eventData]) => {
        minimalData.events[eventId] = {
          boothPositions: eventData.boothPositions,
          sheetUrl: eventData.sheetUrl,
          lastSync: eventData.lastSync
        };
      });
      try {
        localStorage.setItem(key, JSON.stringify(minimalData));
      } catch {
        console.error('Failed to save even minimal data to localStorage');
      }
    }
  },

  getEventData(email: string, eventId: string): UserEventData | null {
    const userData = this.getUserData(email);
    return userData.events[eventId] || null;
  },

  saveEventData(email: string, eventId: string, eventData: Partial<UserEventData>): void {
    const userData = this.getUserData(email);
    const currentEventData = userData.events[eventId] || {
      boothPositions: [],
      sheetUrl: ''
    };

    userData.events[eventId] = {
      ...currentEventData,
      ...eventData,
      lastSync: new Date().toISOString()
    };

    this.saveUserData(email, userData);
  },

  saveBoothPositions(email: string, eventId: string, positions: BoothPosition[]): void {
    this.saveEventData(email, eventId, { boothPositions: positions });
  },

  saveSheetUrl(email: string, eventId: string, sheetUrl: string): void {
    this.saveEventData(email, eventId, { sheetUrl });
  },

  saveMapUrl(email: string, eventId: string, mapUrl: string): void {
    // Map URLs are stored in database only, not in localStorage to avoid quota issues
    console.log('Map URL saved to database:', mapUrl);
  },

  clearUserData(email: string): void {
    const key = this.getUserKey(email);
    localStorage.removeItem(key);
  },

  clearEventData(email: string, eventId: string): void {
    const userData = this.getUserData(email);
    delete userData.events[eventId];
    this.saveUserData(email, userData);
  },

  getDeletedBoothIds(email: string, eventId: string): string[] {
    const eventData = this.getEventData(email, eventId);
    return eventData?.deletedBoothIds || [];
  },

  saveDeletedBoothIds(email: string, eventId: string, deletedIds: string[]): void {
    this.saveEventData(email, eventId, { deletedBoothIds: deletedIds });
  }
};