import React, { useState, useEffect, useRef } from 'react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { supabase } from '../lib/supabase';
import { Search, FolderOpen, UploadCloud, FileText, Download, Trash2, Loader2, AlertCircle, FileBadge } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Dossiers() {
  const { user } = useAuth();
  const isApprenant = user?.profile?.role === 'apprenant';

  const [apprenants, setApprenants] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedApprenant, setSelectedApprenant] = useState(null);
  const [loadingApprenants, setLoadingApprenants] = useState(true);

  const [documents, setDocuments] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);

  const [fileTitle, setFileTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isApprenant && user?.profile) {
      // Vue personnelle pour l'apprenant
      setSelectedApprenant(user.profile);
      setLoadingApprenants(false);
    } else {
      // Vue globale pour l'admin
      fetchApprenants();
    }
  }, [isApprenant, user]);

  useEffect(() => {
    if (selectedApprenant) {
      fetchDocuments(selectedApprenant.id);
      setFileTitle('');
      setSelectedFile(null);
      setError(null);
    }
  }, [selectedApprenant]);

  const fetchApprenants = async () => {
    setLoadingApprenants(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email')
      .eq('role', 'apprenant')
      .order('last_name');

    if (error) console.error(error);
    else setApprenants(data || []);
    setLoadingApprenants(false);
  };

  const fetchDocuments = async (apprenantId) => {
    setLoadingDocs(true);
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('apprenant_id', apprenantId)
      .order('created_at', { ascending: false });

    if (error) console.error(error);
    else setDocuments(data || []);
    setLoadingDocs(false);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile || !fileTitle || !selectedApprenant) return;
    setIsUploading(true);
    setError(null);

    try {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${selectedApprenant.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage.from('dossiers').upload(filePath, selectedFile);
      if (uploadError) throw uploadError;

      // const { error: dbError } = await supabase.from('documents').insert([{
      //   apprenant_id: selectedApprenant.id,
      //   title: fileTitle,
      //   file_path: filePath,
      //   file_type: selectedFile.type || 'application/octet-stream',
      //   uploaded_by: user?.id 
      // }]);
      const { error: dbError } = await supabase.from('documents').insert([{
        apprenant_id: selectedApprenant.id,
        title: fileTitle,
        file_path: filePath,
        file_type: selectedFile.type || 'application/octet-stream',
        uploaded_by: user?.profile?.id // <-- LA CORRECTION
      }]);
      if (dbError) throw dbError;

      fetchDocuments(selectedApprenant.id);
      setFileTitle('');
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      setError("Erreur lors de l'envoi. Vérifiez la taille du fichier et votre connexion.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = async (filePath) => {
    const { data, error } = await supabase.storage.from('dossiers').createSignedUrl(filePath, 60);
    if (error) alert("Erreur lors de la génération du lien.");
    else window.open(data.signedUrl, '_blank');
  };

  const handleDelete = async (docId, filePath) => {
    if (!window.confirm("Supprimer ce document définitivement ?")) return;
    await supabase.storage.from('dossiers').remove([filePath]);
    await supabase.from('documents').delete().eq('id', docId);
    fetchDocuments(selectedApprenant.id);
  };

  const filteredApprenants = apprenants.filter(a => 
    `${a.first_name} ${a.last_name}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 h-[calc(100vh-8rem)] flex flex-col">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 shrink-0">
        <h1 className="text-2xl font-bold text-gray-900">{isApprenant ? 'Mon Dossier' : 'Dossiers Stagiaires'}</h1>
        <p className="text-gray-500 mt-1">Gérez les documents administratifs (Conventions, CNI, Justificatifs...).</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-0">
        
        {/* Colonne de gauche cachée pour l'apprenant */}
        {!isApprenant && (
          <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input type="text" placeholder="Rechercher..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none bg-white" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {loadingApprenants ? (
                <div className="flex justify-center p-4"><Loader2 className="h-6 w-6 text-brand-500 animate-spin" /></div>
              ) : filteredApprenants.length === 0 ? (
                <p className="text-center text-sm text-gray-400 p-4">Aucun résultat.</p>
              ) : (
                filteredApprenants.map(apprenant => (
                  <button key={apprenant.id} onClick={() => setSelectedApprenant(apprenant)} className={`w-full flex items-center p-3 rounded-xl transition-all ${selectedApprenant?.id === apprenant.id ? 'bg-brand-50 border border-brand-100 text-brand-700' : 'hover:bg-gray-50 text-gray-700 border border-transparent'}`}>
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold mr-3 ${selectedApprenant?.id === apprenant.id ? 'bg-brand-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                      {apprenant.first_name[0]}{apprenant.last_name[0]}
                    </div>
                    <div className="text-left truncate">
                      <p className="text-sm font-bold truncate">{apprenant.first_name} {apprenant.last_name}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {/* Colonne de droite : Prend 4 colonnes pour l'apprenant, 3 pour l'admin */}
        <div className={`${isApprenant ? 'lg:col-span-4' : 'lg:col-span-3'} bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden`}>
          {!selectedApprenant ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50/50">
              <FolderOpen className="h-16 w-16 mb-4 text-gray-300" />
              <p className="text-lg font-medium text-gray-500">Sélectionnez un stagiaire</p>
            </div>
          ) : (
            <>
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
                <div className="flex items-center">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center text-white text-lg font-bold mr-4 shadow-sm">
                    {selectedApprenant.first_name[0]}{selectedApprenant.last_name[0]}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Dossier de {selectedApprenant.first_name} {selectedApprenant.last_name}</h2>
                    <p className="text-sm text-gray-500">{selectedApprenant.email}</p>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 bg-gray-50/30">
                <form onSubmit={handleUpload} className="mb-8 bg-white p-5 rounded-2xl border border-dashed border-brand-200 shadow-sm">
                  <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center"><UploadCloud className="h-4 w-4 mr-2 text-brand-500" /> Ajouter un document</h3>
                  {error && <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-sm text-red-700 flex items-center"><AlertCircle className="h-4 w-4 mr-2" /> {error}</div>}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <input type="text" required placeholder="Titre (ex: Carte d'identité)" value={fileTitle} onChange={(e) => setFileTitle(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none" />
                    </div>
                    <div className="flex-1 relative">
                      <input type="file" required ref={fileInputRef} onChange={(e) => setSelectedFile(e.target.files[0])} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 border border-gray-200 rounded-xl cursor-pointer" />
                    </div>
                    <button type="submit" disabled={isUploading || !selectedFile || !fileTitle} className="px-6 py-2.5 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 shadow-md disabled:opacity-50 flex items-center justify-center min-w-[140px]">
                      {isUploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <UploadCloud className="h-4 w-4 mr-2" />} {isUploading ? 'Envoi...' : 'Envoyer'}
                    </button>
                  </div>
                </form>

                <div>
                  <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Documents enregistrés ({documents.length})</h3>
                  {loadingDocs ? (
                    <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 text-brand-500 animate-spin" /></div>
                  ) : documents.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-2xl border border-gray-100"><FileBadge className="h-12 w-12 text-gray-200 mx-auto mb-3" /><p className="text-gray-500 font-medium">Aucun document.</p></div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {documents.map((doc) => (
                        <div key={doc.id} className="group bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:border-brand-200 flex items-start justify-between">
                          <div className="flex items-start overflow-hidden pr-4">
                            <div className="p-2 bg-brand-50 rounded-lg text-brand-600 mr-3 shrink-0"><FileText className="h-5 w-5" /></div>
                            <div className="min-w-0">
                              <h4 className="text-sm font-bold text-gray-900 truncate">{doc.title}</h4>
                              <p className="text-xs text-gray-500 mt-0.5">Le {format(parseISO(doc.created_at), 'dd MMM yyyy', { locale: fr })}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleDownload(doc.file_path)} className="p-2 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg"><Download className="h-4 w-4" /></button>
                            <button onClick={() => handleDelete(doc.id, doc.file_path)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="h-4 w-4" /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}