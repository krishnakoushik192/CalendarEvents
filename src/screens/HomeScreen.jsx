import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions, Alert, RefreshControl, ScrollView, ProgressBarAndroid, Pressable } from 'react-native';
import Header from '../components/Header';
import { Calendar } from 'react-native-calendars';
import { getEvents } from '../services/GoogleCalendarService';
import { useFocusEffect } from '@react-navigation/native';
import AuthManager from '../services/AuthManager';
import TokenExpiredModal from '../components/TokenExpiredModal';

const { height, width } = Dimensions.get('window');

const HomeScreen = (props) => {
  const [events, setEvents] = useState([]);
  const [markedDates, setMarkedDates] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const [todayEvents, setTodayEvents] = useState(0);
  const [calendarKey, setCalendarKey] = useState(0);
  const [showTokenExpiredModal, setShowTokenExpiredModal] = useState(false);
  const [eventLoading, setEventLoading] = useState(false);
  const [eventsByDate, setEventsByDate] = useState({});

  const authManager = AuthManager.getInstance();

  useEffect(() => {
    authManager.setTokenExpiredCallback(() => {
      console.log('Token expired callback triggered in HomeScreen');
      setShowTokenExpiredModal(true);
    });

    return () => {
      authManager.setTokenExpiredCallback(null);
    };
  }, []);

  const fetchEvents = async () => {
    try {
      setEventLoading(true);
      const fetchedEvents = await getEvents();
      console.log("Fetched events count:", fetchedEvents.length);
      setEvents(fetchedEvents);
      
      // Group events by date
      const grouped = {};
      fetchedEvents.forEach(event => {
        let eventDate;
        if (event.start?.dateTime) {
          eventDate = event.start.dateTime.split('T')[0];
        } else if (event.start?.date) {
          eventDate = event.start.date;
        }

        if (eventDate) {
          if (!grouped[eventDate]) {
            grouped[eventDate] = [];
          }
          grouped[eventDate].push(event);
        }
      });
      
      setEventsByDate(grouped);
      markEventDates(fetchedEvents, grouped);
      calculateTodayEvents(fetchedEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
      if (!error.message.includes('Authentication failed') &&
        !error.message.includes('Token refresh failed')) {
        Alert.alert('Error', 'Failed to fetch events');
      }
    } finally {
      setEventLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchEvents();
    setRefreshing(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchEvents();
    }, [])
  );

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

  const markEventDates = (eventsList, grouped) => {
    setMarkedDates({});

    setTimeout(() => {
      const marked = {};
      const today = new Date().toISOString().split('T')[0];

      console.log('Today\'s date:', today);

      // Mark dates with events
      Object.keys(grouped).forEach(date => {
        const dateEvents = grouped[date];
        const isToday = date === today;
        
        marked[date] = {
          selected: isToday,
          selectedColor: isToday ? '#4285F4' : undefined,
          selectedTextColor: isToday ? '#ffffff' : undefined,
          customStyles: {
            container: {
              backgroundColor: isToday ? '#4285F4' : 'transparent',
              borderRadius: 8,
            },
            text: {
              color: isToday ? '#ffffff' : '#ffffff',
              fontSize: 16,
              fontWeight: isToday ? 'bold' : 'normal',
            }
          }
        };
      });

      // Always mark today even if no events
      if (!marked[today]) {
        marked[today] = {
          selected: true,
          selectedColor: '#4285F4',
          selectedTextColor: '#ffffff',
          customStyles: {
            container: {
              backgroundColor: '#4285F4',
              borderRadius: 8,
            },
            text: {
              color: '#ffffff',
              fontSize: 16,
              fontWeight: 'bold',
            }
          }
        };
      }

      console.log('Setting new marked dates:', marked);
      setMarkedDates(marked);
      setCalendarKey(prev => prev + 1);
    }, 50);
  };
   const onDayPress = (day) => {
    console.log('selected day', day);
    props.navigation.navigate("EventList", {
      date: day.dateString,
      dateString: day.dateString
    });
  };

  // Custom day component to show events
  const DayComponent = ({ date, marking }) => {
    const dateString = date.dateString;
    const dayEvents = eventsByDate[dateString] || [];
    const isToday = dateString === new Date().toISOString().split('T')[0];
    const hasEvents = dayEvents.length > 0;

    return (
      <Pressable onPress={() => onDayPress(date)}>      
      <View style={styles.dayContainer}>
        <View style={[
          styles.dayHeader,
          isToday && styles.todayHeader
        ]}>
          <Text style={[
            styles.dayText,
            isToday && styles.todayText
          ]}>
            {date.day}
          </Text>
        </View>
        
        {hasEvents && (
          <View style={styles.eventContainer}>
            {dayEvents.slice(0, 2).map((event, index) => (
              <View 
                key={event.id} 
                style={[
                  styles.eventBox,
                  { backgroundColor: isToday ? '#1976D2' : '#2E7D32' }
                ]}
              >
                <Text style={styles.eventText} numberOfLines={1}>
                  {event.summary || 'Untitled'}
                </Text>
              </View>
            ))}
            {dayEvents.length > 2 && (
              <View style={[
                styles.moreEventsBox,
                { backgroundColor: isToday ? '#0D47A1' : '#1B5E20' }
              ]}>
                <Text style={styles.moreEventsText}>
                  +{dayEvents.length - 2} more
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
      </Pressable>
    );
  };

 

  const handleReLogin = async () => {
    try {
      await authManager.logout();
      setShowTokenExpiredModal(false);
      props.navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error) {
      console.error('Error during re-login process:', error);
      setShowTokenExpiredModal(false);
      props.navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    }
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
        <ProgressBarAndroid
          styleAttr="Horizontal"
          indeterminate={eventLoading}
          color="#4285F4"
          style={{ width: '100%', height: 20 }}
        />

        <View style={styles.calendarContainer}>
          <Calendar
            key={calendarKey}
            onDayPress={onDayPress}
            markedDates={markedDates}
            dayComponent={DayComponent}
            theme={{
              backgroundColor: '#000000',
              calendarBackground: '#000000',
              textSectionTitleColor: '#ffffff',
              textDayHeaderFontFamily: 'Lato-Regular',
              arrowColor: '#ffffff',
              disabledArrowColor: '#444444',
              monthTextColor: '#ffffff',
              indicatorColor: '#4285F4',
              textMonthFontSize: 22,
              textMonthFontFamily: 'Lato-Bold',
              textDayHeaderFontSize: 14,
              'stylesheet.calendar.header': {
                week: {
                  marginTop: 5,
                  flexDirection: 'row',
                  justifyContent: 'space-around'
                }
              },
            }}
            headerStyle={{
              backgroundColor: '#000000',
              borderBottomWidth: 0,
            }}
            style={styles.calendar}
            enableSwipeMonths={true}
            hideExtraDays={true}
            firstDay={1}
          />
        </View>

        {/* Legend */}
        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#1976D2' }]} />
            <Text style={styles.legendText}>Today's Events</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#2E7D32' }]} />
            <Text style={styles.legendText}>Other Events</Text>
          </View>
        </View>

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
      </View>

      <TokenExpiredModal
        visible={showTokenExpiredModal}
        onReLogin={handleReLogin}
      />
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
    paddingBottom: 120,
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
  // Custom day component styles
  dayContainer: {
    width: width * 0.13,
    height: 80,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingVertical: 2,
  },
  dayHeader: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 4,
    borderRadius: 4,
  },
  todayHeader: {
    backgroundColor: '#4285F4',
  },
  dayText: {
    fontSize: 16,
    color: '#ffffff',
    fontFamily: 'Lato-Regular',
  },
  todayText: {
    color: '#ffffff',
    fontFamily: 'Lato-Bold',
  },
  eventContainer: {
    width: '100%',
    paddingHorizontal: 1,
    marginTop: 2,
    gap: 1,
  },
  eventBox: {
    borderRadius: 3,
    paddingHorizontal: 2,
    paddingVertical: 1,
    marginVertical: 0.5,
  },
  eventText: {
    fontSize: 8,
    color: '#ffffff',
    fontFamily: 'Lato-Regular',
    textAlign: 'center',
  },
  moreEventsBox: {
    borderRadius: 3,
    paddingHorizontal: 2,
    paddingVertical: 1,
    marginVertical: 0.5,
  },
  moreEventsText: {
    fontSize: 7,
    color: '#ffffff',
    fontFamily: 'Lato-Regular',
    textAlign: 'center',
    fontStyle: 'italic',
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
  fixedStatsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: '#000000',
    paddingHorizontal: width * 0.04,
    paddingVertical: height * 0.015,
    paddingBottom: height * 0.03,
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