import { useEffect, useRef, useState } from 'react';
import Button from './Button';
export default function PortfolioImprovements({ suggestions, notice, onComplete, onCancel }) {
  const [items,setItems]=useState(()=>structuredClone(suggestions));
  const [step,setStep]=useState(0),[editing,setEditing]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const dialog=useRef(null),cancel=useRef(onCancel),working=useRef(false);
  cancel.current=onCancel;working.current=busy;
  useEffect(()=>{
    const trigger=document.activeElement,overflow=document.body.style.overflow;
    document.body.style.overflow='hidden';
    const key=e=>{
      if(e.key==='Escape' && !working.current) cancel.current();
      if(e.key==='Tab') {
        const controls=[...dialog.current.querySelectorAll('button:not(:disabled),textarea:not(:disabled)')];
        const first=controls[0],last=controls.at(-1);
        if(e.shiftKey && [first,dialog.current].includes(document.activeElement)){e.preventDefault();last?.focus();}
        else if(!e.shiftKey && [last,dialog.current].includes(document.activeElement)){e.preventDefault();first?.focus();}
      }
    };
    window.addEventListener('keydown',key);
    return ()=>{document.body.style.overflow=overflow;window.removeEventListener('keydown',key);trigger?.focus();};
  },[]);
  useEffect(()=>{dialog.current?.focus();},[step]);
  const item=items[step];
  const update=patch=>setItems(old=>old.map((row,index)=>index===step?{...row,...patch}:row));
  const decide=status=>{update({status});setEditing(false);setStep(step+1);};
  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"><section ref={dialog} role="dialog" aria-modal="true" aria-label="Review Portfolio Suggestions" tabIndex={-1} className="max-h-[90vh] w-full max-w-2xl space-y-4 overflow-auto rounded-xl bg-white p-6">
    <h2 className="text-xl font-bold">Review Portfolio Suggestions</h2><p className="text-sm">{notice}</p>
    <p className="text-sm">Nothing is added to your profile. Approve only wording that accurately describes your work.</p>
    {item ? <><p>Suggestion {step+1} of {items.length}</p><h3 className="font-bold">Would you like to use this {item.title}?</h3><p className="text-sm font-semibold">Original</p><p>{item.original || 'No introduction saved.'}</p><p className="text-sm font-semibold">{item.source==='ai'?'AI suggestion':'Profile-based suggestion'}</p>
      {editing?<label>Suggested wording<textarea className="mt-2 w-full rounded border p-2" value={item.value} onChange={e=>update({value:e.target.value})}/></label>:<p>{item.value}</p>}
      <div className="flex gap-3"><Button disabled={!item.value.trim()} onClick={()=>decide('approved')}>Approve suggestion</Button><Button variant="outline" onClick={()=>setEditing(!editing)}>Edit</Button><Button variant="outline" onClick={()=>decide('declined')}>Decline</Button></div></>
      : <><p>Review complete. Approved suggestions will appear in your preview; declined suggestions keep your original wording.</p><Button disabled={busy} onClick={async()=>{setBusy(true);setError('');try{await onComplete(items);}catch(e){setError(e.message);}finally{setBusy(false);}}}>{busy?'Saving…':'Create Preview'}</Button></>}
    {error && <p role="alert">{error}</p>}<div className="flex gap-3">{step>0 && <Button disabled={busy} variant="outline" onClick={()=>{setEditing(false);setStep(step-1);}}>Back</Button>}<Button disabled={busy} variant="outline" onClick={onCancel}>Cancel</Button></div>
  </section></div>;
}
