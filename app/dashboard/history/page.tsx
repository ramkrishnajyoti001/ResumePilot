"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { deleteResume, getResumes, saveCurrentResume } from "../../../lib/storage/storage";
import { Resume } from "../../../lib/types/resume";
import { scoreResume } from "../../../lib/analysis/resume-analysis";
export default function HistoryPage(){
 const [resumes,setResumes]=useState<Resume[]>([]);
 useEffect(()=>{const timer=window.setTimeout(()=>setResumes(getResumes()),0);return()=>window.clearTimeout(timer)},[]);
 function remove(id:string){if(!confirm("Delete this resume?"))return; deleteResume(id); setResumes(getResumes());}
 const avg=resumes.length?Math.round(resumes.reduce((s,r)=>s+scoreResume(r).score,0)/resumes.length):0;
 return <main className="min-h-screen bg-[#07090f] text-white"><div className="mx-auto max-w-7xl px-6 py-8">
 <header className="flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><p className="text-sm text-indigo-400">ResumePilot / History</p><h1 className="mt-2 text-4xl font-bold">Resume History</h1><p className="mt-2 text-sm text-gray-400">Real saved resumes from local storage.</p></div><Link href="/dashboard/create-resume" className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold">+ Create New Resume</Link></header>
 <div className="mt-8 grid gap-4 sm:grid-cols-3"><Stat label="Total Resumes" value={String(resumes.length)}/><Stat label="Average ATS" value={resumes.length?`${avg}%`:"—"}/><Stat label="Latest" value={resumes[0]?new Date(resumes[0].updatedAt).toLocaleDateString():"—"}/></div>
 <section className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025]"><div className="divide-y divide-white/5">{resumes.map(r=><div key={r.id} className="flex flex-col gap-4 p-6 lg:flex-row lg:items-center lg:justify-between"><div><h2 className="font-semibold">{r.title}</h2><p className="mt-1 text-xs text-gray-500">{r.targetRole||"No target role"} · {r.template} · {new Date(r.updatedAt).toLocaleString()}</p></div><div className="flex flex-wrap gap-2"><span className="rounded-lg bg-emerald-500/10 px-3 py-2 text-xs text-emerald-400">ATS {scoreResume(r).score}</span><Link onClick={()=>saveCurrentResume(r)} href={`/dashboard/preview?id=${r.id}`} className="rounded-lg border border-white/10 px-4 py-2 text-xs">Preview</Link><Link href={`/dashboard/create-resume?id=${r.id}`} className="rounded-lg border border-white/10 px-4 py-2 text-xs">Edit</Link><button onClick={()=>remove(r.id)} className="rounded-lg border border-red-500/20 px-4 py-2 text-xs text-red-400">Delete</button></div></div>)}{!resumes.length&&<div className="p-12 text-center text-sm text-gray-500">No saved resumes yet.</div>}</div></section>
 </div></main>;
}
function Stat({label,value}:{label:string;value:string}){return <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5"><p className="text-xs text-gray-500">{label}</p><p className="mt-2 text-2xl font-bold">{value}</p></div>}
