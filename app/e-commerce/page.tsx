'use client';
import React from 'react';
import Navigation from '@/components/ecommerce/Navigation';
import HeroSection from '@/components/ecommerce/HeroSection';
import SaleProducts from '@/components/ecommerce/SaleProducts';
import OurCategories from '@/components/ecommerce/OurCategories';
import BestSellerProducts from '@/components/ecommerce/BestSellerProducts';
import FeaturesSection from '@/components/ecommerce/FeaturesSection';
import Footer from '@/components/ecommerce/Footer';

export default function HomePage() {
  return (
    <div className="bg-white min-h-screen">

      <Navigation />
      <HeroSection />
      <OurCategories />
      <SaleProducts />
      <BestSellerProducts />
      <FeaturesSection />
      <Footer />
    </div>
  );
}