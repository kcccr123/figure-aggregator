// SearchResults.jsx  — uses env‑based API endpoints
import React, { useState, useEffect } from "react";
import Axios from "axios";
import "./searchresults.css";
import { useSearchParams } from "react-router-dom";
import { Checkbox } from "@material-ui/core";

const api = Axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL, // e.g. http://34.110.244.134
});

const ENDPOINT_SEARCH        = process.env.REACT_APP_API_ENDPOINT_SEARCH;        // “/search”
const ENDPOINT_NUM_IN_STORE  = process.env.REACT_APP_API_ENDPOINT_NUM_IN_STORE;  // “/numInStore”

export default function SearchResults() {
  const [searchParems, setSearchParems] = useSearchParams();
  const [searchResults, setSearchResults] = useState([]);
  const [storeSolaris, setSolarisNums]   = useState();
  const [storeTOM, setTOMNums]           = useState();
  const [currentPage, setCurrentPage]    = useState(1);
  var pages = getPages();                // initial empty pages array

  /* ---------- API helpers ---------- */
  function getItems(p) {
    api.get(ENDPOINT_NUM_IN_STORE, { params: { name: "SolarisJapan", searchParem: p } })
       .then(r => setSolarisNums(r.data[0].count.toString()));
    api.get(ENDPOINT_NUM_IN_STORE, { params: { name: "TokyoOtakuMode", searchParem: p } })
       .then(r => setTOMNums(r.data[0].count.toString()));
  }

  function getData(p, filters, sortPrice, ordertype) {
    api.get(ENDPOINT_SEARCH, {
      params: { searchParem: p, filters, sort$: sortPrice, ordertype }
    }).then(r => setSearchResults(r.data));
  }

  /* ---------- derived paging ---------- */
  function getPages() {
    const pg = [];
    const remainder = searchResults.length % 24;
    for (let i = 0; i < Math.floor(searchResults.length / 24); i++) {
      pg.push(searchResults.slice(i * 24, (i + 1) * 24));
    }
    if (remainder > 0) pg.push(searchResults.slice(-remainder));
    return pg;
  }

  /* ---------- effects ---------- */
  useEffect(() => {
    getData(
      searchParems.get("query"),
      searchParems.get("filters"),
      searchParems.get("sort$"),
      searchParems.get("ordertype")
    );
    setCurrentPage(1);
    pages = getPages();
  }, [
    searchParems.get("query"),
    searchParems.get("filters"),
    searchParems.get("sort$"),
    searchParems.get("ordertype"),
  ]);

  useEffect(() => { getItems(searchParems.get("query")); }, [searchParems.get("query")]);

  /* ---------- pagination helpers ---------- */
  function nextPage() { setCurrentPage(currentPage + 1); window.scrollTo(0, 0); }
  function prevPage() { setCurrentPage(currentPage - 1); window.scrollTo(0, 0); }
  function toPage(n)   { setCurrentPage(n); }

  /* ---------- UI helpers ---------- */
  const queryCheck = q => (q ? `Results for "${q}"` : null);

  const collapseMenu = id => {
    const m = document.getElementById(id);
    if (!m) return;
    const open = m.style.opacity === "1";
    m.style.opacity = open ? "0" : "1";
    m.style.height  = open ? "0px" : "auto";
  };

  function handleStoreFitler(name) {
    let filters = searchParems.get("filters") || "00";
    if (name === "SolarisJapanCheck") {
      filters = (filters[0] === "0" ? "1" : "0") + filters.slice(1);
    } else {
      filters = filters[0] + (filters[1] === "0" ? "1" : "0");
    }
    setSearchParems({ query: searchParems.get("query"), filters, sort$: searchParems.get("sort$"), ordertype: searchParems.get("ordertype") });
  }

  function handlePriceFilter(t) {
    setSearchParems({ query: searchParems.get("query"), filters: searchParems.get("filters"), sort$: t });
    const h = document.getElementById("priceMenuHeader");
    if (h) h.textContent = t === "low" ? "Low‑To‑High" : t === "high" ? "High‑To‑Low" : "None";
  }

  function orderTypeFilter(type) {
    let o = searchParems.get("ordertype") || "000";
    const idx = { preorder: 0, brandnew: 1, remsoldout: 2 }[type];
    o = o.split("").map((c, i) => (i === idx ? (c === "0" ? "1" : "0") : c)).join("");
    setSearchParems({ query: searchParems.get("query"), filters: searchParems.get("filters"), sort$: searchParems.get("sort$"), ordertype: o });
  }

  const renderPrice = (lbl, v) => <div className={lbl.replace(/ /g, "").toLowerCase()}>{`${lbl}: $${v}`}</div>;
  function buyable(price, preowned, rel, website) {
    if (website === "SolarisJapan") {
      if (!rel) return price && preowned ? [renderPrice("Brand New", price), renderPrice("Pre‑Owned", preowned)] :
                       price ? renderPrice("Brand New", price) :
                       preowned ? renderPrice("Pre‑Owned", preowned) :
                       <div className="soldOut">Sold Out</div>;
      return rel && price ? [renderPrice("Pre‑Order", price), <div className="priceRelease">{`Release: ${rel}`}</div>] :
                            <div className="priceRelease">{`Release: ${rel}`}</div>;
    }
    return !rel ? renderPrice("Brand New", price) :
                  [renderPrice("Pre‑Order", price), <div className="priceRelease">{`Release: ${rel}`}</div>];
  }

  function displayPagesBar() {
    const np = pages.length;
    if (!np || !pages[0].length) return <div />;
    const btns  = Array.from({ length: np }, (_, i) => i + 1);
    const vis   = btns.filter(p => p === 1 || p === np || Math.abs(p - currentPage) <= 1);
    const items = vis.reduce((a, p, i) => { if (i && p - vis[i - 1] > 1) a.push("…"); a.push(p); return a; }, []);
    return (
      <div className="pagesBar">
        {currentPage > 1  && <button className="switchPage" onClick={prevPage}>Previous</button>}
        {items.map((it, i) =>
          typeof it === "string" ? <span key={i} className="ellipsis">{it}</span> :
          <button key={it} className={currentPage === it ? "currentPage" : "pageButton"} onClick={() => toPage(it)}>{it}</button>
        )}
        {currentPage < np && <button className="switchPage" onClick={nextPage}>Next</button>}
      </div>
    );
  }

  /* ---------- render ---------- */
  return (
    <div className="searchContainer">
      {/* Filters */}
      <div className="filterContainer">
        <div className="filterElement">
          <div className="filterTitle">Select Store</div>
          <div className="filterItem">
            <Checkbox style={{ color: "red" }} id="SolarisJapanCheck" onChange={() => handleStoreFitler("SolarisJapanCheck")} />
            {`Solaris Japan (${storeSolaris || 0})`}
          </div>
          <div className="filterItem">
            <Checkbox style={{ color: "red" }} id="TokyoOtakuModeCheck" onChange={() => handleStoreFitler("TokyoOtakuModeCheck")} />
            {`Tokyo Otaku Mode (${storeTOM || 0})`}
          </div>
        </div>

        <div className="filterElement">
          <div className="filterTitle">Sort by Price</div>
          <div className="colMenu" onClick={() => collapseMenu("priceMenu")}>
            <div id="priceMenuHeader" className="colMenuTitle">None</div>
            <div id="priceMenu" className="colMenuItems">
              <div className="menuItem" onClick={() => handlePriceFilter("")}>None</div>
              <div className="menuItem" onClick={() => handlePriceFilter("low")}>Low‑To‑High</div>
              <div className="menuItem" onClick={() => handlePriceFilter("high")}>High‑To‑Low</div>
            </div>
          </div>
        </div>

        <div className="filterElement">
          <div className="filterTitle">Item Type</div>
          <div className="filterItem"><Checkbox style={{ color: "red" }} onChange={() => orderTypeFilter("preorder")} />Pre‑order</div>
          <div className="filterItem"><Checkbox style={{ color: "red" }} onChange={() => orderTypeFilter("brandnew")} />Brand‑New</div>
          <div className="filterItem"><Checkbox style={{ color: "red" }} onChange={() => orderTypeFilter("remsoldout")} />Remove Sold‑Out</div>
        </div>
      </div>

      {/* Results */}
      <div className="alignment">
        <div className="resultsFor">{queryCheck(searchParems.get("query"))}</div>
        <hr className="searchLine" />
        <div className="innerAlignment">
          {pages[currentPage - 1] && pages[currentPage - 1].map(product => (
            <div className="productContainer" key={product.id || product.name}>
              <a href={product.url} target="_blank" rel="noopener noreferrer">
                <img className="productImage" src={product.image} alt={product.name} />
              </a>
              <div className="productInformation">
                <div className="title">{product.name}</div>
                <div>{buyable(product.price, product.preowned, product.rel, product.website)}</div>
                <div>{product.website}</div>
              </div>
            </div>
          ))}
        </div>
        {displayPagesBar()}
      </div>
    </div>
  );
}
