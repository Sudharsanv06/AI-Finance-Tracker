import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Modal, TextInput, FlatList,
} from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import familyService from '../services/familyService';
import incomeService from '../services/incomeService';
import { COLORS, formatCurrency, formatDate, getInitials } from '../utils/helpers';
import Ionicons from '@expo/vector-icons/Ionicons';

const RELATIONS = ['Spouse', 'Parent', 'Child', 'Sibling', 'Other'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const COLOR_OPTIONS = [
  '#004643', '#1a706b', '#2d9e99', '#f59e0b',
  '#8b5cf6', '#ec4899', '#ef4444', '#10b981',
];

export default function FamilyScreen({ navigation }) {
  const now = new Date();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [submitting, setSubmitting] = useState(false);

  // Modal Form State
  const [name, setName] = useState('');
  const [relation, setRelation] = useState('Other');
  const [color, setColor] = useState('#004643');

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      const famRes = await familyService.getMembers({ month: selectedMonth, year: selectedYear });
      setMembers(famRes.data?.members || []);
    } catch (err) {
      console.log('Error fetching family:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const handleOpenAdd = () => {
    setEditingMember(null);
    setName('');
    setRelation('Other');
    setColor('#004643');
    setShowModal(true);
  };

  const handleOpenEdit = (m) => {
    setEditingMember(m);
    setName(m.name || '');
    setRelation(m.relation || 'Other');
    setColor(m.color || '#004643');
    setShowModal(true);
  };

  const handleSaveMember = async () => {
    if (!name.trim()) {
      return Alert.alert('Validation Error', 'Member name is required.');
    }
    setSubmitting(true);
    try {
      const payload = { name: name.trim(), relation, color };
      if (editingMember?._id) {
        await familyService.updateMember(editingMember._id, payload);
      } else {
        await familyService.createMember(payload);
      }
      setShowModal(false);
      fetchMembers();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to save family member.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteMember = (id, memberName) => {
    Alert.alert(
      'Remove Member',
      `Are you sure you want to remove ${memberName} from your family group?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await familyService.deleteMember(id);
              fetchMembers();
            } catch (err) {
              Alert.alert('Error', 'Failed to delete member.');
            }
          },
        },
      ]
    );
  };

  const totalFamilyIncome = members.reduce((sum, m) => sum + (m.recordedIncome || 0), 0);
  const selfMember = members.find((m) => m.relation === 'Self');
  const myIncome = selfMember ? (selfMember.recordedIncome || 0) : 0;

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>Family & Shared Budget</Text>
          <Text style={s.headerSub}>{members.length} member{members.length !== 1 ? 's' : ''} in family</Text>
        </View>
        <TouchableOpacity style={s.addBtn} onPress={handleOpenAdd} activeOpacity={0.85}>
          <Ionicons name="add" size={20} color={COLORS.white} />
          <Text style={s.addBtnText}>Add</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.content}>
        {/* Family Summary Overview */}
        <View style={s.summaryCard}>
          <Text style={s.summaryTitle}>Family Financial Overview</Text>
          <View style={s.summaryGrid}>
            <View style={s.summaryBox}>
              <Text style={s.summaryBoxLabel}>Members</Text>
              <Text style={s.summaryBoxVal}>{members.length}</Text>
            </View>
            <View style={s.summaryBox}>
              <Text style={s.summaryBoxLabel}>My Income</Text>
              <Text style={s.summaryBoxVal}>{formatCurrency(myIncome)}</Text>
            </View>
            <View style={s.summaryBox}>
              <Text style={s.summaryBoxLabel}>Combined Income</Text>
              <Text style={s.summaryBoxVal}>{formatCurrency(totalFamilyIncome)}</Text>
            </View>
          </View>
        </View>

        <Text style={s.sectionHeader}>Family Members</Text>

        {loading ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginTop: 20 }} />
        ) : members.length === 0 ? (
          <View style={s.emptyBox}>
            <Ionicons name="people-outline" size={48} color={COLORS.teal200} />
            <Text style={s.emptyTitle}>No Family Members Added</Text>
            <Text style={s.emptySub}>Add members to track combined family finances and shared budgets.</Text>
            <TouchableOpacity style={s.emptyBtn} onPress={handleOpenAdd}>
              <Text style={s.emptyBtnText}>+ Add First Member</Text>
            </TouchableOpacity>
          </View>
        ) : (
          members.map((item) => (
            <View key={item._id} style={s.memberCard}>
              <View style={s.memberRow}>
                <View style={[s.avatar, { backgroundColor: item.color || COLORS.primary }]}>
                  <Text style={s.avatarText}>{getInitials(item.name)}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={s.memberName}>{item.name}</Text>
                  <Text style={s.memberRelation}>{item.relation || 'Member'}</Text>
                </View>
                <Text style={s.memberIncome}>{formatCurrency(item.recordedIncome || 0)}</Text>
              </View>

              <View style={s.cardActions}>
                <TouchableOpacity style={s.editBtn} onPress={() => handleOpenEdit(item)}>
                  <Text style={s.editBtnText}>Edit</Text>
                </TouchableOpacity>
                {item.relation !== 'Self' && (
                  <TouchableOpacity style={s.deleteBtn} onPress={() => handleDeleteMember(item._id, item.name)}>
                    <Text style={s.deleteBtnText}>Remove</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Add / Edit Member Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>{editingMember ? 'Edit Member' : 'Add Family Member'}</Text>

            <Text style={s.label}>FULL NAME</Text>
            <TextInput
              style={s.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g. Priya"
              placeholderTextColor={COLORS.outlineVariant}
            />

            <Text style={s.label}>RELATIONSHIP</Text>
            <View style={s.relationRow}>
              {RELATIONS.map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[s.relationChip, relation === r && s.relationChipActive]}
                  onPress={() => setRelation(r)}
                >
                  <Text style={[s.relationChipText, relation === r && s.relationChipTextActive]}>{r}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={s.label}>AVATAR COLOR</Text>
            <View style={s.colorRow}>
              {COLOR_OPTIONS.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[s.colorCircle, { backgroundColor: c }, color === c && s.colorCircleActive]}
                  onPress={() => setColor(c)}
                />
              ))}
            </View>

            <View style={s.modalBtns}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => setShowModal(false)}>
                <Text style={s.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.saveBtn} onPress={handleSaveMember} disabled={submitting}>
                {submitting ? <ActivityIndicator color={COLORS.white} /> : <Text style={s.saveBtnText}>Save Member</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    paddingTop: 56, paddingBottom: 16, paddingHorizontal: 16,
    backgroundColor: COLORS.white, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'space-between',
    borderBottomWidth: 1, borderBottomColor: 'rgba(194,198,214,0.2)',
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: COLORS.onSurface },
  headerSub: { fontSize: 12, color: COLORS.onSurfaceVariant, marginTop: 2 },
  addBtn: {
    backgroundColor: COLORS.primary, paddingHorizontal: 14,
    paddingVertical: 8, borderRadius: 8, flexDirection: 'row', alignItems: 'center',
  },
  addBtnText: { color: COLORS.white, fontWeight: '700', marginLeft: 4 },
  content: { padding: 16, paddingBottom: 40 },
  summaryCard: {
    backgroundColor: COLORS.white, borderRadius: 16, padding: 16,
    marginBottom: 20, borderWidth: 1, borderColor: 'rgba(194,198,214,0.3)',
  },
  summaryTitle: { fontSize: 15, fontWeight: '700', color: COLORS.onSurface, marginBottom: 12 },
  summaryGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryBox: {
    flex: 1, backgroundColor: COLORS.surfaceContainerLow,
    padding: 10, borderRadius: 10, marginHorizontal: 4, alignItems: 'center',
  },
  summaryBoxLabel: { fontSize: 10, color: COLORS.onSurfaceVariant, fontWeight: '600', textTransform: 'uppercase' },
  summaryBoxVal: { fontSize: 13, fontWeight: '700', color: COLORS.primary, marginTop: 4 },
  sectionHeader: { fontSize: 16, fontWeight: '700', color: COLORS.onSurface, marginBottom: 12 },
  emptyBox: {
    backgroundColor: COLORS.white, borderRadius: 16, padding: 32,
    alignItems: 'center', borderWidth: 1, borderColor: 'rgba(194,198,214,0.3)',
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: COLORS.onSurface, marginTop: 12 },
  emptySub: { fontSize: 12, color: COLORS.onSurfaceVariant, textAlign: 'center', marginTop: 4, marginBottom: 16 },
  emptyBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  emptyBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 13 },
  memberCard: {
    backgroundColor: COLORS.white, borderRadius: 14, padding: 16,
    marginBottom: 12, borderWidth: 1, borderColor: 'rgba(194,198,214,0.3)',
  },
  memberRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: COLORS.white, fontWeight: '700', fontSize: 15 },
  memberName: { fontSize: 15, fontWeight: '700', color: COLORS.onSurface },
  memberRelation: { fontSize: 12, color: COLORS.onSurfaceVariant, marginTop: 1 },
  memberIncome: { fontSize: 15, fontWeight: '700', color: COLORS.primary },
  cardActions: { flexDirection: 'row', marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(194,198,214,0.15)' },
  editBtn: { flex: 1, alignItems: 'center', paddingVertical: 6 },
  editBtnText: { color: COLORS.primary, fontWeight: '600', fontSize: 13 },
  deleteBtn: { flex: 1, alignItems: 'center', paddingVertical: 6 },
  deleteBtnText: { color: COLORS.red, fontWeight: '600', fontSize: 13 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalCard: { backgroundColor: COLORS.white, borderRadius: 16, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: COLORS.onSurface, marginBottom: 16 },
  label: { fontSize: 11, fontWeight: '700', color: COLORS.onSurfaceVariant, marginTop: 12, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: COLORS.outlineVariant, borderRadius: 8, padding: 12, fontSize: 14 },
  relationRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  relationChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: COLORS.outlineVariant },
  relationChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  relationChipText: { fontSize: 12, color: COLORS.onSurfaceVariant },
  relationChipTextActive: { color: COLORS.white, fontWeight: '700' },
  colorRow: { flexDirection: 'row', gap: 10, marginTop: 6 },
  colorCircle: { width: 28, height: 28, borderRadius: 14 },
  colorCircleActive: { borderWidth: 2, borderColor: COLORS.primary },
  modalBtns: { flexDirection: 'row', gap: 12, marginTop: 24 },
  cancelBtn: { flex: 1, borderHeight: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 8, borderWidth: 1, borderColor: COLORS.outlineVariant },
  cancelBtnText: { color: COLORS.onSurfaceVariant, fontWeight: '600' },
  saveBtn: { flex: 1, backgroundColor: COLORS.primary, paddingVertical: 12, alignItems: 'center', borderRadius: 8 },
  saveBtnText: { color: COLORS.white, fontWeight: '700' },
});
