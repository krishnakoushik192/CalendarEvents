import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { use, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const SplashScreen = (props) => {
  useEffect(() => {
    const checkLoginStatus = async () => {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        props.navigation.replace('Home');
      } else {
        props.navigation.replace('Login');
      }
    };
    const timer = setTimeout(() => {
      checkLoginStatus();
    }, 2000);
    return () => clearTimeout(timer);
  }, []);
  return (
    <View style={styles.container}>
      <MaterialIcons name="calendar-month" size={120} color="white" />
      <Text style={styles.text}>CALENDAR</Text>
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
    fontSize: 34,
    color: 'white',
    fontFamily: 'LibertinusRegular',
  },
});

export default SplashScreen;