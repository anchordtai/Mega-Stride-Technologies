"use client";
import { useCallback,useEffect,useRef,useState } from "react";
export default function PaymentVerification({reference,auto=false}:{reference:string;auto?:boolean}) {
  const [message,setMessage]=useState(""),[pending,setPending]=useState(false);
  const running=useRef(false),started=useRef(false);
  const verify=useCallback(async()=>{
    if(running.current)return;
    running.current=true;setPending(true);
    try {
      const r=await fetch("/api/payments/verify",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({reference}),signal:AbortSignal.timeout(20000)});
      const d=await r.json();
      setMessage(d.message||d.error||"Check your payment records below.");
      if(r.ok)window.location.assign(typeof d.learningPath==="string"&&/^\/academy\/learn\/[a-f0-9-]{36}$/.test(d.learningPath)?d.learningPath:"/academy/payments?verified=1");
    } catch {setMessage("Confirmation is unavailable. Keep your reference and contact support before paying again.");}
    finally {running.current=false;setPending(false);}
  },[reference]);
  useEffect(()=>{if(auto&&!started.current){started.current=true;void verify();}},[auto,verify]);
  return <div className="platform-panel mb-8"><h2 className="text-xl font-bold">Confirm your checkout result</h2><p className="mt-3 break-all text-sm">Reference: {reference}</p><p className="mt-3 text-sm leading-7">We verify the payment with Paystack before opening paid course access. If you have already paid, keep this reference and do not pay again while confirmation is pending.</p><button disabled={pending} className="primary-button mt-5" onClick={verify}>{pending?"Checking payment…":"Verify payment"}</button>{message&&<p role="status" className="mt-4 leading-7">{message}</p>}</div>;
}
