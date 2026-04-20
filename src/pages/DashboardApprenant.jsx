import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  TrendingUp, Clock, Calendar, CheckCircle2, FileDown, Loader2, User as UserIcon, Award, AlertTriangle
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function DashboardApprenant() {
  const { id } = useParams();
  const dashboardRef = useRef(null);
  
  const [loading, setLoading] = useState(true);
  const [apprenant, setApprenant] = useState(null);
  const [stats, setStats] = useState({
    totalHeures: 0,
    objectifHeures: 150, // Par défaut
    seancesEffectuees: 0,
    tauxPresence: 0,
    progression: 0
  });
  const [activites, setActivites] = useState([]);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: profile, error: pError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();
      if (pError) throw pError;
      setApprenant(profile);

      // NOUVEAU : Récupérer l'objectif d'heures du groupe
      const { data: grpData } = await supabase
        .from('groupes_apprenants')
        .select('groupes(objectif_heures)')
        .eq('apprenant_id', id)
        .limit(1)
        .maybeSingle();
      
      const objectif = grpData?.groupes?.objectif_heures || 150;

      const { data: presences, error: prError } = await supabase
        .from('presences')
        .select('status, heures_validees, seances (title, date, start_time, end_time)')
        .eq('apprenant_id', id)
        .order('seances(date)', { ascending: false });

      if (prError) throw prError;

      const totalH = presences.reduce((acc, p) => acc + (parseFloat(p.heures_validees) || 0), 0);
      const presents = presences.filter(p => p.status === 'present').length;
      const taux = presences.length > 0 ? (presents / presences.length) * 100 : 0;
      const progressionCalculated = Math.min(100, (totalH / objectif) * 100);

      setStats({
        totalHeures: totalH,
        objectifHeures: objectif,
        seancesEffectuees: presents,
        tauxPresence: Math.round(taux),
        progression: Math.round(progressionCalculated)
      });
      setActivites(presences);

    } catch (err) {
      console.error("Erreur Dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  const exportToPDF = async () => {
    if (!dashboardRef.current) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(dashboardRef.current, { scale: 2, useCORS: true, logging: false, backgroundColor: '#f9fafb' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Bilan_Formation_${apprenant.last_name}_${format(new Date(), 'dd_MM_yyyy')}.pdf`);
    } catch (error) {
      console.error("Erreur export PDF:", error);
    } finally {
      setIsExporting(false);
    }
  };

  if (loading) return <div className="h-96 flex items-center justify-center"><Loader2 className="h-12 w-12 text-brand-600 animate-spin" /></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Tableau de Bord Personnel</h1>
        <button onClick={exportToPDF} disabled={isExporting} className="flex items-center px-5 py-2.5 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-all shadow-sm disabled:opacity-50">
          {isExporting ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <FileDown className="h-5 w-5 mr-2 text-brand-600" />}
          Exporter le bilan PDF
        </button>
      </div>

      <div ref={dashboardRef} className="space-y-8 p-4 rounded-3xl">
        <div className="bg-gradient-to-r from-brand-600 to-purple-700 rounded-3xl p-8 text-white shadow-xl shadow-brand-100 flex flex-col md:flex-row items-center gap-8">
          <div className="h-24 w-24 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-inner">
            <UserIcon className="h-12 w-12 text-white" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-3xl font-black">{apprenant.first_name} {apprenant.last_name.toUpperCase()}</h2>
            <p className="text-brand-100 font-medium mt-1">Dispositif LesPassClé • Session 2024</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 text-center min-w-[150px]">
            <p className="text-sm font-bold text-brand-100 uppercase tracking-widest">Évolution</p>
            <p className="text-4xl font-black mt-1">{stats.progression}%</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><Clock className="h-6 w-6" /></div>
            <div><p className="text-sm font-bold text-gray-500 uppercase">Heures validées</p><p className="text-2xl font-black text-gray-900">{stats.totalHeures}h</p></div>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-green-50 text-green-600 rounded-2xl"><CheckCircle2 className="h-6 w-6" /></div>
            <div><p className="text-sm font-bold text-gray-500 uppercase">Séances réalisées</p><p className="text-2xl font-black text-gray-900">{stats.seancesEffectuees}</p></div>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl"><Award className="h-6 w-6" /></div>
            <div><p className="text-sm font-bold text-gray-500 uppercase">Taux d'assiduité</p><p className="text-2xl font-black text-gray-900">{stats.tauxPresence}%</p></div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center"><Calendar className="h-5 w-5 mr-2 text-brand-600" /> Historique des ateliers & séances</h3>
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Atelier / Séance</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase">Statut</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase">Heures</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {activites.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4"><p className="font-bold text-gray-900 text-sm">{item.seances.title}</p></td>
                      <td className="px-6 py-4 text-sm text-gray-500">{format(parseISO(item.seances.date), 'dd MMM yyyy', { locale: fr })}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${item.status === 'present' ? 'bg-green-100 text-green-700' : item.status === 'absent' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>{item.status}</span>
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-gray-900 text-sm">{item.heures_validees}h</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center"><TrendingUp className="h-5 w-5 mr-2 text-brand-600" /> Progression Formation</h3>
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center justify-center">
              <div className="relative h-40 w-40 flex items-center justify-center">
                <svg className="h-full w-full transform -rotate-90">
                  <circle cx="80" cy="80" r="70" fill="transparent" stroke="#f3f4f6" strokeWidth="12" />
                  <circle cx="80" cy="80" r="70" fill="transparent" stroke="#006eb8" strokeWidth="12" strokeDasharray={440} strokeDashoffset={440 - (440 * stats.progression) / 100} strokeLinecap="round" className="transition-all duration-1000 ease-out" />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-4xl font-black text-gray-900">{stats.progression}%</span>
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Objectif</span>
                </div>
              </div>
              <div className="mt-8 space-y-4 w-full">
                <div className="flex justify-between items-end">
                  <div><p className="text-xs font-bold text-gray-400 uppercase">Cumul actuel</p><p className="text-lg font-black text-gray-900">{stats.totalHeures}h</p></div>
                  <div className="text-right"><p className="text-xs font-bold text-gray-400 uppercase">Cible</p><p className="text-lg font-black text-gray-600">{stats.objectifHeures}h</p></div>
                </div>
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-brand-600 h-full rounded-full" style={{ width: `${stats.progression}%` }} />
                </div>
              </div>
              {stats.totalHeures < stats.objectifHeures && (
                <div className="mt-6 p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-start">
                  <AlertTriangle className="h-5 w-5 text-amber-500 mr-3 shrink-0" />
                  <p className="text-xs text-amber-800 leading-relaxed font-medium">Encore <strong>{stats.objectifHeures - stats.totalHeures} heures</strong> pour atteindre l'objectif.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}