import { useLocalSearchParams } from 'expo-router';
import TrainingScreen from '../features/workouts/TrainingScreen';
export default function Screen() {
  const { workoutId } = useLocalSearchParams<{ workoutId: string }>();
  return <TrainingScreen key={workoutId} workoutId={workoutId} />;
}
