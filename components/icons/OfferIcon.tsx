import React from 'react';

const OfferIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" {...props}>
    <circle cx="12" cy="12" r="10" fill="currentColor" />
    <text 
      x="12" 
      y="16" 
      fontSize="12" 
      fill="white" 
      textAnchor="middle" 
      fontWeight="bold"
      fontFamily="sans-serif"
    >
      Of
    </text>
  </svg>
);

export default OfferIcon;