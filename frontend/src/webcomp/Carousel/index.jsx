import React, { useState } from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import './carousel.css';

export default function FeaturedCarousel({ items }) {
  const [currentSlide, setCurrentSlide] = useState(Math.floor(items.length / 2));

  const formatPrice = (price) => {
    return price ? `$${price}` : null;
  };

  const handleCardClick = (e, index) => {
    if (index !== currentSlide) {
      e.preventDefault();
    }
  };

  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 3,
    slidesToScroll: 1,
    centerMode: true,
    centerPadding: '60px',
    focusOnSelect: true,
    swipeToSlide: true,
    arrows: true,
    autoplay: false,
    cssEase: 'cubic-bezier(0.645, 0.045, 0.355, 1)',
    initialSlide: Math.floor(items.length / 2),
    beforeChange: (current, next) => setCurrentSlide(next),
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 2,
          centerPadding: '40px',
        }
      },
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 1,
          centerPadding: '30px',
        }
      }
    ]
  };

  return (
    <div className="featured-carousel">
      <Slider {...settings}>
        {items.map((item, index) => (
          <div key={item.name} className="carousel-item">
            <a 
              href={item.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="carousel-card"
              onClick={(e) => handleCardClick(e, index)}
            >
              <div className="carousel-card__image-wrapper">
                <img 
                  src={item.images[0]} 
                  alt={item.name}
                  className="carousel-card__image"
                />
              </div>
              <div className="carousel-card__content">
                <h3 className="carousel-card__title">{item.name}</h3>
                <div className="carousel-card__meta">
                  {item.rel && <p className="carousel-card__line">Release: {item.rel}</p>}
                  {item.price && <p className="carousel-card__line carousel-card__price">New: {formatPrice(item.price)}</p>}
                  {item.preowned && <p className="carousel-card__line">Used: {formatPrice(item.preowned)}</p>}
                  {!item.rel && !item.price && !item.preowned &&
                    <p className="carousel-card__line carousel-card__sold-out">Sold out</p>
                  }
                </div>
              </div>
            </a>
          </div>
        ))}
      </Slider>
    </div>
  );
}
