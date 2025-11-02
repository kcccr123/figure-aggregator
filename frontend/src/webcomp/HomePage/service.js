import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_BASE_URL;
const EP_FEATURED = process.env.REACT_APP_API_ENDPOINT_FEATURED_ITEMS;

export const fetchFeaturedItems = async (store) => {
  try {
    const res = await axios.get(`${BASE_URL}${EP_FEATURED}`, { params: { store } });
    return res.data;
  } catch {
    return [];
  }
};