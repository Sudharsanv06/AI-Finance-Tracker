import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, FlatList, Modal, ActivityIndicator,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useState, useRef } from 'react';
import api    from '../services/api';
import { COLORS } from '../utils/helpers';

const SUGGESTIONS = [
  'How is my budget?',
  'Any pending approvals?',
  'Summarize my finances',
  'Tips to save money',
];

export default function ChatBot() {
  const [isOpen,   setIsOpen]   = useState(false);
  const [messages, setMessages] = useState([
    {
      role:    'assistant',
      content: "Hi! I'm EventFi AI 🤖 Ask me anything about your finances!",
    },
  ]);
  const [input,   setInput]   = useState('');
  const [loading, setLoading] = useState(false);
  const listRef               = useRef(null);

  const sendMessage = async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;

    const userMsg = { role: 'user', content: msg };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const history = messages.slice(1).map((m) => ({
        role: m.role, content: m.content,
      }));
      const res = await api.post('/ai/chat', { message: msg, history });
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: res.data.data.reply },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, something went wrong. Try again.' },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const renderMessage = ({ item }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[s.msgRow, isUser && s.msgRowUser]}>
        {!isUser && (
          <View style={s.botAvatar}>
            <Text style={{ fontSize: 16 }}>🤖</Text>
          </View>
        )}
        <View style={[s.bubble, isUser ? s.bubbleUser : s.bubbleBot]}>
          <Text style={[s.bubbleText, isUser && s.bubbleTextUser]}>
            {item.content}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <>
      {/* Floating Button */}
      <TouchableOpacity
        style={s.fab}
        onPress={() => setIsOpen(true)}
        activeOpacity={0.85}
      >
        <Text style={s.fabText}>🤖</Text>
      </TouchableOpacity>

      {/* Chat Modal */}
      <Modal visible={isOpen} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView
          style={s.container}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* Header */}
          <View style={s.header}>
            <View style={s.headerLeft}>
              <View style={s.headerAvatar}>
                <Text style={{ fontSize: 20 }}>🤖</Text>
              </View>
              <View>
                <Text style={s.headerTitle}>EventFi AI</Text>
                <Text style={s.headerSub}>Powered by Groq</Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => setIsOpen(false)}
              style={s.closeBtn}
            >
              <Text style={s.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Messages */}
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(_, i) => String(i)}
            renderItem={renderMessage}
            contentContainerStyle={s.messageList}
            onContentSizeChange={() =>
              listRef.current?.scrollToEnd({ animated: true })
            }
            ListFooterComponent={
              loading ? (
                <View style={s.typingRow}>
                  <View style={s.botAvatar}>
                    <Text style={{ fontSize: 16 }}>🤖</Text>
                  </View>
                  <View style={s.typingBubble}>
                    <ActivityIndicator size="small" color={COLORS.teal} />
                  </View>
                </View>
              ) : null
            }
          />

          {/* Suggestions */}
          {messages.length <= 1 && (
            <View style={s.suggestRow}>
              {SUGGESTIONS.map((sg) => (
                <TouchableOpacity
                  key={sg}
                  onPress={() => sendMessage(sg)}
                  style={s.suggestBtn}
                >
                  <Text style={s.suggestText}>{sg}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Input */}
          <View style={s.inputRow}>
            <TextInput
              style={s.input}
              value={input}
              onChangeText={setInput}
              placeholder="Ask about your finances..."
              placeholderTextColor={COLORS.teal100}
              multiline
              maxLength={500}
              editable={!loading}
            />
            <TouchableOpacity
              style={[s.sendBtn, (!input.trim() || loading) && s.sendBtnDisabled]}
              onPress={() => sendMessage()}
              disabled={!input.trim() || loading}
            >
              <Text style={s.sendText}>→</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const s = StyleSheet.create({
  fab: {
    position:        'absolute',
    bottom:          90,
    right:           20,
    width:           56,
    height:          56,
    borderRadius:    18,
    backgroundColor: COLORS.teal,
    alignItems:      'center',
    justifyContent:  'center',
    shadowColor:     COLORS.teal,
    shadowOffset:    { width: 0, height: 4 },
    shadowOpacity:   0.35,
    shadowRadius:    8,
    elevation:       8,
    zIndex:          999,
  },
  fabText: { fontSize: 24 },
  container: { flex: 1, backgroundColor: COLORS.cream },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', backgroundColor: COLORS.teal,
    paddingHorizontal: 16, paddingVertical: 14, paddingTop: 50,
  },
  headerLeft:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerAvatar: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 15, fontWeight: '800', color: COLORS.cream },
  headerSub:   { fontSize: 10, color: 'rgba(240,237,229,0.7)', marginTop: 1 },
  closeBtn: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  closeText: { fontSize: 14, color: COLORS.cream, fontWeight: '700' },
  messageList: { padding: 16, gap: 12, paddingBottom: 8 },
  msgRow:     { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 4 },
  msgRowUser: { flexDirection: 'row-reverse' },
  botAvatar: {
    width: 30, height: 30, borderRadius: 10,
    backgroundColor: COLORS.teal50, alignItems: 'center', justifyContent: 'center',
  },
  bubble: {
    maxWidth: '78%', paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 16,
  },
  bubbleBot:      { backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.teal100, borderBottomLeftRadius: 4 },
  bubbleUser:     { backgroundColor: COLORS.teal, borderBottomRightRadius: 4 },
  bubbleText:     { fontSize: 14, color: COLORS.teal, lineHeight: 20 },
  bubbleTextUser: { color: COLORS.cream },
  typingRow:   { flexDirection: 'row', alignItems: 'flex-end', gap: 8, padding: 8 },
  typingBubble:{ backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.teal100, borderRadius: 16, padding: 12 },
  suggestRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16, paddingBottom: 8 },
  suggestBtn: {
    paddingHorizontal: 12, paddingVertical: 8,
    backgroundColor: COLORS.white, borderRadius: 12,
    borderWidth: 1, borderColor: COLORS.teal100,
  },
  suggestText: { fontSize: 12, color: COLORS.teal, fontWeight: '600' },
  inputRow: {
    flexDirection: 'row', gap: 10, padding: 12,
    backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: COLORS.teal100,
  },
  input: {
    flex: 1, borderWidth: 1.5, borderColor: COLORS.teal100, borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: COLORS.teal,
    maxHeight: 80,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: COLORS.teal, alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
  sendText: { fontSize: 20, color: COLORS.cream, fontWeight: '800' },
});