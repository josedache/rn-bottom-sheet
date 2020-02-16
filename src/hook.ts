import React, {useCallback, useState, useRef, useMemo} from 'react';
import {useWindowDimension} from '@josedache/rn-media-query';
import {
  PanGestureHandlerGestureEvent,
  State,
} from 'react-native-gesture-handler';
import Animated, {
  event,
  block,
  Value,
  set,
  add,
  diffClamp,
  greaterOrEq,
  cond,
  eq,
  onChange,
  call,
  debug,
  interpolate,
  Extrapolate,
  Easing,
  spring,
  Clock,
  SpringUtils,
  proc,
  clockRunning,
  not,
  startClock,
  stopClock,
  timing,
  defined,
  multiply,
  and,
} from 'react-native-reanimated';

export type Props = {
  snapPoints: number[];
  initSnapIndex?: number;
};
export type Ref = React.Ref<{
  open: Function;
  close: Function;
  snapTo: Function;
}>;

// const animeState = {
//   finished: new Value(0),
//   position: new Value(0),
//   time: new Value(0),
//   frameTime: new Value(0),
//   velocity: new Value(0),
// };

// const animeConfig = SpringUtils.makeConfigFromOrigamiTensionAndFriction({
//   ...SpringUtils.makeDefaultConfig(),
//   tension: 30,
//   friction: 5,
// });

const timingConfig = {
  duration: 1000,
  easing: Easing.inOut(Easing.ease),
  toValue: new Value(0),
};

const GestureState = State.UNDETERMINED;

export function useBottomSheet(props: Props, ref: Ref) {
  const {snapPoints, initSnapIndex = 0} = props;
  const VISIBLE_FULL_HEIGHT = Math.max(...snapPoints);
  const DEVICE_HEIGHT = useWindowDimension().height;
  const REST_POSITIONS = useMemo(
    () => snapPoints.map(point => VISIBLE_FULL_HEIGHT - point),
    [VISIBLE_FULL_HEIGHT, snapPoints],
  );
  const SORTED_POSITIONS = useMemo(
    () =>
      [...REST_POSITIONS]
        .sort((a, b) => (a < b ? -1 : a === b ? 0 : 1))
        .map(position => new Value(position)),
    [REST_POSITIONS],
  );

  const [clock] = useState(() => new Clock());

  const [previousPosition] = useState(
    () => new Value(REST_POSITIONS[initSnapIndex]),
  );
  const [position] = useState(() => new Value(REST_POSITIONS[initSnapIndex]));

  const calcSnapPoint = useCallback(
    (i = 0): Animated.Node<number> =>
      i + 1 === SORTED_POSITIONS.length
        ? SORTED_POSITIONS[i]
        : cond(
            greaterOrEq(SORTED_POSITIONS[i], position),
            SORTED_POSITIONS[i],
            calcSnapPoint(i + 1),
          ),
    [SORTED_POSITIONS, position],
  );

  const snapPoint = calcSnapPoint();

  const animeState = useMemo(
    () => ({
      finished: new Value(0),
      position: new Value(REST_POSITIONS[initSnapIndex]),
      time: new Value(0),
      // frameTime: new Value(0),
      velocity: new Value(0),
    }),
    [REST_POSITIONS, initSnapIndex],
  );

  const animeConfig = useMemo(
    () =>
      SpringUtils.makeConfigFromOrigamiTensionAndFriction({
        ...SpringUtils.makeDefaultConfig(),
        tension: 40,
        friction: 7,
        toValue: snapPoint,
      }),
    [snapPoint],
  );

  // const [onDragEnd, watcher] = useReanimatedTriggerAndWatcher(
  //   [position],
  //   ([positionRawValue]) => {
  //     // const currentPostion = SORTED_POSITIONS.find(
  //     //   restPosition => restPosition >= positionRawValue,
  //     // );
  //     // previousPosition.setValue(currentPostion!);
  //     // position.setValue(currentPostion!);
  //   },
  // );

  const handleJSAnimation = useCallback(
    toValue => {
      previousPosition.setValue(toValue);
      spring(animeState.position, {
        ...SpringUtils.makeDefaultConfig(),
        toValue,
      }).start();
    },
    [animeState.position, previousPosition],
  );

  Animated.useCode(
    () => [
      cond(clockRunning(clock), 0, [
        set(animeState.finished, 0),
        set(animeState.time, 0),
        set(animeState.velocity, 0),
        // debug('state setter', clockRunning(clock)),
        // set(animeConfig.toValue, snapPoint),
      ]),
      // spring(clock, animeState, animeConfig),
      cond(clockRunning(clock), spring(clock, animeState, animeConfig)),
      cond(animeState.finished, stopClock(clock)),
      // debug('clock is runing', clockRunning(clock)),
    ],
    [],
  );

  // Animated.useCode(
  //   () => [cond(clockRunning(clock), spring(clock, animeState, animeConfig))],
  //   [],
  // );

  const style = useMemo(
    () => ({
      height: VISIBLE_FULL_HEIGHT,
      bottom: 0,
      transform: [{translateY: animeState.position}],
    }),
    [VISIBLE_FULL_HEIGHT, animeState.position],
  );

  const onDragEnd = useCallback(
    event<PanGestureHandlerGestureEvent>([
      {
        nativeEvent: ({state, translationY}) =>
          block([
            cond(eq(state, State.END), [
              set(previousPosition, snapPoint),
              // set(animeState.position, snapPoint),
              startClock(clock),
            ]),
          ]),
      },
    ]),
    [],
  );

  const onDrag = useCallback(
    event<PanGestureHandlerGestureEvent>([
      {
        nativeEvent: ({translationY}) =>
          block([
            set(
              animeState.position,
              set(
                position,
                interpolate(add(previousPosition, translationY), {
                  inputRange: [
                    Math.min(...REST_POSITIONS),
                    Math.max(...REST_POSITIONS),
                  ],
                  outputRange: [
                    Math.min(...REST_POSITIONS),
                    Math.max(...REST_POSITIONS),
                  ],
                  extrapolate: Extrapolate.CLAMP,
                }),
              ),
            ),
          ]),
      },
    ]),
    [],
  );

  return {
    DEVICE_HEIGHT,
    VISIBLE_FULL_HEIGHT,
    position,
    onDrag,
    onDragEnd,
    style,
    handleJSAnimation,
  };
}

export function useReanimatedTriggerAndWatcher<T>(
  nodes: (T | Animated.Node<T>)[],
  callback: (args: ReadonlyArray<T>) => void,
) {
  const value = new Value<number>(0);
  const trigger = () => {
    value.setValue(1);
    return value;
  };

  const watcher = onChange(value, [
    cond(value, call(nodes, callback)),
    set(value, 0),
  ]);

  return [trigger, watcher] as const;
}
