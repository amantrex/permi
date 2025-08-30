import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";

// Initialize the Firebase Admin SDK
admin.initializeApp();

/**
 * Fetches a specific consent banner configuration from Firestore.
 * This is a publicly callable endpoint.
 */
export const getBannerConfig = onRequest({ cors: true }, async (request, response) => {
    logger.info("getBannerConfig request received", { 
        query: request.query, 
        body: request.body 
    });

    // Robustly get the configId from either query string or body
    const configId = (request.query.id || request.body.id) as string;

    if (!configId) {
        logger.error("Request missing configId in query or body");
        response.status(400).send({ error: "Configuration ID is required" });
        return;
    }

    try {
        const doc = await admin.firestore().collection("consent_configurations").doc(configId).get();

        if (doc.exists) {
            const data = doc.data();
            // We only return the fields needed for public display, not internal ones.
            response.status(200).send({
                name: data?.name,
                content: data?.content,
                button_text: data?.button_text,
                background_color: data?.background_color,
                text_color: data?.text_color,
            });
        } else {
            logger.warn(`Configuration not found for id: ${configId}`);
            response.status(404).send({ error: "Configuration not found" });
        }
    } catch (error) {
        logger.error("Error fetching document:", error);
        response.status(500).send({ error: "Internal server error" });
    }
});

/**
 * Logs a consent action from the embeddable script into Firestore.
 * This is a publicly callable endpoint.
 */
export const logConsent = onRequest({ cors: true }, async (request, response) => {
    // We only allow POST requests for this endpoint
    if (request.method !== 'POST') {
        response.status(405).send('Method Not Allowed');
        return;
    }

    const { configurationId, userIdentifier, metadata } = request.body;

    if (!configurationId) {
        logger.error("Request body missing configurationId");
        response.status(400).send({ error: "configurationId is required" });
        return;
    }

    try {
        await admin.firestore().collection("consent_log").add({
            configuration_id: configurationId,
            user_identifier: userIdentifier || null,
            metadata: metadata || {},
            consent_action: 'granted',
            log_timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });
        response.status(201).send({ success: true });
    } catch (error) {
        logger.error("Error logging consent:", error);
        response.status(500).send({ error: "Internal server error" });
    }
});
