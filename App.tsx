import { View, Text } from 'react-native'

export default function App() {
  return (
    <View style={{ flex: 1, backgroundColor: '#0D0D0F', alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: '#F5A623', fontSize: 32, fontWeight: 'bold' }}>Maatram</Text>
      <Text style={{ color: '#fff', fontSize: 16, marginTop: 8 }}>If you can see this, React works!</Text>
    </View>
  )
}
