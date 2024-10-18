const axios = require('axios');
const md5 = require('md5');

const MAILCHIMP_API_KEY = process.env.MAILCHIMP_API_KEY;

exports.getSubscriber = async (email, listId) => {
    const subscriberHash = md5(email.toLowerCase());
    const url = `https://us13.api.mailchimp.com/3.0/lists/${listId}/members/${subscriberHash}`;
    const headers = {
        "Authorization": `apikey ${MAILCHIMP_API_KEY}`,
        "Content-Type": "application/json"
    };

    try {
        const response = await axios.get(url, { headers });
        return response.data;
    } catch (error) {
        if (error.response && error.response.status === 404) {
            return null; // Subscriber not found
        }
        throw error;
    }
};

exports.upsertSubscriberToMailchimp = async (email, mergeFields, listId) => {
    const subscriberHash = md5(email.toLowerCase());
    const url = `https://us13.api.mailchimp.com/3.0/lists/${listId}/members/${subscriberHash}`;
    const headers = {
        "Authorization": `apikey ${MAILCHIMP_API_KEY}`,
        "Content-Type": "application/json"
    };

    const payload = {
        email_address: email,
        status_if_new: "subscribed",
        merge_fields: mergeFields
    };

    try {
        const existingSubscriber = await this.getSubscriber(email, listId);
        const response = await axios.put(url, payload, { headers });
        
        if (!existingSubscriber) {
            return { status: 'success_new', email, mergeFields };
        } else if (JSON.stringify(existingSubscriber.merge_fields) !== JSON.stringify(mergeFields)) {
            return { status: 'updated', email, mergeFields, oldMergeFields: existingSubscriber.merge_fields };
        } else {
            return { status: 'no_changes', email, mergeFields };
        }
    } catch (error) {
        console.error(`Error updating ${email} in Mailchimp: ${error.message}`);
        return { status: 'error', email, error: error.message };
    }
};

exports.updateMailchimp = async (data, listId) => {
    if (!data || !data.data.items) {
        console.error("Invalid data from Monday");
        return [];
    }

    const syncResults = [];

    for (const item of data.data.items) {
        const emailValue = item.column_values.find(col => col.email)?.email;
        const email = emailValue || null;
        if (email) {
            const mergeFields = {
                NAME: item.column_values.find(col => col.text)?.text || "",
                PHONE: item.column_values.find(col => col.number)?.number || "",
                FDATE: item.column_values.find(col => col.date)?.date || "",
                STATUS: item.column_values.find(col => col.label)?.label || ""
            };

            try {
                const result = await this.upsertSubscriberToMailchimp(email, mergeFields, listId);
                syncResults.push(result);
            } catch (error) {
                syncResults.push({ email, status: 'error', error: error.message, mergeFields });
            }
            await new Promise(resolve => setTimeout(resolve, 1000)); // Espera 1 segundo entre solicitudes
        } else {
            syncResults.push({ email: null, status: 'skipped', reason: 'No email found' });
        }
    }

    return syncResults;
};