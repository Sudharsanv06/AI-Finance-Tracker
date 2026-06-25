import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, FlatList, Modal, ActivityIndicator,
  KeyboardAvoidingView, Platform, Animated, PanResponder, Dimensions,
} from 'react-native';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import api    from '../services/api';
import { COLORS } from '../utils/helpers';
import Ionicons from '@expo/vector-icons/Ionicons';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const FAB_SIZE = 56;

const SUGGESTIONS = [
  'How is my budget?',
  'Any pending approvals?',
  'Summarize my finances',
  'Tips to save money',
];

const cleanMarkdown = (text) => {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^#+\s+/gm, '')
    .trim();
};

export default function ChatBot() {
  const { user } = useAuth();
  const [isOpen,   setIsOpen]   = useState(false);
  const [messages, setMessages] = useState([
    {
      role:    'assistant',
      content: "Hi! I'm Paisa Pulse AI. Ask me anything about your finances!",
    },
  ]);
  const [input,   setInput]   = useState('');
  const [loading, setLoading] = useState(false);
  const listRef               = useRef(null);

  // ── Draggable FAB position ───────────────────────────────────────────
  const pan = useRef(
    new Animated.ValueXY({
      x: SCREEN_W - FAB_SIZE - 20,
      y: SCREEN_H - FAB_SIZE - 160,
    })
  ).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        pan.setOffset({ x: pan.x._value, y: pan.y._value });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event(
        [null, { dx: pan.x, dy: pan.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: (_, gesture) => {
        pan.flattenOffset();
        let newX = pan.x._value;
        let newY = pan.y._value;
        newX = Math.max(8, Math.min(newX, SCREEN_W - FAB_SIZE - 8));
        newY = Math.max(60, Math.min(newY, SCREEN_H - FAB_SIZE - 100));
        Animated.spring(pan, {
          toValue: { x: newX, y: newY },
          useNativeDriver: false,
          friction: 6,
        }).start();

        // Tiny movement = treat as a tap, open the chat
        const dist = Math.abs(gesture.dx) + Math.abs(gesture.dy);
        if (dist < 6) {
          setIsOpen(true);
        }
      },
    })
  ).current;

  useFocusEffect(
    useCallback(() => {
      setMessages([{
        role: 'assistant',
        content: `Hi ${user?.name?.split(' ')[0] || 'there'}! I'm your Paisa Pulse AI advisor. I have access to all your financial data. Ask me anything!`,
      }]);
      setInput('');
    }, [user?.name])
  );

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
      const history = messages
        .slice(-8)
        .map(m => ({ role: m.role, content: m.content }));
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
            <Ionicons name="sparkles" size={16} color={COLORS.primary} />
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
      {/* Draggable Floating Button */}
      <Animated.View
        style={[s.fab, { transform: pan.getTranslateTransform() }]}
        {...panResponder.panHandlers}
      >
        <View style={s.fabInner}>
          <Ionicons name="chatbubble-ellipses" size={26} color="#ffffff" />
        </View>
      </Animated.View>

      <Modal visible={isOpen} animationType="slide" presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : undefined}>
        <KeyboardAvoidingView
          style={s.container}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
        >
          <View style={s.header}>
            <View style={s.headerLeft}>
              <View style={s.headerAvatar}>
                <Ionicons name="sparkles" size={20} color="#ffffff" />
              </View>
              <View>
                <Text style={s.headerTitle}>Paisa Pulse AI</Text>
                <Text style={s.headerSub}>Powered by Groq</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <TouchableOpacity
                onPress={() => setMessages([{
                  role: 'assistant',
                  content: 'Chat cleared! Ask me anything about your finances.',
                }])}
                style={s.clearBtn}
              >
                <Text style={s.clearBtnText}>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setIsOpen(false)}
                style={s.closeBtn}
              >
                <Ionicons name="close" size={20} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </View>

          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item, i) => `${item.role}-${i}-${item.content?.length || 0}`}
            renderItem={renderMessage}
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 12, gap: 8, paddingBottom: 8 }}
            onContentSizeChange={() =>
              setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50)
            }
            ListFooterComponent={
              loading ? (
                <View style={s.typingRow}>
                  <View style={s.botAvatar}>
                    <Ionicons name="sparkles" size={16} color={COLORS.primary} />
                  </View>
                  <View style={s.typingBubble}>
                    <ActivityIndicator size="small" color={COLORS.primary} />
                  </View>
                </View>
              ) : null
            }
          />

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
    position: 'absolute',
    top: 0,
    left: 0,
    width: FAB_SIZE,
    height: FAB_SIZE,
    zIndex: 999,
  },
  fabInner: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    backgroundColor: '#0058be',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0058be',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
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
  clearBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  clearBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
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