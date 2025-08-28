import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';


const LoginScreen = (props) => {

    const handleLogin = async () => {
        //    google sign in
    }

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