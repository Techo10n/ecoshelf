import './App.css';

function App() {

  return (
    <div className="flex flex-col border border-green-400 border-3 w-120 h-full bg-[#1E1E1E] px-6">
      <div className="text-lg font-bold text-white pt-2 justify-start items-start w-full text-left">
        EcoShelf
      </div>
      <span className="flex flex-row gap-2 justify-center items-center w-full pt-2">
        <div className="justify-center items-center">
          <svg width="40" height="40" viewBox="0 0 32 32">
            {/* Gray slice 1 */}
            <circle r="16" cx="16" cy="16" fill="transparent" stroke="#d1d5db" strokeWidth="32" strokeDasharray="10 22" transform="rotate(-90 16 16)" />
            {/* Green-400 slice */}
            <circle r="16" cx="16" cy="16" fill="transparent" stroke="#4ade80" strokeWidth="32" strokeDasharray="10 22" strokeDashoffset="10" transform="rotate(-90 16 16)" />
            {/* Gray slice 2 */}
            <circle r="16" cx="16" cy="16" fill="transparent" stroke="#d1d5db" strokeWidth="32" strokeDasharray="12 20" strokeDashoffset="20" transform="rotate(-90 16 16)" />
          </svg>
        </div>
        <span className="flex flex-col justify-center items-center w-full">
          <h1 className="text-2xl font-bold text-green-400 pt-4">
            Sustainability Score: 65%
          </h1>
          <p className="text-lg pt-1 text-green-400">
            Learn More:
          </p>
        </span>
      </span>
      <h2 className="text-sm font-bold text-white pt-4">
        A Chrome Extension for online shopping that calculates the emissions produced from shipping a product, recommending more sustainable alternatives with similar price points.
      </h2>
      <p className="text-white text-md pt-4 pb-10">
        Instead of telling consumers to completely change what they're shopping for, our project aims to help users sort through the dozens of near identical products on sites such as Amazon and allow them to prioritize sustainability without sacrificing on functionality or price. When users find a product they like, our extension will notify them of any other vendors selling the same product that would produce less emissions when shipping it, making sure to stay within a similar price point range.
      </p>
    </div>
  );
}

export default App;
