import { useState, useEffect } from "react";

export default function App(){
const [aziende,setAziende]=useState([]);
const [nome,setNome]=useState("");
const [note,setNote]=useState("");

useEffect(()=>{
const saved=localStorage.getItem("apiari");
if(saved) setAziende(JSON.parse(saved));
},[]);

useEffect(()=>{
localStorage.setItem("apiari",JSON.stringify(aziende));
},[aziende]);

function salva(){
if(!nome) return;
setAziende([...aziende,{id:Date.now(),nome,note}]);
setNome(""); setNote("");
}

function elimina(id){
setAziende(aziende.filter(a=>a.id!==id));
}

return(
<div style={{padding:20,fontFamily:"Arial"}}>
<h1>Gestione Apiari</h1>

<input placeholder="Nome azienda" value={nome} onChange={e=>setNome(e.target.value)} />
<br/><br/>
<textarea placeholder="Note" value={note} onChange={e=>setNote(e.target.value)} />
<br/><br/>

<button onClick={salva}>Salva</button>

<hr/>

{aziende.map(a=>(
<div key={a.id} style={{border:"1px solid #ccc",padding:10,marginTop:10}}>
<b>{a.nome}</b>
<p>{a.note}</p>
<button onClick={()=>elimina(a.id)}>Elimina</button>
</div>
))}
</div>
);
}