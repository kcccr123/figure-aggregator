// src/webcomp/SearchResults/index.js

import React, { useEffect, useState } from "react";
import { useSearchParams }             from "react-router-dom";
import Checkbox                         from "@mui/material/Checkbox";
import Pagination                       from "@mui/material/Pagination";
import { fetchStoreCounts, fetchSearchResults } from './service';
import { loadConfig, formatStoreName } from '../helpers';
import "./searchresults.css";
import ProductCard                      from "../ProductCard";

export default function SearchResults() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Extracted params for stable deps
  const query    = searchParams.get("query")   || "";
  const preorder = searchParams.get("preorder");
  const preowned = searchParams.get("preowned");
  const sortVal  = searchParams.get("sort$");

  // Load stores from config
  const [stores, setStores] = useState([]);

  // Dynamic state
  const [counts, setCounts] = useState({});
  const [results, setResults] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState("00");
  const [pageSize, setPageSize] = useState(40);

  // Load config on mount
  useEffect(() => {
    loadConfig().then(config => setStores(config.stores || []));
  }, []);

  // Initialize counts and filters when stores load
  useEffect(() => {
    if (stores.length > 0) {
      const initialCounts = stores.reduce((acc, store) => ({ ...acc, [store]: 0 }), {});
      setCounts(initialCounts);
      const urlFilters = searchParams.get("filters");
      const defaultFilters = '0'.repeat(stores.length);
      setFilters(urlFilters && urlFilters.length === stores.length ? urlFilters : defaultFilters);
    }
  }, [stores, searchParams]);

  // 2) Fetch results whenever any filter/sort param changes
  useEffect(() => {
    const params = { query, filters };
    if (preorder) params.preorder = preorder;
    if (preowned) params.preowned = preowned;
    if (sortVal)  params["sort$"] = sortVal;

    fetchSearchResults(params).then(results => {
      setResults(results);
      // Compute counts from results
      const newCounts = results.reduce((acc, p) => {
        acc[p.website] = (acc[p.website] || 0) + 1;
        return acc;
      }, {});
      setCounts(newCounts);
      setCurrentPage(1);
    });
  }, [query, filters, preorder, preowned, sortVal]);

  // Pagination
  const pages = [];
  for (let i = 0; i < results.length; i += pageSize) {
    pages.push(results.slice(i, i + pageSize));
  }

  // Helper to update URL params
  const setParam = (key, value) => {
    const next = { ...Object.fromEntries(searchParams) };
    if (!value) delete next[key];
    else next[key] = value;
    setSearchParams(next);
  };

  // Handlers
  const handleStoreFilter = (index) => {
    const newFilters = filters.split('');
    newFilters[index] = newFilters[index] === '0' ? '1' : '0';
    const updatedFilters = newFilters.join('');
    setFilters(updatedFilters);
    setParam("filters", updatedFilters);
  };

  const handlePreorderFilter = () =>
    setParam("preorder", preorder === "true" ? "" : "true");

  const handlePreownedFilter = () =>
    setParam("preowned", preowned === "true" ? "" : "true");

  const handleSortChange = (e) =>
    setParam("sort$", e.target.value);

  const handlePageSizeChange = (e) => {
    setPageSize(Number(e.target.value));
    setCurrentPage(1); // Reset to first page when changing page size
  };

  return (
    <div className="searchContainer">
      <aside className="filterContainer">
        <div className="filterTitle">Select Store</div>

        {stores.map((store, index) => (
          <div className="filterItem" key={store}>
            <Checkbox
              style={{ color: "var(--clr-primary)" }}
              checked={filters[index] === "1"}
              onChange={() => handleStoreFilter(index)}
            />
            {formatStoreName(store)} ({counts[store] || 0})
          </div>
        ))}

        <div className="filterTitle">Condition</div>

        <div className="filterItem">
          <Checkbox
            style={{ color: "var(--clr-primary)" }}
            checked={preorder === "true"}
            onChange={handlePreorderFilter}
          />
          Pre-Order Only
        </div>

        <div className="filterItem">
          <Checkbox
            style={{ color: "var(--clr-primary)" }}
            checked={preowned === "true"}
            onChange={handlePreownedFilter}
          />
          Pre-Owned Only
        </div>

        <div className="filterTitle">Sort by Price</div>
        <div className="filterItem">
          <select
            value={sortVal || ""}
            onChange={handleSortChange}
            style={{
              width: "100%", padding: "0.5rem",
              borderRadius: "var(--radius)",
              border: "1px solid var(--clr-secondary)"
            }}
          >
            <option value="">None</option>
            <option value="high">High → Low</option>
            <option value="low">Low → High</option>
          </select>
        </div>

        <div className="filterTitle">Items per Page</div>
        <div className="filterItem">
          <select
            value={pageSize}
            onChange={handlePageSizeChange}
            style={{
              width: "100%", padding: "0.5rem",
              borderRadius: "var(--radius)",
              border: "1px solid var(--clr-secondary)"
            }}
          >
            <option value="20">20</option>
            <option value="40">40</option>
            <option value="60">60</option>
            <option value="80">80</option>
            <option value="100">100</option>
          </select>
        </div>
      </aside>

      <main className="alignment">
        <div className="resultsFor">
          Results for “{query || "All"}”
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
            sx={{ "& .Mui-selected": { bgcolor: "var(--clr-primary)!important", color: "#fff" } }}
          />
        )}
      </main>
    </div>
  );
}
