import {useEffect,useState} from "react";
import { Link ,createSearchParams } from "react-router-dom";
import { fetchFeaturedItems } from './service';
import { formatStoreName } from '../helpers';
import yaml from 'js-yaml';

import FeaturedCarousel from "../Carousel";
import solaris from '../images/SolarisFiller.png';
import tokyo   from '../images/tokyoOtakuMode2.jpg';
import './home.css';

export default function HomePage(){
  const [featuredItems, setFeaturedItems] = useState({});
  const [stores, setStores] = useState([]);

  const generateStoreFilter = (targetStore) => {
    return stores.map(store => store === targetStore ? '1' : '0').join('');
  };

  function deseralizeImages(str){
    return str.split(">>><<<");
  }

  useEffect(()=>{
    // Fetch stores configuration
    fetch('/config.yaml')
      .then(response => response.text())
      .then(yamlText => {
        const config = yaml.load(yamlText);
        setStores(config.stores || []);
      })
    // Fetch featured items
    fetchFeaturedItems().then(data => {
      const grouped = {};
      data.forEach(item => {
        const store = item.website;
        if (!grouped[store]) grouped[store] = [];
        grouped[store].push({ ...item, images: deseralizeImages(item.image) });
      });
      setFeaturedItems(grouped);
    });
  },[]);

  return(
    <>
      <section className="hero">
        <img src={solaris} alt="Solaris Japan banner"/>
        <img src={tokyo}   alt="Tokyo Otaku Mode banner"/>
        <div className="hero__title">
          <h1>Your One‑Stop Figure Tracker</h1>
          <p>Compare prices & release dates from Popular stores.</p>
        </div>
      </section>

      <section className="showcase">
        {Object.entries(featuredItems).map(([store, items]) => (
          <div key={store} className="store-section">
            <h2 className="section-heading">{formatStoreName(store)}</h2>
            <FeaturedCarousel items={items} />
            <Link
              to={"/search?" + createSearchParams({query:"", filters: generateStoreFilter(store)}).toString()}
              className="navbar__link show-more"
            >
              More from {formatStoreName(store)}
            </Link>
          </div>
        ))}
      </section>
    </>
  );
}
