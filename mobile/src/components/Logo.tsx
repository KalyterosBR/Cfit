import { Image, View } from 'react-native';

type Props = { variant?: 'default' | 'light'; width?: number };

export default function Logo({ variant = 'default', width = 112 }: Props) {
  const light = variant === 'light';
  const imageHeight = width * (light ? 260 / 600 : 400 / 600);
  const visibleHeight = light ? imageHeight : width * 0.32;
  return (
    <View style={{ width, height: visibleHeight, overflow: 'hidden', justifyContent: 'center' }}>
    <Image
      source={light ? require('../../assets/cfit-logo-sidebar.webp') : require('../../assets/cfit-logo.webp')}
      accessibilityLabel="Cfit"
      accessible
      resizeMode="contain"
      style={{ width, height: imageHeight }}
    />
    </View>
  );
}
