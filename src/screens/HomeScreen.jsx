import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Header from '../components/Header';
import { Calendar } from 'react-native-calendars';
import { getEvents } from '../services/GoogleCalendarService';

const { height, width } = Dimensions.get('window');

const HomeScreen = (props) => {
  useEffect(()=>{
    getEvents().then(events=>{
      console.log("Fetched events:", events);
    });
  },[])
  return (
    <View style={styles.container}>
      <Header nav={props.navigation} />
      <Calendar
        onDayPress={(day) => {
        //  props.navigation.navigate("EventList", { date: day.dateString });
          console.log('selected day', day);
        }}
        // color theme
        theme={{
          backgroundColor: '#000000',
          calendarBackground: '#000000',
          textSectionTitleColor: '#ffffff',
          textDayHeaderFontFamily: 'Lato-Regular',
          todayTextColor: '#ffffff',
          todayBackgroundColor: '#34A853',
          dayTextColor: '#ffffff',
          textDisabledColor: '#444444',
          arrowColor: '#ffffff',
          monthTextColor: '#ffffff',
          textMonthFontSize: 24,
          textMonthFontFamily: 'Lato-Regular',
          textDayFontFamily: 'Lato-Regular',
          textDayFontSize: 19,
        }}
        headerStyle={{ backgroundColor: '#000000', borderBottomWidth: 0, }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
});

export default HomeScreen;