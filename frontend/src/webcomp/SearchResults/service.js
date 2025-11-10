import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_BASE_URL;
const EP_SEARCH = process.env.REACT_APP_API_ENDPOINT_SEARCH;
const EP_NUM = process.env.REACT_APP_API_ENDPOINT_NUM_IN_STORE;

export const fetchStoreCounts = async (query, stores) => {
  try {
    const promises = stores.map(store =>
      axios.get(`${BASE_URL}${EP_NUM}`, { params: { name: store, searchParem: query } })
    );
    const responses = await Promise.all(promises);
    const counts = {};
    stores.forEach((store, index) => {
      counts[store] = responses[index].data[0]?.count || 0;
    });
    return counts;
  } catch {
    const counts = {};
    stores.forEach(store => counts[store] = 0);
    return counts;
  }
};

export const fetchSearchResults = async (params) => {
  try {
    const res = await axios.get(`${BASE_URL}${EP_SEARCH}`, { params });
    return res.data;
  } catch {
    return [];
  }
};