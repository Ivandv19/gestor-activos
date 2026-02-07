/**
 * Service to interact with the Argon2id Hashing Microservice (Go)
 */
class HashService {
    constructor() {
        this.url = process.env.HASH_SERVICE_URL || 'http://localhost:3010';
        this.apiKey = process.env.HASH_SERVICE_KEY;
    }

    /**
     * Hashes a password using the microservice
     * @param {string} password 
     * @returns {Promise<string>} The hashed password
     */
    async hash(password) {
        try {
            const response = await fetch(`${this.url}/hash`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': this.apiKey
                },
                body: JSON.stringify({ password })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Hash Service Error: ${errorText}`);
            }

            const data = await response.json();
            return data.hash;
        } catch (error) {
            console.error('[HashService] Error hashing password:', error.message);
            throw error;
        }
    }

    /**
     * Verifies a password against a hash using the microservice
     * @param {string} password 
     * @param {string} hash 
     * @returns {Promise<boolean>} True if it matches
     */
    async verify(password, hash) {
        try {
            const response = await fetch(`${this.url}/verify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': this.apiKey
                },
                body: JSON.stringify({ password, hash })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Hash Service Error: ${errorText}`);
            }

            const data = await response.json();
            return data.match;
        } catch (error) {
            console.error('[HashService] Error verifying password:', error.message);
            return false; // Safely return false on error
        }
    }
}

module.exports = new HashService();
