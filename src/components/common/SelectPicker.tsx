import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, borderRadius, spacing, typography, shadows } from '../../constants/theme';

export interface SelectOption {
  label: string;
  value: string;
}

interface SelectPickerProps {
  label?: string;
  placeholder: string;
  options: SelectOption[];
  selectedValue: string;
  onValueChange: (value: string) => void;
  error?: string | null;
  containerStyle?: ViewStyle;
  testID?: string;
  errorTestID?: string;
}

export const SelectPicker: React.FC<SelectPickerProps> = ({
  label,
  placeholder,
  options,
  selectedValue,
  onValueChange,
  error,
  containerStyle,
  testID,
  errorTestID,
}) => {
  const [modalVisible, setModalVisible] = useState(false);

  const selectedOption = options.find((opt) => opt.value === selectedValue);
  const displayLabel = selectedOption && selectedOption.value !== '' ? selectedOption.label : placeholder;
  const isPlaceholder = !selectedOption || selectedOption.value === '';

  const handleSelect = (value: string) => {
    onValueChange(value);
    setModalVisible(false);
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <TouchableOpacity
        testID={testID}
        activeOpacity={0.75}
        style={[
          styles.trigger,
          !isPlaceholder ? styles.triggerActive : null,
          error ? styles.triggerError : null,
        ]}
        onPress={() => setModalVisible(true)}
      >
        <Text
          style={[
            styles.triggerText,
            isPlaceholder ? styles.placeholderText : styles.selectedText,
          ]}
        >
          {displayLabel}
        </Text>
        <View style={styles.chevronCircle}>
          <Ionicons name="chevron-down" size={16} color={colors.primary} />
        </View>
      </TouchableOpacity>

      {error ? (
        <Text testID={errorTestID} style={styles.errorText}>
          {error}
        </Text>
      ) : null}

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <View style={styles.modalIconDot} />
                <Text style={styles.modalTitle}>{label || placeholder}</Text>
              </View>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeBtn}
              >
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={options}
              keyExtractor={(item, index) => `${item.value}_${index}`}
              renderItem={({ item }) => {
                const isSelected = item.value === selectedValue;
                const isOptionPlaceholder = item.value === '';
                return (
                  <TouchableOpacity
                    style={[
                      styles.optionItem,
                      isSelected ? styles.optionItemSelected : null,
                    ]}
                    onPress={() => handleSelect(item.value)}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        isSelected ? styles.optionTextSelected : null,
                        isOptionPlaceholder ? styles.optionPlaceholderText : null,
                      ]}
                    >
                      {item.label}
                    </Text>
                    {isSelected ? (
                      <View style={styles.checkCircle}>
                        <Ionicons
                          name="checkmark"
                          size={14}
                          color={colors.textInverted}
                        />
                      </View>
                    ) : null}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.captionMedium,
    color: colors.textSecondary,
    marginBottom: spacing.xs + 2,
    letterSpacing: 0.2,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
  },
  triggerActive: {
    borderColor: colors.borderFocus,
    backgroundColor: '#FAFCFF',
  },
  triggerError: {
    borderColor: colors.error,
    backgroundColor: colors.errorLight,
  },
  triggerText: {
    fontSize: 15,
  },
  placeholderText: {
    color: colors.textMuted,
  },
  selectedText: {
    color: colors.text,
    fontWeight: '600',
  },
  chevronCircle: {
    width: 24,
    height: 24,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    ...typography.caption,
    color: colors.error,
    marginTop: spacing.xs,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(11, 25, 44, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  modalContent: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    ...shadows.floating,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  modalIconDot: {
    width: 8,
    height: 8,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
  },
  modalTitle: {
    ...typography.h3,
    color: colors.text,
  },
  closeBtn: {
    padding: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceSubtle,
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    marginVertical: 2,
  },
  optionItemSelected: {
    backgroundColor: colors.primaryLight,
  },
  optionText: {
    fontSize: 15,
    color: colors.text,
    fontWeight: '500',
  },
  optionPlaceholderText: {
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  optionTextSelected: {
    color: colors.primary,
    fontWeight: '700',
  },
  checkCircle: {
    width: 20,
    height: 20,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
