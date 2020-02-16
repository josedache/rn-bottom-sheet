import React, {useCallback} from 'react';
import {View, Text, StyleSheet, Button} from 'react-native';
import Reanimated from 'react-native-reanimated';
import {
  PanGestureHandler,
  PanGestureHandlerGestureEvent,
  State,
} from 'react-native-gesture-handler';
import {useBottomSheet, Props, Ref} from './hook';

function BottomSheet(props: Props, ref: Ref) {
  const {style, onDrag, onDragEnd, handleJSAnimation} = useBottomSheet(props, ref);

  // const onHandlerStateChange = useCallback(
  //   ({nativeEvent: {state}}: PanGestureHandlerGestureEvent) => {
  //     if (state === State.END) {
  //       onDragEnd();
  //       // console.log('End');
  //     }
  //   },
  //   [onDragEnd],
  // );

  return (
    <PanGestureHandler onGestureEvent={onDrag} onHandlerStateChange={onDragEnd}>
      <Reanimated.View style={[styles.container, style]}>
        <Text>Hello</Text>
        <Button
          title="Animate"
          onPress={() => {
            handleJSAnimation(0);
          }}
        />
      </Reanimated.View>
    </PanGestureHandler>
  );
}

export default BottomSheet;

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: '100%',
    backgroundColor: 'yellow',
  },
});
