import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Navbar from './webcomp/Navbar';
import HomePage from './webcomp/HomePage/index';
import SearchResults from './webcomp/SearchResults';

function App() {
  return (
    <>
      <Router>
        <Navbar />
        <Routes>
          <Route path='/' element={<HomePage />} />\
          <Route path='/search' element={<SearchResults />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;
