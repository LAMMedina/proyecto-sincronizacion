const axios = require('axios');

const MONDAY_API_KEY = process.env.MONDAY_API_KEY;

exports.getItemIds = async (boardId) => {
    const url = "https://api.monday.com/v2";
    const headers = {
        "Authorization": MONDAY_API_KEY,
        "Content-Type": "application/json"
    };

    const query = `
    {
      boards(ids: [${boardId}]) {
        items_page {
          items {
            id
          }
        }
      }
    }`;

    try {
        const response = await axios.post(url, { query }, { headers });
        return response.data.data.boards[0].items_page.items.map(item => item.id);
    } catch (error) {
        console.error(`Error fetching item IDs: ${error.message}`);
        return null;
    }
};

exports.getItemColumnValues = async (itemIds) => {
    const url = "https://api.monday.com/v2";
    const headers = {
        "Authorization": MONDAY_API_KEY,
        "Content-Type": "application/json"
    };

    const query = `
    query {
      items (ids: [${itemIds.join(',')}]) {
        column_values {
          ... on DateValue {
            date
          }
          ... on NumbersValue {
            number
          }
          ... on TextValue {
            text
          }
          ... on StatusValue {
            label
          }
          ... on EmailValue {
            email
          }
        }
      }
    }`;

    try {
        const response = await axios.post(url, { query }, { headers });
        return response.data;
    } catch (error) {
        console.error(`Error fetching item column values: ${error.message}`);
        return null;
    }
};