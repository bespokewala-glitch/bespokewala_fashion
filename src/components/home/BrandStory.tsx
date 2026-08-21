"use client";

import React from 'react';
import OptimizedImage from '@/components/ui/OptimizedImage';
import Link from 'next/link';

export default function BrandStory({ data }: { data?: any }) {
  const subtitle = data?.subtitle || "Our Heritage";
  const title = data?.title || "Crafting Elegance,\nStitching Legacy.";
  const text1 = data?.text1 || "At Bespokewala, we believe true luxury lies in the details. Every piece we create is a testament to the rich heritage of Indian craftsmanship, blended seamlessly with contemporary silhouettes. From the intricate zari work to the delicate hand-embroidery, our artisans pour their heart into every stitch.";
  const text2 = data?.text2 || "Our bespoke philosophy ensures that every garment is more than just clothing; it is a personalized work of art, designed to celebrate your unique identity and the most special moments of your life.";
  const ctaText = data?.ctaText || "Discover Our Story";
  const ctaLink = data?.ctaLink || "/about";
  const image = data?.image || "https://images.unsplash.com/photo-1584308972271-204c35ce82c3?auto=format&fit=crop&q=80&w=1200";

  return (
    <section className="brand-story-section">
      <style>{`
        .brand-story-section {
          padding: 8rem 4rem;
          background-color: #fcfcfc;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .brand-story-container {
          max-width: 1400px;
          width: 100%;
          display: flex;
          gap: 6rem;
          align-items: center;
        }
        .brand-story-image-wrapper {
          flex: 1;
          position: relative;
          height: 700px;
          border-radius: 4px;
          overflow: hidden;
          box-shadow: 0 20px 40px rgba(0,0,0,0.08);
        }
        .brand-story-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2rem;
          padding-right: 2rem;
        }
        .brand-story-subtitle {
          font-size: 0.85rem;
          text-transform: uppercase;
          letter-spacing: 0.2em;
          color: #888;
          font-weight: 600;
        }
        .brand-story-title {
          font-size: 3rem;
          font-weight: 300;
          letter-spacing: 0.05em;
          color: #111;
          line-height: 1.2;
          white-space: pre-line;
        }
        .brand-story-text {
          font-size: 1.1rem;
          line-height: 1.8;
          color: #555;
          font-weight: 300;
        }
        .brand-story-cta {
          display: inline-block;
          margin-top: 1rem;
          padding: 1rem 2.5rem;
          background-color: transparent;
          color: #111;
          border: 1px solid #111;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          font-size: 0.85rem;
          text-decoration: none;
          transition: all 0.3s ease;
          align-self: flex-start;
        }
        .brand-story-cta:hover {
          background-color: #111;
          color: #fff;
        }
        @media (max-width: 1024px) {
          .brand-story-section {
            padding: 6rem 2rem;
          }
          .brand-story-container {
            flex-direction: column;
            gap: 4rem;
          }
          .brand-story-content {
            padding-right: 0;
            text-align: center;
            align-items: center;
          }
          .brand-story-image-wrapper {
            width: 100%;
            height: 500px;
            order: -1;
          }
          .brand-story-title {
            font-size: 2.5rem;
          }
        }
        @media (max-width: 768px) {
          .brand-story-section {
            padding: 4rem 1.5rem;
          }
          .brand-story-image-wrapper {
            height: 400px;
          }
          .brand-story-title {
            font-size: 2rem;
          }
          .brand-story-text {
            font-size: 1rem;
          }
        }
      `}</style>

      <div className="brand-story-container">
        <div className="brand-story-content">
          <span className="brand-story-subtitle">{subtitle}</span>
          <h2 className="brand-story-title">{title}</h2>
          <p className="brand-story-text">{text1}</p>
          <p className="brand-story-text">{text2}</p>
          <Link href={ctaLink} className="brand-story-cta">
            {ctaText}
          </Link>
        </div>

        <div className="brand-story-image-wrapper">
          {image.match(/\.(mp4|webm|ogg)$/i) ? (
            <video
              src={image}
              autoPlay
              loop
              muted
              playsInline
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <OptimizedImage
              src={image}
              alt="Craftsmanship and Heritage"
              fill
              style={{ objectFit: 'cover' }}
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority={false}
            />
          )}
        </div>
      </div>
    </section>
  );
}
