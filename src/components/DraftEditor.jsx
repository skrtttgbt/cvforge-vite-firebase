import { useState } from 'react';
import Button from './Button';
import { normalizeResume, resumeSections } from '../utils/resumeContent';
const label = key => String(key ?? 'Content').replace(/([A-Z])/g,' $1').replace(/^./, c=>c.toUpperCase());
export default function DraftEditor({ resume, onSave, onCancel }) {
  const [value,setValue]=useState(()=>normalizeResume(resume));
  const [error,setError]=useState('');
  const [saving,setSaving]=useState(false);
  const update=(path,next)=>setValue(previous=>{
    const copy=structuredClone(previous);let current=copy;
    for(const key of path.slice(0,-1)) current=current[key];
    current[path.at(-1)]=next;return copy;
  });
  function fields(item,path=[]) {
    const key=path.at(-1);
    if (key === 'imgUrl') return null;
    if (typeof item==='string' || typeof item==='number') return <label key={path.join('.')} className="block">
      <span className="block text-sm font-semibold">{typeof key==='number' ? `Item ${key+1}` : label(key)}</span>
      <textarea className="w-full rounded border border-slate-300 p-2" value={item} readOnly={key==='targetRole'} onChange={e=>update(path,e.target.value)} />
    </label>;
    if (Array.isArray(item)) {
      const section=resumeSections.find(section=>section.key===key);
      return <fieldset key={path.join('.')} className="min-w-0 rounded border p-3">
        <legend className="font-bold">{section?.title || label(key)}</legend>
        {item.length===0 && <p className="text-sm text-slate-500">No entries yet.</p>}
        {item.map((row,index)=><fieldset className="mb-3 min-w-0 space-y-2 rounded border p-3" key={index}>
          <legend>{section?.title || label(key)} {index+1}</legend>
          {fields(row,[...path,index])}
          <Button type="button" variant="outline" onClick={()=>update(path,item.filter((_,i)=>i!==index))}>Remove {section?.singular || 'entry'} {index+1}</Button>
        </fieldset>)}
        <Button type="button" variant="outline" onClick={()=>update(path,[...item,structuredClone(section?.empty ?? (typeof item[0]==='object' ? item[0] : ''))])}>Add {section?.singular || 'entry'}</Button>
      </fieldset>;
    }
    if(item && typeof item==='object') return Object.entries(item).map(([key,v])=>fields(v,[...path,key]));
    return null;
  }
  return <section aria-label="Edit resume" className="grid w-full min-w-0 gap-3 rounded border border-slate-200 bg-white p-4">
    <h2 className="text-lg font-bold">Edit Resume</h2>
    <p className="text-sm text-slate-600">Edit your content, then save it as a draft for review.</p>
    {fields(value)}
    {error && <p role="alert">{error}</p>}
    <div className="flex flex-wrap gap-3">
      <Button type="button" disabled={saving} onClick={async()=>{
        setSaving(true);setError('');try{await onSave(normalizeResume(value));}catch(e){setError(e.message);}finally{setSaving(false);}
      }}>{saving?'Saving…':'Save edits as draft'}</Button>
      <Button type="button" variant="outline" disabled={saving} onClick={onCancel}>Cancel</Button>
    </div>
  </section>;
}
