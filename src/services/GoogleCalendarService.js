import AsyncStorage from "@react-native-async-storage/async-storage";

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

// GET - Fetch all events
export const getEvents = async () => {
    const accessToken = await getAccessToken();
    if (!accessToken) {
        console.error("No access token found");
        return [];
    }

    let events = [];
    let pageToken = null;

    try {
        do {
            const url = new URL(`${baseUrl}/calendars/${calendarId}/events`);
            url.searchParams.append("maxResults", "2500");
            url.searchParams.append("singleEvents", "true");
            url.searchParams.append("orderBy", "startTime");
            url.searchParams.append("timeMin", new Date().toISOString());
            if (pageToken) {
                url.searchParams.append("pageToken", pageToken);
            }

            const response = await fetch(url.toString(), {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.items) {
                events = [...events, ...data.items];
            }
            pageToken = data.nextPageToken;
        } while (pageToken);

        console.log("Total events fetched:", events.length);
        return events;
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
        // Create start and end of day
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const url = new URL(`${baseUrl}/calendars/${calendarId}/events`);
        url.searchParams.append("timeMin", startOfDay.toISOString());
        url.searchParams.append("timeMax", endOfDay.toISOString());
        url.searchParams.append("singleEvents", "true");
        url.searchParams.append("orderBy", "startTime");

        const response = await fetch(url.toString(), {
            method: "GET",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data.items || [];
    } catch (error) {
        console.error("Error fetching events for date:", error);
        return [];
    }
};

// CREATE - Add new event
export const createEvent = async (eventData) => {
    const accessToken = await getAccessToken();
    if (!accessToken) {
        throw new Error("No access token found");
    }

    try {
        const url = `${baseUrl}/calendars/${calendarId}/events`;

        const response = await fetch(url, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
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

// UPDATE - Edit existing event
export const updateEvent = async (eventId, eventData) => {
    const accessToken = await getAccessToken();
    if (!accessToken) {
        throw new Error("No access token found");
    }

    try {
        const url = `${baseUrl}/calendars/${calendarId}/events/${eventId}`;

        const response = await fetch(url, {
            method: "PUT",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
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

// DELETE - Remove event
export const deleteEvent = async (eventId) => {
    const accessToken = await getAccessToken();
    if (!accessToken) {
        throw new Error("No access token found");
    }

    try {
        const url = `${baseUrl}/calendars/${calendarId}/events/${eventId}`;

        const response = await fetch(url, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
        });

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