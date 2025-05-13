import React from "react";

export default function ProductCard({ product }) {
  const {
    images,
    name,
    price,
    preorder,
    preowned,
    rel,    
    website,
    url
  } = product;

  return (
    <a className="card" href={url} target="_blank" rel="noopener noreferrer">
      <img src={images[0]} alt={name} />
      <h3>{name}</h3>
                                                                            
      <div className="card__meta">
        {rel      && <p className="card__line">Release: {rel}</p>}
        {preorder && <p className="card__line">Pre-Order: {preorder}</p>}
        {price    && <p className="card__line">New: ${price}</p>}
        {preowned && <p className="card__line">Used: ${preowned}</p>}
        {!rel && !price && !preowned && !preorder &&
          <p className="card__line">Sold out</p>
        }
      </div>

      <span className="card__footer">{website}</span>
    </a>
  );
}
