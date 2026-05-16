import { memo, useCallback } from "react";
import { type LayoutChangeEvent, StyleSheet, View } from "react-native";
import { runOnUI } from "react-native-reanimated";
import { useDescriptors } from "../../providers/screen/descriptors";
import { SystemStore } from "../../stores/system.store";
import { useBackdropPointerEvents } from "./hooks/use-backdrop-pointer-events";
import { BackdropLayer } from "./layers/backdrop";
import { ContentLayer } from "./layers/content";

type Props = {
	children: React.ReactNode;
};

export const ScreenContainer = memo(({ children }: Props) => {
	const { pointerEvents, isBackdropActive, backdropBehavior } =
		useBackdropPointerEvents();
	const { current } = useDescriptors();
	const screenLayout = SystemStore.getValue(current.route.key, "screenLayout");

	const handleLayout = useCallback(
		(event: LayoutChangeEvent) => {
			const { width, height } = event.nativeEvent.layout;
			if (width <= 0 || height <= 0) return;

			runOnUI((nextWidth: number, nextHeight: number) => {
				"worklet";
				const previous = screenLayout.get();
				if (previous?.width === nextWidth && previous?.height === nextHeight) {
					return;
				}

				screenLayout.set({
					width: nextWidth,
					height: nextHeight,
				});
			})(width, height);
		},
		[screenLayout],
	);

	return (
		<View
			collapsable={false}
			onLayout={handleLayout}
			style={styles.container}
			pointerEvents={pointerEvents}
		>
			<BackdropLayer
				isBackdropActive={isBackdropActive}
				backdropBehavior={backdropBehavior}
			/>
			<ContentLayer
				pointerEvents={pointerEvents}
				isBackdropActive={isBackdropActive}
			>
				{children}
			</ContentLayer>
		</View>
	);
});

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
});
