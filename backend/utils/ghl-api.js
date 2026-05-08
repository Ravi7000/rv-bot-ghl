const axios = require('axios');

const GHL_API_BASE = 'https://services.leadconnectorhq.com';

// Get GHL API headers
function getHeaders() {
  return {
    'Authorization': `Bearer ${process.env.GHL_API_KEY}`,
    'Content-Type': 'application/json',
    'Version': '2021-07-28'
  };
}

// Find or create contact by email
async function syncContactToGHL(email, data = {}) {
  try {
    const locationId = process.env.GHL_LOCATION_ID;
    
    if (!locationId || !process.env.GHL_API_KEY) {
      console.warn('GHL API not configured, skipping sync');
      return null;
    }

    // Search for existing contact
    const searchResponse = await axios.get(
      `${GHL_API_BASE}/contacts/`,
      {
        headers: getHeaders(),
        params: {
          locationId,
          email
        }
      }
    );

    let contactId;

    if (searchResponse.data.contacts && searchResponse.data.contacts.length > 0) {
      // Update existing contact
      contactId = searchResponse.data.contacts[0].id;
      
      await axios.put(
        `${GHL_API_BASE}/contacts/${contactId}`,
        {
          ...data,
          email
        },
        { headers: getHeaders() }
      );
    } else {
      // Create new contact
      const createResponse = await axios.post(
        `${GHL_API_BASE}/contacts/`,
        {
          locationId,
          email,
          ...data
        },
        { headers: getHeaders() }
      );

      contactId = createResponse.data.contact.id;
    }

    // Update custom fields if provided
    if (data.customFields && contactId) {
      await axios.post(
        `${GHL_API_BASE}/contacts/${contactId}/customFields`,
        data.customFields,
        { headers: getHeaders() }
      );
    }

    // Add tags if provided
    if (data.tags && data.tags.length > 0 && contactId) {
      await axios.post(
        `${GHL_API_BASE}/contacts/${contactId}/tags`,
        { tags: data.tags },
        { headers: getHeaders() }
      );
    }

    return contactId;
  } catch (error) {
    console.error('GHL API error:', error.response?.data || error.message);
    throw error;
  }
}

// Update contact custom field
async function updateContactField(email, fieldKey, fieldValue) {
  try {
    const locationId = process.env.GHL_LOCATION_ID;
    
    if (!locationId || !process.env.GHL_API_KEY) {
      return null;
    }

    // Find contact
    const searchResponse = await axios.get(
      `${GHL_API_BASE}/contacts/`,
      {
        headers: getHeaders(),
        params: {
          locationId,
          email
        }
      }
    );

    if (!searchResponse.data.contacts || searchResponse.data.contacts.length === 0) {
      console.warn('Contact not found in GHL:', email);
      return null;
    }

    const contactId = searchResponse.data.contacts[0].id;

    // Update custom field
    await axios.post(
      `${GHL_API_BASE}/contacts/${contactId}/customFields`,
      {
        [fieldKey]: fieldValue
      },
      { headers: getHeaders() }
    );

    return contactId;
  } catch (error) {
    console.error('GHL update field error:', error.response?.data || error.message);
    throw error;
  }
}

module.exports = {
  syncContactToGHL,
  updateContactField
};
