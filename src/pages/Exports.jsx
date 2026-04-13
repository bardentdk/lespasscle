import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { fr } from 'date-fns/locale';
import Papa from 'papaparse';
import { 
  FileDown, 
  Filter, 
  Calendar as CalendarIcon, 
  Layers, 
  Loader2, 
  Table as TableIcon,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

export default function Exports() {
  const [groupes, setGroupes] = useState([]);
  const [selectedGroupe, setSelectedGroupe] = useState('');
  const [dateRange, setDateRange] = useState({
    start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    end: format(endOfMonth(new Date()), 'yyyy-MM-dd')
  });

  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    fetchGroupes();
  }, []);

  const fetchGroupes = async () => {
    const { data } = await supabase.from('groupes').select('id, name').order('name');
    setGroupes(data || []);
  };

  const generatePreview = async () => {
    if (!selectedGroupe) return;
    setLoading(true);

    try {
      // 1. On récupère les présences avec la nouvelle colonne justificatif_id
      const { data, error } = await supabase
        .from('presences')
        .select(`
          status,
          heures_validees,
          justificatif_id,
          apprenant_id,
          profiles (first_name, last_name, email),
          seances!inner (
            date,
            groupe_id
          )
        `)
        .eq('seances.groupe_id', selectedGroupe)
        .gte('seances.date', dateRange.start)
        .lte('seances.date', dateRange.end);

      if (error) throw error;

      // 2. On aggrège et on sépare les absences
      const aggregation = data.reduce((acc, curr) => {
        const id = curr.apprenant_id;
        if (!acc[id]) {
          acc[id] = {
            Nom: curr.profiles.last_name.toUpperCase(),
            Prénom: curr.profiles.first_name,
            Email: curr.profiles.email,
            'Total Séances': 0,
            'Heures Présentielles': 0,
            'Absences Justifiées': 0,
            'Absences Injustifiées': 0
          };
        }
        
        acc[id]['Total Séances'] += 1;
        
        if (curr.status === 'present' || curr.status === 'retard') {
          acc[id]['Heures Présentielles'] += parseFloat(curr.heures_validees || 0);
        } else if (curr.status === 'absent' || curr.status === 'excuse') {
          // La condition métier stricte
          if (curr.justificatif_id || curr.status === 'excuse') {
            acc[id]['Absences Justifiées'] += 1;
          } else {
            acc[id]['Absences Injustifiées'] += 1;
          }
        }
        
        return acc;
      }, {});

      setReportData(Object.values(aggregation).sort((a, b) => a.Nom.localeCompare(b.Nom)));
    } catch (err) {
      console.error("Erreur génération rapport:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    setIsExporting(true);
    const groupeName = groupes.find(g => g.id === selectedGroupe)?.name || 'Export';
    const filename = `Bilan_${groupeName}_${dateRange.start}_au_${dateRange.end}.csv`;

    const csv = Papa.unparse(reportData, { delimiter: ";" });
    const blob = new Blob(["\ufeff" + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setIsExporting(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h1 className="text-2xl font-bold text-gray-900">Exports Administratifs</h1>
        <p className="text-gray-500 mt-1">Générez les bilans d'heures par groupe, incluant le statut des justificatifs.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Filtres */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-gray-900 uppercase flex items-center">
              <Filter className="h-4 w-4 mr-2 text-brand-600" /> Filtres
            </h3>
            
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Groupe</label>
              <select 
                value={selectedGroupe}
                onChange={(e) => setSelectedGroupe(e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
              >
                <option value="">Sélectionner un groupe</option>
                {groupes.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Du</label>
              <input 
                type="date" 
                value={dateRange.start}
                onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Au</label>
              <input 
                type="date" 
                value={dateRange.end}
                onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
              />
            </div>

            <button 
              onClick={generatePreview}
              disabled={!selectedGroupe || loading}
              className="w-full py-3 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 transition-all shadow-md disabled:opacity-50 flex justify-center"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Générer l'aperçu"}
            </button>
          </div>
        </div>

        {/* Aperçu et Export */}
        <div className="lg:col-span-3 space-y-4">
          {reportData.length > 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-in slide-in-from-right-4 duration-300">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h3 className="font-bold text-gray-900 flex items-center">
                  <TableIcon className="h-5 w-5 mr-2 text-brand-600" /> Aperçu du bilan
                </h3>
                <button 
                  onClick={handleDownload}
                  className="flex items-center px-6 py-2 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 transition-all shadow-lg shadow-brand-100"
                >
                  <FileDown className="h-4 w-4 mr-2" />
                  Exporter (Excel)
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-white border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Stagiaire</th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase">Séances</th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase">Abs. Justifiées</th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase">Abs. Injustifiées</th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase">Total Heures</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {reportData.map((row, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/80 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-bold text-gray-900 text-sm">{row.Nom} {row.Prénom}</p>
                          <p className="text-[10px] text-gray-400">{row.Email}</p>
                        </td>
                        <td className="px-6 py-4 text-center text-sm font-medium text-gray-600">
                          {row['Total Séances']}
                        </td>
                        
                        {/* Colonne Justifiées (Orange doux) */}
                        <td className="px-6 py-4 text-center">
                          {row['Absences Justifiées'] > 0 ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-orange-50 text-orange-600 border border-orange-100">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              {row['Absences Justifiées']}
                            </span>
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </td>

                        {/* Colonne Injustifiées (Rouge vif) */}
                        <td className="px-6 py-4 text-center">
                          {row['Absences Injustifiées'] > 0 ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-red-50 text-red-600 border border-red-100">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              {row['Absences Injustifiées']}
                            </span>
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </td>

                        {/* Heures Présentielles */}
                        <td className="px-6 py-4 text-right">
                          <span className="px-3 py-1 bg-brand-50 border border-brand-100 text-brand-700 rounded-lg font-black text-sm">
                            {row['Heures Présentielles']}h
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-gray-100 border-dashed text-gray-400">
              <Layers className="h-16 w-16 mb-4 opacity-20 text-brand-600" />
              <p className="font-medium">Sélectionnez un groupe et une période pour voir le bilan.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}