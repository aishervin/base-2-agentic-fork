import React from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { colors, font } from '../theme';
import { Notice, Panel } from '../components/Ui';

export default function PlaceholderScreen({ title, description }) {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Panel>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </Panel>
      <Notice tone="warning">این بخش در فورک فعلی به UI و API واقعی وصل نشده است. مسیرهای اصلی اسناد و شروع/پایان حمل آماده‌اند.</Notice>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, padding: 14, backgroundColor: colors.canvas },
  title: { color: colors.text, fontFamily: font, fontWeight: '700', fontSize: 18, textAlign: 'right', writingDirection: 'rtl' },
  description: { color: colors.muted, fontFamily: font, fontSize: 13, lineHeight: 23, marginTop: 10, textAlign: 'right', writingDirection: 'rtl' },
});
