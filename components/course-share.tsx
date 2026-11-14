"use client";
import { useState } from "react";
export default function CourseShare({title,slug}:{title:string;slug:string}) {
  const [message,setMessage]=useState("");
  const url=`https://www.megastride.com.ng/academy/courses/${encodeURIComponent(slug)}`;
  const text=`Explore ${title} at Mega Stride Academy`;
  const links=[
    ["WhatsApp",`https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`],
    ["Facebook",`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`],
    ["LinkedIn",`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`],
    ["X",`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`],
  ];
  return <section className="mt-7 border-t border-slate-200 pt-6" aria-label={`Share ${title}`}>
    <h3 className="font-bold">Share this course</h3>
    <div className="mt-4 flex flex-wrap gap-x-5 gap-y-3">{links.map(([label,href])=><a key={label} className="text-link text-sm" href={href} target="_blank" rel="noopener noreferrer" aria-label={`Share ${title} on ${label}`}>{label} ↗</a>)}
      <button type="button" className="text-link text-sm" onClick={async()=>{try{await navigator.clipboard.writeText(url);setMessage("Course link copied.");}catch{setMessage(`Copy this course link: ${url}`);}}}>Copy link</button>
      <button type="button" className="text-link text-sm" onClick={async()=>{try{if(navigator.share)await navigator.share({title,text,url});else {await navigator.clipboard.writeText(url);setMessage("Course link copied. Paste it into your preferred app.");}}catch(e){if(!(e instanceof DOMException&&e.name==="AbortError"))setMessage(`Share this course link: ${url}`);}}}>More sharing options</button>
    </div><p role="status" aria-live="polite" className="mt-3 break-words text-sm text-slate-600">{message}</p>
  </section>;
}
