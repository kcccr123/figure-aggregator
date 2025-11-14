import React from 'react';
import SearchIcon from "@mui/icons-material/Search";
import { createSearchParams, useNavigate } from "react-router-dom";

export default function SearchBar(){
  const navigate = useNavigate();

  function handleKey(event){
    if(event.key==='Enter'){
      const search = event.target.value.trim();
      navigate({
        pathname:"/search",
        search:createSearchParams({query:search,filters:'00'}).toString()
      });
      event.target.value="";
    }
  }

  return(
    <div className="search">
      <input
        id="searchBar"
        type="text"
        placeholder="Search for figures!"
        onKeyPress={handleKey}
      />
      <SearchIcon/>
    </div>
  );
}
