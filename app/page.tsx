'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowRight, ArrowUpRight, Eye, Menu, Pause, Play, ShieldCheck, X } from 'lucide-react';
import './landing.css';
import { homeUrl, dashboardUrl } from '../lib/site-paths';

const media = {
 hero: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260405_074625_a81f018a-956b-43fb-9aee-4d1508e30e6a.mp4',
 feature: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260402_054547_9875cfc5-155a-4229-8ec8-b7ba7125cbf8.mp4',
 vision: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260307_083826_e938b29f-a43a-41ec-a153-3d4730578ab8.mp4',
 research: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260314_131748_f2ca2a28-fed7-44c8-b9a9-bd9acdd5ec31.mp4',
 review: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260324_151826_c7218672-6e92-402c-9e45-f1e0f454bdc4.mp4',
};

export default function Landing() {
 const root = useRef<HTMLDivElement>(null);
 const [menu, setMenu] = useState(false);
 const [motion, setMotion] = useState(false);
 useEffect(() => {
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const sync = () => setMotion(!preference.matches);
  sync(); preference.addEventListener('change', sync);
  return () => preference.removeEventListener('change', sync);
 }, []);
 useEffect(() => {
  const videos = root.current?.querySelectorAll('video');
  if (!motion) { videos?.forEach(video => video.pause()); return; }
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
   const target = entry.target as HTMLVideoElement;
   if (entry.isIntersecting) void target.play().catch(() => {});
   else target.pause();
  }), {threshold: 0.01});
  videos?.forEach(video => observer.observe(video));
  return () => { observer.disconnect(); videos?.forEach(video => video.pause()); };
 }, [motion]);
 useEffect(() => {
  const close = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenu(false); };
  window.addEventListener('keydown',close);
  return () => window.removeEventListener('keydown',close);
 }, []);
 function video(src: string, hero = false) {
  return <video className={hero ? 'landing-video hero-video' : 'landing-video'} src={src} muted loop playsInline preload={hero ? 'auto' : 'none'} aria-hidden="true" onCanPlay={e => e.currentTarget.classList.add('is-ready')}/>;
 }
 return <div ref={root} className="landing">
  <a className="skip" href="#landing-content">Skip to content</a>
  <section className="landing-hero">
   {video(media.hero, true)}<div className="hero-shade"/>
   <header className="landing-header liquid-glass">
    <a className="landing-brand" href={homeUrl} aria-label="RetinaReview home"><Eye size={25} strokeWidth={1.4}/><span>retina<span>review</span></span></a>
    <nav className="landing-nav" aria-label="Landing page"><a href="#approach">Our approach</a><a href="#workflow">The workspace</a><a href="#research">Research</a></nav>
    <a href={dashboardUrl} className="nav-launch liquid-glass">Open workspace <ArrowUpRight size={15}/></a>
    <button className="mobile-menu-button" aria-label={menu ? 'Close navigation' : 'Open navigation'} aria-expanded={menu} aria-controls="mobile-navigation" onClick={() => setMenu(!menu)}>{menu ? <X/> : <Menu/>}</button>
   </header>
   {menu && <nav id="mobile-navigation" className="mobile-navigation liquid-glass" aria-label="Mobile navigation">{[['Our approach','#approach'],['The workspace','#workflow'],['Research','#research'],['Open workspace',dashboardUrl]].map(([label,url]) => <a key={url} href={url} onClick={() => setMenu(false)}>{label}<ArrowUpRight size={16}/></a>)}</nav>}
   <div id="landing-content" className="hero-copy">
    <span className="hero-label"><span/> RETINAL IMAGING · HUMAN-LED REVIEW</span>
    <h1>See clearly.<br/>Review <em>thoughtfully.</em></h1>
    <p>A considered space for retinal image review.<br/>From the original image to your next observation.</p>
    <a className="hero-cta liquid-glass" href={dashboardUrl}><span>Step into the workspace</span><span className="cta-disc"><ArrowRight size={22}/></span></a>
    <span className="hero-disclaimer"><ShieldCheck size={14}/> Research prototype. Human assessment comes first.</span>
   </div>
   <div className="hero-bottom"><span>DETAIL MATTERS. SO DOES JUDGMENT.</span><a className="scroll-cue liquid-glass" href="#approach" aria-label="Explore our approach"><ArrowDown size={19}/></a><button className="motion-control liquid-glass" onClick={() => setMotion(!motion)} aria-label={motion ? 'Pause ambient videos' : 'Play ambient videos'}>{motion ? <Pause size={14}/> : <Play size={14}/>}<span>{motion ? 'Pause motion' : 'Play motion'}</span></button></div>
  </section>
  <section id="approach" className="landing-section about-section">
   <span className="section-label">01 / OUR APPROACH</span>
   <h2>A closer look.<br/><em>A more considered perspective.</em></h2>
   <p className="section-intro">Retinal images deserve careful attention. RetinaReview brings image inspection, reviewer observations, and traceable exports into one focused workspace.</p>
  </section>
  <section className="landing-section featured-section" aria-label="Our philosophy">
   <div className="featured-film">{video(media.feature)}<div className="film-shade"/><div className="film-content"><div className="film-card liquid-glass"><span className="section-label">BUILT AROUND THE REVIEWER</span><p>Technology can bring detail into focus.<br/>The assessment stays with you.</p></div><a href={dashboardUrl} className="glass-link liquid-glass">Explore the workspace <ArrowUpRight size={18}/></a></div></div>
  </section>
  <section id="workflow" className="landing-section vision-section"><div className="section-heading"><h2>Insight <em>×</em> Judgment.</h2><span className="section-label">02 / THE WORKSPACE</span></div><div className="vision-grid"><div className="vision-film">{video(media.vision)}<div className="film-shade"/><span className="film-caption">A SPACE TO SEE MORE CLEARLY</span></div><div className="vision-copy"><article><span className="section-label">01 — INSPECT THE ORIGINAL</span><h3>Every detail, in context.</h3><p>Open a fundus image locally, zoom into the original, and move between cases without losing your place. Your image stays in your browser.</p></article><article><span className="section-label">02 — RECORD YOUR PERSPECTIVE</span><h3>Make your review traceable.</h3><p>Record an assessment, add observations, and export a review record. Session data clears on refresh, so you choose what to keep.</p></article><a className="text-link" href={dashboardUrl}>Try the review flow <ArrowRight size={17}/></a></div></div></section>
  <section id="research" className="landing-section capabilities-section"><div className="section-heading"><h2>Built with <em>intention.</em></h2><span className="section-label">03 / RESEARCH & PRACTICE</span></div><div className="capability-grid"><article className="capability-card liquid-glass"><div className="card-film">{video(media.research)}</div><div className="capability-body"><span className="section-label">THE RESEARCH DIRECTION</span><h3>Evidence before confidence.</h3><p>APTOS, IDRiD, and RetiZero inform the project’s research direction. Import labeled predictions to compare model variants, examine external IDRiD results, and investigate grading errors. No trained model is bundled.</p><a className="text-link" href="https://github.com/LooKing9218/RetiZero" target="_blank" rel="noreferrer">Explore RetiZero <ArrowUpRight size={17}/></a></div></article><article className="capability-card liquid-glass"><div className="card-film">{video(media.review)}</div><div className="capability-body"><span className="section-label">THE WORKING PROTOTYPE</span><h3>A human in every decision.</h3><p>Local quality checks, imported confidence and attribution, reviewer notes, and structured reports. Sample findings are labeled, and uploaded images never receive fabricated predictions.</p><a className="text-link" href={dashboardUrl}>Open the prototype <ArrowUpRight size={17}/></a></div></article></div></section>
  <section className="landing-section closing-section"><span className="section-label">YOUR NEXT PERSPECTIVE</span><h2>Take a <em>closer look.</em></h2><a className="hero-cta liquid-glass" href={dashboardUrl}><span>Open RetinaReview</span><span className="cta-disc"><ArrowRight size={22}/></span></a><p>Frontend prototype · No diagnostic model connected</p></section>
  <footer className="landing-footer"><a className="landing-brand" href={homeUrl}><Eye size={24}/><span>retina<span>review</span></span></a><span>Designed for research. Guided by human judgment.</span><a href={dashboardUrl}>Workspace <ArrowUpRight size={14}/></a></footer>
 </div>;
}



