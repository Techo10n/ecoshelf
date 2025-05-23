import { useState } from 'react';
import reactLogo from '@/assets/react.svg';
import wxtLogo from '/wxt.svg';
import './App.css';

function App() {

  return (
    <div className="flex flex-col items-center border border-green-500 w-full h-full bg-black p-4">
      <h1 className="text-3xl font-bold text-white">
        Welcome to EcoShelf
      </h1>
      <h2 className="text-sm font-bold text-white pt-4">
        A Chrome Extension for online shopping that calculates the emissions produced from shipping a product, recommending more sustainable alternatives with similar price points.
      </h2>
      <p className="text-white text-md pt-4">
        Instead of telling consumers to completely change what they're shopping for, our project aims to help users sort through the dozens of near identical products on sites such as Amazon and allow them to prioritize sustainability without sacrificing on functionality or price. When users find a product they like, our extension will notify them of any other vendors selling the same product that would produce less emissions when shipping it, making sure to stay within a similar price point range.
      </p>
    </div>
  );
}

export default App;
