import React from "react";

export default function ProductCard({product}){
  const {images,name,price,preorder,preowned,rel,website,url}=product;

  const priceLine = rel
    ? `Release ${rel}`
    : price
      ? `Brand New $${price}`
      : preowned
        ? `Pre‑Owned $${preowned}`
        : "Sold out";

  return(
    <a className="card" href={url} target="_blank" rel="noopener noreferrer">
      <img src={images[0]} alt={name}/>
      <h3>{name}</h3>
      <p className="card__meta">{priceLine}</p>
      <span>{website}</span>
    </a>
  );
}
