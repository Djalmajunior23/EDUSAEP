import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  UserPlus, 
  Trash2, 
  Key, 
  Zap, 
  ZapOff,
  Loader2,
  Filter,
  Download
} from 'lucide-react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc
} from 'firebase/firestore';
import { sendPasswordResetEmail, User, getAuth as getSecondaryAuth, createUserWithEmailAndPassword as createSecondaryUser } from 'firebase/auth';
import { db, auth, firebaseConfig } from '../../firebase';
import { UserProfile } from '../../types';
import { handleFirestoreError, OperationType } from '../../services/errorService';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';
import Papa from 'papaparse';

interface AdminUsersViewProps {
  user: User | null;
}

export function AdminUsersView({ user }: AdminUsersViewProps) {
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'ADMIN' | 'TEACHER' | 'STUDENT' | 'COORDINATOR' | 'MONITOR'>('all');
  
  const filteredUsers = useMemo(() => {
    return usersList.filter(u => {
      const matchesSearch = (u.displayName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
                            (u.email?.toLowerCase() || '').includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === 'all' || u.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [usersList, searchTerm, roleFilter]);

  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<'STUDENT' | 'TEACHER' | 'ADMIN' | 'COORDINATOR' | 'MONITOR'>('STUDENT');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersData = snapshot.docs.map(doc => doc.data() as UserProfile);
      setUsersList(usersData);
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'users');
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    let secondaryApp;
    try {
      const { getApps, initializeApp } = await import('firebase/app');
      const apps = getApps();
      secondaryApp = apps.find(app => app.name === "SecondaryApp") || initializeApp(firebaseConfig, "SecondaryApp");
      const secondaryAuth = getSecondaryAuth(secondaryApp);
      
      const result = await createSecondaryUser(secondaryAuth, newEmail, newPassword);
      const newUser = result.user;

      const userRef = doc(db, 'users', newUser.uid);
      await setDoc(userRef, {
        uid: newUser.uid,
        email: newUser.email,
        displayName: newName || newEmail.split('@')[0],
        photoURL: '',
        emailVerified: false,
        role: newRole,
        createdAt: new Date().toISOString()
      });

      await secondaryAuth.signOut();
      toast.success(`Usuário ${newEmail} criado com sucesso!`);
      setNewEmail('');
      setNewPassword('');
      setNewName('');
      setNewRole('STUDENT');
    } catch (err: any) {
      console.error("Error creating user", err);
      if (err.code === 'auth/email-already-in-use') {
        toast.error("Este e-mail já está em uso.");
      } else if (err.code === 'auth/weak-password') {
        toast.error("A senha deve ter pelo menos 6 caracteres.");
      } else if (err.code === 'auth/operation-not-allowed') {
        toast.error("O cadastro por e-mail/senha não está habilitado no Firebase Console.");
      } else {
        toast.error(`Erro ao criar usuário: ${err.message || "Verifique os dados."}`);
      }
    } finally {
      if (secondaryApp) {
        const { deleteApp } = await import('firebase/app');
        await deleteApp(secondaryApp).catch(console.error);
      }
      setCreating(false);
    }
  };

  const handleDeleteUser = async (uid: string) => {
    if (!confirm("Tem certeza que deseja excluir este usuário?")) return;
    try {
      await deleteDoc(doc(db, 'users', uid));
      toast.success("Usuário removido com sucesso.");
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${uid}`);
    }
  };

  const handleToggleGamification = async (uid: string, currentStatus: boolean | undefined) => {
    try {
      await updateDoc(doc(db, 'users', uid), {
        gamificationEnabled: !currentStatus
      });
      toast.success(`Gamificação ${!currentStatus ? 'ativada' : 'desativada'}!`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${uid}`);
    }
  };

  const handleSendPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success(`E-mail de redefinição enviado para ${email}`);
    } catch (err: any) {
      toast.error(`Erro ao enviar e-mail: ${err.message}`);
    }
  };

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleImportUsers = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rows = results.data as any[];
        if (rows.length === 0) {
          toast.error("Planilha vazia.");
          return;
        }

        setCreating(true);
        let successCount = 0;
        let secondaryApp;
        try {
          const { getApps, initializeApp } = await import('firebase/app');
          const apps = getApps();
          secondaryApp = apps.find(app => app.name === "SecondaryApp") || initializeApp(firebaseConfig, "SecondaryApp");
          const secondaryAuth = getSecondaryAuth(secondaryApp);

          for (const row of rows) {
            const email = row.email || row.Email || row.EMAIL;
            const password = row.senha || row.Senha || row.PASSWORD || "123456";
            const name = row.nome || row.Nome || row.NAME || email.split('@')[0];
            const role = (row.funcao || row.Funcao || row.ROLE || "STUDENT").toUpperCase() as any;

            if (email) {
              try {
                const res = await createSecondaryUser(secondaryAuth, email, password);
                await setDoc(doc(db, 'users', res.user.uid), {
                  uid: res.user.uid,
                  email,
                  displayName: name,
                  role,
                  createdAt: new Date().toISOString()
                });
                successCount++;
                await secondaryAuth.signOut();
              } catch (err) {
                console.warn(`Erro ao importar ${email}:`, err);
              }
            }
          }
          toast.success(`${successCount} usuários importados!`);
        } finally {
          if (secondaryApp) {
            const { deleteApp } = await import('firebase/app');
            await deleteApp(secondaryApp).catch(console.error);
          }
          setCreating(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      }
    });
  };

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Gestão de Usuários</h2>
          <p className="text-gray-500">Controle de acesso e administração da plataforma.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <button 
            onClick={() => {
              const header = "email,senha,nome,funcao";
              const rows = [
                "aluno1@escola.com,123456,João Silva,STUDENT",
                "professor1@escola.com,123456,Maria Santos,TEACHER",
                "coordenador@escola.com,123456,Coordenação,COORDINATOR"
              ];
              const csvContent = [header, ...rows].join("\n");
              const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
              const link = document.createElement("a");
              const url = URL.createObjectURL(blob);
              link.setAttribute("href", url);
              link.setAttribute("download", "template_cadastro_usuarios_eduaicore.csv");
              link.style.visibility = 'hidden';
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              toast.success("Template CSV baixado!");
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 text-blue-700 rounded-xl font-bold text-sm border border-blue-200 hover:bg-blue-100 transition-all shadow-sm"
          >
            <Download size={18} />
            Baixar Template CSV
          </button>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImportUsers} 
            accept=".csv" 
            className="hidden" 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all"
          >
            <UserPlus size={18} />
            Importar Alunos em Lote
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm sticky top-24">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <UserPlus size={20} className="text-emerald-600" />
              Novo Usuário
            </h3>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Nome Completo</label>
                <input 
                  type="text" 
                  value={newName} 
                  onChange={(e) => setNewName(e.target.value)} 
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all" 
                  placeholder="Nome do usuário"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">E-mail</label>
                <input 
                  type="email" 
                  required 
                  value={newEmail} 
                  onChange={(e) => setNewEmail(e.target.value)} 
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all" 
                  placeholder="email@escola.com"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Senha Temporária</label>
                <input 
                  type="password" 
                  required 
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)} 
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all" 
                  placeholder="******"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Função/Cargo</label>
                <select 
                  value={newRole} 
                  onChange={(e) => setNewRole(e.target.value as any)}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                >
                  <option value="STUDENT">Aluno</option>
                  <option value="TEACHER">Professor</option>
                  <option value="COORDINATOR">Coordenador</option>
                  <option value="MONITOR">Monitor</option>
                  <option value="ADMIN">Administrador</option>
                </select>
              </div>
              <button 
                disabled={creating} 
                type="submit"
                className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-100 hover:bg-emerald-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2 mt-4"
              >
                {creating ? <Loader2 className="animate-spin" size={18} /> : <UserPlus size={18} />}
                Criar Usuário
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nome ou e-mail..."
                className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none shadow-sm transition-all"
              />
            </div>
            <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-xl border border-gray-200 shadow-sm">
              <Filter size={16} className="text-gray-400" />
              <select 
                value={roleFilter} 
                onChange={(e) => setRoleFilter(e.target.value as any)}
                className="bg-transparent border-none text-sm font-bold text-gray-600 outline-none cursor-pointer"
              >
                <option value="all">Todos os Cargos</option>
                <option value="STUDENT">Alunos</option>
                <option value="TEACHER">Professores</option>
                <option value="ADMIN">Admins</option>
                <option value="COORDINATOR">Coordenadores</option>
                <option value="MONITOR">Monitores</option>
              </select>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Usuário</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Função</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Status</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-gray-400">
                        <Loader2 className="animate-spin mx-auto mb-2" />
                        Carregando usuários...
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-gray-400 italic">
                        Nenhum usuário encontrado.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => (
                      <tr key={u.uid} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">
                              {u.displayName?.charAt(0) || u.email?.charAt(0)}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-bold text-gray-900 text-sm">{u.displayName}</span>
                              <span className="text-xs text-gray-500">{u.email}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={cn(
                            "px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider",
                            u.role === 'ADMIN' ? "bg-purple-100 text-purple-700" :
                            u.role === 'TEACHER' ? "bg-blue-100 text-blue-700" :
                            u.role === 'COORDINATOR' ? "bg-amber-100 text-amber-700" :
                            "bg-emerald-100 text-emerald-700"
                          )}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button 
                            onClick={() => handleToggleGamification(u.uid, u.gamificationEnabled)}
                            className={cn(
                              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all",
                              u.gamificationEnabled !== false ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100" : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                            )}
                          >
                            {u.gamificationEnabled !== false ? <Zap size={10} /> : <ZapOff size={10} />}
                            {u.gamificationEnabled !== false ? 'Gamificado' : 'Normal'}
                          </button>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => handleSendPassword(u.email || '')}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                              title="Redefinir Senha"
                            >
                              <Key size={16} />
                            </button>
                            <button 
                              onClick={() => handleDeleteUser(u.uid)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                              title="Excluir Usuário"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
