'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

import { translations } from './translations';

// Custom Avenir Font Stacks via Tailwind Arbitrary Values
const avenirBody = "font-['Avenir_Light',_'Avenir',_'Avenir_Next',_'Helvetica_Neue',_Arial,_sans-serif] font-light";
const avenirHeading = "font-['Avenir_Black',_'Avenir',_'Avenir_Next',_'Helvetica_Neue',_Arial,_sans-serif] font-black";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const galleryImages = [
  '/gallery-1.jpg',
  '/gallery-2.jpg',
  '/gallery-3.jpg',
  '/gallery-4.jpg',
  '/gallery-5.jpg',
  '/gallery-6.jpg',
  '/gallery-7.jpg',
  '/gallery-8.jpg',
  '/gallery-9.jpg',
  '/gallery-10.jpg',
];

// --- THE TRANSLATION DICTIONARY ---

const FadeInSection = ({ children, delayMs = 0 }: { children: React.ReactNode, delayMs?: number }) => {
  const [isVisible, setVisible] = useState(false);
  const domRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setVisible(true);
          if (domRef.current) observer.unobserve(domRef.current);
        }
      });
    }, { threshold: 0.15 });

    if (domRef.current) observer.observe(domRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={domRef}
      style={{ transitionDelay: `${delayMs}ms` }}
      className={`transition-all duration-1000 ease-out ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
      }`}
    >
      {children}
    </div>
  );
};

const BackgroundPattern = () => {
  const sequences = Array(8).fill(null);
  // Increase the number of rows significantly so the pattern covers the full height of the scrollable page
  const rows = Array(80).fill(null);

  return (
    // Changed "fixed" to "absolute" so it scrolls with the main relative container
    <div className="absolute inset-0 -z-10 flex flex-col gap-12 bg-[#DBDAC8] overflow-hidden py-12">
      {rows.map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-16 w-max px-12 h-32 shrink-0">
          {sequences.map((_, seqIndex) => (
            <React.Fragment key={seqIndex}>
              <div className="flex gap-8">
                <div className="w-[29px] bg-[#3091b3] h-full"></div>
                <div className="w-[29px] bg-[#3091b3] h-full"></div>
              </div>
              <div className="flex gap-8">
                <div className="w-[29px] bg-[#3091b3] h-full"></div>
                <div className="w-[29px] bg-[#3091b3] h-full"></div>
                <div className="w-[29px] bg-[#3091b3] h-full"></div>
                <div className="w-[29px] bg-[#3091b3] h-full"></div>
              </div>
            </React.Fragment>
          ))}
        </div>
      ))}
    </div>
  );
};

export default function Home() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  
  // Touch state for gallery swipe
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 50; 

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null); 
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe) showNextImage();
    if (isRightSwipe) showPrevImage();
  };

  // State for Menu Scroll Behavior
  const [showNav, setShowNav] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [language, setLanguage] = useState<'SK' | 'EN' | 'DE'>('SK'); 

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  const t = translations[language] as any;

  // IP Address Geolocation hook to automatically set language
  useEffect(() => {
    const detectUserLocation = async () => {
      try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        const country = data.country_code;

        if (['SK', 'CZ'].includes(country)) {
          setLanguage('SK');
        } else if (['DE', 'AT', 'CH'].includes(country)) {
          setLanguage('DE');
        } else {
          setLanguage('EN'); 
        }
      } catch (error) {
        console.error("Location detection failed, defaulting to English.", error);
        setLanguage('EN'); 
      }
    };

    detectUserLocation();
  }, []);

  // Updated Scroll Tracking Logic
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setShowNav(false);
        setIsMenuOpen(false); // Close menu on scroll down
      } else {
        setShowNav(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  useEffect(() => {
    const slideInterval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % galleryImages.length);
    }, 8000); 
    return () => clearInterval(slideInterval);
  }, []);

  // Keyboard navigation for Lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedImageIndex === null) return;
      
      if (e.key === 'ArrowRight') {
        showNextImage();
      } else if (e.key === 'ArrowLeft') {
        showPrevImage();
      } else if (e.key === 'Escape') {
        setSelectedImageIndex(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedImageIndex]);

 // --- MAPBOX INITIALIZATION HOOK ---
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapRef.current) return; 

    mapboxgl.accessToken = 'pk.eyJ1IjoiamFuc2thY2VsIiwiYSI6ImNtbXVlaTV5djF4cDkzMXNkZHlvZmJiaGQifQ.lHBxLmr5NR_QFhXjEXPkbQ';

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/janskacel/cmmutgfuo00ac01s9cznqfnaa', 
      center: [17.0950, 48.1240],
      zoom: 15.5, 
      pitch: 75, 
      bearing: 15, 
      scrollZoom: false,
      cooperativeGestures: true,
      attributionControl: false
    });

    mapRef.current = map;
    map.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-right');

    map.on('load', () => {
      if (!document.getElementById('mapbox-custom-styles')) {
        const style = document.createElement('style');
        style.id = 'mapbox-custom-styles';
        style.innerHTML = `
          @keyframes mapbox-pulse {
            0% { box-shadow: 0 0 0 0 rgba(255, 166, 43, 0.6); }
            70% { box-shadow: 0 0 0 20px rgba(255, 166, 43, 0); }
            100% { box-shadow: 0 0 0 0 rgba(255, 166, 43, 0); }
          }
          .zieger-pulse {
            animation: mapbox-pulse 2s infinite;
          }
        `;
        document.head.appendChild(style);
      }

      const projectWrapper = document.createElement('div');
      projectWrapper.style.display = 'flex';
      projectWrapper.style.flexDirection = 'column';
      projectWrapper.style.alignItems = 'center';
      projectWrapper.style.cursor = 'pointer';
      projectWrapper.style.zIndex = '50';

      const projectPin = document.createElement('div');
      projectPin.className = 'zieger-pulse';
      projectPin.style.backgroundColor = '#ffa62b'; 
      projectPin.style.width = '52px';
      projectPin.style.height = '52px';
      projectPin.style.display = 'flex';
      projectPin.style.alignItems = 'center';
      projectPin.style.justifyContent = 'center';
      projectPin.style.border = '3px solid #ffffff';
      
      projectPin.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 21h18"></path>
          <path d="M5 21V8l7-5 7 5v13"></path>
          <path d="M9 21v-5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v5"></path>
        </svg>
      `;

      const projectLabel = document.createElement('div');
      projectLabel.innerHTML = 'ZIEGER MILL';
      projectLabel.style.backgroundColor = '#1c1917'; 
      projectLabel.style.color = '#ffffff';
      projectLabel.style.padding = '4px 12px';
      projectLabel.style.fontSize = '12px';
      projectLabel.style.fontWeight = '800';
      projectLabel.style.letterSpacing = '1px';
      projectLabel.style.marginTop = '-10px'; 
      projectLabel.style.boxShadow = '0 4px 10px rgba(0,0,0,0.3)';
      projectLabel.style.border = '1px solid #44403c';
      projectLabel.style.whiteSpace = 'nowrap';
      projectLabel.style.fontFamily = '"Avenir Black", Avenir, sans-serif';

      projectWrapper.appendChild(projectPin);
      projectWrapper.appendChild(projectLabel);

      new mapboxgl.Marker({ 
        element: projectWrapper, 
        anchor: 'bottom' 
      })
      .setLngLat([17.0935, 48.1201])
      .addTo(map);

      const landmarks = [
        { name: "Bratislavský hrad", coords: [17.1001, 48.1422], walkTime: "40 min", icon: "/icon-castle.png" },
        { name: "Sad Janka Kráľa & Aupark", coords: [17.1085, 48.1360], walkTime: "25 min", icon: "/icon-park.png" },
        { name: "Vienna Gate, Tesco, Lekáreň", coords: [17.0977, 48.1214], walkTime: "5 min",  icon: "/icon-shop-bus.png" },
        { name: "ŽST Bratislava-Petržalka", coords: [17.0989, 48.1217], walkTime: "6 min",  icon: "/icon-train.png" },
        { name: "Kúpalisko Matadorka", coords: [17.0933, 48.1228], walkTime: "4 min",  icon: "/icon-swim.png" },
      ];

      landmarks.forEach(poi => {
        const markerContainer = document.createElement('div');
        markerContainer.style.display = 'flex';
        markerContainer.style.flexDirection = 'column';
        markerContainer.style.alignItems = 'center';
        markerContainer.style.cursor = 'pointer';
        markerContainer.style.zIndex = '10';

        const tooltip = document.createElement('div');
        tooltip.innerHTML = poi.name;
        tooltip.style.position = 'absolute';
        tooltip.style.bottom = '100%'; 
        tooltip.style.left = '50%';
        tooltip.style.transform = 'translateX(-50%)';
        tooltip.style.marginBottom = '8px'; 
        tooltip.style.backgroundColor = '#1c1917'; 
        tooltip.style.color = '#ffffff';
        tooltip.style.padding = '6px 12px';
        tooltip.style.fontSize = '12px';
        tooltip.style.fontWeight = '700';
        tooltip.style.whiteSpace = 'nowrap';
        tooltip.style.opacity = '0'; 
        tooltip.style.transition = 'opacity 0.2s ease-in-out'; 
        tooltip.style.pointerEvents = 'none'; 
        tooltip.style.boxShadow = '0 4px 10px rgba(0,0,0,0.3)';
        tooltip.style.zIndex = '20';
        tooltip.style.fontFamily = '"Avenir Light", Avenir, sans-serif';

        const iconDiv = document.createElement('div');
        iconDiv.style.width = '50px';
        iconDiv.style.height = '50px';
        iconDiv.style.backgroundImage = `url(${poi.icon})`;
        iconDiv.style.backgroundSize = 'contain';
        iconDiv.style.backgroundRepeat = 'no-repeat';
        iconDiv.style.backgroundPosition = 'center';
        iconDiv.style.borderRadius = '50%';
        iconDiv.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)'; 

        const timeLabel = document.createElement('div');
        timeLabel.innerHTML = `
          <div style="color: #544740; font-size: 11px; font-weight: 700; display: flex; align-items: center; justify-content: center; gap: 4px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="#544740" stroke="#544740" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 16v-2.38C4 11.5 2.97 10.5 3 8c.03-2.72 1.49-6 4.5-6C9.37 2 10 3.8 10 5.5c0 3.11-2 5.66-2 8.68V16a2 2 0 1 1-4 0Z"/>
              <path d="M20 20v-2.38c0-2.12 1.03-3.12 1-5.62-.03-2.72-1.49-6-4.5-6C14.63 6 14 7.8 14 9.5c0 3.11 2 5.66 2 8.68V20a2 2 0 1 0 4 0Z"/>
            </svg>
            ${poi.walkTime}
          </div>
        `;
        timeLabel.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
        timeLabel.style.padding = '2px 8px';
        timeLabel.style.borderRadius = '12px';
        timeLabel.style.marginTop = '-10px'; 
        timeLabel.style.boxShadow = '0 2px 6px rgba(0,0,0,0.15)';
        timeLabel.style.border = '1px solid #e7e5e4';
        timeLabel.style.fontFamily = '"Avenir Light", Avenir, sans-serif';

        markerContainer.addEventListener('mouseenter', () => {
          tooltip.style.opacity = '1';
          markerContainer.style.zIndex = '30';
        });
        markerContainer.addEventListener('mouseleave', () => {
          tooltip.style.opacity = '0';
          markerContainer.style.zIndex = '10';
        });

        markerContainer.appendChild(tooltip); 
        markerContainer.appendChild(iconDiv);
        markerContainer.appendChild(timeLabel);

        new mapboxgl.Marker({ 
          element: markerContainer, 
          anchor: 'bottom' 
        })
        .setLngLat(poi.coords as [number, number])
        .addTo(map);
      });
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    const { error } = await supabase.from('leads').insert([{ name, email, phone }]);
    if (error) {
      console.error(error);
      setStatus('error');
    } else {
      setStatus('success');
      setName(''); setEmail(''); setPhone('');
    }
  };

  const scrollToForm = () => {
    document.getElementById('kontakt')?.scrollIntoView({ behavior: 'smooth' });
  };

  const showNextImage = () => {
    setSelectedImageIndex((prev) => prev !== null ? (prev + 1) % galleryImages.length : null);
  };

  const showPrevImage = () => {
    setSelectedImageIndex((prev) => prev !== null ? (prev === 0 ? galleryImages.length - 1 : prev - 1) : null);
  };

  return (
    <main className={`text-stone-800 selection:bg-amber-700 selection:text-white ${avenirBody} relative`}>
      <BackgroundPattern />

      {/* CSS for Menu Staggered Animation */}
      <style jsx global>{`
        @keyframes menu-fade-in-down {
          0% { opacity: 0; transform: translateY(-10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-menu-item {
          opacity: 0;
          animation: menu-fade-in-down 0.4s ease-out forwards;
        }
      `}</style>

      <div className="w-full h-1 bg-[#544740] fixed top-0 left-0 z-50"></div>

      {/* STICKY TOP MENU BAR */}
      <nav
        className={`fixed top-1 left-0 w-full h-40 z-40 bg-[#3091b3]/40 backdrop-blur-sm shadow-md transition-transform duration-500 ease-in-out flex items-center px-6 md:px-12 ${
          showNav ? 'translate-y-0' : '-translate-y-[110%]'
        }`}
      >
        <div className="flex-1 relative">
          {/* Hamburger Menu - Hidden on Mobile per user request */}
          <div className="hidden md:block">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)} 
              className="p-2 text-[#d7d9c7] hover:text-stone-700 transition-colors focus:outline-none"
              aria-label="Menu"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
              </svg>
            </button>
            
            {/* Dropdown Menu */}
            {isMenuOpen && (
              <div className="absolute top-14 left-0 w-48 bg-[#d7d9c7]/80 backdrop-blur-sm shadow-xl border border-[#ffa62b]/30 py-2 overflow-hidden flex flex-col z-50 rounded-sm">
                {[
                  { id: 'uvod', label: t.navHome },
                  { id: 'projekt', label: t.navProject },
                  { id: 'galeria', label: t.navGallery },
                  { id: 'historia', label: t.navHistory },
                  { id: 'lokalita', label: t.navLocation },
                  { id: 'kontakt', label: t.navContact }
                ].map((item, index) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setIsMenuOpen(false);
                      document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    style={{ animationDelay: `${index * 50}ms` }}
                    className="animate-menu-item text-left px-6 py-3 text-stone-700 hover:bg-[#ffa62b]/50 hover:text-[#544740] transition-colors font-bold tracking-wider text-sm uppercase"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <div 
          className="flex-shrink-0 cursor-pointer max-w-full overflow-hidden"
          onClick={() => {
            setIsMenuOpen(false);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          <img src="/logo.png" alt="Zieger Mill Logo" className="h-auto max-h-[100px] sm:max-h-none sm:h-35 w-auto max-w-full sm:max-w-none object-contain" />
        </div>
        <div className="flex-1"></div>
      </nav>

      {/* LIGHTBOX MODAL */}
      {selectedImageIndex !== null && (
        <div 
          className="fixed inset-0 z-50 bg-stone-900/95 flex items-center justify-center" onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
          <button onClick={() => setSelectedImageIndex(null)} className="absolute top-8 right-8 text-stone-400 hover:text-amber-500 transition-colors z-50 p-2">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
          <button onClick={showPrevImage} className="absolute left-4 md:left-10 text-stone-400 hover:text-amber-500 transition-colors z-50 p-2">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 19l-7-7 7-7"></path></svg>
          </button>
          <img src={galleryImages[selectedImageIndex]} alt="Zväčšená vizualizácia" className="max-h-[85vh] max-w-[85vw] object-contain shadow-2xl" />
          <button onClick={showNextImage} className="absolute right-4 md:right-10 text-stone-400 hover:text-amber-500 transition-colors z-50 p-2 rounded-md">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5l7 7-7 7"></path></svg>
          </button>
          <div className="absolute bottom-8 text-stone-400 tracking-widest text-xs">
            {selectedImageIndex + 1} / {galleryImages.length}
          </div>
        </div>
      )}

      {/* 1. HERO SECTION */}
      <section id="uvod" className="relative h-screen w-full flex flex-col items-center justify-center p-6">
        <div className="absolute inset-0 z-0 overflow-hidden bg-stone-900">
          {galleryImages.map((img, idx) => (
            <div
              key={idx}
              className={`absolute inset-0 bg-cover bg-center transition-opacity duration-[3000ms] ease-in-out ${
                idx === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
              }`}
              style={{ backgroundImage: `url('${img}')` }}
            />
          ))}
          <div className="absolute inset-0 bg-stone-900/30 z-20 pointer-events-none"></div>
        </div>

        <FadeInSection>
          <div className="relative z-30 text-center max-w-4xl mx-auto mt-[-5vh]">

            
            <h1 className={`hidden md:block text-6xl sm:text-8xl lg:text-9xl text-white mb-6 tracking-wide uppercase drop-shadow-lg ${avenirHeading}`}>
              ZIEGERMILL
            </h1>
            <p className="text-lg sm:text-xl text-stone-100 font-light max-w-2xl mx-auto leading-relaxed mb-10 drop-shadow-md">
              {t.heroDesc}
            </p>
            <button onClick={scrollToForm} className={`border border-white/50 bg-white/20 backdrop-blur-md text-white rounded hover:bg-white hover:text-stone-900 rounded uppercase tracking-widest text-sm px-12 py-4 transition-all duration-500 ${avenirHeading}`}>
              {t.btnInterest}
            </button>
          </div>
        </FadeInSection>
      </section>

      {/* CONTINUOUS GLASSMORPHISM WRAPPER */}
      <div className="max-w-7xl mx-auto w-full bg-[#d7d9c7]/70 backdrop-blur-sm shadow-xl relative z-10">

        {/* 2. VISUALIZATIONS & TEXT */}
        <section id="projekt" className="px-6 py-14 sm:py-22 overflow-hidden">
          <FadeInSection>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center mb-24 sm:mb-32">
              <div className="order-2 lg:order-1">
                <h2 className={`text-4xl sm:text-5xl text-stone-800 mb-6 tracking-wide uppercase ${avenirHeading}`}>
                  {t.feat1T1}
                </h2>
                <div className="w-24 h-[1px] bg-[#3091b3] mb-8"></div>
                {t.feat1P1 && <p className="text-stone-600 leading-relaxed text-lg mb-6">{t.feat1P1}</p>}
                {t.feat1P2 && <p className="text-stone-600 leading-relaxed text-lg">{t.feat1P2}</p>}
              </div>
              <div className="order-1 lg:order-2 h-[400px] sm:h-[600px] w-full bg-cover bg-center shadow-xl border-4 border-[#d7d9c7] rounded-sm" style={{ backgroundImage: "url('/feature-1.jpg')" }}></div>
            </div>
          </FadeInSection>

          <FadeInSection>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center">
              <div className="h-[400px] sm:h-[600px] w-full bg-cover bg-center shadow-xl border-4 border-[#d7d9c7] rounded-sm" style={{ backgroundImage: "url('/feature-2.jpg')" }}></div>
              <div>
                <h2 className={`text-4xl sm:text-5xl text-stone-800 mb-6 tracking-wide uppercase ${avenirHeading}`}>
                  {t.feat2T1} 
                </h2>
                <div className="w-24 h-[1px] bg-[#3091b3] mb-8"></div>
                {t.feat2P1 && <p className="text-stone-600 leading-relaxed text-lg mb-6">{t.feat2P1}</p>}
                {t.feat2P2 && <p className="text-stone-600 leading-relaxed text-lg">{t.feat2P2}</p>}
              </div>
            </div>
          </FadeInSection>
        </section>

        {/* 3. GALLERY SECTION */}
        <section id="galeria" className="py-14 overflow-hidden">
          <div className="px-6">
            <FadeInSection>
              <div className="text-center mb-16">
                <h2 className={`text-4xl sm:text-5xl text-stone-800 mb-4 tracking-wide uppercase ${avenirHeading}`}>
                  {t.galT1} 
                </h2>
                <div className="w-24 h-[1px] bg-[#3091b3] mx-auto"></div>

              </div>
            </FadeInSection>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {galleryImages.map((img, index) => (
                <FadeInSection key={index} delayMs={index * 100}>
                  <div className="aspect-square overflow-hidden cursor-pointer relative group bg-stone-300 rounded-md" onClick={() => setSelectedImageIndex(index)}>
                    <div className="absolute inset-0 bg-stone-900/0 group-hover:bg-stone-900/60 transition-all duration-300 z-10 flex items-center justify-center">
                      <svg className="w-10 h-10 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"></path></svg>
                    </div>
                    <img src={img} alt={`Galéria ${index + 1}`} className="w-full rounded h-full object-cover grayscale-[30%] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700" />
                  </div>
                </FadeInSection>
              ))}
            </div>
          </div>
        </section>

        {/* 4. HISTORY SECTION */}
        <section id="historia" className="pt-14 pb-12 overflow-hidden">
          <div className="px-6">
            <FadeInSection>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-24 items-center">
                
                <div className="order-2 lg:order-1 lg:col-span-2 relative w-full bg-transparent shadow-xl  overflow-hidden rounded-lg">
                  <img src="/history.jpg" alt="Historical photo" className="w-full h-auto block grayscale sepia-[.3]" />
                  <div className="absolute inset-0 bg-stone-900/10 mix-blend-multiply pointer-events-none"></div>
                </div>
                
                <div className="order-1 lg:order-2 lg:col-span-1">
                  <h2 className={`text-4xl sm:text-5xl text-stone-800 mb-6 tracking-wide uppercase ${avenirHeading}`}>
                    {t.histT1} 
                  </h2>
                  <div className="w-24 h-[1px] bg-[#3091b3] mb-8"></div>
                  {t.histP1 && <p className="text-stone-600 leading-relaxed text-lg mb-6">{t.histP1}</p>}
                  {t.histP2 && <p className="text-stone-600 leading-relaxed text-lg">{t.histP2}</p>}
                </div>

              </div>
            </FadeInSection>
          </div>
        </section>

      </div>

      {/* 4.5 LOCATION MAP SECTION */}
      <section id="lokalita" className="bg-transparent overflow-hidden">
        <FadeInSection>
          <div className="relative w-full h-[520px] lg:h-[650px] shadow-xl">
            <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />
          </div>
        </FadeInSection>
      </section>

      {/* 5. LEAD CAPTURE FORM SECTION */}
      <section id="kontakt" className="py-10 px-6 overflow-hidden max-w-7xl mx-auto w-full bg-[#d7d9c7]/70 backdrop-blur-sm shadow-xl relative z-10 ">
        <FadeInSection>
          <div className="max-w-2xl mx-auto">
            
            <div className="p-4 sm:p-14 shadow-2xl relative overflow-hidden ">
              <div className="absolute inset-2 pointer-events-none "></div>

              <div className="text-center mb-10 relative z-10">
                <h2 className={`text-3xl text-stone-700 mb-4 tracking-wide uppercase ${avenirHeading}`}>{t.formTitle}</h2>
                <div className="w-16 h-[1px] mx-auto mb-6"></div>
                <p className="text-stone-700">{t.formDesc}</p>
              </div>

              {status === 'success' ? (
                <div className="py-12 text-center relative z-10">
                  <div className="w-20 h-20 flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M5 13l4 4L19 7"></path></svg>
                  </div>
                  <h3 className={`text-2xl text-amber-700 mb-3 uppercase tracking-wide ${avenirHeading}`}>{t.formThanks}</h3>
                  <p className="text-stone-700">{t.formThanksDesc}</p>
                  <button onClick={() => setStatus('idle')} className="mt-8 rounded-sm text-sm text-amber-600 uppercase tracking-widest hover:text-amber-500 transition-colors border-b border-amber-600/30 pb-1">{t.formNew}</button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                  <div>
                    <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-sm px-5 py-4 bg-[#3091b3]/50 border border-stone-700 focus:border-stone-300 outline-none text-white transition-all placeholder-stone-300" placeholder={t.formName} />
                  </div>
                  <div>
                    <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-sm px-5 py-4 bg-[#3091b3]/50 border border-stone-700 focus:border-stone-300 outline-none text-white transition-all placeholder-stone-300" placeholder={t.formEmail} />
                  </div>
                  <div>
                    <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full rounded-sm px-5 py-4 bg-[#3091b3]/50 border border-stone-700 focus:border-stone-300 outline-none text-white transition-all placeholder-stone-300" placeholder={t.formPhone} />
                  </div>
                  {status === 'error' && <p className="text-amber-700 text-sm text-center mt-2 bg-amber-900/20 py-3 border border-amber-900/50">{t.formError}</p>}
                  <button type="submit" disabled={status === 'loading'} className="w-full rounded-sm mt-6 bg-stone-500/70 text-stone-300 uppercase tracking-widest text-sm py-5 hover:bg-white hover:text-stone-600 transition-colors duration-300 disabled:opacity-50 font-bold">
                    {status === 'loading' ? t.formSending : t.formSubmit}
                  </button>
                </form>
              )}
            </div>
          </div>
        </FadeInSection>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#3091b3] py-16 text-center flex flex-col items-center gap-8">
        
        <div className="flex justify-center items-center gap-6 text-sm tracking-widest uppercase font-bold">
          {['SK', 'EN', 'DE'].map((lang) => (
            <button 
              key={lang}
              onClick={() => setLanguage(lang as 'SK' | 'EN' | 'DE')}
              className={`pb-1 transition-colors ${
                language === lang 
                  ? 'text-amber-500 border-b-2 border-amber-500' 
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              {lang}
            </button>
          ))}
        </div>

        <div className="flex flex-col items-center gap-4">
          <div className="text-stone-300 text-xs tracking-widest uppercase">
            {t.footer}
          </div>
          <a 
            href="/ochrana-osobnych-udajov" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-stone-300 hover:text-amber-500 transition-colors text-xs tracking-widest uppercase underline underline-offset-4"
          >
            {t.privacy}
          </a>
        </div>
      </footer>
    </main>
  );
}