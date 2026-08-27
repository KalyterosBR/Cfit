import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Archive, Download, Plus, RefreshCw, Search } from "lucide-react";
import toast from "react-hot-toast";
import { EmptyState, ErrorState, SkeletonState } from "@/components/AsyncState";
import Modal from "@/components/Modal";
import PaginationFooter from "@/components/PaginationFooter";
import DashboardLayout from "@/layouts/DashboardLayout";
import PageHeader from "@/components/PageHeader";
import { Api } from "@/services/http";

type Student={id:string;name:string;email:string|null};
type Document={id:string;student_name:string;title:string;document_type:string;version:number;expires_at:string|null;accepted_at:string|null;archived_at:string|null;file:string|null};
type Page<T>={count:number;next:string|null;previous:string|null;results:T[]};
const field="h-11 rounded-xl border border-[var(--cfit-border)] bg-[var(--cfit-surface-elevated)] px-3 text-sm";
const unwrap=<T,>(data:T[]|Page<T>)=>Array.isArray(data)?data:data.results;

export default function Documents(){
  const [students,setStudents]=useState<Student[]>([]);
  const [data,setData]=useState<Page<Document>>({count:0,next:null,previous:null,results:[]});
  const [selected,setSelected]=useState(""),[search,setSearch]=useState(""),[status,setStatus]=useState(""),[type,setType]=useState(""),[page,setPage]=useState(1);
  const [loading,setLoading]=useState(true),[error,setError]=useState(false),[open,setOpen]=useState(false);
  const load=useCallback(async()=>{
    try{
      setLoading(true);setError(false);
      const [studentResponse,documentResponse]=await Promise.all([
        Api.get("/students/"),
        Api.get<Page<Document>>("/operations/documents/",{params:{search:search||undefined,status:status||undefined,document_type:type||undefined,page}}),
      ]);
      setStudents(unwrap(studentResponse.data));setData(documentResponse.data);
    }catch{setError(true)}finally{setLoading(false)}
  },[page,search,status,type]);
  useEffect(()=>{void load()},[load]);

  async function create(event:FormEvent<HTMLFormElement>){
    event.preventDefault();const form=new FormData(event.currentTarget);
    await Api.post("/operations/documents/",Object.fromEntries(form));
    event.currentTarget.reset();setSelected("");setOpen(false);toast.success("Documento registrado e disponibilizado no portal.");await load();
  }
  async function createPortal(){
    const student=students.find(item=>item.id===selected);if(!student)return;
    const email=prompt("E-mail de acesso:",student.email||"");const password=prompt("Senha inicial com ao menos 8 caracteres:");if(!email||!password)return;
    await Api.post(`/users/portal/students/${student.id}/access/`,{email,password});toast.success("Acesso do portal criado.");
  }
  async function renew(item:Document){
    const expires_at=prompt("Nova validade (AAAA-MM-DD), ou deixe vazio:",item.expires_at||"");
    await Api.post(`/operations/documents/${item.id}/renew/`,{expires_at:expires_at||null});toast.success("Nova versão criada sem alterar o aceite anterior.");await load();
  }
  async function archive(item:Document){
    const reason=prompt("Motivo do arquivamento:");if(!reason)return;
    await Api.post(`/operations/documents/${item.id}/archive/`,{reason});toast.success("Documento arquivado.");await load();
  }
  async function download(item:Document){
    const response=await Api.get(`/operations/documents/${item.id}/download/`,{responseType:"blob"});
    const url=URL.createObjectURL(response.data);const link=document.createElement("a");link.href=url;link.download=item.file?.split("/").pop()||item.title;link.click();URL.revokeObjectURL(url);
  }

  return <DashboardLayout><div className="space-y-5">
    <PageHeader title="Documentos e portal" subtitle="Versões, validade, aceite imutável e acesso autorizado do aluno." actions={<button onClick={()=>setOpen(true)} className="cfit-primary-button"><Plus size={16}/>Novo documento</button>}/>
    <section className="rounded-2xl border border-[var(--cfit-border)] bg-[var(--cfit-surface-primary)]">
      <div className="grid gap-3 border-b border-[var(--cfit-border)] p-4 sm:grid-cols-3">
        <label className="relative"><Search className="absolute left-3 top-3 text-[var(--cfit-text-tertiary)]" size={17}/><input value={search} onChange={event=>{setSearch(event.target.value);setPage(1)}} placeholder="Buscar documento ou aluno" className={`${field} w-full pl-10`}/></label>
        <select value={type} onChange={event=>{setType(event.target.value);setPage(1)}} className={field}><option value="">Todos os tipos</option><option value="contract">Contrato</option><option value="medical">Atestado</option><option value="authorization">Autorização</option><option value="other">Outro</option></select>
        <select value={status} onChange={event=>{setStatus(event.target.value);setPage(1)}} className={field}><option value="">Todas as situações</option><option value="pending">Aguardando aceite</option><option value="accepted">Aceitos</option><option value="archived">Arquivados</option></select>
      </div>
      {loading?<div className="p-5"><SkeletonState rows={5}/></div>:error?<div className="p-5"><ErrorState onRetry={load}/></div>:data.results.length===0?<div className="p-8"><EmptyState label="Nenhum documento" detail="Crie um documento ou ajuste os filtros."/></div>:<div className="cfit-record-list px-5">{data.results.map(item=><article key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-4 text-sm">
        <div><strong>{item.title}</strong><p className="mt-1 text-[var(--cfit-text-secondary)]">{item.student_name} · versão {item.version}{item.expires_at?` · vence ${new Date(`${item.expires_at}T12:00:00`).toLocaleDateString("pt-BR")}`:""}</p></div>
        <div className="flex flex-wrap items-center gap-2"><span className="cfit-status-chip">{item.archived_at?"Arquivado":item.accepted_at?"Aceito":"Aguardando aceite"}</span>{item.file&&<button onClick={()=>void download(item)} className="cfit-icon-button" aria-label={`Baixar ${item.title}`}><Download size={16}/></button>}{!item.archived_at&&<><button onClick={()=>void renew(item)} className="cfit-icon-button" aria-label={`Renovar ${item.title}`}><RefreshCw size={16}/></button><button onClick={()=>void archive(item)} className="cfit-icon-button" aria-label={`Arquivar ${item.title}`}><Archive size={16}/></button></>}</div>
      </article>)}</div>}
      <PaginationFooter count={data.count} label="documento(s)" hasPrevious={Boolean(data.previous)} hasNext={Boolean(data.next)} onPrevious={()=>setPage(value=>Math.max(1,value-1))} onNext={()=>setPage(value=>value+1)}/>
    </section>
    <Modal open={open} title="Novo documento" onClose={()=>setOpen(false)}><form onSubmit={create} className="grid gap-3 md:grid-cols-2">
      <select required name="student" value={selected} onChange={event=>setSelected(event.target.value)} className={field}><option value="">Selecione o aluno</option>{students.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select>
      <select name="document_type" className={field}><option value="contract">Contrato</option><option value="medical">Atestado</option><option value="authorization">Autorização</option><option value="other">Outro</option></select>
      <input required name="title" placeholder="Título do documento" className={field}/><input name="expires_at" type="date" className={field}/>
      <textarea name="content_snapshot" placeholder="Conteúdo ou termos apresentados ao aluno" className="min-h-28 rounded-xl border border-[var(--cfit-border)] bg-[var(--cfit-surface-elevated)] p-3 md:col-span-2"/>
      <label className="flex min-h-11 items-center gap-2 text-sm"><input name="requires_acceptance" value="true" type="checkbox" defaultChecked/>Exigir aceite do aluno</label>
      <div className="flex flex-wrap justify-end gap-2"><button type="button" disabled={!selected} onClick={createPortal} className="cfit-secondary-button">Criar acesso ao portal</button><button className="cfit-primary-button">Criar documento</button></div>
    </form></Modal>
  </div></DashboardLayout>;
}
