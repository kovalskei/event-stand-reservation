const API_URL = 'https://functions.poehali.dev/c9b46bff-046e-40ca-b12e-632b8ad7462f';

export interface Event {
  id: number;
  user_id: number;
  name: string;
  date: string;
  location: string;
  created_at: string;
  updated_at: string;
  map_url?: string;
}

export interface Booth {
  id: string;
  event_id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  status: string;
  company?: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  notes?: string;
}

export const api = {
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

  async getBooths(eventId: number): Promise<Booth[]> {
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
};