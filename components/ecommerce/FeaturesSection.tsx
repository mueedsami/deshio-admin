'use client';

import React from 'react';
import { Truck, Shield, Headphones, RefreshCw } from 'lucide-react';

export default function FeaturesSection() {
  const features = [
    {
      icon: <Truck size={36} />,
      title: 'Free Shipping',
      description: 'On orders over ৳5,000',
    },
    {
      icon: <RefreshCw size={36} />,
      title: 'Easy Returns',
      description: '30-day return policy',
    },
    {
      icon: <Shield size={36} />,
      title: 'Secure Payment',
      description: '100% secure transactions',
    },
    {
      icon: <Headphones size={36} />,
      title: '24/7 Support',
      description: 'Dedicated customer service',
    },
  ];

  return (
    <section className="py-16 bg-white border-y border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {features.map((feature, idx) => (
            <div key={idx} className="text-center group cursor-pointer">
              {/* Icon */}
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-50 text-red-600 mb-5 group-hover:bg-red-600 group-hover:text-white transition-all duration-300 shadow-lg group-hover:shadow-xl">
                {feature.icon}
              </div>
              
              {/* Feature Info */}
              <h3 className="font-bold text-gray-900 mb-2 text-lg group-hover:text-gray-600 transition-colors">
                {feature.title}
              </h3>
              <p className="text-sm text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}