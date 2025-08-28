import { NavigationContainer } from '@react-navigation/native';
import { StatusBar, StyleSheet,} from 'react-native';
import {
  SafeAreaView,
} from 'react-native-safe-area-context';
import StackNavigator from './src/navigation/StackNavigator';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

function App() {
  GoogleSignin.configure({
    webClientId: '886883572738-jnmgefnaeptk0ncrbj5d7kqvg1pbirl2.apps.googleusercontent.com',
    scopes: ['email','https://www.googleapis.com/auth/calendar'],
  });
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={'light-content'} />
      <NavigationContainer>
        <StackNavigator />
      </NavigationContainer>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000'
  },
});

export default App;
