
# CalendarEvents

A cross-platform (Android/iOS) calendar app built with **React Native**. Integrates with Google Calendar for event management, authentication, and supports drag-and-drop event rescheduling.

## Features

- Google Sign-In authentication
- View, add, and update Google Calendar events
- Drag and drop events to reschedule
- Modern, dark-themed UI
- Event list and event details
- Token/session expiration handling

## Folder Structure

```
.
├── App.jsx
├── package.json
├── android/           # Android native project
├── ios/               # iOS native project
├── src/
│   ├── assets/        # Fonts and images
│   ├── components/    # Reusable UI components
│   ├── navigation/    # Navigation stack
│   ├── screens/       # App screens (Home, Login, EventList, Splash)
│   ├── services/      # Google Calendar and Auth logic
```

## Setup

1. **Install dependencies:**
	```sh
	npm install
	# or
	yarn install
	```

2. **Android:**
	```sh
	npm run android
	# or
	yarn android
	```

3. **iOS:**
	- Install CocoaPods dependencies:
	  ```sh
	  cd ios
	  pod install
	  cd ..
	  ```
	- Run:
	  ```sh
	  npm run ios
	  # or
	  yarn ios
	  ```

4. **Google Sign-In:**
	- Configure your Google OAuth credentials and update the `webClientId` in `App.jsx`.

## Usage

- Sign in with your Google account.
- View your calendar and events.
- Drag and drop events to reschedule them.
- Tap on a date to see all events for that day.

## Scripts

- `npm start` — Start Metro bundler
- `npm run android` — Run on Android device/emulator
- `npm run ios` — Run on iOS simulator
- `npm test` — Run tests

## Dependencies

- `react-native`
- `@react-navigation/native`, `@react-navigation/stack`
- `react-native-calendars`
- `@react-native-google-signin/google-signin`
- `@react-native-firebase/app`, `@react-native-firebase/auth`
- and more (see `package.json`)

## License

MIT
