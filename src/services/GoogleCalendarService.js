import AsyncStorage from "@react-native-async-storage/async-storage";

const getAccessToken = async () => {
    console.log("Retrieving access token from storage");
    try {
        const tokenData = await AsyncStorage.getItem('token');
        // console.log("Retrieved token data:", tokenData);
        return tokenData;
    } catch (error) {
        console.error("Error getting access token:", error);
    }
};

const baseUrl = 'https://www.googleapis.com/calendar/v3';
const calendarId = 'primary';

export const getEvents = async () => {
    const accessToken = await getAccessToken();
    // console.log("Access token used:", accessToken);
    if (!accessToken) {
        console.error("No access token found");
        return [];
    }

    let events = [];
    let pageToken = null;

    try {
        do {
            const url = new URL(`${baseUrl}/calendars/${calendarId}/events`);
            url.searchParams.append("maxResults", "2500"); // Max allowed
            url.searchParams.append("singleEvents", "true"); // Expand recurring events
            url.searchParams.append("orderBy", "startTime");
            url.searchParams.append("timeMin", new Date().toISOString()); // Only future events
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

            const data = await response.json();
            console.log("Fetched batch:", data.items?.length || 0);

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
