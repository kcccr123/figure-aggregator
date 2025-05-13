import React from "react";
import { createSearchParams, Link } from "react-router-dom";

export default function Browse(){
  return(
    <Link
      className="navbar__link"
      to={"/search?"+createSearchParams({query:"",filters:"00"}).toString()}
    >
      Browse Catalog
    </Link>
  );
}
