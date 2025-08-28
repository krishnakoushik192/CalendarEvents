import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    Modal,
    TouchableOpacity,
    Image,
    StyleSheet,
    Dimensions
} from 'react-native';
import LogoutModal from './LogoutModal';
import LinearGradient from 'react-native-linear-gradient';

const { width, height } = Dimensions.get('window');

const UserProfileModal = ({ visible, onCancel, onLogout }) => {
    const [user, setUser] = useState(null);
    const [logoutModalVisible, setLogoutModalVisible] = useState(false);

    const getUser = async () => {
        try {
            const userData = await AsyncStorage.getItem('userInfo');
            if (userData) {
                setUser(JSON.parse(userData));
            }
        } catch (error) {
            console.log('Error getting user data:', error);
        }
    };

    useEffect(() => {
        if (visible) {
            getUser();
        }
    }, [visible]);

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onCancel}
        >
            <View style={styles.modalOverlay}>
                <TouchableOpacity
                    style={styles.modalBackground}
                    activeOpacity={1}
                    onPress={onCancel}
                >
                    <View style={styles.modalContainer}>
                        {/* Close Button */}
                        <TouchableOpacity style={styles.closeButton} onPress={onCancel}>
                            <Text style={styles.closeButtonText}>✕</Text>
                        </TouchableOpacity>

                        {/* Profile Picture with Rainbow Border */}
                        <View style={styles.profileContainer}>
                            <LinearGradient
                                colors={['#4285F4', '#34A853', '#FBBC05', '#EA4335']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.rainbowBorder}
                            >
                                <View style={styles.profileImageContainer}>
                                    {user?.photo && (
                                    <Image
                                        source={{ uri: user.photo }}
                                        style={styles.profileImage}
                                    />
                                )}
                                </View>
                            </LinearGradient>
                        </View>

                        {/* Greeting Text */}
                        <Text style={styles.greetingText}>
                            Hi, {user?.name || 'User'}!
                        </Text>

                        {/* Email Display */}
                        <Text style={styles.emailText}>
                            {user?.email || 'koushikaraveti24@gmail.com'}
                        </Text>

                        {/* Logout Button */}
                        <TouchableOpacity style={styles.logoutButton} onPress={() => setLogoutModalVisible(true)}>
                            <Text style={styles.logoutButtonText}>Logout</Text>
                        </TouchableOpacity>

                        <LogoutModal
                            visible={logoutModalVisible}
                            onConfirm={onLogout}
                            onCancel={() => setLogoutModalVisible(false)}
                        />
                    </View>
                </TouchableOpacity>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        paddingVertical: height * 0.05,
    },
    modalBackground: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: width * 0.05,
    },
    modalContainer: {
        backgroundColor: '#2c2c2c',
        borderRadius: width * 0.05,
        paddingVertical: height * 0.04,
        paddingHorizontal: width * 0.08,
        alignItems: 'center',
        width: width * 0.9,
        maxWidth: 450,
        minHeight: height * 0.4,
        position: 'relative',
    },
    closeButton: {
        position: 'absolute',
        top: height * 0.015,
        right: width * 0.05,
        width: width * 0.08,
        height: width * 0.08,
        justifyContent: 'center',
        alignItems: 'center',
        minWidth: 30,
        minHeight: 30,
    },
    closeButtonText: {
        color: '#ffffff',
        fontSize: Math.max(16, width * 0.04),
        fontWeight: 'bold',
    },
    profileContainer: {
        marginBottom: height * 0.025,
        marginTop: height * 0.01,
    },
    rainbowBorder: {
        width: Math.min(width * 0.28, 120),
        height: Math.min(width * 0.28, 120),
        borderRadius: Math.min(width * 0.14, 60),
        padding: 5,
    },
    profileImageContainer: {
        width: Math.min(width * 0.26, 110),
        height: Math.min(width * 0.26, 110),
        borderRadius: Math.min(width * 0.13, 55),
        backgroundColor: '#3c3c3c',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    profileImage: {
        width: Math.min(width * 0.26, 110),
        height: Math.min(width * 0.26, 110),
        borderRadius: Math.min(width * 0.13, 55),
    },
    defaultAvatar: {
        width: Math.min(width * 0.26, 110),
        height: Math.min(width * 0.26, 110),
        borderRadius: Math.min(width * 0.13, 55),
        backgroundColor: '#4285f4',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        color: '#ffffff',
        fontSize: Math.max(24, width * 0.09),
        fontWeight: 'bold',
    },
    greetingText: {
        color: '#ffffff',
        fontSize: Math.max(20, width * 0.055),
        fontWeight: '400',
        marginBottom: height * 0.01,
        textAlign: 'center',
        paddingHorizontal: width * 0.02,
    },
    emailText: {
        color: '#b0b0b0',
        fontSize: Math.max(14, width * 0.038),
        marginBottom: height * 0.035,
        textAlign: 'center',
        paddingHorizontal: width * 0.02,
    },
    logoutButton: {
        backgroundColor: '#dc3545',
        borderWidth: 1.5,
        borderColor: '#ffffff',
        borderRadius: height * 0.03,
        paddingVertical: height * 0.015,
        paddingHorizontal: width * 0.08,
        width: width * 0.7,
        maxWidth: 280,
        minHeight: height * 0.05,
        justifyContent: 'center',
    },
    logoutButtonText: {
        color: '#ffffff',
        fontSize: Math.max(14, width * 0.04),
        fontWeight: '500',
        textAlign: 'center',
    },
});

export default UserProfileModal;