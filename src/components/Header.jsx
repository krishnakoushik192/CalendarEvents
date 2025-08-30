import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, Image, Pressable, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import UserProfileModal from './UserDetails';
import LinearGradient from 'react-native-linear-gradient';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

const { width, height } = Dimensions.get('window');

const Header = ({nav}) => {
    const [userData, setUserData] = useState(null);
    const [showModal, setShowModal] = useState(false);

    const getUserData = async () => {
        const user = await AsyncStorage.getItem('userInfo');
        // console.log('Fetched user data:', user);
        return user ? JSON.parse(user) : null;
    };

    useEffect(() => {
        const fetchData = async () => {
            const data = await getUserData();
            setUserData(data);
        };
        fetchData();
    }, []);

    const handleLogout = async () => {
        await GoogleSignin.signOut();
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('user');
        nav.navigate('Login');
        setUserData(null);
        setShowModal(false);
    };

    const handleCancel = () => {
        setShowModal(false);
    };

    return (
        <>
            <View style={styles.container}>
                <View style={styles.titleContainer}>
                    <Text style={styles.text}>CALENDAR</Text>
                </View>
                <Pressable
                    onPress={() => { setShowModal(true) }}
                    style={styles.avatarPressable}
                    android_ripple={{
                        color: 'rgba(255, 255, 255, 0.2)',
                        borderless: true,
                        radius: 30
                    }}
                >
                    <LinearGradient
                        colors={['#4285F4', '#34A853', '#FBBC05', '#EA4335']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.border}
                    >
                        <View style={styles.avatarContainer}>
                            <Image
                                source={{
                                    uri: userData?.photo|| 'https://via.placeholder.com/100x100/cccccc/666666?text=User'
                                }}
                                style={styles.avatar}
                            />
                        </View>
                    </LinearGradient>
                </Pressable>
            </View>
            <UserProfileModal
                visible={showModal}
                onCancel={handleCancel}
                onLogout={handleLogout}
            />
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: width * 0.04, // 4% of screen width
        flexDirection: 'row',
        paddingVertical: height * 0.015, // 1.5% of screen height
        justifyContent: 'space-between',
        alignItems: 'center',
        minHeight: 60,
        maxHeight: 80,
    },
    titleContainer: {
        flex: 1,
    },
    text: {
        fontSize: Math.min(width * 0.08, 32), // Responsive font size with max limit
        color: 'white',
        fontFamily: 'LibertinusRegular',
        fontWeight: '600',
        letterSpacing: 1.2,
    },
    avatarPressable: {
        borderRadius: width * 0.08, // Responsive border radius
        padding: 4,
    },
    avatarContainer: {
        width: Math.min(width * 0.12, 54), // Responsive size with max limit
        height: Math.min(width * 0.12, 54),
        borderRadius: Math.min(width * 0.06, 27),
        padding: 2,
    },
    border: {
        padding: 3, // border thickness
        borderRadius: 60,
    },
    avatar: {
        width: '100%',
        height: '100%',
        borderRadius: Math.min(width * 0.055, 25),
        backgroundColor: '#f0f0f0', // Placeholder background
    },
});

export default Header;