import React,{useEffect,useState} from "react";
import { useSearchParams } from "react-router-dom";
import Checkbox from "@material-ui/core/Checkbox";
import Pagination from "@mui/material/Pagination";
import './searchresults.css';
import ProductCard from "./ProductCard";
import axios from "axios";

const BASE_URL = process.env.REACT_APP_API_BASE_URL;
const EP_SEARCH= process.env.REACT_APP_API_ENDPOINT_SEARCH;

export default function SearchResults(){
  const [searchParams,setSearchParams] = useSearchParams();
  const [results,setResults] = useState([]);
  const [currentPage,setCurrentPage] = useState(1);

  /* --- fetch whenever the querystring changes --- */
  useEffect(()=>{
    axios.get(`${BASE_URL}${EP_SEARCH}`,{params:Object.fromEntries(searchParams)})
         .then(res=>setResults(res.data));
    setCurrentPage(1);
  },[searchParams]);

  /*  -------  helpers  ------- */
  const pageSize = 40;
  const pages = [];
  for(let i=0;i<results.length;i+=pageSize){
    pages.push(results.slice(i,i+pageSize));
  }

  function handleStoreFilter(id){
    /* same logic, but simplified for brevity */
    const current = searchParams.get('filters')||"00";
    const updated = id==="SolarisJapanCheck"
      ? (current[0]==="0" ? "1"+current[1] : "0"+current[1])
      : (current[1]==="0" ? current[0]+"1" : current[0]+"0");
    setSearchParams({...Object.fromEntries(searchParams),filters:updated});
  }

  /* --- render --- */
  return(
    <div className="searchContainer">
      {/* -------------  SIDEBAR ------------- */}
      <aside className="filterContainer">
        <div className="filterElement">
          <div className="filterTitle">Select Store</div>
          <div className="filterItem">
            <Checkbox
              style={{color:"var(--clr-primary)"}}
              onChange={()=>handleStoreFilter('SolarisJapanCheck')}
            /> Solaris Japan
          </div>
          <div className="filterItem">
            <Checkbox
              style={{color:"var(--clr-primary)"}}
              onChange={()=>handleStoreFilter('TokyoOtakuModeCheck')}
            /> Tokyo Otaku Mode
          </div>
        </div>
        {/* Any additional filters can go here */}
      </aside>

      {/* -------------  RESULTS ------------- */}
      <main className="alignment">
        <div className="resultsFor">
          Results for “{searchParams.get('query')||'All'}”
        </div>
        <hr className="searchLine"/>

        <div className="innerAlignment">
          {pages.length>0 && pages[currentPage-1].map(p=>
            <ProductCard key={p.url} product={{
              images:[p.image],
              name:p.name,
              price:p.price,
              preorder:p.preorder,
              preowned:p.preowned,
              rel:p.rel,
              website:p.website,
              url:p.url
            }}/>
          )}
        </div>

        {pages.length>1 &&
          <Pagination
            className="pagination"
            page={currentPage}
            count={pages.length}
            onChange={(e,p)=>{setCurrentPage(p);window.scrollTo({top:0,behavior:'smooth'});}}
            sx={{'& .Mui-selected':{bgcolor:'var(--clr-primary)!important',color:'#fff'}}}
          />
        }
      </main>
    </div>
  );
}
