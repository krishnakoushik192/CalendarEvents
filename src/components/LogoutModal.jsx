import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Dimensions, Pressable, ActivityIndicator } from 'react-native';

const { width, height } = Dimensions.get('window');

const LogoutModal = (props) => {
  return (
    <Modal
      transparent={true}
      animationType="fade"
      visible={props.visible}
      onRequestClose={props.loading ? null : props.onCancel} // Prevent closing while loading
    >
      <View style={styles.overlay}>
        <Pressable 
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }} 
          onPress={props.loading ? null : props.onCancel} // Disable tap to close while loading
        >
          <View style={styles.modalContainer}>
            <Text style={styles.title}>{props.title}</Text>
            <Text style={styles.message}>{props.message}</Text>

            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={[styles.logoutButton, props.loading && styles.disabledButton]} 
                onPress={props.loading ? null : props.onConfirm}
                activeOpacity={props.loading ? 1 : 0.8}
                disabled={props.loading}
              >
                {props.loading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="#ffffff" />
                    <Text style={[styles.logoutButtonText, { marginLeft: 8 }]}>Deleting...</Text>
                  </View>
                ) : (
                  <Text style={styles.logoutButtonText}>Yes, {props.title}</Text>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.cancelButton, props.loading && styles.disabledButton]} 
                onPress={props.loading ? null : props.onCancel}
                activeOpacity={props.loading ? 1 : 0.8}
                disabled={props.loading}
              >
                <Text style={[styles.cancelButtonText, props.loading && styles.disabledText]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    width: width * 0.85,
    maxWidth: 400,
    minWidth: 280,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    color: '#333333',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  buttonContainer: {
    flexDirection: 'column',
    gap: 12,
  },
  logoutButton: {
    backgroundColor: '#dc3545',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  logoutButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '500',
  },
  disabledButton: {
    opacity: 0.6,
  },
  disabledText: {
    color: '#999999',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default LogoutModal;