import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_BASE_URL;
const EP_SEARCH = process.env.REACT_APP_API_ENDPOINT_SEARCH;
const EP_NUM = process.env.REACT_APP_API_ENDPOINT_NUM_IN_STORE;

export const fetchStoreCounts = async (query) => {
  try {
    const [solarisRes, tomRes] = await Promise.all([
      axios.get(`${BASE_URL}${EP_NUM}`, { params: { name: "SolarisJapan", searchParem: query } }),
      axios.get(`${BASE_URL}${EP_NUM}`, { params: { name: "TokyoOtakuMode", searchParem: query } })
    ]);
    return {
      solaris: solarisRes.data[0]?.count || 0,
      tom: tomRes.data[0]?.count || 0
    };
  } catch {
    return { solaris: 0, tom: 0 };
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