import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions, Alert, RefreshControl, ScrollView } from 'react-native';
import Header from '../components/Header';
import { Calendar } from 'react-native-calendars';
import { getEvents } from '../services/GoogleCalendarService';
import { useFocusEffect } from '@react-navigation/native';

const { height, width } = Dimensions.get('window');

const HomeScreen = (props) => {
  const [events, setEvents] = useState([]);
  const [markedDates, setMarkedDates] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const [todayEvents, setTodayEvents] = useState(0);

  const fetchEvents = async () => {
    try {
      const fetchedEvents = await getEvents();
      console.log("Fetched events count:", fetchedEvents.length);
      setEvents(fetchedEvents);
      markEventDates(fetchedEvents);
      calculateTodayEvents(fetchedEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
      Alert.alert('Error', 'Failed to fetch events');
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchEvents();
    setRefreshing(false);
  }, []);

  // Refresh events when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchEvents();
    }, [])
  );

  // Auto-refresh every 30 seconds when screen is active
  useEffect(() => {
    const interval = setInterval(() => {
      fetchEvents();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, []);

  const calculateTodayEvents = (eventsList) => {
    const today = new Date().toISOString().split('T')[0];
    const count = eventsList.filter(event => {
      let eventDate;
      if (event.start?.dateTime) {
        eventDate = event.start.dateTime.split('T')[0];
      } else if (event.start?.date) {
        eventDate = event.start.date;
      }
      return eventDate === today;
    }).length;
    setTodayEvents(count);
  };

  const markEventDates = (eventsList) => {
    const marked = {};
    const today = new Date().toISOString().split('T')[0];
    
    // Group events by date
    const eventsByDate = {};
    eventsList.forEach(event => {
      let eventDate;
      if (event.start?.dateTime) {
        eventDate = event.start.dateTime.split('T')[0];
      } else if (event.start?.date) {
        eventDate = event.start.date;
      }
      
      if (eventDate) {
        if (!eventsByDate[eventDate]) {
          eventsByDate[eventDate] = 0;
        }
        eventsByDate[eventDate]++;
      }
    });

    // Mark all dates with events
    Object.keys(eventsByDate).forEach(date => {
      const isToday = date === today;
      marked[date] = {
        marked: true,
        dotColor: isToday ? '#ffffff' : '#4285F4', // White dot for today, blue for other days
        activeOpacity: 0.7,
      };
    });

    // Always mark today (even if no events)
    if (!marked[today]) {
      marked[today] = {
        selected: true,
        selectedColor: '#34A853',
        selectedTextColor: '#ffffff',
      };
    } else {
      // If today has events, combine the marking with selection
      marked[today] = {
        ...marked[today],
        selected: true,
        selectedColor: '#34A853',
        selectedTextColor: '#ffffff',
      };
    }

    setMarkedDates(marked);
  };

  const onDayPress = (day) => {
    console.log('selected day', day);
    props.navigation.navigate("EventList", { 
      date: day.dateString,
      dateString: day.dateString 
    });
  };

  const getEventsCount = (date) => {
    return events.filter(event => {
      let eventDate;
      if (event.start?.dateTime) {
        eventDate = event.start.dateTime.split('T')[0];
      } else if (event.start?.date) {
        eventDate = event.start.date;
      }
      return eventDate === date;
    }).length;
  };

  const getDaysWithEvents = () => {
    const uniqueDates = new Set();
    events.forEach(event => {
      let eventDate;
      if (event.start?.dateTime) {
        eventDate = event.start.dateTime.split('T')[0];
      } else if (event.start?.date) {
        eventDate = event.start.date;
      }
      if (eventDate) {
        uniqueDates.add(eventDate);
      }
    });
    return uniqueDates.size;
  };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#4285F4']}
          tintColor="#4285F4"
          progressBackgroundColor="#1a1a1a"
        />
      }
    >
      <Header nav={props.navigation} />
      
      <View style={styles.calendarContainer}>
        <Calendar
          onDayPress={onDayPress}
          markedDates={markedDates}
          markingType={'simple'}
          theme={{
            backgroundColor: '#000000',
            calendarBackground: '#000000',
            textSectionTitleColor: '#ffffff',
            textDayHeaderFontFamily: 'Lato-Regular',
            selectedDayBackgroundColor: '#34A853',
            selectedDayTextColor: '#ffffff',
            todayTextColor: '#34A853',
            dayTextColor: '#ffffff',
            textDisabledColor: '#444444',
            dotColor: '#4285F4',
            selectedDotColor: '#ffffff',
            arrowColor: '#ffffff',
            disabledArrowColor: '#444444',
            monthTextColor: '#ffffff',
            indicatorColor: '#4285F4',
            textMonthFontSize: 22,
            textMonthFontFamily: 'Lato-Bold',
            textDayFontFamily: 'Lato-Regular',
            textDayFontSize: 18,
            textDayHeaderFontSize: 14,
            'stylesheet.calendar.header': {
              week: {
                marginTop: 5,
                flexDirection: 'row',
                justifyContent: 'space-around'
              }
            },
            'stylesheet.day.basic': {
              today: {
                backgroundColor: '#34A853',
                borderRadius: 16,
              },
              todayText: {
                color: '#ffffff',
                fontWeight: 'bold',
              },
            },
          }}
          headerStyle={{ 
            backgroundColor: '#000000', 
            borderBottomWidth: 0,
          }}
          style={styles.calendar}
          enableSwipeMonths={true}
          hideExtraDays={true}
          firstDay={1} // Start week on Monday
        />
      </View>

      {/* Stats Section */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{events.length}</Text>
          <Text style={styles.statLabel}>Total Events</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{todayEvents}</Text>
          <Text style={styles.statLabel}>Today's Events</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{getDaysWithEvents()}</Text>
          <Text style={styles.statLabel}>Days with Events</Text>
        </View>
      </View>

      {/* Legend */}
      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#ffffff' }]} />
          <Text style={styles.legendText}>Today's Events</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#4285F4' }]} />
          <Text style={styles.legendText}>Other Days</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#34A853' }]} />
          <Text style={styles.legendText}>Today</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  calendarContainer: {
    paddingHorizontal: width * 0.02,
    paddingTop: 10,
    paddingBottom: 10,
  },
  calendar: {
    borderRadius: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: width * 0.04,
    paddingVertical: height * 0.02,
    justifyContent: 'space-between',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderLeftWidth: 3,
    borderLeftColor: '#4285F4',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4285F4',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#cccccc',
    textAlign: 'center',
    fontFamily: 'Lato-Regular',
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: width * 0.04,
    paddingBottom: height * 0.03,
    gap: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    color: '#cccccc',
    fontSize: 12,
    fontFamily: 'Lato-Regular',
  },
});

export default HomeScreen;