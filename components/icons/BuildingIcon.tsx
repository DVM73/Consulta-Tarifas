import React from 'react';

const BuildingIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M3 21h18" />
    <path d="M5 21V5l7-4 7 4v16" />
    <path d="M9 9h6v2H9z" />
    <path d="M9 13h6v2H9z" />
    <path d="M9 17h6v2H9z" />
  </svg>
);

export default BuildingIcon;