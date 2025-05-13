import React,{useEffect,useState} from "react";
import { Link ,createSearchParams } from "react-router-dom";
import axios from "axios";

import ProductCard from "../ProductCard";
import solaris from '../images/SolarisFiller.png';
import tokyo   from '../images/tokyoOtakuMode2.jpg';
import './home.css';

const BASE_URL    = process.env.REACT_APP_API_BASE_URL;
const EP_FEATURED = process.env.REACT_APP_API_ENDPOINT_FEATURED_ITEMS;

export default function HomePage(){
  const [featuredSolaris,setFeaturedSolaris] = useState([]);
  const [featuredTOM,setFeaturedTOM]         = useState([]);

  function deseralizeImages(str){
    return str.split(">>><<<");
  }

  useEffect(()=>{
    axios.get(`${BASE_URL}${EP_FEATURED}`,{params:{store:"SolarisJapan"}})
         .then(res=>setFeaturedSolaris(
           res.data.map(it=>({...it,images:deseralizeImages(it.images.toString())}))
         ));
    axios.get(`${BASE_URL}${EP_FEATURED}`,{params:{store:"TokyoOtakuMode"}})
         .then(res=>setFeaturedTOM(
           res.data.map(it=>({...it,images:deseralizeImages(it.images.toString())}))
         ));
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
        <h2 className="section-heading">Featured – Solaris Japan</h2>
        <div className="cards-grid">
          {featuredSolaris.map(p=><ProductCard key={p.name} product={p}/>)}
        </div>
        <Link
          to={"/search?"+createSearchParams({query:"",filters:"10"}).toString()}
          className="navbar__link show-more"
        >
          More from Solaris Japan
        </Link>

        <h2 className="section-heading">Featured – Tokyo Otaku Mode</h2>
        <div className="cards-grid">
          {featuredTOM.map(p=><ProductCard key={p.name} product={p}/>)}
        </div>
        <Link
          to={"/search?"+createSearchParams({query:"",filters:"01"}).toString()}
          className="navbar__link show-more"
        >
          More from TOM
        </Link>
      </section>
    </>
  );
}
