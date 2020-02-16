import React from 'react';
import BottomSheet from '@josedache/rn-bottom-sheet';

function BottomSheetDemo() {
  return <BottomSheet snapPoints={[100, 250, 350]} />;
}

BottomSheetDemo.routeName = 'Bottom Sheet';
export default BottomSheetDemo;