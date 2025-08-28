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
  const [calendarKey, setCalendarKey] = useState(0); // Add calendar key for forced re-render

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
    // Force a complete reset by clearing markedDates first
    setMarkedDates({});
    
    // Use setTimeout to ensure the reset happens before setting new values
    setTimeout(() => {
      const marked = {};
      const today = new Date().toISOString().split('T')[0];
      
      console.log('Today\'s date:', today);
      
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

      // Mark dates with events (excluding today)
      Object.keys(eventsByDate).forEach(date => {
        if (date !== today) {
          marked[date] = {
            marked: true,
            dotColor: '#4285F4',
            selected: false
          };
        }
      });

      // Mark today
      const todayHasEvents = eventsByDate[today] && eventsByDate[today] > 0;
      marked[today] = {
        selected: true,
        selectedColor: '#34A853',
        selectedTextColor: '#ffffff',
        ...(todayHasEvents && {
          marked: true,
          dotColor: '#ffffff'
        })
      };

      console.log('Setting new marked dates:', marked);
      setMarkedDates(marked);
      setCalendarKey(prev => prev + 1); // Force calendar re-render
    }, 50); // Small delay to ensure reset happens first
  };

  const onDayPress = (day) => {
    console.log('selected day', day);
    props.navigation.navigate("EventList", { 
      date: day.dateString,
      dateString: day.dateString 
    });
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
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#4285F4']}
            tintColor="#4285F4"
            progressBackgroundColor="#1a1a1a"
          />
        }
        contentContainerStyle={styles.scrollContent}
      >
        <Header nav={props.navigation} />
        
        <View style={styles.calendarContainer}>
          <Calendar
            key={calendarKey} // Use calendarKey instead of markedDates length
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

        {/* Spacer to push stats to bottom */}
        <View style={styles.spacer} />
      </ScrollView>

      {/* Fixed Stats Section at Bottom */}
      <View style={styles.fixedStatsContainer}>
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 120, // Space for fixed bottom stats
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
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: width * 0.04,
    paddingVertical: height * 0.02,
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
  spacer: {
    flex: 1,
    minHeight: 20,
  },
  // Fixed Stats Container at Bottom
  fixedStatsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: '#000000',
    paddingHorizontal: width * 0.04,
    paddingVertical: height * 0.015,
    paddingBottom: height * 0.03, // Extra padding for safe area
    justifyContent: 'space-between',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#333333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderLeftWidth: 3,
    borderLeftColor: '#4285F4',
    minHeight: 70,
    justifyContent: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4285F4',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#cccccc',
    textAlign: 'center',
    fontFamily: 'Lato-Regular',
    lineHeight: 14,
  },
});

export default HomeScreen;