import { SafeAreaView, StyleSheet } from "react-native";

export default function HomeScreen() {
  return <SafeAreaView style={styles.container} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f6f8",
  },
});
