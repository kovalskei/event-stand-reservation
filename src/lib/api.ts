const API_URL = 'https://functions.poehali.dev/c9b46bff-046e-40ca-b12e-632b8ad7462f';

const FUNCTION_URLS: Record<string, string> = {
  'upload-image': 'https://functions.poehali.dev/dda5eec5-ce80-45f7-b5b4-bc8a3896d9c9',
  'events': 'https://functions.poehali.dev/c9b46bff-046e-40ca-b12e-632b8ad7462f',
  'detect-booths': 'https://functions.poehali.dev/c2e9e565-4a01-4b37-8c5b-7853ae94e5bd',
  'google-sheets': 'https://functions.poehali.dev/0a047b83-702c-4547-ae04-ff2dd383ee27'
};

export interface Event {
  id: number;
  user_id: number;
  name: string;
  date: string;
  location: string;
  created_at: string;
  updated_at: string;
  map_url?: string;
  sheet_url?: string;
}

export interface Booth {
  id: string;
  event_id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  status: string;
  company?: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  notes?: string;
}

export const api = {
  getFunctionUrl(functionName: string): string {
    const url = FUNCTION_URLS[functionName];
    if (!url) {
      throw new Error(`Function URL not found for: ${functionName}`);
    }
    return url;
  },

  async getEvents(userEmail: string): Promise<Event[]> {
    const response = await fetch(API_URL, {
      method: 'GET',
      headers: {
        'X-User-Email': userEmail,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch events');
    }
    
    return response.json();
  },

  async createEvent(userEmail: string, data: { name: string; date: string; location: string }): Promise<Event> {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Email': userEmail,
      },
      body: JSON.stringify({
        action: 'create_event',
        ...data,
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to create event');
    }
    
    return response.json();
  },

  async getBooths(eventId: number): Promise<{ booths: Booth[], sheet_url: string | null }> {
    const response = await fetch(`${API_URL}?event_id=${eventId}`, {
      method: 'GET',
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch booths');
    }
    
    return response.json();
  },

  async saveBooths(eventId: number, booths: any[]): Promise<{ success: boolean }> {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'save_booths',
        event_id: eventId,
        booths: booths.map(b => ({
          id: b.id,
          x: b.x,
          y: b.y,
          width: b.width,
          height: b.height,
          rotation: b.rotation || 0,
          status: b.status,
          company: b.company,
          contactPerson: b.contactPerson,
          phone: b.phone,
          email: b.email,
          notes: b.notes,
        })),
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to save booths');
    }
    
    return response.json();
  },

  async saveSheetUrl(eventId: number, sheetUrl: string): Promise<{ success: boolean }> {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'update_sheet_url',
        event_id: eventId,
        sheet_url: sheetUrl,
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to save sheet URL');
    }
    
    return response.json();
  },
};