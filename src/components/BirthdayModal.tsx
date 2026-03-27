import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Pressable,
  Platform,
  Animated,
  PanResponder,
  Dimensions,
} from 'react-native';
import useTheme from '../hooks/useTheme';

const SCREEN_HEIGHT = Dimensions.get('window').height;

interface BirthdayModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (date: string) => void;
  onRemove: () => void;
  initialValue?: string;
}

export const BirthdayModal: React.FC<BirthdayModalProps> = ({ 
  visible, 
  onClose, 
  onSave, 
  onRemove,
  initialValue = '12/09/1996'
}) => {
  const { colors: themeColors } = useTheme();
  
  const [day, setDay] = useState('12');
  const [month, setMonth] = useState('09');
  const [year, setYear] = useState('1996');

  const panY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible && initialValue) {
      const parts = initialValue.split('/');
      if (parts[0]) setDay(parts[0]);
      if (parts[1]) setMonth(parts[1]);
      if (parts[2]) setYear(parts[2]);
    }
    // Reset pan position when opening
    if (visible) {
      panY.setValue(0);
    }
  }, [visible, initialValue]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => gestureState.dy > 5,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          panY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 120 || gestureState.vy > 0.5) {
          // Close modal
          Animated.timing(panY, {
            toValue: SCREEN_HEIGHT,
            duration: 200,
            useNativeDriver: true,
          }).start(onClose);
        } else {
          // Reset position
          Animated.spring(panY, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 5,
          }).start();
        }
      },
    })
  ).current;

  const months = [
    'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
  ];

  const handleSave = () => {
    const newBirthday = `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
    onSave(newBirthday);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <Animated.View 
          style={[
            styles.sheet, 
            { 
              backgroundColor: themeColors.surface,
              transform: [{ translateY: panY }]
            }
          ]}
        >
          <View style={styles.indicatorContainer} {...panResponder.panHandlers}>
            <View style={styles.indicator} />
          </View>
          
          <View style={styles.header}>
            <Text style={[styles.title, { color: themeColors.textPrimary }]}>Aniversário</Text>
          </View>
          
          <View style={styles.pickerContainer}>
            {/* Day Column */}
            <View style={styles.column}>
              <Text style={[styles.pickerItem, { color: themeColors.textPrimary }]}>11</Text>
              <View style={[styles.selectionBox, { borderColor: themeColors.primary }]}>
                  <Text style={[styles.pickerItemActive, { color: themeColors.textPrimary }]}>{day}</Text>
              </View>
              <Text style={[styles.pickerItem, { color: themeColors.textPrimary }]}>13</Text>
            </View>

            {/* Month Column */}
            <View style={[styles.column, { flex: 1.5 }]}>
              <Text style={[styles.pickerItem, { color: themeColors.textPrimary }]}>agosto</Text>
              <View style={[styles.selectionBox, { borderColor: themeColors.primary }]}>
                  <Text style={[styles.pickerItemActive, { color: themeColors.textPrimary }]}>{months[parseInt(month) - 1] || 'setembro'}</Text>
              </View>
              <Text style={[styles.pickerItem, { color: themeColors.textPrimary }]}>outubro</Text>
            </View>

            {/* Year Column */}
            <View style={styles.column}>
              <Text style={[styles.pickerItem, { color: themeColors.textPrimary }]}>1995</Text>
              <View style={[styles.selectionBox, { borderColor: themeColors.primary }]}>
                  <Text style={[styles.pickerItemActive, { color: themeColors.textPrimary }]}>{year}</Text>
              </View>
              <Text style={[styles.pickerItem, { color: themeColors.textPrimary }]}>1997</Text>
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.saveButton, { backgroundColor: themeColors.primary }]}
            onPress={handleSave}
            activeOpacity={0.8}
          >
            <Text style={styles.saveButtonText}>Salvar</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.removeButton}
            onPress={() => { onRemove(); onClose(); }}
            activeOpacity={0.7}
          >
            <Text style={[styles.removeButtonText, { color: themeColors.primary }]}>Remover</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    alignItems: 'center',
  },
  indicatorContainer: {
    width: '100%',
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  indicator: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#8e8e93',
  },
  header: {
    width: '100%',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  pickerContainer: {
    flexDirection: 'row',
    height: 180,
    width: '100%',
    marginBottom: 30,
  },
  column: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectionBox: {
    width: '90%',
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
  },
  pickerItem: {
    fontSize: 16,
    opacity: 0.3,
  },
  pickerItemActive: {
    fontSize: 18,
    fontWeight: '600',
  },
  saveButton: {
    width: '100%',
    height: 54,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  removeButton: {
    width: '100%',
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
