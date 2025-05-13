import React, { useEffect, useState } from "react";
import { useSearchParams }             from "react-router-dom";
import Checkbox                         from "@material-ui/core/Checkbox";
import Pagination                       from "@mui/material/Pagination";
import axios                            from "axios";
import "./searchresults.css";
import ProductCard                      from "../ProductCard";

const BASE_URL  = process.env.REACT_APP_API_BASE_URL;
const EP_SEARCH = process.env.REACT_APP_API_ENDPOINT_SEARCH;
const EP_NUM    = process.env.REACT_APP_API_ENDPOINT_NUM_IN_STORE;

export default function SearchResults() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [results,      setResults]      = useState([]);
  const [countSolaris, setCountSolaris] = useState(0);
  const [countTOM,     setCountTOM]     = useState(0);
  const [currentPage,  setCurrentPage]  = useState(1);

  // Fetch counts when query/filters/preorder/preowned change
  useEffect(() => {
    const q = searchParams.get("query") || "";
    axios.get(`${BASE_URL}${EP_NUM}`, { params: { name: "SolarisJapan",   searchParem: q } })
      .then(res => setCountSolaris(res.data[0]?.count || 0))
      .catch(() => setCountSolaris(0));
    axios.get(`${BASE_URL}${EP_NUM}`, { params: { name: "TokyoOtakuMode", searchParem: q } })
      .then(res => setCountTOM(res.data[0]?.count || 0))
      .catch(() => setCountTOM(0));
  }, [
    searchParams.get("query"),
    searchParams.get("filters"),
    searchParams.get("preorder"),
    searchParams.get("preowned")
  ]);

  // Fetch results when any filter or sort changes (added sort$ here)
  useEffect(() => {
    axios.get(`${BASE_URL}${EP_SEARCH}`, { params: Object.fromEntries(searchParams) })
      .then(res => {
        setResults(res.data);
        setCurrentPage(1);
      })
      .catch(() => setResults([]));
  }, [
    searchParams.get("query"),
    searchParams.get("filters"),
    searchParams.get("preorder"),
    searchParams.get("preowned"),
    searchParams.get("sort$")
  ]);

  // Pagination
  const pageSize = 40;
  const pages = [];
  for (let i = 0; i < results.length; i += pageSize) {
    pages.push(results.slice(i, i + pageSize));
  }

  // Helpers to update URL params
  const setParam = (key, value) => {
    const next = { ...Object.fromEntries(searchParams) };
    if (!value) delete next[key];
    else next[key] = value;
    setSearchParams(next);
  };

  const handleStoreFilter = key => {
    const cur = searchParams.get("filters") || "00";
    const updated =
      key === "SolarisJapanCheck"
        ? (cur[0] === "0" ? "1"+cur[1] : "0"+cur[1])
        : (cur[1] === "0" ? cur[0]+"1" : cur[0]+"0");
    setParam("filters", updated);
  };

  const handlePreorderFilter = () =>
    setParam("preorder", searchParams.get("preorder")==="true" ? "" : "true");

  const handlePreownedFilter = () =>
    setParam("preowned", searchParams.get("preowned")==="true" ? "" : "true");

  const handleSortChange = e =>
    setParam("sort$", e.target.value);

  return (
    <div className="searchContainer">
      <aside className="filterContainer">
        <div className="filterTitle">Select Store</div>
        <div className="filterItem">
          <Checkbox
            style={{ color: "var(--clr-primary)" }}
            checked={searchParams.get("filters")?.[0] === "1"}
            onChange={() => handleStoreFilter("SolarisJapanCheck")}
          />
          Solaris Japan ({countSolaris})
        </div>
        <div className="filterItem">
          <Checkbox
            style={{ color: "var(--clr-primary)" }}
            checked={searchParams.get("filters")?.[1] === "1"}
            onChange={() => handleStoreFilter("TokyoOtakuModeCheck")}
          />
          Tokyo Otaku Mode ({countTOM})
        </div>

        <div className="filterTitle">Condition</div>
        <div className="filterItem">
          <Checkbox
            style={{ color: "var(--clr-primary)" }}
            checked={searchParams.get("preorder") === "true"}
            onChange={handlePreorderFilter}
          />
          Pre-Order Only
        </div>
        <div className="filterItem">
          <Checkbox
            style={{ color: "var(--clr-primary)" }}
            checked={searchParams.get("preowned") === "true"}
            onChange={handlePreownedFilter}
          />
          Pre-Owned Only
        </div>

        <div className="filterTitle">Sort by Price</div>
        <div className="filterItem">
          <select
            value={searchParams.get("sort$") || ""}
            onChange={handleSortChange}
            style={{
              width: "100%",
              padding: "0.5rem",
              borderRadius: "var(--radius)",
              border: "1px solid var(--clr-secondary)",
              background: "#fff",
              fontSize: "1rem"
            }}
          >
            <option value="">None</option>
            <option value="high">High → Low</option>
            <option value="low">Low → High</option>
          </select>
        </div>
        </aside>

      <main className="alignment">
        <div className="resultsFor">
          Results for “{searchParams.get("query") || "All"}”
        </div>
        <hr className="searchLine" />

        <div className="innerAlignment">
          {pages[currentPage - 1]?.map(p => (
            <ProductCard
              key={p.url}
              product={{
                images:  [p.image],
                name:    p.name,
                price:   p.price,
                preorder:p.preorder,
                preowned:p.preowned,
                rel:     p.rel,
                website: p.website,
                url:     p.url
              }}
            />
          ))}
        </div>

        {pages.length > 1 && (
          <Pagination
            className="pagination"
            page={currentPage}
            count={pages.length}
            onChange={(_, p) => {
              setCurrentPage(p);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            sx={{
              "& .Mui-selected": {
                bgcolor: "var(--clr-primary)!important",
                color: "#fff"
              }
            }}
          />
        )}
      </main>
    </div>
  );
}