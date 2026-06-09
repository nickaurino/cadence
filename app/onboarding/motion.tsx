import { View, Text, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { colors } from '@/theme/colors';
import { PRIMERS } from '@/onboarding/copy';

// Motion heads-up (informational). No Allow button: iOS won't reliably honor a
// re-prompt once motion is decided, so this just sets expectations. The OS prompt
// fires when the first session starts reading steps; if motion is off, the in-app
// no-motion state handles it.
export default function MotionHeadsUp() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{PRIMERS.motion.title}</Text>
      <Text style={styles.body}>{PRIMERS.motion.body}</Text>
      <Pressable
        style={styles.button}
        onPress={() => router.push('/onboarding/connect?from=onboarding')}
      >
        <Text style={styles.buttonText}>{PRIMERS.motion.cta}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', padding: 32 },
  title: { fontSize: 32, fontWeight: '700', color: colors.text, marginBottom: 24 },
  body: { fontSize: 17, color: colors.muted, lineHeight: 26, marginBottom: 48 },
  button: { backgroundColor: colors.accent, borderRadius: 50, paddingVertical: 16, alignItems: 'center' },
  buttonText: { color: colors.onAccent, fontSize: 17, fontWeight: '600' },
});
