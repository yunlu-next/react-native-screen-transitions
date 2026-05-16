import { useCallback } from "react";
import { type LayoutChangeEvent, useWindowDimensions } from "react-native";
import { runOnUI } from "react-native-reanimated";
import {
	useDescriptorDerivations,
	useDescriptors,
} from "../../../providers/screen/descriptors";
import { AnimationStore } from "../../../stores/animation.store";
import {
	LifecycleTransitionRequestKind,
	SystemStore,
} from "../../../stores/system.store";

export function useContentLayout() {
	const { current } = useDescriptors();
	const { isFirstKey } = useDescriptorDerivations();
	const { height: screenHeight } = useWindowDimensions();
	const routeKey = current.route.key;
	const animations = AnimationStore.getBag(routeKey);
	const system = SystemStore.getBag(routeKey);

	const {
		targetProgress,
		resolvedAutoSnapPoint,
		measuredContentLayout,
		screenLayout,
	} = system;
	const { requestLifecycleTransition } = system.actions;

	const experimental_animateOnInitialMount =
		current.options.experimental_animateOnInitialMount;

	return useCallback(
		(event: LayoutChangeEvent) => {
			const { width, height } = event.nativeEvent.layout;
			if (width <= 0 || height <= 0) return;

			runOnUI(
				(nextWidth: number, nextHeight: number, fallbackHeight: number) => {
					"worklet";
					const measuredScreenHeight =
						screenLayout.get()?.height ?? fallbackHeight;
					const nextFraction = Math.min(nextHeight / measuredScreenHeight, 1);

					measuredContentLayout.value = {
						width: nextWidth,
						height: nextHeight,
					};

					const isFirstMeasurement = resolvedAutoSnapPoint.value <= 0;
					resolvedAutoSnapPoint.value = nextFraction;

					if (
						!isFirstMeasurement ||
						animations.progress.value !== 0 ||
						animations.animating.value !== 0
					) {
						return;
					}

					if (isFirstKey && !experimental_animateOnInitialMount) {
						targetProgress.value = nextFraction;
						animations.progress.value = nextFraction;
						return;
					}

					requestLifecycleTransition(
						LifecycleTransitionRequestKind.Open,
						nextFraction,
					);
				},
			)(width, height, screenHeight);
		},
		[
			animations,
			targetProgress,
			resolvedAutoSnapPoint,
			measuredContentLayout,
			screenLayout,
			isFirstKey,
			screenHeight,
			experimental_animateOnInitialMount,
			requestLifecycleTransition,
		],
	);
}
