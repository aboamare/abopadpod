# AboPadPod
A React Native app to turn tablet into a ship pod controller.

## Development setup
AboPodPad is a React Native application, so you need to setup an development environment. Best to follow the [React Native guidelines](https://reactnative.dev/docs/environment-setup) for this, but it means ensuring that you have a good Java install and the Android Studio with the correct Android SDK version. Next ensure that the Android device is setup for debugging.
A normal `npm install` should install the required dependencies.
This little app uses the [React Native Gesture Handler](https://docs.swmansion.com/react-native-gesture-handler/) which likes to install Expo, but that is not needed otherwise. Development can be done with the basic React Native tools i.e. start Metro with `npx react-native start` and in another shell execute `npx react-native run-android`.

## Controls
The app tracks "pan" and "rotate" gestures. There is somewhat complicated code to achieve a couple of nice features:
- for rotation there is a "dead zone" around the 0. This is achieved by a Threshold state which absorbs gesture changes until a threshold is passed.
- when the rotation angle is between -10 and +10 the rotation gesture is more sensitive and allows 1 degree changes in the control.
- otherwise controls have steps of 5 units.
- when a control is in the center vibration feedback is given, for rotation this also happens at 30, 60, 90 and 180 degrees.
All of the above is fairly easy to change, and with React Native can be quickly tested.

## Usage
Touch the screen with two (or more) fingers (or thumb and one finger) to rotate the pod. Touch and move one finger in a vertical direction to move the propulsion lever of the pod.

## Communication
The app does not yet send any data. This can be added as e.g. NMEA messages over a serial-over-usb connection, or as UDP over Wifi.