"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    {
      name: "Home",
      href: "/dashboard",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>
      ),
    },
    {
      name: "Favorites",
      href: "/dashboard/favorites",
      icon: (
        <svg width="24" height="24" viewBox="0 0 30 31" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g clipPath="url(#clip0_star)">
            <path d="M14.0461 3.03341C14.3396 2.10007 15.6604 2.10006 15.9539 3.0334L18.1479 10.0098C18.2789 10.4264 18.6651 10.7098 19.1018 10.7098L26.2687 10.7101C27.2294 10.7102 27.6373 11.933 26.869 12.5098L21.0153 16.9049C20.6763 17.1595 20.5346 17.6001 20.6617 18.0045L22.8841 25.0731C23.1755 26.0002 22.1069 26.7562 21.3297 26.1727L15.6004 21.8717C15.2447 21.6047 14.7553 21.6047 14.3996 21.8717L8.67026 26.1727C7.89306 26.7562 6.82446 26.0002 7.11594 25.0731L9.33827 18.0045C9.46542 17.6001 9.32375 17.1595 8.98473 16.9049L3.13095 12.5098C2.36267 11.933 2.77061 10.7102 3.73133 10.7101L10.8982 10.7098C11.3349 10.7098 11.7211 10.4264 11.8521 10.0098L14.0461 3.03341Z" 
              stroke="currentColor" 
              strokeWidth="2"/>
          </g>
          <defs>
            <clipPath id="clip0_star">
              <rect width="30" height="31" fill="white"/>
            </clipPath>
          </defs>
        </svg>
      ),
      activeIcon: (
        <svg width="24" height="24" viewBox="0 0 33 33" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M14.9307 6.4796C15.4246 4.95944 17.5753 4.95944 18.0692 6.4796L19.834 11.9111C20.0549 12.5909 20.6884 13.0512 21.4032 13.0512H27.1142C28.7126 13.0512 29.3772 15.0966 28.0841 16.0361L23.4638 19.3929C22.8855 19.8131 22.6435 20.5578 22.8644 21.2376L24.6292 26.6691C25.1231 28.1893 23.3832 29.4534 22.0901 28.5139L17.4698 25.157C16.8915 24.7369 16.1084 24.7369 15.5301 25.157L10.9098 28.5139C9.61671 29.4534 7.87682 28.1893 8.37075 26.6691L10.1355 21.2376C10.3564 20.5578 10.1144 19.8131 9.53614 19.3929L4.91586 16.0361C3.62273 15.0966 4.28731 13.0512 5.88571 13.0512H11.5967C12.3115 13.0512 12.945 12.5909 13.1659 11.9111L14.9307 6.4796Z" 
            fill="currentColor"/>
        </svg>
      ),
    },
    {
      name: "Watch Later",
      href: "/dashboard/watch-later",
      icon: (
        <svg width="24" height="24" viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M17 11.3333V17L21.25 21.25M29.75 17C29.75 24.0416 24.0416 29.75 17 29.75C9.95837 29.75 4.25 24.0416 4.25 17C4.25 9.95837 9.95837 4.25 17 4.25C24.0416 4.25 29.75 9.95837 29.75 17Z" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"/>
        </svg>
      ),
      activeIcon: (
        <svg width="24" height="24" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path fillRule="evenodd" clipRule="evenodd" d="M15 27C21.6274 27 27 21.6274 27 15C27 8.37258 21.6274 3 15 3C8.37258 3 3 8.37258 3 15C3 21.6274 8.37258 27 15 27ZM16 9C16 8.44772 15.5523 8 15 8C14.4477 8 14 8.44772 14 9V15C14 15.2652 14.1054 15.5196 14.2929 15.7071L18.5355 19.9497C18.9261 20.3403 19.5592 20.3403 19.9497 19.9497C20.3403 19.5592 20.3403 18.9261 19.9497 18.5355L16 14.5858V9Z" 
            fill="currentColor"/>
        </svg>
      ),
    },
  ];

  return (
    <nav className="md:w-20 md:h-full bg-[#18b998] flex md:flex-col items-center py-3 md:pt-0 md:pb-0">
      <div className="flex md:flex-col w-full justify-evenly md:justify-start">
        <div className="flex md:flex-col w-full justify-evenly md:space-y-8 md:pt-8">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`md:p-3 p-2 md:rounded-lg rounded-md ${isActive ? "bg-white text-[#1ED2AF]" : "text-white hover:bg-white/20"} flex flex-col items-center justify-center`}
                title={item.name}
              >
                {isActive && item.activeIcon ? item.activeIcon : item.icon}
                <span className="md:hidden text-xs mt-1">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}