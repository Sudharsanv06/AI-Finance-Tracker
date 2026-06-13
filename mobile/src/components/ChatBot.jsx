import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, FlatList, Modal, ActivityIndicator,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useState, useRef, useEffect } from 'react';
import api    from '../services/api';
import { COLORS } from '../utils/helpers';
import Ionicons from '@expo/vector-icons/Ionicons';

const SUGGESTIONS = [
  'How is my budget?',
  'Any pending approvals?',
  'Summarize my finances',
  'Tips to save money',
];

const cleanMarkdown = (text) => {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1') // remove bold asterisks
    .replace(/\*(.*?)\*/g, '$1')     // remove italic asterisks
    .replace(/`([^`]+)`/g, '$1')     // remove inline code blocks
    .replace(/^#+\s+/gm, '')         // remove headers markdown
    .trim();
};

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

  // Auto-scroll to bottom when messages or loading state changes
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        listRef.current?.scrollToEnd({ animated: true });
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [messages, loading, isOpen]);

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
    } catch (err) {
      console.log('Chat Error details:', err);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, something went wrong. Try again.' },
      ]);
    } finally {
      setLoading(false);
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
            {isUser ? item.content : cleanMarkdown(item.content)}
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
        <Ionicons name="chatbubble-ellipses" size={26} color="#ffffff" />
      </TouchableOpacity>

      {/* Chat Modal */}
      <Modal visible={isOpen} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView
          style={s.container}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
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
              <Ionicons name="close" size={20} color="#ffffff" />
            </TouchableOpacity>
          </View>

          {/* Messages */}
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(_, i) => String(i)}
            renderItem={renderMessage}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
            contentContainerStyle={s.messageList}
            ListFooterComponent={
              loading ? (
                <View style={s.typingRow}>
                  <View style={s.botAvatar}>
                    <Text style={{ fontSize: 16 }}>🤖</Text>
                  </View>
                  <View style={s.typingBubble}>
                    <ActivityIndicator size="small" color={COLORS.primary} />
                  </View>
                </View>
              ) : null
            }
          />

          {/* Suggestions */}
          {messages.length <= 1 && !loading && (
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
              placeholderTextColor={COLORS.outline}
              multiline
              maxLength={500}
              editable={!loading}
            />
            <TouchableOpacity
              style={[s.sendBtn, (!input.trim() || loading) && s.sendBtnDisabled]}
              onPress={() => sendMessage()}
              disabled={!input.trim() || loading}
            >
              <Ionicons name="send" size={18} color="#ffffff" />
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
    bottom:          80,
    right:           20,
    width:           56,
    height:          56,
    borderRadius:    28,
    backgroundColor: '#0058be', // Vibrant Blue primary
    alignItems:      'center',
    justifyContent:  'center',
    shadowColor:     '#0058be',
    shadowOffset:    { width: 0, height: 4 },
    shadowOpacity:   0.35,
    shadowRadius:    8,
    elevation:       8,
    zIndex:          999,
  },
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', backgroundColor: '#0058be',
    paddingHorizontal: 16, paddingVertical: 14, paddingTop: Platform.OS === 'ios' ? 44 : 48,
  },
  headerLeft:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerAvatar: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 16, fontWeight: '800', color: COLORS.white },
  headerSub:   { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 1 },
  closeBtn: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  messageList: { padding: 16, gap: 12, paddingBottom: 16 },
  msgRow:     { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 4 },
  msgRowUser: { flexDirection: 'row-reverse' },
  botAvatar: {
    width: 30, height: 30, borderRadius: 10,
    backgroundColor: COLORS.surfaceContainerLow, alignItems: 'center', justifyContent: 'center',
  },
  bubble: {
    maxWidth: '78%', paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 16,
  },
  bubbleBot:      { backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.outlineVariant, borderBottomLeftRadius: 4 },
  bubbleUser:     { backgroundColor: '#0058be', borderBottomRightRadius: 4 },
  bubbleText:     { fontSize: 14, color: COLORS.onSurface, lineHeight: 20 },
  bubbleTextUser: { color: COLORS.white },
  typingRow:   { flexDirection: 'row', alignItems: 'flex-end', gap: 8, padding: 8 },
  typingBubble:{ backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.outlineVariant, borderRadius: 16, padding: 12 },
  suggestRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16, paddingBottom: 16 },
  suggestBtn: {
    paddingHorizontal: 12, paddingVertical: 8,
    backgroundColor: COLORS.white, borderRadius: 12,
    borderWidth: 1, borderColor: COLORS.outlineVariant,
  },
  suggestText: { fontSize: 12, color: '#0058be', fontWeight: '600' },
  inputRow: {
    flexDirection: 'row', gap: 10, padding: 12,
    backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: COLORS.outlineVariant,
    alignItems: 'center',
  },
  input: {
    flex: 1, borderWidth: 1.5, borderColor: COLORS.outlineVariant, borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: COLORS.onSurface,
    maxHeight: 80,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: '#0058be', alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
});