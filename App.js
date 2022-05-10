/**
 * React Native app that acts as pod, or rudder and telegraph, control for ship simulators.
 *
 * @format
 * @flow strict-local
 */

import React, { useState } from 'react'
import {
  Dimensions,
  Text,
  StyleSheet,
  Vibration,
  View,
} from 'react-native'
import { gestureHandlerRootHOC, Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler'

class ControlState {
  processChange (changeInValue) {
    return changeInValue
  }

  reset () {
    this._accumulatedChange = 0
  }
}

class ThresholdRequired extends ControlState {
  constructor (threshold = 4) {
    super()
    this.threshold = threshold
    this.reset()
  }

  processChange (changeInValue) {
    this._accumulatedChange += changeInValue
    if (Math.abs(this._accumulatedChange) > this.threshold) {
      return changeInValue
    } else {
      return 0
    }
  }
}

class Gain extends ControlState {
  constructor (gain = 0.5, roundToInt = true) {
    super()
    this.gain = gain
    this.roundToInt = roundToInt
    this.reset()
  }

  processChange (changeInValue) {
    this._accumulatedChange += changeInValue
    const change = this.roundToInt ? Math.round(this._accumulatedChange * this.gain) : this._accumulatedChange * this.gain
    if (Math.abs(change) > 0) {
      this.reset()
      return change
    } else {
      return 0
    }
  }
}

class Step extends ControlState {
  constructor (stepSize = 5) {
    super()
    this.stepSize = stepSize
    this.reset()
  }

  processChange (changeInValue) {
    this._accumulatedChange += changeInValue
    if (Math.abs(this._accumulatedChange) >= this.stepSize) {
      this.reset()
      return changeInValue > 0 ? this.stepSize : 0 - this.stepSize
    } else {
      return 0
    }
  }
}

let prevPan = 0, prevRotation = 0
class RotationHandler {
  constructor (onChange = () => {}, gestureOptions = {}) {
    // console.log('constructing rotation handler')
    this.gesture = Gesture.Rotation()
      .onStart((e) => {
        prevRotation = e.rotation || 0
      })
      .onUpdate((e) => {
        const gestureRotationInDegrees = this.asDeg(e.rotation)
        const change = gestureRotationInDegrees - prevRotation
        prevRotation = gestureRotationInDegrees
        if (change) {
          onChange(change)
        }
      })
    Object.assign(this.gesture, gestureOptions)
  }

  asDeg (radians = 0) {
    return Math.round((radians / Math.PI) * 180)
  }
}

const PodControl = gestureHandlerRootHOC(() => {

  const [ angle, setAngle ] = useState(0)
  const [ telegraph, setTelegraph ] = useState(0)

  const height = Dimensions.get("screen").height
  const panScale = Math.floor(height / 200)

  let panState = new Step(5)
  const pan = Gesture.Pan()
  .onStart((e) => {
    if (e.numberOfPointers > 1) {
      pan.enabled(false)
      return
    }
    prevPan = 0
  })
  .onUpdate((e) => {
    if (e.numberOfPointers > 1) {
      pan.enabled(false)
      return
    }
    const change = Math.round((prevPan - e.translationY) / panScale)
    prevPan = e.translationY
    if (change) {
      const newTelegraph = Math.min(100, Math.max(-100, telegraph + panState.processChange(change)))
      setTelegraph(newTelegraph)
      if (newTelegraph == 0) {
        Vibration.vibrate(500)
      }
    }  
  })
  pan.minDistance = 5
  pan.activeOffsetX = [-10, 10]
  pan.failOffsetX = [-10, 10]
  pan.activeOffsetY = [-5, 5]

  let rotationState = undefined
  const rotate = new RotationHandler((change) => {
    if (angle == 0 && !(rotationState instanceof ThresholdRequired)) {
      rotationState = new ThresholdRequired(9)
    } else if (angle > 0) {
      if (change > 0) {
        if (angle < 10 && !(rotationState instanceof Gain)) {
          rotationState = new Gain(0.25)
        } else if (angle >= 10 && !(rotationState instanceof Step)) {
          rotationState = new Step(5)
        }
      } else {
        if (angle <= 10 && !(rotationState instanceof Gain)) {
          rotationState = new Gain(0.25)
        } else if (angle > 10 && !(rotationState instanceof Step)) {
          rotationState = new Step(5)
        }
      }
    } else if (angle < 0) {
      if (change < 0) {
        if (angle > -10 && !(rotationState instanceof Gain)) {
          rotationState = new Gain(0.25)
        } else if (angle <= -10 && !(rotationState instanceof Step)) {
          rotationState = new Step(5)
        }
      } else {
        if (angle >= -10 && !(rotationState instanceof Gain)) {
          rotationState = new Gain(0.25)
        } else if (angle < -10 && !(rotationState instanceof Step)) {
          rotationState = new Step(5)
        }
      }
    }
    // console.log(`angle is ${angle} in ${rotationState.constructor.name}`)
    let newAngle = angle + rotationState.processChange(change)
    if (newAngle > 180) {
      newAngle = 360 - newAngle
    }
    if (newAngle == 0 && angle !== newAngle) {
      Vibration.vibrate(500)      
    }
    if ([30, 60, 90, 180].includes(newAngle)) {
      Vibration.vibrate(200)
    }
    setAngle(newAngle)
  })
  rotate.gesture.onFinalize((e) => {
    pan.enabled(true)
  })
  
  const gesture = Gesture.Race(rotate.gesture, pan)

  return (
  <GestureHandlerRootView style={{ flex: 1 }}>
    <GestureDetector style={{ flex: 1 }} gesture={gesture}>
      <View
      style={styles.background}>
        <Text style={styles.large}>{angle.toString()}°</Text>
        <Text style={styles.large}>{telegraph.toString()}%</Text>
      </View>
    </GestureDetector>
  </GestureHandlerRootView>
  )
})

const styles = StyleSheet.create({
  background: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: '#666666',
  },
  large: {
    fontSize: 30
  }
})
 
 export default PodControl 
