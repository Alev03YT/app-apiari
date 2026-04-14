import { useEffect, useMemo, useState } from "react";

const floweringOptions = [
  "Non indicata",
  "Acacia",
  "Castagno",
  "Millefiori",
  "Eucalipto",
  "Agrumi",
  "Sulla",
  "Girasole",
  "Erica",
  "Bosco",
  "Altro",
];

const apiaryStatusOptions = ["Non indicato", "Forte", "Medio", "Debole"];
const queenStatusOptions = ["Non indicato", "Presente", "Da controllare", "Da sostituire"];
const treatmentStatusOptions = ["Non indicato", "Fatto", "Da fare", "In corso"];
const honeyStatusOptions = [
  "Non indicato",
  "Melario presente",
  "Produzione bassa",
  "Produzione media",
  "Produzione alta",
];
const teamOptions = ["Tutti", "Squadra 1", "Squadra 2", "Squadra 3"];

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY;

function todayLocalDate() {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60000);
  return local.toISOString().slice(0, 10);
}

function getDistanceKm(a, b) {
  if (!a || !b) return null;
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const value =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return R * (2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value)));
}

function formatDistance(lat, lng, current) {
  const km = getDistanceKm(current, lat != null && lng != null ? { lat, lng } : null);
  if (km == null) return "";
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function badgeStyle(bg, color) {
  return {
    display: "inline-block",
    padding: "5px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 600,
    background: bg,
    color,
    border: "1px solid rgba(0,0,0,0.06)",
  };
}

function cardStyle(selected = false) {
  return {
    border: selected ? "2px solid #111827" : "1px solid #d1d5db",
    background: selected ? "#f3f4f6" : "#fff",
    borderRadius: 16,
    padding: 14,
    cursor: "pointer",
  };
}

function inputStyle() {
  return {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid #d1d5db",
    fontSize: 16,
    boxSizing: "border-box",
    background: "#fff",
  };
}

function sectionCard() {
  return {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 20,
    padding: 16,
    boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
  };
}

function buttonStyle(primary = true) {
  return {
    padding: "12px 14px",
    borderRadius: 12,
    border: primary ? "none" : "1px solid #d1d5db",
    background: primary ? "#111827" : "#fff",
    color: primary ? "#fff" : "#111827",
    fontWeight: 600,
    fontSize: 15,
    cursor: "pointer",
    minHeight: 46,
  };
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 900);

  useEffect(() => {
    function onResize() {
      setIsMobile(window.innerWidth < 900);
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return isMobile;
}

function getHeaders(extra = {}) {
  return {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    "Content-Type": "application/json",
    ...extra,
  };
}

function fromDb(row) {
  return {
    id: row.id,
    companyName: row.company_name || "",
    siteName: row.site_name || "",
    manualAddress: row.manual_address || "",
    hiveCount: row.hive_count,
    flowering: row.flowering || "Non indicata",
    accessType: row.access_type || "",
    lastVisit: row.last_visit || "",
    notes: row.notes || "",
    lat: row.lat,
    lng: row.lng,
    assignedTeam: row.assigned_team || "Tutti",
    apiaryStatus: row.apiary_status || "Non indicato",
    queenStatus: row.queen_status || "Non indicato",
    treatmentStatus: row.treatment_status || "Non indicato",
    lastTreatmentDate: row.last_treatment_date || "",
    treatmentNotes: row.treatment_notes || "",
    honeyStatus: row.honey_status || "Non indicato",
    honeyEstimate: row.honey_estimate || "",
    photo: row.photo || "",
    visitHistory: Array.isArray(row.visit_history) ? row.visit_history : [],
    updatedAt: row.updated_at || "",
  };
}

function toDb(item) {
  return {
    id: item.id,
    company_name: item.companyName || null,
    site_name: item.siteName || null,
    manual_address: item.manualAddress || null,
    hive_count: item.hiveCount ?? null,
    flowering: item.flowering || null,
    access_type: item.accessType || null,
    last_visit: item.lastVisit || null,
    notes: item.notes || null,
    lat: item.lat ?? null,
    lng: item.lng ?? null,
    assigned_team: item.assignedTeam || "Tutti",
    apiary_status: item.apiaryStatus || null,
    queen_status: item.queenStatus || null,
    treatment_status: item.treatmentStatus || null,
    last_treatment_date: item.lastTreatmentDate || null,
    treatment_notes: item.treatmentNotes || null,
    honey_status: item.honeyStatus || null,
    honey_estimate: item.honeyEstimate || null,
    photo: item.photo || null,
    visit_history: Array.isArray(item.visitHistory) ? item.visitHistory : [],
  };
}

async function fetchApiari() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/apiari?select=*&order=updated_at.desc`,
    {
      headers: getHeaders(),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Errore caricamento dati");
  }

  const data = await res.json();
  return data.map(fromDb);
}

async function insertApiario(item) {
  const payload = toDb(item);
  delete payload.id;

  const res = await fetch(`${SUPABASE_URL}/rest/v1/apiari`, {
    method: "POST",
    headers: getHeaders({
      Prefer: "return=representation",
    }),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Errore inserimento");
  }

  const data = await res.json();
  return data[0] ? fromDb(data[0]) : null;
}

async function updateApiario(item) {
  const payload = toDb(item);

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/apiari?id=eq.${encodeURIComponent(item.id)}`,
    {
      method: "PATCH",
      headers: getHeaders({
        Prefer: "return=representation",
      }),
      body: JSON.stringify(payload),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Errore aggiornamento");
  }

  const data = await res.json();
  return data[0] ? fromDb(data[0]) : null;
}

async function deleteApiario(id) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/apiari?id=eq.${encodeURIComponent(id)}`,
    {
      method: "DELETE",
      headers: getHeaders(),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Errore eliminazione");
  }
}

export default function App() {
  const isMobile = useIsMobile();

  const [records, setRecords] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("Pronto");
  const [currentPosition, setCurrentPosition] = useState(null);
  const [loading, setLoading] = useState(true);

  const [companyName, setCompanyName] = useState("");
  const [siteName, setSiteName] = useState("");
  const [manualAddress, setManualAddress] = useState("");
  const [hiveCount, setHiveCount] = useState("");
  const [flowering, setFlowering] = useState("Non indicata");
  const [accessType, setAccessType] = useState("");
  const [lastVisit, setLastVisit] = useState(todayLocalDate());
  const [notes, setNotes] = useState("");
  const [coords, setCoords] = useState(null);
  const [assignedTeam, setAssignedTeam] = useState("Tutti");

  const [apiaryStatus, setApiaryStatus] = useState("Non indicato");
  const [queenStatus, setQueenStatus] = useState("Non indicato");
  const [treatmentStatus, setTreatmentStatus] = useState("Non indicato");
  const [lastTreatmentDate, setLastTreatmentDate] = useState("");
  const [treatmentNotes, setTreatmentNotes] = useState("");
  const [honeyStatus, setHoneyStatus] = useState("Non indicato");
  const [honeyEstimate, setHoneyEstimate] = useState("");
  const [photo, setPhoto] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [sortMode, setSortMode] = useState("distance");
  const [saving, setSaving] = useState(false);

  const [quickVisitDate, setQuickVisitDate] = useState(todayLocalDate());
  const [quickVisitOperator, setQuickVisitOperator] = useState("");
  const [quickQueenSeen, setQuickQueenSeen] = useState(false);
  const [quickMelarioPresent, setQuickMelarioPresent] = useState(false);
  const [quickTreatmentDone, setQuickTreatmentDone] = useState(false);
  const [quickFeedDone, setQuickFeedDone] = useState(false);
  const [quickVisitNotes, setQuickVisitNotes] = useState("");

  async function loadRecords() {
    setLoading(true);
    try {
      const rows = await fetchApiari();
      setRecords(rows);
      setStatus("Dati sincronizzati.");
    } catch (err) {
      setStatus(`Errore caricamento: ${String(err.message || err)}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!SUPABASE_URL || !SUPABASE_KEY) {
      setStatus("Mancano le variabili ambiente di Supabase su Vercel.");
      setLoading(false);
      return;
    }
    loadRecords();
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrentPosition({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      () => {}
    );
  }, []);

  const selectedRecord = records.find((r) => r.id === selectedId) || null;

  const filteredRecords = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = [...records];

    if (q) {
      list = list.filter((item) =>
        [
          item.companyName,
          item.siteName,
          item.manualAddress,
          item.flowering,
          item.accessType,
          item.notes,
          item.apiaryStatus,
          item.queenStatus,
          item.treatmentStatus,
          item.treatmentNotes,
          item.honeyStatus,
          item.assignedTeam,
          ...(item.visitHistory || []).map((v) => `${v.operator} ${v.summary} ${v.notes}`),
        ]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q))
      );
    }

    if (sortMode === "distance" && currentPosition) {
      list.sort((a, b) => {
        const da = getDistanceKm(
          currentPosition,
          a.lat != null && a.lng != null ? { lat: a.lat, lng: a.lng } : null
        );
        const db = getDistanceKm(
          currentPosition,
          b.lat != null && b.lng != null ? { lat: b.lat, lng: b.lng } : null
        );
        if (da == null && db == null) return (a.companyName || "").localeCompare(b.companyName || "");
        if (da == null) return 1;
        if (db == null) return -1;
        return da - db;
      });
    } else if (sortMode === "name") {
      list.sort((a, b) => (a.companyName || "").localeCompare(b.companyName || ""));
    } else if (sortMode === "visit") {
      list.sort((a, b) => String(b.lastVisit || "").localeCompare(String(a.lastVisit || "")));
    }

    return list;
  }, [records, search, sortMode, currentPosition]);

  function resetForm() {
    setCompanyName("");
    setSiteName("");
    setManualAddress("");
    setHiveCount("");
    setFlowering("Non indicata");
    setAccessType("");
    setLastVisit(todayLocalDate());
    setNotes("");
    setCoords(null);
    setAssignedTeam("Tutti");
    setApiaryStatus("Non indicato");
    setQueenStatus("Non indicato");
    setTreatmentStatus("Non indicato");
    setLastTreatmentDate("");
    setTreatmentNotes("");
    setHoneyStatus("Non indicato");
    setHoneyEstimate("");
    setPhoto("");
    setEditingId(null);
  }

  function resetQuickVisit() {
    setQuickVisitDate(todayLocalDate());
    setQuickVisitOperator("");
    setQuickQueenSeen(false);
    setQuickMelarioPresent(false);
    setQuickTreatmentDone(false);
    setQuickFeedDone(false);
    setQuickVisitNotes("");
  }

  function detectPosition() {
    if (!navigator.geolocation) {
      setStatus("Geolocalizzazione non disponibile.");
      return;
    }

    setStatus("Rilevo la posizione attuale...");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const found = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setCoords(found);
        setCurrentPosition(found);
        setStatus("Posizione salvata correttamente.");
      },
      () => {
        setStatus("Non sono riuscito a rilevare la posizione.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function onPhotoSelected(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setPhoto(dataUrl);
      setStatus("Foto caricata.");
    } catch {
      setStatus("Errore nel caricamento foto.");
    }
  }

  async function saveRecord() {
    if (!companyName.trim()) {
      setStatus("Inserisci il nome dell'azienda.");
      return;
    }
    if (!coords && !manualAddress.trim()) {
      setStatus("Salva la posizione GPS oppure inserisci un indirizzo.");
      return;
    }

    const existingHistory = editingId
      ? records.find((rec) => rec.id === editingId)?.visitHistory || []
      : [];

    const item = {
      id: editingId || crypto.randomUUID(),
      companyName: companyName.trim(),
      siteName: siteName.trim(),
      manualAddress: manualAddress.trim(),
      hiveCount: hiveCount ? Number(hiveCount) : null,
      flowering,
      accessType: accessType.trim(),
      lastVisit,
      notes: notes.trim(),
      lat: coords?.lat ?? null,
      lng: coords?.lng ?? null,
      assignedTeam,
      apiaryStatus,
      queenStatus,
      treatmentStatus,
      lastTreatmentDate,
      treatmentNotes: treatmentNotes.trim(),
      honeyStatus,
      honeyEstimate: honeyEstimate.trim(),
      photo,
      visitHistory: existingHistory,
      updatedAt: new Date().toISOString(),
    };

    setSaving(true);
    try {
      let saved;
      if (editingId) {
        saved = await updateApiario(item);
        setStatus("Scheda aggiornata e sincronizzata.");
      } else {
        saved = await insertApiario(item);
        setStatus("Azienda salvata e sincronizzata.");
      }

      await loadRecords();
      if (saved?.id) setSelectedId(saved.id);
      resetForm();
    } catch (err) {
      setStatus(`Errore salvataggio: ${String(err.message || err)}`);
    } finally {
      setSaving(false);
    }
  }

  function editRecord(item) {
    setEditingId(item.id);
    setCompanyName(item.companyName || "");
    setSiteName(item.siteName || "");
    setManualAddress(item.manualAddress || "");
    setHiveCount(item.hiveCount != null ? String(item.hiveCount) : "");
    setFlowering(item.flowering || "Non indicata");
    setAccessType(item.accessType || "");
    setLastVisit(item.lastVisit || todayLocalDate());
    setNotes(item.notes || "");
    setCoords(item.lat != null && item.lng != null ? { lat: item.lat, lng: item.lng } : null);
    setAssignedTeam(item.assignedTeam || "Tutti");
    setApiaryStatus(item.apiaryStatus || "Non indicato");
    setQueenStatus(item.queenStatus || "Non indicato");
    setTreatmentStatus(item.treatmentStatus || "Non indicato");
    setLastTreatmentDate(item.lastTreatmentDate || "");
    setTreatmentNotes(item.treatmentNotes || "");
    setHoneyStatus(item.honeyStatus || "Non indicato");
    setHoneyEstimate(item.honeyEstimate || "");
    setPhoto(item.photo || "");
    setStatus("Stai modificando la scheda selezionata.");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDeleteRecord(id) {
    try {
      await deleteApiario(id);
      if (selectedId === id) setSelectedId("");
      setStatus("Azienda eliminata.");
      await loadRecords();
    } catch (err) {
      setStatus(`Errore eliminazione: ${String(err.message || err)}`);
    }
  }

  function buildQuickVisitRecord() {
    const parts = [];
    if (quickQueenSeen) parts.push("Regina presente");
    if (quickMelarioPresent) parts.push("Melario presente");
    if (quickTreatmentDone) parts.push("Trattamento fatto");
    if (quickFeedDone) parts.push("Nutrizione fatta");
    if (quickVisitNotes.trim()) parts.push(quickVisitNotes.trim());

    return {
      id: crypto.randomUUID(),
      date: quickVisitDate,
      operator: quickVisitOperator.trim(),
      summary: parts.join(" • ") || "Visita registrata",
      queenSeen: quickQueenSeen,
      melarioPresent: quickMelarioPresent,
      treatmentDone: quickTreatmentDone,
      feedDone: quickFeedDone,
      notes: quickVisitNotes.trim(),
      createdAt: new Date().toISOString(),
    };
  }

  async function addQuickVisit() {
    if (!selectedRecord) {
      setStatus("Seleziona prima un'azienda.");
      return;
    }

    const newVisit = buildQuickVisitRecord();

    const updated = {
      ...selectedRecord,
      lastVisit: quickVisitDate,
      queenStatus: quickQueenSeen ? "Presente" : selectedRecord.queenStatus,
      treatmentStatus: quickTreatmentDone ? "Fatto" : selectedRecord.treatmentStatus,
      lastTreatmentDate: quickTreatmentDone ? quickVisitDate : selectedRecord.lastTreatmentDate,
      honeyStatus: quickMelarioPresent ? "Melario presente" : selectedRecord.honeyStatus,
      visitHistory: [newVisit, ...(selectedRecord.visitHistory || [])],
    };

    try {
      await updateApiario(updated);
      resetQuickVisit();
      setStatus("Visita rapida registrata.");
      await loadRecords();
      setSelectedId(updated.id);
    } catch (err) {
      setStatus(`Errore visita rapida: ${String(err.message || err)}`);
    }
  }

  async function removeVisit(visitId) {
    if (!selectedRecord) return;

    const updated = {
      ...selectedRecord,
      visitHistory: (selectedRecord.visitHistory || []).filter((visit) => visit.id !== visitId),
    };

    try {
      await updateApiario(updated);
      setStatus("Voce storico eliminata.");
      await loadRecords();
      setSelectedId(updated.id);
    } catch (err) {
      setStatus(`Errore storico: ${String(err.message || err)}`);
    }
  }

  function openRoute(provider) {
    if (!selectedRecord) {
      setStatus("Seleziona prima un'azienda.");
      return;
    }

    let url = "";
    if (selectedRecord.lat != null && selectedRecord.lng != null) {
      url =
        provider === "waze"
          ? `https://waze.com/ul?ll=${selectedRecord.lat},${selectedRecord.lng}&navigate=yes`
          : `https://www.google.com/maps/dir/?api=1&destination=${selectedRecord.lat},${selectedRecord.lng}&travelmode=driving`;
    } else if (selectedRecord.manualAddress) {
      url =
        provider === "waze"
          ? `https://waze.com/ul?q=${encodeURIComponent(selectedRecord.manualAddress)}&navigate=yes`
          : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(selectedRecord.manualAddress)}&travelmode=driving`;
    }

    if (!url) {
      setStatus("Nessuna destinazione valida.");
      return;
    }

    window.open(url, "_blank");
  }

  function exportBackup() {
    const blob = new Blob([JSON.stringify(records, null, 2)], {
      type: "application/json",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "backup-aziende-apiari.json";
    link.click();
    URL.revokeObjectURL(link.href);
    setStatus("Backup esportato.");
  }

  async function importBackup(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (!Array.isArray(parsed)) throw new Error("Formato non valido");

        for (const item of parsed) {
          const normalized = {
            ...item,
            id: item.id || crypto.randomUUID(),
          };
          await updateApiario(normalized).catch(async () => {
            await insertApiario(normalized);
          });
        }

        await loadRecords();
        setStatus("Backup importato correttamente.");
      } catch {
        setStatus("Il file selezionato non è valido.");
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        padding: isMobile ? 10 : 16,
        fontFamily: "Arial, sans-serif",
        color: "#111827",
      }}
    >
      <div style={{ maxWidth: 1300, margin: "0 auto", display: "grid", gap: 16 }}>
        <div style={sectionCard()}>
          <h1 style={{ margin: 0, fontSize: isMobile ? 24 : 30 }}>Gestione aziende e apiari</h1>
          <p style={{ color: "#6b7280", marginTop: 8, fontSize: isMobile ? 14 : 16 }}>
            Scheda azienda completa, check rapido visita, storico e navigazione diretta.
          </p>

          <div
            style={{
              display: "grid",
              gap: 12,
              gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(220px, 1fr))",
              marginTop: 16,
            }}
          >
            <div>
              <label>Nome azienda</label>
              <input style={inputStyle()} value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
            </div>

            <div>
              <label>Nome postazione / apiario</label>
              <input style={inputStyle()} value={siteName} onChange={(e) => setSiteName(e.target.value)} />
            </div>

            <div>
              <label>Numero arnie</label>
              <input
                style={inputStyle()}
                type="number"
                value={hiveCount}
                onChange={(e) => setHiveCount(e.target.value)}
              />
            </div>

            <div>
              <label>Squadra assegnata</label>
              <select style={inputStyle()} value={assignedTeam} onChange={(e) => setAssignedTeam(e.target.value)}>
                {teamOptions.map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label>Indirizzo manuale</label>
              <input style={inputStyle()} value={manualAddress} onChange={(e) => setManualAddress(e.target.value)} />
            </div>

            <div>
              <label>Fioritura</label>
              <select style={inputStyle()} value={flowering} onChange={(e) => setFlowering(e.target.value)}>
                {floweringOptions.map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </div>

            <div>
              <label>Ultima visita</label>
              <input style={inputStyle()} type="date" value={lastVisit} onChange={(e) => setLastVisit(e.target.value)} />
            </div>

            <div>
              <label>Accesso</label>
              <input style={inputStyle()} value={accessType} onChange={(e) => setAccessType(e.target.value)} />
            </div>

            <div>
              <label>Stato apiario</label>
              <select style={inputStyle()} value={apiaryStatus} onChange={(e) => setApiaryStatus(e.target.value)}>
                {apiaryStatusOptions.map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </div>

            <div>
              <label>Stato regina</label>
              <select style={inputStyle()} value={queenStatus} onChange={(e) => setQueenStatus(e.target.value)}>
                {queenStatusOptions.map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </div>

            <div>
              <label>Trattamenti</label>
              <select style={inputStyle()} value={treatmentStatus} onChange={(e) => setTreatmentStatus(e.target.value)}>
                {treatmentStatusOptions.map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </div>

            <div>
              <label>Data ultimo trattamento</label>
              <input
                style={inputStyle()}
                type="date"
                value={lastTreatmentDate}
                onChange={(e) => setLastTreatmentDate(e.target.value)}
              />
            </div>

            <div>
              <label>Produzione</label>
              <select style={inputStyle()} value={honeyStatus} onChange={(e) => setHoneyStatus(e.target.value)}>
                {honeyStatusOptions.map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </div>

            <div>
              <label>Stima produzione / melari</label>
              <input style={inputStyle()} value={honeyEstimate} onChange={(e) => setHoneyEstimate(e.target.value)} />
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label>Note trattamenti</label>
              <textarea
                style={{ ...inputStyle(), minHeight: 90 }}
                value={treatmentNotes}
                onChange={(e) => setTreatmentNotes(e.target.value)}
              />
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label>Note operative</label>
              <textarea
                style={{ ...inputStyle(), minHeight: 100 }}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div
              style={{
                gridColumn: "1 / -1",
                display: "grid",
                gap: 10,
                gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(auto-fit, minmax(160px, 1fr))",
              }}
            >
              <button style={buttonStyle(false)} onClick={detectPosition}>Usa posizione</button>
              <label style={{ ...buttonStyle(false), display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                Carica foto
                <input type="file" accept="image/*" hidden onChange={onPhotoSelected} />
              </label>
              <button style={buttonStyle(true)} onClick={saveRecord} disabled={saving}>
                {saving ? "Salvataggio..." : editingId ? "Aggiorna" : "Salva"}
              </button>
              <button style={buttonStyle(false)} onClick={resetForm}>Pulisci</button>
              <button style={buttonStyle(false)} onClick={exportBackup}>Backup</button>
              <label style={{ ...buttonStyle(false), display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                Importa
                <input type="file" accept="application/json" hidden onChange={importBackup} />
              </label>
            </div>

            {coords && (
              <div style={{ gridColumn: "1 / -1", color: "#374151", fontSize: 14 }}>
                Coordinate rilevate: {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
              </div>
            )}

            {photo && (
              <div style={{ gridColumn: "1 / -1" }}>
                <img
                  src={photo}
                  alt="Foto postazione"
                  style={{ width: "100%", maxHeight: 260, objectFit: "cover", borderRadius: 16 }}
                />
              </div>
            )}
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gap: 16,
            gridTemplateColumns: isMobile ? "1fr" : "minmax(320px, 0.95fr) minmax(320px, 1.05fr)",
          }}
        >
          <div style={sectionCard()}>
            <h2 style={{ marginTop: 0, fontSize: isMobile ? 22 : 24 }}>Elenco aziende</h2>

            <div style={{ display: "grid", gap: 10, marginBottom: 12 }}>
              <input
                style={inputStyle()}
                placeholder="Cerca azienda, squadra, trattamenti, regina, note..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <select style={inputStyle()} value={sortMode} onChange={(e) => setSortMode(e.target.value)}>
                <option value="distance">Ordina per distanza</option>
                <option value="name">Ordina per nome</option>
                <option value="visit">Ordina per ultima visita</option>
              </select>
              <button style={buttonStyle(false)} onClick={loadRecords}>
                {loading ? "Caricamento..." : "Aggiorna dati"}
              </button>
            </div>

            <div style={{ display: "grid", gap: 10, maxHeight: isMobile ? "none" : 700, overflow: "auto" }}>
              {loading ? (
                <div style={{ ...cardStyle(false), textAlign: "center", color: "#6b7280" }}>
                  Caricamento dati...
                </div>
              ) : filteredRecords.length === 0 ? (
                <div style={{ ...cardStyle(false), textAlign: "center", color: "#6b7280" }}>
                  Nessuna azienda salvata.
                </div>
              ) : (
                filteredRecords.map((item) => (
                  <div
                    key={item.id}
                    style={cardStyle(selectedId === item.id)}
                    onClick={() => setSelectedId(item.id)}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                      <div>
                        <div style={{ fontWeight: 700 }}>{item.companyName}</div>
                        {item.siteName ? (
                          <div style={{ fontSize: 14, color: "#4b5563", marginTop: 4 }}>{item.siteName}</div>
                        ) : null}
                      </div>

                      <div style={{ textAlign: "right" }}>
                        {item.lat != null && item.lng != null ? (
                          <div style={{ fontSize: 12, color: "#6b7280" }}>
                            {formatDistance(item.lat, item.lng, currentPosition)}
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                      <span style={badgeStyle("#eef2ff", "#3730a3")}>Azienda</span>
                      {item.assignedTeam ? <span style={badgeStyle("#ecfeff", "#155e75")}>{item.assignedTeam}</span> : null}
                      {item.hiveCount != null ? (
                        <span style={badgeStyle("#f9fafb", "#111827")}>{item.hiveCount} arnie</span>
                      ) : null}
                      {item.apiaryStatus && item.apiaryStatus !== "Non indicato" ? (
                        <span style={badgeStyle("#fef3c7", "#92400e")}>{item.apiaryStatus}</span>
                      ) : null}
                    </div>

                    {item.manualAddress ? (
                      <div style={{ marginTop: 8, fontSize: 13, color: "#6b7280", wordBreak: "break-word" }}>
                        {item.manualAddress}
                      </div>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </div>

          <div style={{ display: "grid", gap: 16 }}>
            <div style={sectionCard()}>
              <h2 style={{ marginTop: 0, fontSize: isMobile ? 22 : 24 }}>Scheda azienda</h2>

              {!selectedRecord ? (
                <div style={{ color: "#6b7280" }}>Seleziona un’azienda dall’elenco.</div>
              ) : (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                    <div>
                      <div style={{ fontSize: isMobile ? 22 : 24, fontWeight: 700 }}>{selectedRecord.companyName}</div>
                      {selectedRecord.siteName ? (
                        <div style={{ color: "#4b5563", marginTop: 4 }}>{selectedRecord.siteName}</div>
                      ) : null}
                    </div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <span style={badgeStyle("#eef2ff", "#3730a3")}>Azienda</span>
                      <span style={badgeStyle("#ecfeff", "#155e75")}>
                        {selectedRecord.assignedTeam || "Tutti"}
                      </span>
                    </div>
                  </div>

                  {selectedRecord.photo ? (
                    <img
                      src={selectedRecord.photo}
                      alt="Foto azienda"
                      style={{ width: "100%", maxHeight: 260, objectFit: "cover", borderRadius: 16, marginTop: 14 }}
                    />
                  ) : null}

                  <div
                    style={{
                      display: "grid",
                      gap: 10,
                      gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(180px, 1fr))",
                      marginTop: 14,
                    }}
                  >
                    <div style={cardStyle(false)}><b>Arnie</b><div style={{ marginTop: 6 }}>{selectedRecord.hiveCount ?? "Non indicato"}</div></div>
                    <div style={cardStyle(false)}><b>Fioritura</b><div style={{ marginTop: 6 }}>{selectedRecord.flowering || "Non indicata"}</div></div>
                    <div style={cardStyle(false)}><b>Stato apiario</b><div style={{ marginTop: 6 }}>{selectedRecord.apiaryStatus || "Non indicato"}</div></div>
                    <div style={cardStyle(false)}><b>Regina</b><div style={{ marginTop: 6 }}>{selectedRecord.queenStatus || "Non indicato"}</div></div>
                    <div style={cardStyle(false)}><b>Accesso</b><div style={{ marginTop: 6 }}>{selectedRecord.accessType || "Non indicato"}</div></div>
                    <div style={cardStyle(false)}><b>Ultima visita</b><div style={{ marginTop: 6 }}>{selectedRecord.lastVisit || "Non indicata"}</div></div>
                    <div style={cardStyle(false)}>
                      <b>Trattamenti</b>
                      <div style={{ marginTop: 6 }}>{selectedRecord.treatmentStatus || "Non indicato"}</div>
                      {selectedRecord.lastTreatmentDate ? (
                        <div style={{ marginTop: 4, fontSize: 13, color: "#6b7280" }}>
                          Ultimo: {selectedRecord.lastTreatmentDate}
                        </div>
                      ) : null}
                    </div>
                    <div style={cardStyle(false)}>
                      <b>Produzione</b>
                      <div style={{ marginTop: 6 }}>{selectedRecord.honeyStatus || "Non indicato"}</div>
                      {selectedRecord.honeyEstimate ? (
                        <div style={{ marginTop: 4, fontSize: 13, color: "#6b7280" }}>
                          {selectedRecord.honeyEstimate}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {selectedRecord.manualAddress ? (
                    <div style={{ ...cardStyle(false), marginTop: 12, wordBreak: "break-word" }}>
                      <b>Indirizzo</b>
                      <div style={{ marginTop: 6 }}>{selectedRecord.manualAddress}</div>
                    </div>
                  ) : null}

                  {selectedRecord.lat != null && selectedRecord.lng != null ? (
                    <div style={{ ...cardStyle(false), marginTop: 12 }}>
                      <b>Coordinate GPS</b>
                      <div style={{ marginTop: 6 }}>
                        {selectedRecord.lat.toFixed(6)}, {selectedRecord.lng.toFixed(6)}
                      </div>
                    </div>
                  ) : null}

                  {selectedRecord.treatmentNotes ? (
                    <div style={{ ...cardStyle(false), marginTop: 12 }}>
                      <b>Note trattamenti</b>
                      <div style={{ marginTop: 6, whiteSpace: "pre-wrap" }}>{selectedRecord.treatmentNotes}</div>
                    </div>
                  ) : null}

                  {selectedRecord.notes ? (
                    <div style={{ ...cardStyle(false), marginTop: 12 }}>
                      <b>Note operative</b>
                      <div style={{ marginTop: 6, whiteSpace: "pre-wrap" }}>{selectedRecord.notes}</div>
                    </div>
                  ) : null}

                  <div
                    style={{
                      display: "grid",
                      gap: 10,
                      gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, minmax(0, 1fr))",
                      marginTop: 14,
                    }}
                  >
                    <button style={buttonStyle(true)} onClick={() => openRoute("google")}>Maps</button>
                    <button style={buttonStyle(false)} onClick={() => openRoute("waze")}>Waze</button>
                    <button style={buttonStyle(false)} onClick={() => editRecord(selectedRecord)}>Modifica</button>
                    <button style={buttonStyle(false)} onClick={() => handleDeleteRecord(selectedRecord.id)}>Elimina</button>
                  </div>
                </>
              )}
            </div>

            <div style={sectionCard()}>
              <h2 style={{ marginTop: 0, fontSize: isMobile ? 22 : 24 }}>Check rapido visita</h2>

              {!selectedRecord ? (
                <div style={{ color: "#6b7280" }}>Seleziona un’azienda per registrare una visita rapida.</div>
              ) : (
                <>
                  <div
                    style={{
                      display: "grid",
                      gap: 10,
                      gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(180px, 1fr))",
                    }}
                  >
                    <div>
                      <label>Data visita</label>
                      <input
                        style={inputStyle()}
                        type="date"
                        value={quickVisitDate}
                        onChange={(e) => setQuickVisitDate(e.target.value)}
                      />
                    </div>
                    <div>
                      <label>Operatore</label>
                      <input
                        style={inputStyle()}
                        value={quickVisitOperator}
                        onChange={(e) => setQuickVisitOperator(e.target.value)}
                      />
                    </div>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gap: 10,
                      gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(180px, 1fr))",
                      marginTop: 12,
                    }}
                  >
                    <label style={cardStyle(false)}>
                      <input
                        type="checkbox"
                        checked={quickQueenSeen}
                        onChange={(e) => setQuickQueenSeen(e.target.checked)}
                      />{" "}
                      Regina presente
                    </label>

                    <label style={cardStyle(false)}>
                      <input
                        type="checkbox"
                        checked={quickMelarioPresent}
                        onChange={(e) => setQuickMelarioPresent(e.target.checked)}
                      />{" "}
                      Melario presente
                    </label>

                    <label style={cardStyle(false)}>
                      <input
                        type="checkbox"
                        checked={quickTreatmentDone}
                        onChange={(e) => setQuickTreatmentDone(e.target.checked)}
                      />{" "}
                      Trattamento fatto
                    </label>

                    <label style={cardStyle(false)}>
                      <input
                        type="checkbox"
                        checked={quickFeedDone}
                        onChange={(e) => setQuickFeedDone(e.target.checked)}
                      />{" "}
                      Nutrizione fatta
                    </label>
                  </div>

                  <div style={{ marginTop: 12 }}>
                    <label>Nota veloce</label>
                    <textarea
                      style={{ ...inputStyle(), minHeight: 90 }}
                      value={quickVisitNotes}
                      onChange={(e) => setQuickVisitNotes(e.target.value)}
                    />
                  </div>

                  <div style={{ marginTop: 12 }}>
                    <button style={{ ...buttonStyle(true), width: "100%" }} onClick={addQuickVisit}>
                      Registra visita rapida
                    </button>
                  </div>
                </>
              )}
            </div>

            <div style={sectionCard()}>
              <h2 style={{ marginTop: 0, fontSize: isMobile ? 22 : 24 }}>Storico visite</h2>

              {!selectedRecord ? (
                <div style={{ color: "#6b7280" }}>Seleziona un’azienda per vedere lo storico.</div>
              ) : (selectedRecord.visitHistory || []).length === 0 ? (
                <div style={{ color: "#6b7280" }}>Nessuna visita registrata.</div>
              ) : (
                <div style={{ display: "grid", gap: 10, maxHeight: isMobile ? "none" : 350, overflow: "auto" }}>
                  {(selectedRecord.visitHistory || []).map((visit) => (
                    <div key={visit.id} style={cardStyle(false)}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                        <div>
                          <div style={{ fontWeight: 700 }}>{visit.date || "Data non indicata"}</div>
                          {visit.operator ? (
                            <div style={{ color: "#6b7280", fontSize: 13, marginTop: 4 }}>
                              Operatore: {visit.operator}
                            </div>
                          ) : null}
                        </div>
                        <button style={buttonStyle(false)} onClick={() => removeVisit(visit.id)}>Elimina</button>
                      </div>
                      <div style={{ marginTop: 8 }}>{visit.summary}</div>
                      {visit.notes ? (
                        <div style={{ marginTop: 8, color: "#6b7280", whiteSpace: "pre-wrap" }}>{visit.notes}</div>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div style={sectionCard()}>
          <b>Stato:</b> <span>{status}</span>
        </div>
      </div>
    </div>
  );
}
