import {useEffect,useState} from "react";
import { Link ,createSearchParams } from "react-router-dom";
import { fetchFeaturedItems } from './service';
import { formatStoreName } from '../helpers';

import ProductCard from "../ProductCard";
import solaris from '../images/SolarisFiller.png';
import tokyo   from '../images/tokyoOtakuMode2.jpg';
import './home.css';

export default function HomePage(){
  const [featuredItems, setFeaturedItems] = useState({});

  const storeFilters = { SolarisJapan: '10', TokyoOtakuMode: '01' };

  function deseralizeImages(str){
    return str.split(">>><<<");
  }

  useEffect(()=>{
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
          <p>Compare prices & release dates from Solaris Japan and Tokyo Otaku Mode.</p>
        </div>
      </section>

      <section className="showcase">
        {Object.entries(featuredItems).map(([store, items]) => (
          <div key={store}>
            <h2 className="section-heading">Featured – {formatStoreName(store)}</h2>
            <div className="cards-grid">
              {items.map(p => <ProductCard key={p.name} product={p} />)}
            </div>
            <Link
              to={"/search?" + createSearchParams({query:"", filters: storeFilters[store]}).toString()}
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
