
import { GlobalState } from '../types';

const API_BASE = 'https://jsonblob.com/api/jsonBlob';

// Helper to create a new cloud channel
export const createCloudChannel = async (initialData: GlobalState): Promise<string | null> => {
    try {
        const response = await fetch(API_BASE, {
            method: 'POST',
            mode: 'cors',
            credentials: 'omit', // Important for some CORS configs
            redirect: 'follow',
            referrerPolicy: 'no-referrer',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(initialData)
        });

        if (response.ok) {
            // The location header contains the URL of the new blob
            const location = response.headers.get('Location');
            if (location) {
                // Extract ID from URL more safely (handle trailing slashes)
                // location example: https://jsonblob.com/api/jsonBlob/12345
                const parts = location.split('/').filter(p => !!p);
                const id = parts[parts.length - 1];
                if (id) return id;
            } else {
                 // Fallback: Sometimes JSONBlob returns the ID in the body if header is stripped?
                 // No, usually it's just header. If we are here, browser stripped the header.
                 // We can try to assume the response might have it, but for JSONBlob specifically it relies on Location.
                 // However, some proxies might return x-jsonblob-id
                 const customId = response.headers.get('x-jsonblob');
                 if (customId) return customId;
            }
        }
        return null;
    } catch (e) {
        console.error("Failed to create channel", e);
        return null;
    }
};

// Helper to get data
export const fetchCloudData = async (channelId: string): Promise<GlobalState | null> => {
    try {
        const response = await fetch(`${API_BASE}/${channelId}`, {
            mode: 'cors',
            credentials: 'omit',
            referrerPolicy: 'no-referrer',
            headers: {
                'Accept': 'application/json'
            }
        });
        if (response.ok) {
            return await response.json();
        }
        return null;
    } catch (e) {
        console.error("Fetch cloud error", e);
        return null;
    }
};

// Helper to update data
export const updateCloudData = async (channelId: string, data: GlobalState): Promise<boolean> => {
    try {
        const response = await fetch(`${API_BASE}/${channelId}`, {
            method: 'PUT',
            mode: 'cors',
            credentials: 'omit',
            referrerPolicy: 'no-referrer',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(data)
        });
        return response.ok;
    } catch (e) {
        console.error("Update cloud error", e);
        return false;
    }
};
