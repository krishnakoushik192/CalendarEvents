import React, { useEffect, useState, useCallback, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Dimensions, 
  Alert, 
  RefreshControl, 
  ScrollView, 
  ProgressBarAndroid, 
  Pressable,
  PanResponder,
  Animated,
  Vibration
} from 'react-native';
import Header from '../components/Header';
import { Calendar } from 'react-native-calendars';
import { getEvents, updateEvent } from '../services/GoogleCalendarService';
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
  
  // Drag and drop state
  const [isDragging, setIsDragging] = useState(false);
  const [draggedEvent, setDraggedEvent] = useState(null);
  const [draggedFromDate, setDraggedFromDate] = useState(null);

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
    if (isDragging) {
      // Handle drop
      handleDrop(day.dateString);
      return;
    }
    
    console.log('selected day', day);
    props.navigation.navigate("EventList", {
      date: day.dateString,
      dateString: day.dateString
    });
  };

  // Handle dropping event on a date
  const handleDrop = (targetDate) => {
    if (!draggedEvent || !draggedFromDate) return;

    if (targetDate === draggedFromDate) {
      // Dropped on same date, cancel
      resetDragState();
      return;
    }

    const targetDateFormatted = new Date(targetDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    Alert.alert(
      'Move Event',
      `Move "${draggedEvent.summary}" to ${targetDateFormatted}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: resetDragState,
        },
        {
          text: 'Move',
          onPress: () => moveEventToDate(draggedEvent, targetDate),
        },
      ]
    );
  };

  // Reset drag state
  const resetDragState = () => {
    setIsDragging(false);
    setDraggedEvent(null);
    setDraggedFromDate(null);
  };

  // Function to handle event move
  const moveEventToDate = async (event, newDate) => {
    try {
      setEventLoading(true);
      resetDragState();
      
      let updatedEventData = {};
      
      if (event.start?.dateTime) {
        // For timed events, keep the same time but change the date
        const originalDateTime = new Date(event.start.dateTime);
        const hours = originalDateTime.getHours();
        const minutes = originalDateTime.getMinutes();
        const seconds = originalDateTime.getSeconds();
        
        const newDateTime = new Date(newDate);
        newDateTime.setHours(hours, minutes, seconds, 0);
        
        updatedEventData.start = {
          dateTime: newDateTime.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        };
        
        if (event.end?.dateTime) {
          const originalEndDate = new Date(event.end.dateTime);
          const duration = originalEndDate.getTime() - originalDateTime.getTime();
          const newEndDateTime = new Date(newDateTime.getTime() + duration);
          updatedEventData.end = {
            dateTime: newEndDateTime.toISOString(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          };
        }
      } else if (event.start?.date) {
        // For all-day events
        updatedEventData.start = { date: newDate };
        if (event.end?.date) {
          updatedEventData.end = { date: newDate };
        }
      }

      // Preserve other event properties
      updatedEventData.summary = event.summary;
      if (event.description) updatedEventData.description = event.description;
      if (event.location) updatedEventData.location = event.location;
      if (event.reminders) updatedEventData.reminders = event.reminders;

      console.log('Updating event with data:', updatedEventData);

      // Call your Google Calendar API to update the event
      await updateEvent(event.id, updatedEventData);
      
      // Refresh events after successful update
      await fetchEvents();
      
      Alert.alert('Success', `Event "${event.summary}" moved successfully!`);
    } catch (error) {
      console.error('Error moving event:', error);
      Alert.alert('Error', 'Failed to move event. Please try again.');
    } finally {
      setEventLoading(false);
    }
  };

  // Handle long press on event
  const handleEventLongPress = (event, dateString) => {
    // Check if event can be moved
    if (event.isHoliday || (event.calendarId && event.calendarId !== 'primary')) {
      Alert.alert('Cannot Move Event', 'Only your personal events can be moved.');
      return;
    }

    Vibration.vibrate(100); // Haptic feedback
    setIsDragging(true);
    setDraggedEvent(event);
    setDraggedFromDate(dateString);
    console.log('Started dragging event:', event.summary);
  };

  // Custom day component
  const DayComponent = ({ date, marking }) => {
    const dateString = date.dateString;
    const dayEvents = eventsByDate[dateString] || [];
    const isToday = dateString === new Date().toISOString().split('T')[0];
    const hasEvents = dayEvents.length > 0;
    const isDropZone = isDragging && dateString !== draggedFromDate;
    const isDragSource = isDragging && dateString === draggedFromDate;

    return (
      <Pressable 
        onPress={() => onDayPress(date)}
        style={[
          styles.dayContainer,
          isDropZone && styles.dropZone,
          isDragSource && styles.dragSource
        ]}
      >
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
            {dayEvents.slice(0, 2).map((event, index) => {
              const canBeMoved = !event.isHoliday && (!event.calendarId || event.calendarId === 'primary');
              const isDraggedEvent = isDragging && draggedEvent?.id === event.id;
              
              return (
                <Pressable
                  key={event.id}
                  onLongPress={() => handleEventLongPress(event, dateString)}
                  delayLongPress={200}
                  style={[
                    styles.eventBox,
                    { 
                      backgroundColor: isToday ? '#1976D2' : '#2E7D32',
                      opacity: isDraggedEvent ? 0.5 : (canBeMoved ? 1 : 0.7),
                      borderWidth: isDraggedEvent ? 2 : 0,
                      borderColor: isDraggedEvent ? '#FF6B35' : 'transparent',
                    }
                  ]}
                >
                  <Text style={[
                    styles.eventText,
                    !canBeMoved && styles.nonEditableEventText
                  ]} numberOfLines={1}>
                    {event.summary || 'Untitled'}
                    {event.isHoliday && ' 🎉'}
                  </Text>
                </Pressable>
              );
            })}
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

        {isDropZone && (
          <View style={styles.dropIndicator}>
            <Text style={styles.dropIndicatorText}>Drop Here</Text>
          </View>
        )}
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
        scrollEnabled={!isDragging}
      >
        <Header nav={props.navigation} />
        <ProgressBarAndroid
          styleAttr="Horizontal"
          indeterminate={eventLoading}
          color="#4285F4"
          style={{ width: '100%', height: 20 }}
        />

        {isDragging && (
          <View style={styles.dragNotification}>
            <Text style={styles.dragNotificationText}>
              Moving "{draggedEvent?.summary}" - Tap any date to drop
            </Text>
            <Pressable 
              style={styles.cancelButton}
              onPress={resetDragState}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
          </View>
        )}

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
            enableSwipeMonths={!isDragging}
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
          {!isDragging && (
            <View style={styles.legendItem}>
              <Text style={styles.legendHint}>Long press events to move them</Text>
            </View>
          )}
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
  // Drag notification bar
  dragNotification: {
    backgroundColor: '#FF6B35',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: width * 0.02,
    marginTop: 10,
    borderRadius: 8,
  },
  dragNotificationText: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: 'Lato-Regular',
    flex: 1,
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  cancelButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: 'Lato-Bold',
  },
  // Custom day component styles
  dayContainer: {
    width: width * 0.13,
    height: 80,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingVertical: 2,
    borderRadius: 6,
  },
  dropZone: {
    backgroundColor: 'rgba(255, 107, 53, 0.3)',
    borderWidth: 2,
    borderColor: '#FF6B35',
    borderStyle: 'dashed',
  },
  dragSource: {
    backgroundColor: 'rgba(66, 133, 244, 0.2)',
    borderWidth: 1,
    borderColor: '#4285F4',
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
    paddingVertical: 3,
    marginVertical: 0.5,
  },
  eventText: {
    fontSize: 8,
    color: '#ffffff',
    fontFamily: 'Lato-Regular',
    textAlign: 'center',
  },
  nonEditableEventText: {
    fontStyle: 'italic',
    opacity: 0.8,
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
  dropIndicator: {
    position: 'absolute',
    bottom: 2,
    alignSelf: 'center',
    backgroundColor: '#FF6B35',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  dropIndicatorText: {
    fontSize: 6,
    color: '#ffffff',
    fontFamily: 'Lato-Bold',
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: width * 0.04,
    paddingVertical: height * 0.02,
    gap: 15,
    flexWrap: 'wrap',
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
  legendHint: {
    color: '#888888',
    fontSize: 11,
    fontFamily: 'Lato-Regular',
    fontStyle: 'italic',
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