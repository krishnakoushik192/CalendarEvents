import React, { useState, useEffect } from 'react';
import {
    Modal,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    ScrollView,
    Alert,
    ActivityIndicator,
    Platform
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { createEvent, updateEvent, formatEventForAPI } from '../services/GoogleCalendarService';

const { width, height } = Dimensions.get('window');

const EventModal = ({ visible, type, event, date, onClose, onEventUpdated }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [location, setLocation] = useState('');
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('10:00');
    const [eventDate, setEventDate] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (visible) {
            if (type === 'edit' && event) {
                // Pre-fill form with existing event data
                setTitle(event.summary || '');
                setDescription(event.description || '');
                setLocation(event.location || '');
                
                if (event.start?.dateTime) {
                    const startDateTime = new Date(event.start.dateTime);
                    setStartTime(startDateTime.toTimeString().slice(0, 5));
                    setEventDate(startDateTime.toISOString().split('T')[0]);
                }
                
                if (event.end?.dateTime) {
                    const endDateTime = new Date(event.end.dateTime);
                    setEndTime(endDateTime.toTimeString().slice(0, 5));
                }
            } else {
                // Reset form for new event
                setTitle('');
                setDescription('');
                setLocation('');
                setStartTime('09:00');
                setEndTime('10:00');
                setEventDate(date);
            }
        }
    }, [visible, type, event, date]);

    const handleSave = async () => {
        if (!title.trim()) {
            Alert.alert('Error', 'Please enter a title for the event');
            return;
        }

        const startDateTime = new Date(`${eventDate}T${startTime}:00`);
        const endDateTime = new Date(`${eventDate}T${endTime}:00`);

        if (startDateTime >= endDateTime) {
            Alert.alert('Error', 'End time must be after start time');
            return;
        }

        setLoading(true);
        try {
            const eventData = formatEventForAPI(
                title.trim(),
                description.trim(),
                startDateTime.toISOString(),
                endDateTime.toISOString(),
                location.trim()
            );

            if (type === 'edit' && event) {
                await updateEvent(event.id, eventData);
                Alert.alert('Success', 'Event updated successfully');
            } else {
                await createEvent(eventData);
                Alert.alert('Success', 'Event created successfully');
            }

            onEventUpdated();
            onClose();
        } catch (error) {
            console.error('Error saving event:', error);
            Alert.alert('Error', 'Failed to save event. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const formatDateDisplay = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const generateTimeOptions = () => {
        const times = [];
        for (let hour = 0; hour < 24; hour++) {
            for (let minute = 0; minute < 60; minute +=60) { // Changed to 15-minute intervals for better UX
                const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                const displayTime = new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                });
                times.push({ value: timeString, display: displayTime });
            }
        }
        return times;
    };

    const timeOptions = generateTimeOptions();

    const TimePickerModal = ({ visible, value, onSelect, onClose, title }) => (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <TouchableOpacity 
                style={styles.timePickerOverlay} 
                activeOpacity={1} 
                onPress={onClose}
            >
                <TouchableOpacity 
                    style={styles.timePickerModal} 
                    activeOpacity={1} 
                    onPress={() => {}}
                >
                    <View style={styles.timePickerHeader}>
                        <Text style={styles.timePickerTitle}>{title}</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeTimePickerButton}>
                            <MaterialIcons name="close" size={24} color="white" />
                        </TouchableOpacity>
                    </View>
                    <ScrollView 
                        style={styles.timePickerList}
                        showsVerticalScrollIndicator={true}
                        nestedScrollEnabled={true}
                    >
                        {timeOptions.map((time) => (
                            <TouchableOpacity
                                key={time.value}
                                style={[
                                    styles.timeOption,
                                    value === time.value && styles.selectedTimeOption
                                ]}
                                onPress={() => {
                                    onSelect(time.value);
                                    onClose();
                                }}
                                activeOpacity={0.7}
                            >
                                <Text style={[
                                    styles.timeOptionText,
                                    value === time.value && styles.selectedTimeOptionText
                                ]}>
                                    {time.display}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </TouchableOpacity>
            </TouchableOpacity>
        </Modal>
    );

    const [showStartTimePicker, setShowStartTimePicker] = useState(false);
    const [showEndTimePicker, setShowEndTimePicker] = useState(false);

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <MaterialIcons name="close" size={24} color="white" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>
                        {type === 'edit' ? 'Edit Event' : 'Create Event'}
                    </Text>
                    <TouchableOpacity 
                        onPress={handleSave} 
                        style={[styles.saveButton, loading && styles.saveButtonDisabled]}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator size="small" color="white" />
                        ) : (
                            <Text style={styles.saveButtonText}>Save</Text>
                        )}
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    {/* Title Input */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Title *</Text>
                        <TextInput
                            style={styles.input}
                            value={title}
                            onChangeText={setTitle}
                            placeholder="Enter event title"
                            placeholderTextColor="#666"
                            maxLength={100}
                        />
                    </View>

                    {/* Date Display */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Date</Text>
                        <View style={styles.dateDisplay}>
                            <MaterialIcons name="event" size={20} color="#4285F4" />
                            <Text style={styles.dateDisplayText}>
                                {formatDateDisplay(eventDate)}
                            </Text>
                        </View>
                    </View>

                    {/* Time Selection */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Time</Text>
                        <View style={styles.timeContainer}>
                            <TouchableOpacity 
                                style={styles.timeButton}
                                onPress={() => setShowStartTimePicker(true)}
                            >
                                <MaterialIcons name="access-time" size={20} color="#4285F4" />
                                <Text style={styles.timeButtonText}>
                                    {timeOptions.find(t => t.value === startTime)?.display || startTime}
                                </Text>
                                <Text style={styles.timeLabel}>Start</Text>
                            </TouchableOpacity>
                            
                            <View style={styles.timeSeparator}>
                                <Text style={styles.timeSeparatorText}>to</Text>
                            </View>
                            
                            <TouchableOpacity 
                                style={styles.timeButton}
                                onPress={() => setShowEndTimePicker(true)}
                            >
                                <MaterialIcons name="access-time" size={20} color="#4285F4" />
                                <Text style={styles.timeButtonText}>
                                    {timeOptions.find(t => t.value === endTime)?.display || endTime}
                                </Text>
                                <Text style={styles.timeLabel}>End</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Location Input */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Location</Text>
                        <TextInput
                            style={styles.input}
                            value={location}
                            onChangeText={setLocation}
                            placeholder="Enter location (optional)"
                            placeholderTextColor="#666"
                            maxLength={200}
                        />
                    </View>

                    {/* Description Input */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Description</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            value={description}
                            onChangeText={setDescription}
                            placeholder="Enter description (optional)"
                            placeholderTextColor="#666"
                            multiline={true}
                            numberOfLines={4}
                            textAlignVertical="top"
                            maxLength={500}
                        />
                    </View>
                </ScrollView>

                {/* Time Picker Modals */}
                <TimePickerModal
                    visible={showStartTimePicker}
                    value={startTime}
                    onSelect={setStartTime}
                    onClose={() => setShowStartTimePicker(false)}
                    title="Select Start Time"
                />

                <TimePickerModal
                    visible={showEndTimePicker}
                    value={endTime}
                    onSelect={setEndTime}
                    onClose={() => setShowEndTimePicker(false)}
                    title="Select End Time"
                />
            </View>
        </Modal>
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
        justifyContent: 'space-between',
        paddingHorizontal: width * 0.04,
        paddingVertical: height * 0.015,
        paddingTop: Platform.OS === 'ios' ? height * 0.06 : height * 0.04,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
        minHeight: Platform.OS === 'ios' ? 90 : 70,
    },
    closeButton: {
        padding: 8,
        width: Math.max(60, width * 0.15),
        alignItems: 'flex-start',
    },
    headerTitle: {
        fontSize: Math.min(20, width * 0.05),
        color: 'white',
        fontWeight: '600',
        flex: 1,
        textAlign: 'center',
        fontFamily: 'Lato-Regular',
    },
    saveButton: {
        backgroundColor: '#4285F4',
        paddingHorizontal: Math.max(12, width * 0.03),
        paddingVertical: Math.max(8, height * 0.01),
        borderRadius: 6,
        minWidth: Math.max(60, width * 0.15),
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 36,
    },
    saveButtonDisabled: {
        opacity: 0.6,
    },
    saveButtonText: {
        color: 'white',
        fontSize: Math.min(16, width * 0.04),
        fontFamily: 'Lato-Bold',
    },
    content: {
        flex: 1,
        paddingHorizontal: width * 0.05,
        paddingTop: height * 0.02,
        paddingBottom: height * 0.02,
    },
    inputGroup: {
        marginBottom: height * 0.025,
    },
    label: {
        color: 'white',
        fontSize: Math.min(18, width * 0.045),
        marginBottom: height * 0.01,
        fontFamily: 'Lato-Bold',
    },
    input: {
        backgroundColor: '#1a1a1a',
        borderWidth: 1,
        borderColor: '#333',
        borderRadius: 10,
        paddingHorizontal: width * 0.04,
        paddingVertical: height * 0.015,
        color: 'white',
        fontSize: Math.min(16, width * 0.04),
        minHeight: height * 0.06,
        fontFamily: 'Lato-Regular',
    },
    textArea: {
        minHeight: height * 0.12,
        paddingTop: height * 0.015,
        textAlignVertical: 'top',
    },
    dateDisplay: {
        backgroundColor: '#1a1a1a',
        borderWidth: 1,
        borderColor: '#333',
        borderRadius: 10,
        paddingHorizontal: width * 0.04,
        paddingVertical: height * 0.015,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        minHeight: height * 0.06,
    },
    dateDisplayText: {
        color: 'white',
        fontSize: Math.min(16, width * 0.04),
        flex: 1,
        fontFamily: 'Lato-Regular',
    },
    timeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: width * 0.02,
    },
    timeButton: {
        flex: 1,
        backgroundColor: '#1a1a1a',
        borderWidth: 1,
        borderColor: '#333',
        borderRadius: 10,
        paddingHorizontal: width * 0.03,
        paddingVertical: height * 0.015,
        alignItems: 'center',
        gap: 6,
        minHeight: height * 0.08,
        justifyContent: 'center',
    },
    timeButtonText: {
        color: 'white',
        fontSize: Math.min(16, width * 0.04),
        fontFamily: 'Lato-Bold',
        textAlign: 'center',
    },
    timeLabel: {
        color: '#666',
        fontSize: Math.min(12, width * 0.03),
        fontFamily: 'Lato-Regular',
    },
    timeSeparator: {
        paddingHorizontal: width * 0.02,
        alignItems: 'center',
        justifyContent: 'center',
    },
    timeSeparatorText: {
        color: '#666',
        fontSize: Math.min(14, width * 0.035),
        fontFamily: 'Lato-Bold',
    },
    timePickerOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        justifyContent: 'flex-end',
        paddingHorizontal: width * 0.02,
        paddingBottom: height * 0.02,
    },
    timePickerModal: {
        backgroundColor: '#1a1a1a',
        borderRadius: 15,
        maxHeight: height * 0.7,
        minHeight: height * 0.4,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
    },
    timePickerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: width * 0.05,
        paddingVertical: height * 0.02,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
        minHeight: height * 0.07,
    },
    timePickerTitle: {
        color: 'white',
        fontSize: Math.min(20, width * 0.05),
        fontFamily: 'Lato-Bold',
        flex: 1,
    },
    closeTimePickerButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    timePickerList: {
        flex: 1,
        paddingHorizontal: width * 0.02,
    },
    timeOption: {
        paddingHorizontal: width * 0.05,
        paddingVertical: height * 0.015,
        borderBottomWidth: 0.5,
        borderBottomColor: '#333',
        minHeight: height * 0.06,
        justifyContent: 'center',
        marginHorizontal: width * 0.01,
        borderRadius: 8,
        marginVertical: 1,
    },
    selectedTimeOption: {
        backgroundColor: '#4285F4',
        borderBottomColor: '#4285F4',
    },
    timeOptionText: {
        color: 'white',
        fontSize: Math.min(18, width * 0.045),
        textAlign: 'center',
        fontFamily: 'Lato-Regular',
    },
    selectedTimeOptionText: {
        color: 'white',
        fontWeight: '600',
    },
});

export default EventModal;