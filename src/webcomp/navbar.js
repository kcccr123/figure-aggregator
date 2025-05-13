import React from "react";
import { Link } from "react-router-dom";
import SearchBar from "./searchbar";
import Browse from "./browse";
import logo from './images/logo.png';
import './navbar.css';

export default function Navbar(){
  return(
    <header className="navbar">
      <Link to="/" className="navbar__brand">
        <img src={logo} alt="FigureCenter logo"/>
        FigureCenter
      </Link>

      <div className="navbar__search">
        <SearchBar/>
      </div>

      <Browse/>
    </header>
  );
}
