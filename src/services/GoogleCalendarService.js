import AsyncStorage from "@react-native-async-storage/async-storage";

const getAccessToken = async() => {
    console.log("Retrieving access token from storage");
    try {
        const tokenData = await AsyncStorage.getItem('token');
        console.log("Retrieved token data:", tokenData);
        return tokenData;
    } catch (error) {
        console.error("Error getting access token:", error);
    }
};

const baseUrl = 'https://www.googleapis.com/calendar/v3';
const calendarId = 'primary';

export const getEvents = async () => {
    const accessToken = await getAccessToken();
    console.log("Access token used:", accessToken);
    if (!accessToken) {
        console.error("No access token found");
        return [];
    }
    try {
        const response = await fetch(
            `${baseUrl}/calendars/${calendarId}/events`,
            {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
            }
        );
        const data = await response.json();
        console.log("Fetched events:", data);
        return data.items;
    } catch (error) {
        console.error("Error fetching events:", error);
        return [];
    }
};

