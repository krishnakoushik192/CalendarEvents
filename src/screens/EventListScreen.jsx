import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Dimensions,
    ActivityIndicator,
    RefreshControl,
    Alert
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { getEventsForDate, deleteEvent } from '../services/GoogleCalendarService';
import EventModal from '../components/EventModal';

const { width, height } = Dimensions.get('window');

const EventListScreen = ({ route, navigation }) => {
    const { date } = route.params;
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [modalType, setModalType] = useState('create'); // 'create' or 'edit'

    useEffect(() => {
        fetchEvents();
    }, [date]);

    const fetchEvents = async () => {
        try {
            setLoading(true);
            const fetchedEvents = await getEventsForDate(date);
            setEvents(fetchedEvents);
        } catch (error) {
            console.error('Error fetching events:', error);
            Alert.alert('Error', 'Failed to fetch events');
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchEvents();
        setRefreshing(false);
    };

    const handleCreateEvent = () => {
        setSelectedEvent(null);
        setModalType('create');
        setModalVisible(true);
    };

    const handleEditEvent = (event) => {
        setSelectedEvent(event);
        setModalType('edit');
        setModalVisible(true);
    };

    const handleDeleteEvent = (eventId, eventTitle) => {
        Alert.alert(
            'Delete Event',
            `Are you sure you want to delete "${eventTitle}"?`,
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteEvent(eventId);
                            await fetchEvents(); // Refresh the list
                            Alert.alert('Success', 'Event deleted successfully');
                        } catch (error) {
                            console.error('Error deleting event:', error);
                            Alert.alert('Error', 'Failed to delete event');
                        }
                    },
                },
            ]
        );
    };

    const formatDate = (dateString) => {
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        return new Date(dateString).toLocaleDateString('en-US', options);
    };

    const formatTime = (dateTimeString) => {
        if (!dateTimeString) return 'All day';
        return new Date(dateTimeString).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    const renderEventItem = ({ item }) => (
        <View style={styles.eventItem}>
            <View style={styles.eventContent}>
                <View style={styles.eventHeader}>
                    <Text style={styles.eventTitle} numberOfLines={1}>
                        {item.summary || 'Untitled Event'}
                    </Text>
                    <View style={styles.eventActions}>
                        <TouchableOpacity
                            onPress={() => handleEditEvent(item)}
                            style={styles.actionButton}
                        >
                            <MaterialIcons name="edit" size={20} color="#4285F4" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => handleDeleteEvent(item.id, item.summary)}
                            style={styles.actionButton}
                        >
                            <MaterialIcons name="delete" size={20} color="#EA4335" />
                        </TouchableOpacity>
                    </View>
                </View>
                
                <View style={styles.eventDetails}>
                    <View style={styles.timeContainer}>
                        <MaterialIcons name="access-time" size={16} color="#666" />
                        <Text style={styles.eventTime}>
                            {formatTime(item.start?.dateTime)} - {formatTime(item.end?.dateTime)}
                        </Text>
                    </View>
                    
                    {item.location && (
                        <View style={styles.locationContainer}>
                            <MaterialIcons name="location-on" size={16} color="#666" />
                            <Text style={styles.eventLocation} numberOfLines={1}>
                                {item.location}
                            </Text>
                        </View>
                    )}
                    
                    {item.description && (
                        <Text style={styles.eventDescription} numberOfLines={2}>
                            {item.description}
                        </Text>
                    )}
                </View>
            </View>
        </View>
    );

    const renderEmptyState = () => (
        <View style={styles.emptyState}>
            <MaterialIcons name="event-available" size={80} color="#666" />
            <Text style={styles.emptyStateText}>No events for this day</Text>
            <TouchableOpacity style={styles.createButton} onPress={handleCreateEvent}>
                <Text style={styles.createButtonText}>Create Your First Event</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity 
                    onPress={() => navigation.goBack()} 
                    style={styles.backButton}
                >
                    <MaterialIcons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle}>Events</Text>
                    <Text style={styles.headerDate}>{formatDate(date)}</Text>
                </View>
                <TouchableOpacity onPress={handleCreateEvent} style={styles.addButton}>
                    <MaterialIcons name="add" size={24} color="white" />
                </TouchableOpacity>
            </View>

            {/* Events List */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#4285F4" />
                    <Text style={styles.loadingText}>Loading events...</Text>
                </View>
            ) : (
                <FlatList
                    data={events}
                    renderItem={renderEventItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={['#4285F4']}
                            tintColor="#4285F4"
                        />
                    }
                    ListEmptyComponent={renderEmptyState}
                />
            )}

            {/* Floating Action Button */}
            <TouchableOpacity style={styles.fab} onPress={handleCreateEvent}>
                <MaterialIcons name="add" size={28} color="white" />
            </TouchableOpacity>

            {/* Event Modal */}
            <EventModal
                visible={modalVisible}
                type={modalType}
                event={selectedEvent}
                date={date}
                onClose={() => setModalVisible(false)}
                onEventUpdated={fetchEvents}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: width * 0.04,
        paddingVertical: height * 0.02,
        paddingTop: height * 0.05,
    },
    backButton: {
        padding: 8,
        marginRight: 12,
    },
    headerContent: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 24,
        color: 'white',
        fontWeight: '600',
        fontFamily: 'Lato-Bold',
    },
    headerDate: {
        fontSize: 14,
        color: '#cccccc',
        fontFamily: 'Lato-Regular',
        marginTop: 2,
    },
    addButton: {
        padding: 8,
        backgroundColor: '#4285F4',
        borderRadius: 20,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: 'white',
        marginTop: 12,
        fontSize: 16,
    },
    listContainer: {
        paddingHorizontal: width * 0.04,
        paddingBottom: 100,
    },
    eventItem: {
        backgroundColor: '#1a1a1a',
        borderRadius: 12,
        marginVertical: 6,
        borderLeftWidth: 4,
        borderLeftColor: '#4285F4',
    },
    eventContent: {
        padding: 16,
    },
    eventHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    eventTitle: {
        fontSize: 18,
        color: 'white',
        fontWeight: '600',
        flex: 1,
        marginRight: 12,
    },
    eventActions: {
        flexDirection: 'row',
        gap: 8,
    },
    actionButton: {
        padding: 4,
    },
    eventDetails: {
        gap: 6,
    },
    timeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    eventTime: {
        color: '#cccccc',
        fontSize: 14,
    },
    locationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    eventLocation: {
        color: '#cccccc',
        fontSize: 14,
        flex: 1,
    },
    eventDescription: {
        color: '#999999',
        fontSize: 14,
        lineHeight: 18,
        marginTop: 4,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: height * 0.1,
    },
    emptyStateText: {
        color: '#666',
        fontSize: 18,
        marginTop: 16,
        marginBottom: 24,
    },
    createButton: {
        backgroundColor: '#4285F4',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    createButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '500',
    },
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#4285F4',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
    },
});

export default EventListScreen;