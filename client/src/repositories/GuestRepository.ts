import { supabase } from '../lib/supabase';

// Define the Guest type based on the users table
export interface Guest {
  id: string;
  display_name: string;
  email: string | null;
  created_at: string;
  updated_at: string;
}

export interface GuestInput {
  display_name: string;
  email?: string;
}

export class GuestRepository {
  /**
   * Adds a guest to an event, creating the user if they don't exist
   */
  static async addGuestToEvent(guest: GuestInput, eventId: string): Promise<Guest> {
    // First, check if user with this email already exists
    let user: Guest | null = null;

    if (guest.email) {
      const { data: existingUser } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('email', guest.email.trim())
        .single();

      if (existingUser) {
        user = existingUser as Guest;
      }
    }

    // If user doesn't exist, fail for now
    if (!user) {
      throw new Error('User needs to be registered');
    }

    // Add user to event_guests
    const { error: eventGuestError } = await supabase
      .from('event_guests')
      .insert({
        event_id: eventId,
        user_id: user.id
      });

    if (eventGuestError) {
      // If it's a duplicate key error, we can ignore it
      if (eventGuestError.code !== '23505') { // 23505 is unique_violation
        throw new Error(`Failed to add guest to event: ${eventGuestError.message}`);
      }
    }

    return user;
  }

  /**
   * Gets all guests for an event
   */
  static async getGuestsForEvent(eventId: string): Promise<Guest[]> {
    // First get all user_ids for this event
    const { data: eventGuests, error: eventGuestsError } = await supabase
      .from('event_guests')
      .select('user_id')
      .eq('event_id', eventId);

    if (eventGuestsError) {
      throw new Error(`Failed to fetch event guests: ${eventGuestsError.message}`);
    }

    if (!eventGuests || eventGuests.length === 0) {
      return [];
    }

    // Then get all users for those user_ids
    const userIds = eventGuests.map(eg => eg.user_id);
    const { data: users, error: usersError } = await supabase
      .from('user_profiles')
      .select('*')
      .in('id', userIds);

    if (usersError) {
      throw new Error(`Failed to fetch users: ${usersError.message}`);
    }

    return users as Guest[];
  }

  /**
   * Gets all guests for all events, organized by event ID
   */
  static async getAllEventGuests(): Promise<Record<string, Guest[]>> {
    // Get all event_guest relationships
    const { data: eventGuests, error: eventGuestsError } = await supabase
      .from('event_guests')
      .select('event_id, user_id');

    if (eventGuestsError) {
      throw new Error(`Failed to fetch event guests: ${eventGuestsError.message}`);
    }

    if (!eventGuests || eventGuests.length === 0) {
      return {};
    }

    // Get all unique user IDs
    const userIds = [...new Set(eventGuests.map(eg => eg.user_id))];

    // Get all users
    const { data: users, error: usersError } = await supabase
      .from('user_profiles')
      .select('*')
      .in('id', userIds);

    if (usersError) {
      throw new Error(`Failed to fetch users: ${usersError.message}`);
    }

    // Create a map of user_id to user object
    const userMap = users.reduce((acc, user) => {
      acc[user.id] = user as Guest;
      return acc;
    }, {} as Record<string, Guest>);

    // Organize guests by event ID
    const guestsByEvent = eventGuests.reduce((acc, { event_id, user_id }) => {
      if (!acc[event_id]) {
        acc[event_id] = [];
      }
      if (userMap[user_id]) {
        acc[event_id].push(userMap[user_id]);
      }
      return acc;
    }, {} as Record<string, Guest[]>);

    return guestsByEvent;
  }
}
