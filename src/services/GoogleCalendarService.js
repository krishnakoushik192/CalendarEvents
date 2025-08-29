import AsyncStorage from "@react-native-async-storage/async-storage";
import AuthManager from './AuthManager';

const authManager = AuthManager.getInstance();

const getAccessToken = async () => {
    console.log("Retrieving access token from storage");
    try {
        const tokenData = await AsyncStorage.getItem('token');
        return tokenData;
    } catch (error) {
        console.error("Error getting access token:", error);
        return null;
    }
};

const baseUrl = 'https://www.googleapis.com/calendar/v3';
const calendarId = 'primary';

// Helper function to make authenticated requests
const makeAuthenticatedRequest = async (url, options = {}) => {
    return await authManager.makeAuthenticatedRequest(url, options);
};

// GET - Fetch all calendars
export const getCalendarList = async () => {
    const accessToken = await getAccessToken();
    if (!accessToken) {
        console.error("No access token found");
        return [];
    }

    try {
        const url = `${baseUrl}/users/me/calendarList`;
        const response = await makeAuthenticatedRequest(url, { method: "GET" });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log("Available calendars:", data.items?.map(cal => ({ id: cal.id, summary: cal.summary })));
        return data.items || [];
    } catch (error) {
        console.error("Error fetching calendar list:", error);
        return [];
    }
};

// GET - Fetch events from all calendars including holidays
export const getEvents = async () => {
    const accessToken = await getAccessToken();
    if (!accessToken) {
        console.error("No access token found");
        return [];
    }

    try {
        // First get all available calendars
        const calendars = await getCalendarList();
        let allEvents = [];

        // Country-specific holiday calendars using Set to avoid duplicates
        const holidayCalendars = new Set([
            'en.indian#holiday@group.v.calendar.google.com', // Indian holidays
            'en.usa#holiday@group.v.calendar.google.com',    // US holidays
            'en.uk#holiday@group.v.calendar.google.com',     // UK holidays
        ]);

        // Add discovered holiday calendars from the user's calendar list
        calendars.forEach(calendar => {
            if (calendar.id.includes('#holiday@group.v.calendar.google.com') ||
                calendar.summary?.toLowerCase().includes('holiday') ||
                calendar.summary?.toLowerCase().includes('festival')) {
                holidayCalendars.add(calendar.id);
            }
        });

        // Fetch events from primary calendar and all holiday calendars
        const calendarIdsToFetch = ['primary', ...Array.from(holidayCalendars)];

        console.log("Fetching from calendars:", calendarIdsToFetch); // Debug log

        for (const calId of calendarIdsToFetch) {
            let pageToken = null;

            do {
                try {
                    const url = new URL(`${baseUrl}/calendars/${encodeURIComponent(calId)}/events`);
                    url.searchParams.append("maxResults", "2500");
                    url.searchParams.append("singleEvents", "true");
                    url.searchParams.append("orderBy", "startTime");

                    // Fetch events from 1 year ago to 1 year ahead
                    const oneYearAgo = new Date();
                    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
                    const oneYearAhead = new Date();
                    oneYearAhead.setFullYear(oneYearAhead.getFullYear() + 1);

                    url.searchParams.append("timeMin", oneYearAgo.toISOString());
                    url.searchParams.append("timeMax", oneYearAhead.toISOString());

                    if (pageToken) {
                        url.searchParams.append("pageToken", pageToken);
                    }

                    const response = await makeAuthenticatedRequest(url.toString(), { method: "GET" });

                    if (response.ok) {
                        const data = await response.json();

                        if (data.items) {
                            console.log(`Found ${data.items.length} events in calendar: ${calId}`); // Debug log
                            // Add calendar info to each event
                            const eventsWithCalendarInfo = data.items.map(event => ({
                                ...event,
                                calendarId: calId,
                                isHoliday: calId.includes('#holiday@group.v.calendar.google.com'),
                                isEditable: calId === 'primary' // Only primary calendar events are editable
                            }));
                            allEvents = [...allEvents, ...eventsWithCalendarInfo];
                        }
                        pageToken = data.nextPageToken;
                    } else {
                        console.warn(`Failed to fetch events from calendar ${calId}: ${response.status}`);
                        break; // Exit the pagination loop for this calendar
                    }
                } catch (calendarError) {
                    console.warn(`Error fetching from calendar ${calId}:`, calendarError.message);
                    break; // Exit the pagination loop for this calendar
                }
            } while (pageToken);
        }

        console.log(`Total events before deduplication: ${allEvents.length}`);

        // Remove duplicate events (same event ID from different sources)
        const uniqueEvents = allEvents.filter((event, index, self) =>
            index === self.findIndex((e) => e.id === event.id)
        );

        console.log(`Total events after deduplication: ${uniqueEvents.length}`);

        // Sort events by start time
        uniqueEvents.sort((a, b) => {
            const aStart = a.start?.dateTime || a.start?.date || '';
            const bStart = b.start?.dateTime || b.start?.date || '';
            return new Date(aStart) - new Date(bStart);
        });

        return uniqueEvents;
    } catch (error) {
        console.error("Error fetching events:", error);
        return [];
    }
};

// GET - Fetch events for a specific date
export const getEventsForDate = async (date) => {
    const accessToken = await getAccessToken();
    if (!accessToken) {
        console.error("No access token found");
        return [];
    }

    try {
        // Get all calendars
        const calendars = await getCalendarList();
        let allEvents = [];

        // Holiday calendars - using Set to avoid duplicates
        const holidayCalendars = new Set([
            'en.indian#holiday@group.v.calendar.google.com',
            'en.usa#holiday@group.v.calendar.google.com',
            'en.uk#holiday@group.v.calendar.google.com',
        ]);

        // Add discovered holiday calendars (avoid duplicates with Set)
        calendars.forEach(calendar => {
            if (calendar.id.includes('#holiday@group.v.calendar.google.com') ||
                calendar.summary?.toLowerCase().includes('holiday') ||
                calendar.summary?.toLowerCase().includes('festival')) {
                holidayCalendars.add(calendar.id);
            }
        });

        // Convert Set back to array and add primary calendar
        const calendarIdsToFetch = ['primary', ...Array.from(holidayCalendars)];

        console.log("Fetching from calendars:", calendarIdsToFetch); // Debug log

        // Create start and end of day
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        for (const calId of calendarIdsToFetch) {
            try {
                const url = new URL(`${baseUrl}/calendars/${encodeURIComponent(calId)}/events`);
                url.searchParams.append("timeMin", startOfDay.toISOString());
                url.searchParams.append("timeMax", endOfDay.toISOString());
                url.searchParams.append("singleEvents", "true");
                url.searchParams.append("orderBy", "startTime");

                const response = await makeAuthenticatedRequest(url.toString(), { method: "GET" });

                if (response.ok) {
                    const data = await response.json();
                    if (data.items) {
                        console.log(`Found ${data.items.length} events in calendar: ${calId}`); // Debug log
                        const eventsWithCalendarInfo = data.items.map(event => ({
                            ...event,
                            calendarId: calId,
                            isHoliday: calId.includes('#holiday@group.v.calendar.google.com'),
                            isEditable: calId === 'primary'
                        }));
                        allEvents = [...allEvents, ...eventsWithCalendarInfo];
                    }
                }
            } catch (calendarError) {
                console.warn(`Error fetching from calendar ${calId}:`, calendarError.message);
            }
        }

        console.log(`Total events before deduplication: ${allEvents.length}`); // Debug log

        // Remove duplicate events (same event ID from different calendar sources)
        const uniqueEvents = allEvents.filter((event, index, self) =>
            index === self.findIndex((e) => e.id === event.id)
        );

        console.log(`Total events after deduplication: ${uniqueEvents.length}`); // Debug log

        // Sort by start time
        uniqueEvents.sort((a, b) => {
            const aStart = a.start?.dateTime || a.start?.date || '';
            const bStart = b.start?.dateTime || b.start?.date || '';
            return new Date(aStart) - new Date(bStart);
        });

        return uniqueEvents;
    } catch (error) {
        console.error("Error fetching events for date:", error);
        return [];
    }
};

// CREATE - Add new event (only for primary calendar)
export const createEvent = async (eventData) => {
    const accessToken = await getAccessToken();
    if (!accessToken) {
        throw new Error("No access token found");
    }

    try {
        const url = `${baseUrl}/calendars/${calendarId}/events`;
        const response = await makeAuthenticatedRequest(url, {
            method: "POST",
            body: JSON.stringify(eventData),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.error?.message || 'Unknown error'}`);
        }

        const data = await response.json();
        console.log("Event created successfully:", data.id);
        return data;
    } catch (error) {
        console.error("Error creating event:", error);
        throw error;
    }
};

// UPDATE - Edit existing event (only for primary calendar events)
export const updateEvent = async (eventId, eventData) => {
    const accessToken = await getAccessToken();
    if (!accessToken) {
        throw new Error("No access token found");
    }

    try {
        const url = `${baseUrl}/calendars/${calendarId}/events/${eventId}`;
        const response = await makeAuthenticatedRequest(url, {
            method: "PUT",
            body: JSON.stringify(eventData),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.error?.message || 'Unknown error'}`);
        }

        const data = await response.json();
        console.log("Event updated successfully:", data.id);
        return data;
    } catch (error) {
        console.error("Error updating event:", error);
        throw error;
    }
};

// DELETE - Remove event (only for primary calendar events)
export const deleteEvent = async (eventId) => {
    const accessToken = await getAccessToken();
    if (!accessToken) {
        throw new Error("No access token found");
    }

    try {
        const url = `${baseUrl}/calendars/${calendarId}/events/${eventId}`;
        const response = await makeAuthenticatedRequest(url, { method: "DELETE" });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.error?.message || 'Unknown error'}`);
        }

        console.log("Event deleted successfully:", eventId);
        return true;
    } catch (error) {
        console.error("Error deleting event:", error);
        throw error;
    }
};

// Helper function to format event data for API
export const formatEventForAPI = (title, description, startDateTime, endDateTime, location = '') => {
    return {
        summary: title,
        description: description,
        location: location,
        start: {
            dateTime: startDateTime,
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        end: {
            dateTime: endDateTime,
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        reminders: {
            useDefault: true,
        },
    };
};