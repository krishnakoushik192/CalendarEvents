import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { GoogleAuthProvider, getAuth, signInWithCredential } from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import AsyncStorage from '@react-native-async-storage/async-storage';


const LoginScreen = (props) => {

    const handleLogin = async () => {
        // Check if your device supports Google Play
        try {
            await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
            console.log('Google Play Services are available');
            // Get the users ID token
            const signInResult = await GoogleSignin.signIn();
            console.log('Google Sign-In Result:', signInResult.data.user);
            await AsyncStorage.setItem('userInfo', JSON.stringify(signInResult.data.user));
            const idToken = signInResult.data?.idToken;
            if (!idToken) {
                throw new Error('No ID token found');
            }
            // Create a Google credential with the token
            const googleCredential = GoogleAuthProvider.credential(idToken);

            const tokens = await GoogleSignin.getTokens();
            console.log('Access Token:', tokens.accessToken);

            // Store the access token (this is what you need for Calendar API)
            await AsyncStorage.setItem('token', tokens.accessToken);
            // await AsyncStorage.setItem('token', googleCredential.token);
            props.navigation.replace('Home');
            return signInWithCredential(getAuth(), googleCredential);
        } catch (error) {
            console.error('Login Error:', error);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.text}>Welcome To Calendar</Text>
            <Text style={styles.subTitle}>Please Log In</Text>
            <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
                <MaterialCommunityIcons name='google' size={28} color='white' />
                <Text style={styles.buttonText}>Log In with Google</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000000',
    },
    text: {
        fontSize: 26,
        color: 'white',
        fontFamily: 'Lato-Italic',
    },
    subTitle: {
        fontSize: 18,
        color: 'white',
        fontFamily: 'Lato-Regular',
    },
    loginButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1a73e8',
        padding: 12,
        borderRadius: 4,
        marginTop: 12,
        gap: 8,
    },
    buttonText: {
        fontSize: 20,
        color: 'white',
        fontFamily: 'Lato-Bold',
    },
})

export default LoginScreen;