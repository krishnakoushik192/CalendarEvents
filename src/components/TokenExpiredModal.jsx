import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const { width, height } = Dimensions.get('window');

const TokenExpiredModal = ({ visible, onReLogin }) => {
    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={() => {}} // Prevent closing without action
        >
            <View style={styles.overlay}>
                <View style={styles.modalContainer}>
                    <View style={styles.iconContainer}>
                        <MaterialIcons name="access-time" size={60} color="#EA4335" />
                    </View>
                    
                    <Text style={styles.title}>Session Expired</Text>
                    <Text style={styles.message}>
                        Your login session has expired. Please log in again to continue using the app.
                    </Text>

                    <TouchableOpacity 
                        style={styles.reLoginButton} 
                        onPress={onReLogin}
                        activeOpacity={0.8}
                    >
                        <MaterialIcons name="refresh" size={20} color="#ffffff" style={styles.buttonIcon} />
                        <Text style={styles.reLoginButtonText}>Re-Login</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    modalContainer: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 28,
        width: width * 0.85,
        maxWidth: 400,
        minWidth: 300,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 8,
        },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 12,
    },
    iconContainer: {
        marginBottom: 20,
        padding: 15,
        backgroundColor: '#FFF3F3',
        borderRadius: 50,
    },
    title: {
        fontSize: 22,
        fontWeight: '600',
        color: '#000000',
        textAlign: 'center',
        marginBottom: 12,
        fontFamily: 'Lato-Bold',
    },
    message: {
        fontSize: 16,
        color: '#555555',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 28,
        paddingHorizontal: 10,
        fontFamily: 'Lato-Regular',
    },
    reLoginButton: {
        backgroundColor: '#4285F4',
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 150,
        flexDirection: 'row',
        elevation: 2,
        shadowColor: '#4285F4',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
    },
    buttonIcon: {
        marginRight: 8,
    },
    reLoginButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
        fontFamily: 'Lato-Bold',
    },
});

export default TokenExpiredModal;