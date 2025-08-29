import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

class AuthManager {
    static instance = null;
    tokenExpiredCallback = null;

    static getInstance() {
        if (!AuthManager.instance) {
            AuthManager.instance = new AuthManager();
        }
        return AuthManager.instance;
    }

    setTokenExpiredCallback(callback) {
        this.tokenExpiredCallback = callback;
    }

    async handleTokenExpired() {
        console.log('Token expired, triggering callback');
        if (this.tokenExpiredCallback) {
            this.tokenExpiredCallback();
        }
    }

    async logout() {
        try {
            // Sign out from Google
            await GoogleSignin.signOut();
            
            // Clear stored data
            await AsyncStorage.multiRemove(['token', 'userInfo']);
            
            console.log('User logged out successfully');
            return true;
        } catch (error) {
            console.error('Error during logout:', error);
            // Even if Google sign out fails, clear local storage
            await AsyncStorage.multiRemove(['token', 'userInfo']);
            return true;
        }
    }

    async refreshToken() {
        try {
            console.log('Attempting to refresh token...');
            
            // Check if user is still signed in to Google
            const isSignedIn = await GoogleSignin.isSignedIn();
            if (!isSignedIn) {
                console.log('User is not signed in to Google');
                this.handleTokenExpired();
                return null;
            }

            // Try to get fresh tokens
            const tokens = await GoogleSignin.getTokens();
            if (tokens && tokens.accessToken) {
                console.log('Successfully refreshed token');
                await AsyncStorage.setItem('token', tokens.accessToken);
                return tokens.accessToken;
            } else {
                console.log('Failed to get fresh tokens');
                this.handleTokenExpired();
                return null;
            }
        } catch (error) {
            console.error('Error refreshing token:', error);
            this.handleTokenExpired();
            return null;
        }
    }

    async makeAuthenticatedRequest(url, options = {}) {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
            this.handleTokenExpired();
            throw new Error('No access token found');
        }

        const requestOptions = {
            ...options,
            headers: {
                ...options.headers,
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        };

        try {
            const response = await fetch(url, requestOptions);
            
            if (response.status === 401) {
                console.log('Received 401, attempting token refresh...');
                
                // Try to refresh token
                const newToken = await this.refreshToken();
                if (newToken) {
                    // Retry the request with new token
                    const retryOptions = {
                        ...requestOptions,
                        headers: {
                            ...requestOptions.headers,
                            Authorization: `Bearer ${newToken}`,
                        },
                    };
                    
                    const retryResponse = await fetch(url, retryOptions);
                    if (retryResponse.status === 401) {
                        // Still getting 401, token refresh didn't work
                        this.handleTokenExpired();
                        throw new Error('Authentication failed after token refresh');
                    }
                    return retryResponse;
                } else {
                    // Token refresh failed
                    this.handleTokenExpired();
                    throw new Error('Token refresh failed');
                }
            }
            
            return response;
        } catch (error) {
            if (error.message.includes('Network request failed') || error.message.includes('fetch')) {
                // Network error, don't treat as auth error
                throw error;
            }
            
            console.error('Request failed:', error);
            throw error;
        }
    }
}

export default AuthManager;