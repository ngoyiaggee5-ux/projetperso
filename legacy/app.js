// ================================================================
// ⚙️ CONFIGURATION SUPABASE (FONCTIONNELLE)
// ================================================================

// ✅ Votre URL Supabase
const SUPABASE_URL = 'https://cvnemgsptjksukoenfdu.supabase.co';

// ✅ Votre clé PUBLISHABLE
const SUPABASE_ANON_KEY = 'sb_publishable_w3HLHm7t_Z8bx9n2es9MAg_Xy8qrnbK';

// ================================================================
// INITIALISATION DE SU
// ================================================================
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ================================================================
// GESTION DE LA VERSION
// ================================================================
let APP_VERSION = "1.2.0";

function chargerVersion() {
    try {
        const saved = localStorage.getItem('freshstock_app_version');
        if (saved) APP_VERSION = saved;
    } catch(e) {}
    return APP_VERSION;
}

function appliquerVersion() {
    const versionEl = document.getElementById('appVersion');
    if (versionEl) versionEl.textContent = APP_VERSION;
}

chargerVersion();
appliquerVersion();

// ================================================================
// FILE SYSTEM (pour compatibilité locale)
// ================================================================
const FileSystem = {
    structure: {
        'config.json': { 
            content: { 
                version: '1.0.0', 
                appName: 'FreshStock ERP', 
                created: new Date().toISOString(), 
                database: 'database.db', 
                settings: { 
                    language: 'fr', 
                    currency: 'FC', 
                    taxRate: 16, 
                    autoBackup: true, 
                    backupInterval: 1, 
                    theme: 'light', 
                    fontSize: 'medium', 
                    dateFormat: 'fr', 
                    defaultRole: 'magasinier', 
                    sessionTimeout: 30, 
                    require2FA: false, 
                    forcePasswordChange: false, 
                    stockAlerts: true, 
                    expiryAlerts: true, 
                    dailyReports: false, 
                    companyName: 'FreshStock SARL' 
                } 
            } 
        },
        'database.db': { 
            content: { 
                type: 'sqlite', 
                tables: ['users', 'products', 'categories', 'suppliers', 'stock_entries', 'stock_exits', 'sales', 'sale_details', 'audit_logs'], 
                version: 1 
            } 
        },
        'logs/': { type: 'folder', content: null },
        'backup/': { type: 'folder', content: null },
        'images/': { type: 'folder', content: null },
        'temp/': { type: 'folder', content: null }
    },
    filesCreated: { config: false, database: false, logs: false, backup: false, images: false, temp: false },

    init: function() {
        return new Promise((resolve) => {
            console.log('📁 Initialisation de la structure de fichiers...');
            const savedStructure = localStorage.getItem('freshstock_file_structure');
            if (savedStructure) {
                const data = JSON.parse(savedStructure);
                this.filesCreated = data.filesCreated || this.filesCreated;
                console.log('📂 Structure chargée depuis localStorage');
                this.updateStatusUI();
                resolve(true);
                return;
            }
            setTimeout(() => {
                const steps = Object.keys(this.structure);
                let completed = 0;
                steps.forEach((key) => {
                    setTimeout(() => {
                        const item = this.structure[key];
                        const isFolder = key.endsWith('/');
                        const name = isFolder ? key.slice(0, -1) : key;
                        if (isFolder) { 
                            this.filesCreated[name] = true; 
                            console.log(`📁 Dossier créé : ${name}/`); 
                        } else { 
                            this.filesCreated[name.replace('.', '_')] = true; 
                            console.log(`📄 Fichier créé : ${key}`); 
                            if (item.content) localStorage.setItem(`freshstock_file_${key}`, JSON.stringify(item.content)); 
                        }
                        completed++;
                        if (completed === steps.length) {
                            localStorage.setItem('freshstock_file_structure', JSON.stringify({ 
                                filesCreated: this.filesCreated, 
                                created: new Date().toISOString() 
                            }));
                            this.updateStatusUI();
                            console.log('✅ Structure de fichiers créée !');
                            resolve(true);
                        }
                    }, 100 * (steps.indexOf(key) + 1));
                });
            }, 200);
        });
    },

    updateStatusUI: function() {
        const statusEl = document.getElementById('fileStatus');
        if (statusEl) {
            const allCreated = Object.values(this.filesCreated).every(v => v === true);
            if (allCreated) { 
                statusEl.innerHTML = '✅ Tous les fichiers sont prêts'; 
                statusEl.style.background = '#28a745'; 
            } else { 
                const count = Object.values(this.filesCreated).filter(v => v === true).length; 
                const total = Object.keys(this.filesCreated).length; 
                statusEl.innerHTML = `⏳ Création... (${count}/${total})`; 
                statusEl.style.background = '#ffc107'; 
            }
        }
    },

    getFile: function(filename) {
        const key = `freshstock_file_${filename}`;
        const data = localStorage.getItem(key);
        if (data) { try { return JSON.parse(data); } catch (e) { return data; } }
        return null;
    },

    saveFile: function(filename, content) {
        localStorage.setItem(`freshstock_file_${filename}`, JSON.stringify(content));
        console.log(`💾 Fichier sauvegardé : ${filename}`);
        return true;
    },

    exportAllData: function() {
        const allData = { 
            exportDate: new Date().toISOString(), 
            appVersion: APP_VERSION, 
            files: {}, 
            data: { 
                utilisateurs, categories, fournisseurs, produits, entrees, sorties, ventes, details_ventes, auditLogs 
            } 
        };
        Object.keys(this.filesCreated).forEach(key => { 
            const cleanKey = key.replace('_', '.'); 
            allData.files[cleanKey] = this.getFile(cleanKey); 
        });
        return allData;
    }
};

// ================================================================
// ÉTAT DE L'APPLICATION
// ================================================================
let sessionUser = null;
let posPanier = [];
let ventesChart = null;
let categorieChart = null;
let donneesChargees = false;

// Données (cache local)
let utilisateurs = [];
let categories = [];
let fournisseurs = [];
let produits = [];
let entrees = [];
let sorties = [];
let ventes = [];
let details_ventes = [];
let auditLogs = [];
let nextId = { produit: 1, categorie: 1, fournisseur: 1, entree: 1, sortie: 1, vente: 1, detail: 1, audit: 1, utilisateur: 1 };

// Sélections
let facturesSelectionnees = new Set();
let ventesSelectionnees = new Set();

// Paramètres
let appSettings = {};

// ================================================================
// FONCTIONS UTILITAIRES
// ================================================================
function getCategorie(id) { return categories.find(c => c.id === id); }
function getFournisseur(id) { return fournisseurs.find(f => f.id === id); }
function getProduit(id) { return produits.find(p => p.id === id); }
function getCategorieNom(id) { const c = getCategorie(id); return c ? c.nom : 'Non catégorisé'; }
function getFournisseurNom(id) { const f = getFournisseur(id); return f ? f.nom : 'Non fournisseur'; }
function getProduitNom(id) { const p = getProduit(id); return p ? p.nom : 'Inconnu'; }
function formatNumber(n) { return n.toLocaleString('fr-FR'); }

function getStatutBadge(statut) {
    const labels = { 
        'actif': '<span class="badge-status actif">✅ Actif</span>', 
        'inactif': '<span class="badge-status inactif">⛔ Inactif</span>', 
        'rupture': '<span class="badge-status inactif">⚠️ Rupture</span>' 
    };
    return labels[statut] || statut;
}

function getRoleBadge(role) {
    const labels = { 
        'admin': '<span class="badge-status admin">👑 Admin</span>', 
        'manager': '<span class="badge-status manager">📊 Manager</span>', 
        'caissier': '<span class="badge-status caissier">💰 Caissier</span>', 
        'magasinier': '<span class="badge-status magasinier">📦 Magasinier</span>' 
    };
    return labels[role] || role;
}

function getUserStatusBadge(statut) {
    const labels = { 
        'active': '<span class="badge-status actif">✅ Actif</span>', 
        'inactive': '<span class="badge-status inactif">⛔ Inactif</span>', 
        'pending': '<span class="badge-status attente">⏳ En attente</span>' 
    };
    return labels[statut] || statut;
}

function addAuditLog(action, details) {
    const log = { 
        id: nextId.audit++, 
        utilisateur: sessionUser ? sessionUser.email : 'système', 
        action: action, 
        details: details, 
        date: new Date().toISOString().replace('T', ' ').slice(0, 19) 
    };
    auditLogs.push(log);
}

// ================================================================
// TOAST
// ================================================================
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const msg = document.getElementById('toastMessage');
    const icon = document.getElementById('toastIcon');
    const icons = { 'success': '✅', 'error': '❌', 'warning': '⚠️', 'info': 'ℹ️' };
    icon.textContent = icons[type] || '✅';
    msg.textContent = message;
    toast.className = 'toast-notification ' + type;
    toast.classList.add('show');
    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => { toast.classList.remove('show'); }, 4000);
}

function fermerToast() { document.getElementById('toast').classList.remove('show'); }

// ================================================================
// TOGGLE PASSWORD
// ================================================================
function togglePasswordVisibility(inputId, button) {
    const input = document.getElementById(inputId);
    const icon = button.querySelector('i');
    if (input.type === 'password') { 
        input.type = 'text'; 
        icon.className = 'fas fa-eye-slash'; 
    } else { 
        input.type = 'password'; 
        icon.className = 'fas fa-eye'; 
    }
}

// ================================================================
// TOGGLE SIDEBAR
// ================================================================
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    sidebar.classList.toggle('open');
    overlay.classList.toggle('active');
}

document.querySelectorAll('.sidebar .nav-link').forEach(link => {
    link.addEventListener('click', function() {
        if (window.innerWidth <= 992) {
            document.getElementById('sidebar').classList.remove('open');
            document.getElementById('sidebarOverlay').classList.remove('active');
        }
    });
});

// ================================================================
// SWITCH AUTH TAB
// ================================================================
function switchAuthTab(tab) {
    const loginBtn = document.querySelector('.tab-links button:first-child');
    const registerBtn = document.querySelector('.tab-links button:last-child');
    const loginDiv = document.getElementById('authLogin');
    const registerDiv = document.getElementById('authRegister');
    document.getElementById('loginAlert').style.display = 'none';
    document.getElementById('registerAlert').style.display = 'none';
    if (tab === 'login') { 
        loginBtn.classList.add('active'); 
        registerBtn.classList.remove('active'); 
        loginDiv.style.display = 'block'; 
        registerDiv.style.display = 'none'; 
    } else { 
        loginBtn.classList.remove('active'); 
        registerBtn.classList.add('active'); 
        loginDiv.style.display = 'none'; 
        registerDiv.style.display = 'block'; 
    }
}

// ================================================================
// FONCTIONS SUPABASE (CORRIGÉES)
// ================================================================

// --- UTILISATEURS ---
async function chargerUtilisateurs() {
    try {
        console.log('🔄 Chargement des utilisateurs...');
        const { data, error } = await supabaseClient
            .from('utilisateurs')
            .select('*')
            .order('id');
        if (error) throw error;
        utilisateurs = data || [];
        console.log(`✅ ${utilisateurs.length} utilisateurs chargés`);
        return utilisateurs;
    } catch (error) {
        console.error('❌ Erreur chargement utilisateurs:', error);
        if (utilisateurs.length === 0) {
            utilisateurs = [
                { id: 1, nom: 'Administrateur', email: 'admin@freshstock.com', mot_de_passe: 'admin123', role: 'admin', statut: 'active' },
                { id: 2, nom: 'Manager Stock', email: 'manager@freshstock.com', mot_de_passe: 'admin123', role: 'manager', statut: 'active' },
                { id: 3, nom: 'Caissier', email: 'caissier@freshstock.com', mot_de_passe: 'admin123', role: 'caissier', statut: 'active' },
                { id: 4, nom: 'Magasinier', email: 'magasinier@freshstock.com', mot_de_passe: 'admin123', role: 'magasinier', statut: 'active' }
            ];
        }
        return utilisateurs;
    }
}

async function ajouterUtilisateur(user) {
    try {
        const { data, error } = await supabaseClient
            .from('utilisateurs')
            .insert([user])
            .select();
        if (error) throw error;
        if (data && data.length > 0) { 
            utilisateurs.push(data[0]); 
            return data[0]; 
        }
        return null;
    } catch (error) {
        console.error('❌ Erreur ajout utilisateur:', error);
        const maxId = utilisateurs.reduce((max, u) => u.id > max ? u.id : max, 0);
        const newUser = { ...user, id: maxId + 1 };
        utilisateurs.push(newUser);
        sauvegarderDonnees();
        return newUser;
    }
}

async function mettreAJourUtilisateur(id, updates) {
    try {
        const { data, error } = await supabaseClient
            .from('utilisateurs')
            .update(updates)
            .eq('id', id)
            .select();
        if (error) throw error;
        if (data && data.length > 0) {
            const index = utilisateurs.findIndex(u => u.id === id);
            if (index !== -1) utilisateurs[index] = data[0];
            return data[0];
        }
        return null;
    } catch (error) {
        console.error('❌ Erreur mise à jour utilisateur:', error);
        return null;
    }
}

async function supprimerUtilisateurDB(id) {
    try {
        const { error } = await supabaseClient
            .from('utilisateurs')
            .delete()
            .eq('id', id);
        if (error) throw error;
        utilisateurs = utilisateurs.filter(u => u.id !== id);
        return true;
    } catch (error) {
        console.error('❌ Erreur suppression utilisateur:', error);
        return false;
    }
}

// --- CATÉGORIES ---
async function chargerCategories() {
    try {
        const { data, error } = await supabaseClient
            .from('categories')
            .select('*')
            .order('id');
        if (error) throw error;
        categories = data || [];
        return categories;
    } catch (error) {
        console.error('❌ Erreur chargement catégories:', error);
        return categories || [];
    }
}

async function ajouterCategorie(cat) {
    try {
        const { data, error } = await supabaseClient
            .from('categories')
            .insert([cat])
            .select();
        if (error) throw error;
        if (data && data.length > 0) { 
            categories.push(data[0]); 
            return data[0]; 
        }
        return null;
    } catch (error) {
        console.error('❌ Erreur ajout catégorie:', error);
        return null;
    }
}

async function supprimerCategorieDB(id) {
    try {
        const { error } = await supabaseClient
            .from('categories')
            .delete()
            .eq('id', id);
        if (error) throw error;
        categories = categories.filter(c => c.id !== id);
        return true;
    } catch (error) {
        console.error('❌ Erreur suppression catégorie:', error);
        return false;
    }
}

// --- FOURNISSEURS ---
async function chargerFournisseurs() {
    try {
        const { data, error } = await supabaseClient
            .from('fournisseurs')
            .select('*')
            .order('id');
        if (error) throw error;
        fournisseurs = data || [];
        return fournisseurs;
    } catch (error) {
        console.error('❌ Erreur chargement fournisseurs:', error);
        return fournisseurs || [];
    }
}

async function ajouterFournisseur(fourn) {
    try {
        const { data, error } = await supabaseClient
            .from('fournisseurs')
            .insert([fourn])
            .select();
        if (error) throw error;
        if (data && data.length > 0) { 
            fournisseurs.push(data[0]); 
            return data[0]; 
        }
        return null;
    } catch (error) {
        console.error('❌ Erreur ajout fournisseur:', error);
        return null;
    }
}

async function supprimerFournisseurDB(id) {
    try {
        const { error } = await supabaseClient
            .from('fournisseurs')
            .delete()
            .eq('id', id);
        if (error) throw error;
        fournisseurs = fournisseurs.filter(f => f.id !== id);
        return true;
    } catch (error) {
        console.error('❌ Erreur suppression fournisseur:', error);
        return false;
    }
}

// --- PRODUITS ---
async function chargerProduits() {
    try {
        const { data, error } = await supabaseClient
            .from('produits')
            .select('*')
            .order('id');
        if (error) throw error;
        produits = data || [];
        return produits;
    } catch (error) {
        console.error('❌ Erreur chargement produits:', error);
        return produits || [];
    }
}

async function ajouterProduit(prod) {
    try {
        const { data, error } = await supabaseClient
            .from('produits')
            .insert([prod])
            .select();
        if (error) throw error;
        if (data && data.length > 0) { 
            produits.push(data[0]); 
            return data[0]; 
        }
        return null;
    } catch (error) {
        console.error('❌ Erreur ajout produit:', error);
        return null;
    }
}

async function mettreAJourProduit(id, updates) {
    try {
        const { data, error } = await supabaseClient
            .from('produits')
            .update(updates)
            .eq('id', id)
            .select();
        if (error) throw error;
        if (data && data.length > 0) {
            const index = produits.findIndex(p => p.id === id);
            if (index !== -1) produits[index] = data[0];
            return data[0];
        }
        return null;
    } catch (error) {
        console.error('❌ Erreur mise à jour produit:', error);
        return null;
    }
}

async function supprimerProduitDB(id) {
    try {
        const { error } = await supabaseClient
            .from('produits')
            .delete()
            .eq('id', id);
        if (error) throw error;
        produits = produits.filter(p => p.id !== id);
        return true;
    } catch (error) {
        console.error('❌ Erreur suppression produit:', error);
        return false;
    }
}

// --- ENTREES ---
async function chargerEntrees() {
    try {
        const { data, error } = await supabaseClient
            .from('entrees')
            .select('*')
            .order('date_entree', { ascending: false });
        if (error) throw error;
        entrees = data || [];
        return entrees;
    } catch (error) {
        console.error('❌ Erreur chargement entrées:', error);
        return entrees || [];
    }
}

async function ajouterEntree(entree) {
    try {
        const { data, error } = await supabaseClient
            .from('entrees')
            .insert([entree])
            .select();
        if (error) throw error;
        if (data && data.length > 0) { 
            entrees.unshift(data[0]); 
            return data[0]; 
        }
        return null;
    } catch (error) {
        console.error('❌ Erreur ajout entrée:', error);
        return null;
    }
}

async function supprimerEntreesDB(ids) {
    try {
        const { error } = await supabaseClient
            .from('entrees')
            .delete()
            .in('id', ids);
        if (error) throw error;
        entrees = entrees.filter(e => !ids.includes(e.id));
        return true;
    } catch (error) {
        console.error('❌ Erreur suppression entrées:', error);
        return false;
    }
}

// --- SORTIES ---
async function chargerSorties() {
    try {
        const { data, error } = await supabaseClient
            .from('sorties')
            .select('*')
            .order('date_sortie', { ascending: false });
        if (error) throw error;
        sorties = data || [];
        return sorties;
    } catch (error) {
        console.error('❌ Erreur chargement sorties:', error);
        return sorties || [];
    }
}

async function ajouterSortie(sortie) {
    try {
        const { data, error } = await supabaseClient
            .from('sorties')
            .insert([sortie])
            .select();
        if (error) throw error;
        if (data && data.length > 0) { 
            sorties.unshift(data[0]); 
            return data[0]; 
        }
        return null;
    } catch (error) {
        console.error('❌ Erreur ajout sortie:', error);
        return null;
    }
}

async function supprimerSortiesDB(ids) {
    try {
        const { error } = await supabaseClient
            .from('sorties')
            .delete()
            .in('id', ids);
        if (error) throw error;
        sorties = sorties.filter(s => !ids.includes(s.id));
        return true;
    } catch (error) {
        console.error('❌ Erreur suppression sorties:', error);
        return false;
    }
}

// --- VENTES ---
async function chargerVentes() {
    try {
        const { data, error } = await supabaseClient
            .from('ventes')
            .select('*')
            .order('date_vente', { ascending: false });
        if (error) throw error;
        ventes = data || [];
        return ventes;
    } catch (error) {
        console.error('❌ Erreur chargement ventes:', error);
        return ventes || [];
    }
}

async function ajouterVente(vente) {
    try {
        const { data, error } = await supabaseClient
            .from('ventes')
            .insert([vente])
            .select();
        if (error) throw error;
        if (data && data.length > 0) { 
            ventes.unshift(data[0]); 
            return data[0]; 
        }
        return null;
    } catch (error) {
        console.error('❌ Erreur ajout vente:', error);
        return null;
    }
}

async function mettreAJourVente(id, updates) {
    try {
        const { data, error } = await supabaseClient
            .from('ventes')
            .update(updates)
            .eq('id', id)
            .select();
        if (error) throw error;
        if (data && data.length > 0) {
            const index = ventes.findIndex(v => v.id === id);
            if (index !== -1) ventes[index] = data[0];
            return data[0];
        }
        return null;
    } catch (error) {
        console.error('❌ Erreur mise à jour vente:', error);
        return null;
    }
}

async function supprimerVenteDB(id) {
    try {
        const { error } = await supabaseClient
            .from('ventes')
            .delete()
            .eq('id', id);
        if (error) throw error;
        ventes = ventes.filter(v => v.id !== id);
        return true;
    } catch (error) {
        console.error('❌ Erreur suppression vente:', error);
        return false;
    }
}

// --- DÉTAILS VENTES ---
async function chargerDetailsVentes() {
    try {
        const { data, error } = await supabaseClient
            .from('details_ventes')
            .select('*');
        if (error) throw error;
        details_ventes = data || [];
        return details_ventes;
    } catch (error) {
        console.error('❌ Erreur chargement détails ventes:', error);
        return details_ventes || [];
    }
}

async function ajouterDetailVente(detail) {
    try {
        const { data, error } = await supabaseClient
            .from('details_ventes')
            .insert([detail])
            .select();
        if (error) throw error;
        if (data && data.length > 0) { 
            details_ventes.push(data[0]); 
            return data[0]; 
        }
        return null;
    } catch (error) {
        console.error('❌ Erreur ajout détail vente:', error);
        return null;
    }
}

async function supprimerDetailsVente(venteId) {
    try {
        const { error } = await supabaseClient
            .from('details_ventes')
            .delete()
            .eq('vente_id', venteId);
        if (error) throw error;
        details_ventes = details_ventes.filter(d => d.vente_id !== venteId);
        return true;
    } catch (error) {
        console.error('❌ Erreur suppression détails vente:', error);
        return false;
    }
}

// --- AUDIT LOGS ---
async function chargerAuditLogs() {
    try {
        const { data, error } = await supabaseClient
            .from('audit_logs')
            .select('*')
            .order('date', { ascending: false });
        if (error) throw error;
        auditLogs = data || [];
        return auditLogs;
    } catch (error) {
        console.error('❌ Erreur chargement audit logs:', error);
        return auditLogs || [];
    }
}

async function ajouterAuditLogSupabase(log) {
    try {
        const { data, error } = await supabaseClient
            .from('audit_logs')
            .insert([log])
            .select();
        if (error) throw error;
        if (data && data.length > 0) { 
            auditLogs.unshift(data[0]); 
            return data[0]; 
        }
        return null;
    } catch (error) {
        console.error('❌ Erreur ajout audit log:', error);
        return null;
    }
}

async function supprimerAuditLogsDB(ids) {
    try {
        const { error } = await supabaseClient
            .from('audit_logs')
            .delete()
            .in('id', ids);
        if (error) throw error;
        auditLogs = auditLogs.filter(l => !ids.includes(l.id));
        return true;
    } catch (error) {
        console.error('❌ Erreur suppression audit logs:', error);
        return false;
    }
}

// ================================================================
// CHARGEMENT COMPLET DES DONNÉES
// ================================================================
async function chargerToutesLesDonnees() {
    try {
        document.getElementById('syncStatus').textContent = 'Chargement...';
        document.getElementById('syncDot').className = 'sync-dot syncing';
        
        await Promise.all([
            chargerUtilisateurs(),
            chargerCategories(),
            chargerFournisseurs(),
            chargerProduits(),
            chargerEntrees(),
            chargerSorties(),
            chargerVentes(),
            chargerDetailsVentes(),
            chargerAuditLogs()
        ]);
        
        console.log('📊 Détails des ventes chargés:', details_ventes.length);
        console.log('📊 Ventes chargées:', ventes.length);
        
        ventes.forEach(v => {
            const details = details_ventes.filter(d => d.vente_id === v.id);
            console.log(`Vente ${v.id} (${v.numero_vente}): ${details.length} produit(s)`);
        });
        
        donneesChargees = true;
        renderAll();
        showToast('✅ Données chargées depuis le cloud !', 'success');
        return true;
    } catch (error) {
        console.error('❌ Erreur chargement:', error);
        showToast('⚠️ Erreur de chargement. Utilisation du cache local.', 'warning');
        return false;
    }
}

// ================================================================
// AUTHENTIFICATION - VERSION CORRIGÉE AVEC DROITS ADMIN
// ================================================================
async function doLogin(email, motDePasse) {
    console.log('🔐 Tentative de connexion:', email);
    const alertDiv = document.getElementById('loginAlert');
    alertDiv.style.display = 'none'; 
    alertDiv.className = 'alert';
    
    if (!email || !motDePasse) {
        alertDiv.className = 'alert alert-danger';
        alertDiv.textContent = 'Veuillez remplir tous les champs.';
        alertDiv.style.display = 'block';
        return false;
    }
    
    try {
        if (utilisateurs.length === 0) {
            await chargerUtilisateurs();
        }
        
        const user = utilisateurs.find(u => u.email === email && u.mot_de_passe === motDePasse);
        if (!user) {
            alertDiv.className = 'alert alert-danger';
            alertDiv.textContent = 'Email ou mot de passe incorrect.';
            alertDiv.style.display = 'block';
            return false;
        }
        
        if (user.statut === 'inactive') {
            alertDiv.className = 'alert alert-danger';
            alertDiv.textContent = 'Votre compte est désactivé.';
            alertDiv.style.display = 'block';
            return false;
        }
        
        if (user.statut === 'pending') {
            alertDiv.className = 'alert alert-warning';
            alertDiv.textContent = 'Votre compte est en attente d\'activation.';
            alertDiv.style.display = 'block';
            return false;
        }
        
        alertDiv.style.display = 'none';
        sessionUser = user;
        
        document.getElementById('loginPage').style.display = 'none';
        document.getElementById('mainApp').style.display = 'block';
        document.getElementById('userName').textContent = user.nom;
        document.getElementById('userRole').textContent = user.role;
        document.getElementById('userAvatar').textContent = user.nom.charAt(0).toUpperCase();
        
        const statusBadge = document.getElementById('userStatusBadge');
        if (user.statut === 'active') {
            statusBadge.className = 'status-badge active';
            statusBadge.textContent = '✅ Actif';
        } else if (user.statut === 'pending') {
            statusBadge.className = 'status-badge pending';
            statusBadge.textContent = '⏳ En attente';
        } else {
            statusBadge.className = 'status-badge inactive';
            statusBadge.textContent = '⛔ Inactif';
        }
        
        // ============================================================
        // 🔒 GESTION DES DROITS ADMIN - CORRIGÉE
        // ============================================================
        const role = user.role;
        const isAdmin = role === 'admin';
        
        // Éléments à afficher uniquement pour les admins
        const adminSection = document.getElementById('adminSection');
        const adminUsersLink = document.getElementById('adminUsersLink');
        const adminSettingsLink = document.getElementById('adminSettingsLink');
        
        if (isAdmin) {
            // ✅ Afficher les éléments admin
            if (adminSection) adminSection.style.display = '';
            if (adminUsersLink) adminUsersLink.style.display = '';
            if (adminSettingsLink) adminSettingsLink.style.display = '';
            console.log('👑 Mode Admin activé');
        } else {
            // ❌ Cacher les éléments admin
            if (adminSection) adminSection.style.display = 'none';
            if (adminUsersLink) adminUsersLink.style.display = 'none';
            if (adminSettingsLink) adminSettingsLink.style.display = 'none';
            console.log('👤 Mode Utilisateur standard');
        }
        
        // Cacher les pages selon le rôle
        const hiddenPages = {
            'caissier': ['fournisseurs', 'entrees', 'sorties', 'rapports', 'suggestions', 'audit'],
            'magasinier': ['ventes', 'pos', 'factures', 'rapports', 'suggestions', 'audit'],
            'manager': ['users', 'settings', 'audit']
        };
        const hidden = hiddenPages[role] || [];
        document.querySelectorAll('.sidebar .nav-link').forEach(link => {
            const onclick = link.getAttribute('onclick') || '';
            const page = onclick.replace("showPage('", "").replace("')", "");
            if (page && hidden.includes(page)) {
                link.style.display = 'none';
            } else {
                // Si c'est un lien admin et que l'utilisateur n'est pas admin, on le cache
                if ((page === 'users' || page === 'settings') && !isAdmin) {
                    link.style.display = 'none';
                } else {
                    link.style.display = '';
                }
            }
        });
        
        // 🔒 Bloquer l'accès direct aux pages admin via URL
        if (!isAdmin) {
            const currentPage = document.getElementById('pageTitle')?.innerText?.toLowerCase() || '';
            if (currentPage.includes('utilisateur') || currentPage.includes('paramètre')) {
                showPage('dashboard');
            }
        }
        
        if (!donneesChargees) {
            await chargerToutesLesDonnees();
        } else {
            renderAll();
        }
        
        await ajouterAuditLogSupabase({
            utilisateur: user.email,
            action: 'Connexion',
            details: 'Login réussi - Rôle: ' + user.role
        });
        
        renderAll();
        showToast('Bienvenue ' + user.nom + ' !', 'success');
        showPage('dashboard');
        return true;
        
    } catch (error) {
        console.error('❌ Erreur connexion:', error);
        alertDiv.className = 'alert alert-danger';
        alertDiv.textContent = 'Erreur de connexion au serveur. Vérifiez votre connexion internet.';
        alertDiv.style.display = 'block';
        return false;
    }
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('🔄 DOM chargé, initialisation des événements...');
    const loginBtn = document.getElementById('loginBtn');
    const loginForm = document.getElementById('loginForm');
    
    if (loginBtn) {
        console.log('✅ Bouton de connexion trouvé');
        loginBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('🖱️ Clic sur le bouton de connexion');
            doLogin(
                document.getElementById('loginEmail').value.trim(), 
                document.getElementById('loginPassword').value.trim()
            );
        });
    } else {
        console.warn('⚠️ Bouton de connexion non trouvé');
    }
    
    if (loginForm) {
        console.log('✅ Formulaire de connexion trouvé');
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            console.log('📝 Soumission du formulaire de connexion');
            doLogin(
                document.getElementById('loginEmail').value.trim(), 
                document.getElementById('loginPassword').value.trim()
            );
        });
    } else {
        console.warn('⚠️ Formulaire de connexion non trouvé');
    }
});

// ================================================================
// INSCRIPTION
// ================================================================
async function inscription() {
    const nom = document.getElementById('regNom').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;
    const confirm = document.getElementById('regPasswordConfirm').value;
    const alertDiv = document.getElementById('registerAlert');
    alertDiv.style.display = 'none'; 
    alertDiv.className = 'alert';
    
    if (!nom || !email || !password || !confirm) {
        alertDiv.className = 'alert alert-danger';
        alertDiv.textContent = 'Veuillez remplir tous les champs.';
        alertDiv.style.display = 'block';
        return;
    }
    
    if (password !== confirm) {
        alertDiv.className = 'alert alert-danger';
        alertDiv.textContent = 'Les mots de passe ne correspondent pas.';
        alertDiv.style.display = 'block';
        return;
    }
    
    if (password.length < 6) {
        alertDiv.className = 'alert alert-danger';
        alertDiv.textContent = 'Le mot de passe doit contenir au moins 6 caractères.';
        alertDiv.style.display = 'block';
        return;
    }
    
    try {
        if (utilisateurs.length === 0) {
            await chargerUtilisateurs();
        }
        
        if (utilisateurs.find(u => u.email === email)) {
            alertDiv.className = 'alert alert-danger';
            alertDiv.textContent = 'Cet email est déjà utilisé.';
            alertDiv.style.display = 'block';
            return;
        }
        
        const newUser = {
            nom: nom,
            email: email,
            mot_de_passe: password,
            role: 'magasinier',
            statut: 'pending',
            date_creation: new Date().toISOString()
        };
        
        await ajouterUtilisateur(newUser);
        
        await ajouterAuditLogSupabase({
            utilisateur: email,
            action: 'Inscription',
            details: 'Nouvel utilisateur inscrit - En attente'
        });
        
        alertDiv.className = 'alert alert-success';
        alertDiv.innerHTML = `<i class="fas fa-check-circle me-2"></i><strong>Inscription réussie !</strong><br>Votre compte est en attente d'activation.<br><span class="text-muted" style="font-size:0.85rem;">Redirection...</span>`;
        alertDiv.style.display = 'block';
        
        document.getElementById('regNom').value = '';
        document.getElementById('regEmail').value = '';
        document.getElementById('regPassword').value = '';
        document.getElementById('regPasswordConfirm').value = '';
        
        showToast('Inscription réussie !', 'success');
        
        setTimeout(() => {
            switchAuthTab('login');
            const loginAlert = document.getElementById('loginAlert');
            loginAlert.className = 'alert alert-success';
            loginAlert.innerHTML = '<i class="fas fa-check-circle me-2"></i> Inscription réussie ! En attente d\'activation.';
            loginAlert.style.display = 'block';
            setTimeout(() => { loginAlert.style.display = 'none'; }, 5000);
        }, 3000);
        
    } catch (error) {
        console.error('❌ Erreur inscription:', error);
        alertDiv.className = 'alert alert-danger';
        alertDiv.textContent = 'Erreur lors de l\'inscription. Vérifiez votre connexion.';
        alertDiv.style.display = 'block';
    }
}

// ================================================================
// DÉCONNEXION
// ================================================================
function logout() {
    addAuditLog('Déconnexion', 'Logout');
    sessionUser = null;
    document.getElementById('mainApp').style.display = 'none';
    document.getElementById('loginPage').style.display = 'flex';
    document.getElementById('loginEmail').value = '';
    document.getElementById('loginPassword').value = '';
    posPanier = [];
    ventesSelectionnees = new Set();
    facturesSelectionnees = new Set();
    document.getElementById('loginAlert').style.display = 'none';
    document.getElementById('loginAlert').className = 'alert';
    showToast('Déconnexion réussie', 'warning');
}

// ================================================================
// AFFICHAGE DES PAGES - AVEC PROTECTION ADMIN
// ================================================================
function showPage(page) {
    // 🔒 Vérifier si la page est réservée aux admins
    const adminPages = ['users', 'settings'];
    
    if (adminPages.includes(page)) {
        // Vérifier si l'utilisateur est admin
        if (!sessionUser || sessionUser.role !== 'admin') {
            showToast('⛔ Accès refusé. Cette page est réservée aux administrateurs.', 'error');
            return;
        }
    }
    
    const pages = ['dashboard', 'produits', 'categories', 'fournisseurs', 'entrees', 'sorties', 'ventes', 'pos', 'factures', 'rapports', 'suggestions', 'audit', 'users', 'settings', 'about'];
    pages.forEach(p => { 
        const el = document.getElementById('page-' + p); 
        if (el) el.style.display = p === page ? 'block' : 'none'; 
    });
    document.querySelectorAll('.sidebar .nav-link').forEach(a => a.classList.remove('active'));
    document.querySelectorAll('.sidebar .nav-link').forEach(a => {
        const onclick = a.getAttribute('onclick');
        if (onclick && onclick.includes(page)) a.classList.add('active');
    });
    const titles = {
        'dashboard': '<i class="fas fa-chart-pie me-2"></i>Dashboard',
        'produits': '<i class="fas fa-cube me-2"></i>Produits',
        'categories': '<i class="fas fa-tags me-2"></i>Catégories',
        'fournisseurs': '<i class="fas fa-truck me-2"></i>Fournisseurs',
        'entrees': '<i class="fas fa-arrow-down me-2"></i>Entrées stock',
        'sorties': '<i class="fas fa-arrow-up me-2"></i>Sorties stock',
        'ventes': '<i class="fas fa-shopping-cart me-2"></i>Ventes',
        'pos': '<i class="fas fa-cash-register me-2"></i>Point de vente (POS)',
        'factures': '<i class="fas fa-file-invoice me-2"></i>Factures',
        'rapports': '<i class="fas fa-chart-bar me-2"></i>Rapports',
        'suggestions': '<i class="fas fa-lightbulb me-2"></i>Suggestions intelligentes',
        'audit': '<i class="fas fa-history me-2"></i>Journal d\'audit',
        'users': '<i class="fas fa-users-cog me-2"></i>Gestion des utilisateurs',
        'settings': '<i class="fas fa-cog me-2"></i>⚙️ Paramètres',
        'about': '<i class="fas fa-info-circle me-2"></i>À propos'
    };
    document.getElementById('pageTitle').innerHTML = titles[page] || page;
    
    if (page === 'dashboard') renderDashboard();
    else if (page === 'produits') renderProduits();
    else if (page === 'categories') renderCategories();
    else if (page === 'fournisseurs') renderFournisseurs();
    else if (page === 'entrees') renderEntrees();
    else if (page === 'sorties') renderSorties();
    else if (page === 'ventes') renderVentes();
    else if (page === 'pos') renderPOS();
    else if (page === 'factures') renderFactures();
    else if (page === 'rapports') renderRapports();
    else if (page === 'suggestions') renderSuggestions();
    else if (page === 'audit') renderAudit();
    else if (page === 'users') renderUsers();
    else if (page === 'settings') { chargerParametres(); }
    else if (page === 'about') renderAbout();
}

function renderAll() {
    renderDashboard(); 
    renderProduits(); 
    renderCategories(); 
    renderFournisseurs();
    renderEntrees(); 
    renderSorties(); 
    renderVentes(); 
    renderPOS();
    renderFactures(); 
    renderRapports(); 
    renderSuggestions(); 
    renderAudit(); 
    renderUsers(); 
    renderAbout();
}

// ================================================================
// PAGE À PROPOS
// ================================================================
function renderAbout() {
    document.getElementById('aboutProduits').textContent = produits.length;
    document.getElementById('aboutVentes').textContent = ventes.length;
    document.getElementById('aboutUsers').textContent = utilisateurs.length;
}

// ================================================================
// DASHBOARD
// ================================================================
function renderDashboard() {
    const totalProduits = produits.length;
    const stockTotal = produits.reduce((sum, p) => sum + p.quantite_stock, 0);
    const alertes = produits.filter(p => p.quantite_stock <= p.seuil_alerte);
    const perimes = produits.filter(p => p.date_peremption && new Date(p.date_peremption) < new Date());
    const totalCategories = categories.length;
    const ventesJour = ventes.filter(v => new Date(v.date_vente).toDateString() === new Date().toDateString());
    
    document.getElementById('statProduits').textContent = totalProduits;
    document.getElementById('statStockTotal').textContent = stockTotal;
    document.getElementById('statAlerte').textContent = alertes.length;
    document.getElementById('statPerimes').textContent = perimes.length;
    document.getElementById('statCategories').textContent = totalCategories;
    document.getElementById('statVentesJour').textContent = formatNumber(ventesJour.reduce((sum, v) => sum + v.total_ttc, 0)) + ' ' + (appSettings.currency || 'FC');
    
    const alertesList = document.getElementById('alertesList');
    if (alertes.length === 0) {
        alertesList.innerHTML = '<div class="text-center p-3 text-muted">✅ Aucune alerte stock</div>';
    } else {
        let html = '';
        alertes.forEach(p => { 
            html += `<div class="d-flex flex-wrap justify-content-between align-items-center p-2 border-bottom">
                <span>${p.nom}</span>
                <span><strong>${p.quantite_stock}</strong> / ${p.seuil_alerte}</span>
                <span class="badge bg-warning">Alerte</span>
            </div>`; 
        });
        alertesList.innerHTML = html;
    }
    
    const topProduitsList = document.getElementById('topProduitsList');
    const ventesParProduit = {};
    let totalVentesGlobal = 0;
    details_ventes.forEach(d => { 
        if (!ventesParProduit[d.produit_id]) ventesParProduit[d.produit_id] = 0; 
        ventesParProduit[d.produit_id] += d.quantite; 
        totalVentesGlobal += d.quantite; 
    });
    const sorted = Object.entries(ventesParProduit).sort((a, b) => b[1] - a[1]).slice(0, 5);
    
    if (sorted.length === 0) {
        topProduitsList.innerHTML = '<div class="text-center p-3 text-muted">Aucune vente enregistrée</div>';
    } else {
        let html = '';
        let topVentesTotal = 0;
        sorted.forEach(([id, qte]) => { 
            const p = getProduit(parseInt(id)); 
            if (p) { 
                topVentesTotal += qte; 
                const percentage = totalVentesGlobal > 0 ? Math.round(qte / totalVentesGlobal * 100) : 0; 
                html += `<div class="d-flex flex-wrap justify-content-between align-items-center p-2 border-bottom">
                    <span><i class="fas fa-box me-2" style="color:#667eea;"></i>${p.nom}</span>
                    <span><strong>${qte}</strong> unités</span>
                    <span class="badge bg-primary rounded-pill">${percentage}%</span>
                </div>`; 
            } 
        });
        if (html === '') {
            topProduitsList.innerHTML = '<div class="text-center p-3 text-muted">Aucun produit valide</div>';
        } else {
            html += `<div class="d-flex justify-content-between align-items-center p-2 total-top5" style="border-radius:0 0 10px 10px; border-top:2px solid #667eea;">
                <span>📊 Total (Top 5)</span>
                <span>${topVentesTotal} unités</span>
            </div>`;
            topProduitsList.innerHTML = html;
        }
    }
    setTimeout(() => { initCharts(); }, 100);
}

function initCharts() {
    const ventesParMois = {};
    ventes.forEach(v => { 
        const mois = new Date(v.date_vente).toLocaleString('fr-FR', { month: 'short', year: 'numeric' }); 
        ventesParMois[mois] = (ventesParMois[mois] || 0) + v.total_ttc; 
    });
    const labels = Object.keys(ventesParMois); 
    const data = Object.values(ventesParMois);
    
    if (ventesChart) ventesChart.destroy();
    const ctx = document.getElementById('ventesChart').getContext('2d');
    ventesChart = new Chart(ctx, {
        type: 'bar',
        data: { 
            labels: labels.length ? labels : ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun'], 
            datasets: [{ 
                label: 'CA (' + (appSettings.currency || 'FC') + ')', 
                data: data.length ? data : [0,0,0,0,0,0], 
                backgroundColor: 'rgba(102,126,234,0.6)', 
                borderColor: '#667eea', 
                borderWidth: 2 
            }] 
        },
        options: { 
            responsive: true, 
            maintainAspectRatio: false, 
            plugins: { legend: { display: false } }, 
            scales: { y: { beginAtZero: true } } 
        }
    });
    
    const catCount = {};
    produits.forEach(p => { 
        const nom = getCategorieNom(p.categorie_id); 
        catCount[nom] = (catCount[nom] || 0) + 1; 
    });
    const catLabels = Object.keys(catCount); 
    const catData = Object.values(catCount);
    
    if (categorieChart) categorieChart.destroy();
    const ctx2 = document.getElementById('categorieChart').getContext('2d');
    const colors = ['#667eea', '#2e7d32', '#f57c00', '#c62828', '#1a73e8', '#00695c'];
    categorieChart = new Chart(ctx2, {
        type: 'doughnut',
        data: { 
            labels: catLabels.length ? catLabels : ['Aucune'], 
            datasets: [{ 
                data: catData.length ? catData : [1], 
                backgroundColor: catData.length ? colors.slice(0, catData.length) : ['#e9ecef'], 
                borderWidth: 0 
            }] 
        },
        options: { 
            responsive: true, 
            maintainAspectRatio: false, 
            plugins: { 
                legend: { position: 'bottom', labels: { font: { size: 10 } } } 
            } 
        }
    });
}

// ================================================================
// RENDUX DES PAGES (versions simplifiées)
// ================================================================

function renderProduits() {
    const tbody = document.getElementById('produitsBody'); 
    let html = '';
    const search = document.getElementById('searchProduit')?.value?.toLowerCase() || '';
    let list = produits;
    if (search) list = produits.filter(p => p.nom.toLowerCase().includes(search) || p.code.toLowerCase().includes(search));
    if (list.length === 0) { 
        tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted">Aucun produit</td></tr>'; 
        return; 
    }
    list.forEach(p => {
        const estAlerte = p.quantite_stock <= p.seuil_alerte;
        html += `<tr style="${estAlerte ? 'background:#fff3e0;' : ''}">
            <td><code>${p.code}</code></td>
            <td><strong>${p.nom}</strong></td>
            <td>${getCategorieNom(p.categorie_id)}</td>
            <td class="${estAlerte ? 'text-danger fw-bold' : ''}">${p.quantite_stock}</td>
            <td>${p.seuil_alerte}</td>
            <td>${p.date_peremption ? new Date(p.date_peremption).toLocaleDateString('fr-FR') : '-'}</td>
            <td>${getStatutBadge(p.statut)}</td>
            <td>
                <button class="btn-modern primary sm" onclick="openModal('produit_edit', ${p.id})"><i class="fas fa-edit"></i></button>
                <button class="btn-modern danger sm" onclick="supprimerProduit(${p.id})"><i class="fas fa-trash"></i></button>
            </td>
        </tr>`;
    });
    tbody.innerHTML = html;
}

function renderCategories() {
    const tbody = document.getElementById('categoriesBody'); 
    let html = '';
    categories.forEach(c => {
        const count = produits.filter(p => p.categorie_id === c.id).length;
        html += `<tr>
            <td><strong>${c.nom}</strong></td>
            <td>${c.description || '-'}</td>
            <td><span class="badge bg-primary">${count}</span></td>
            <td>
                <button class="btn-modern primary sm" onclick="showToast('Modifier','info')"><i class="fas fa-edit"></i></button>
                <button class="btn-modern danger sm" onclick="if(confirm('Supprimer ?')){supprimerCategorieDB(${c.id});renderAll();showToast('Supprimé','success');}"><i class="fas fa-trash"></i></button>
            </td>
        </tr>`;
    });
    tbody.innerHTML = html || '<tr><td colspan="4" class="text-center text-muted">Aucune catégorie</td></tr>';
}

function renderFournisseurs() {
    const tbody = document.getElementById('fournisseursBody'); 
    let html = '';
    fournisseurs.forEach(f => {
        html += `<tr>
            <td><strong>${f.nom}</strong></td>
            <td>${f.contact || '-'}</td>
            <td>${f.telephone || '-'}</td>
            <td>${f.email || '-'}</td>
            <td>
                <button class="btn-modern primary sm" onclick="showToast('Modifier','info')"><i class="fas fa-edit"></i></button>
                <button class="btn-modern danger sm" onclick="if(confirm('Supprimer ?')){supprimerFournisseurDB(${f.id});renderAll();showToast('Supprimé','success');}"><i class="fas fa-trash"></i></button>
            </td>
        </tr>`;
    });
    tbody.innerHTML = html || '<tr><td colspan="5" class="text-center text-muted">Aucun fournisseur</td></tr>';
}

function renderEntrees() {
    const tbody = document.getElementById('entreesBody'); 
    let html = '';
    entrees.forEach(e => {
        const p = getProduit(e.produit_id); 
        const f = getFournisseur(e.fournisseur_id);
        html += `<tr>
            <td>${p ? p.nom : 'Inconnu'}</td>
            <td>${f ? f.nom : '-'}</td>
            <td><strong>${e.quantite}</strong></td>
            <td>${formatNumber(e.prix_unitaire)} ${appSettings.currency || 'FC'}</td>
            <td><strong>${formatNumber(e.quantite * e.prix_unitaire)} ${appSettings.currency || 'FC'}</strong></td>
            <td>${new Date(e.date_entree).toLocaleDateString('fr-FR')}</td>
        </tr>`;
    });
    tbody.innerHTML = html || '<tr><td colspan="6" class="text-center text-muted">Aucune entrée</td></tr>';
}

function renderSorties() {
    const tbody = document.getElementById('sortiesBody'); 
    let html = '';
    const types = { 'vente': 'Vente', 'perte': 'Perte', 'utilisation': 'Utilisation', 'transfert': 'Transfert' };
    sorties.forEach(s => {
        const p = getProduit(s.produit_id);
        html += `<tr>
            <td>${p ? p.nom : 'Inconnu'}</td>
            <td><span class="badge ${s.type_sortie === 'vente' ? 'bg-success' : 'bg-warning'}">${types[s.type_sortie] || s.type_sortie}</span></td>
            <td><strong>${s.quantite}</strong></td>
            <td>${s.motif || '-'}</td>
            <td>${new Date(s.date_sortie).toLocaleDateString('fr-FR')}</td>
        </tr>`;
    });
    tbody.innerHTML = html || '<tr><td colspan="5" class="text-center text-muted">Aucune sortie</td></tr>';
}

// ================================================================
// GESTION DES SÉLECTIONS
// ================================================================

function toggleAllVentes() {
    const checkAll = document.getElementById('selectAllVentes');
    if (!checkAll) return;
    
    const checkboxes = document.querySelectorAll('.vente-checkbox');
    checkboxes.forEach(cb => {
        cb.checked = checkAll.checked;
        if (checkAll.checked) {
            ventesSelectionnees.add(parseInt(cb.value));
        } else {
            ventesSelectionnees.delete(parseInt(cb.value));
        }
    });
    updateSelectionUI();
}

function toggleVenteSelection(id) {
    const cb = document.querySelector(`.vente-checkbox[value="${id}"]`);
    if (cb) {
        if (cb.checked) ventesSelectionnees.add(id);
        else ventesSelectionnees.delete(id);
    }
    updateSelectionUI();
    const allCbs = document.querySelectorAll('.vente-checkbox');
    document.getElementById('selectAllVentes').checked = allCbs.length > 0 && allCbs.every(c => c.checked);
}

function selectAllVentes() {
    document.querySelectorAll('.vente-checkbox').forEach(cb => { 
        cb.checked = true; 
        ventesSelectionnees.add(parseInt(cb.value)); 
    });
    document.getElementById('selectAllVentes').checked = true;
    updateSelectionUI();
}

function deselectAllVentes() {
    document.querySelectorAll('.vente-checkbox').forEach(cb => { 
        cb.checked = false; 
        ventesSelectionnees.delete(parseInt(cb.value)); 
    });
    document.getElementById('selectAllVentes').checked = false;
    updateSelectionUI();
}

function updateSelectionUI() {
    const count = ventesSelectionnees.size;
    const btn = document.getElementById('btnSupprimerSelection');
    const nbSpan = document.getElementById('nbSelection');
    if (count > 0) { 
        btn.style.display = 'inline-flex'; 
        nbSpan.textContent = count; 
    } else { 
        btn.style.display = 'none'; 
        nbSpan.textContent = '0'; 
    }
}

function toggleAllFactures() {
    const checkAll = document.getElementById('selectAllFactures');
    if (!checkAll) return;
    
    const checkboxes = document.querySelectorAll('.facture-checkbox');
    checkboxes.forEach(cb => {
        cb.checked = checkAll.checked;
        if (checkAll.checked) {
            facturesSelectionnees.add(parseInt(cb.value));
        } else {
            facturesSelectionnees.delete(parseInt(cb.value));
        }
    });
    updateFactureUI();
}

function toggleFactureSelection(id) {
    const cb = document.querySelector(`.facture-checkbox[value="${id}"]`);
    if (cb) {
        if (cb.checked) facturesSelectionnees.add(id);
        else facturesSelectionnees.delete(id);
    }
    updateFactureUI();
    const allCbs = document.querySelectorAll('.facture-checkbox');
    document.getElementById('selectAllFactures').checked = allCbs.length > 0 && allCbs.every(c => c.checked);
}

function selectAllFactures() {
    document.querySelectorAll('.facture-checkbox').forEach(cb => { 
        cb.checked = true; 
        facturesSelectionnees.add(parseInt(cb.value)); 
    });
    document.getElementById('selectAllFactures').checked = true;
    updateFactureUI();
}

function deselectAllFactures() {
    document.querySelectorAll('.facture-checkbox').forEach(cb => { 
        cb.checked = false; 
        facturesSelectionnees.delete(parseInt(cb.value)); 
    });
    document.getElementById('selectAllFactures').checked = false;
    updateFactureUI();
}

function updateFactureUI() {
    const count = facturesSelectionnees.size;
    document.getElementById('btnDetailFacture').disabled = count !== 1;
    document.getElementById('btnModifierFacture').disabled = count !== 1;
    document.getElementById('btnPDFFacture').disabled = count !== 1;
    document.getElementById('btnImprimerFacture').disabled = count !== 1;
    const btnSuppr = document.getElementById('btnSupprimerFacture');
    const nbSpan = document.getElementById('nbFactureSelection');
    if (count > 0) { 
        btnSuppr.style.display = 'inline-flex'; 
        nbSpan.textContent = count; 
    } else { 
        btnSuppr.style.display = 'none'; 
        nbSpan.textContent = '0'; 
    }
}

function getFactureSelectionnee() {
    if (facturesSelectionnees.size !== 1) { 
        showToast('Veuillez sélectionner une seule facture', 'warning'); 
        return null; 
    }
    return Array.from(facturesSelectionnees)[0];
}

function voirDetailFactureSelectionnee() { 
    const id = getFactureSelectionnee(); 
    if (id !== null) voirDetailFacture(id); 
}

function modifierFactureSelectionnee() { 
    const id = getFactureSelectionnee(); 
    if (id !== null) modifierFacture(id); 
}

function exporterFacturePDFSelectionnee() { 
    const id = getFactureSelectionnee(); 
    if (id !== null) exporterFacturePDF(id); 
}

function imprimerFactureSelectionnee() { 
    const id = getFactureSelectionnee(); 
    if (id !== null) imprimerFacture(id); 
}

// ================================================================
// VIDER HISTORIQUES
// ================================================================
async function viderHistoriqueEntrees() {
    if (entrees.length === 0) { 
        showToast('📭 L\'historique des entrées est déjà vide', 'info'); 
        return; 
    }
    if (!confirm(`⚠️ Voulez-vous vraiment supprimer définitivement les ${entrees.length} entrées ?`)) return;
    
    const ids = entrees.map(e => e.id);
    try {
        await supprimerEntreesDB(ids);
        await addAuditLog('Historique entrées vidé', `${ids.length} entrées supprimées`);
        renderEntrees();
        renderAll();
        showToast(`🗑️ ${ids.length} entrée(s) supprimée(s) !`, 'success');
    } catch (error) {
        console.error('Erreur vidage entrées:', error);
        showToast('❌ Erreur lors du vidage', 'error');
    }
}

async function viderHistoriqueSorties() {
    if (sorties.length === 0) { 
        showToast('📭 L\'historique des sorties est déjà vide', 'info'); 
        return; 
    }
    if (!confirm(`⚠️ Voulez-vous vraiment supprimer définitivement les ${sorties.length} sorties ?`)) return;
    
    const ids = sorties.map(s => s.id);
    try {
        await supprimerSortiesDB(ids);
        await addAuditLog('Historique sorties vidé', `${ids.length} sorties supprimées`);
        renderSorties();
        renderAll();
        showToast(`🗑️ ${ids.length} sortie(s) supprimée(s) !`, 'success');
    } catch (error) {
        console.error('Erreur vidage sorties:', error);
        showToast('❌ Erreur lors du vidage', 'error');
    }
}

async function viderJournalAudit() {
    if (auditLogs.length === 0) { 
        showToast('Le journal d\'audit est déjà vide', 'info'); 
        return; 
    }
    if (confirm('⚠️ Voulez-vous vraiment vider tout le journal d\'audit ?')) {
        const ids = auditLogs.map(l => l.id);
        try {
            await supprimerAuditLogsDB(ids);
            renderAudit();
            showToast(`🗑️ Journal vidé (${ids.length} entrées)`, 'success');
        } catch (error) {
            console.error('Erreur vidage audit:', error);
            showToast('❌ Erreur lors du vidage', 'error');
        }
    }
}

// ================================================================
// MODAL
// ================================================================
function openModal(type, id = null) {
    const modal = document.getElementById('modalSim');
    const title = document.getElementById('modalTitle');
    const body = document.getElementById('modalBody');
    modal.classList.add('active');

    switch(type) {
        case 'produit':
            title.textContent = '📦 Nouveau produit';
            body.innerHTML = `
                <div class="form-group"><label>Nom *</label><input type="text" id="fNom" class="form-control" placeholder="Nom du produit"></div>
                <div class="form-group"><label>Description</label><textarea id="fDesc" class="form-control" rows="2"></textarea></div>
                <div class="row g-2">
                    <div class="col-6"><div class="form-group"><label>Catégorie</label><select id="fCategorie" class="form-control">${categories.map(c => `<option value="${c.id}">${c.nom}</option>`).join('')}</select></div></div>
                    <div class="col-6"><div class="form-group"><label>Fournisseur</label><select id="fFournisseur" class="form-control">${fournisseurs.map(f => `<option value="${f.id}">${f.nom}</option>`).join('')}</select></div></div>
                </div>
                <div class="row g-2">
                    <div class="col-6"><div class="form-group"><label>Prix achat</label><input type="number" id="fPrixAchat" class="form-control" placeholder="15000"></div></div>
                    <div class="col-6"><div class="form-group"><label>Prix vente</label><input type="number" id="fPrixVente" class="form-control" placeholder="18000"></div></div>
                </div>
                <div class="row g-2">
                    <div class="col-4"><div class="form-group"><label>Stock</label><input type="number" id="fStock" class="form-control" placeholder="0"></div></div>
                    <div class="col-4"><div class="form-group"><label>Seuil</label><input type="number" id="fSeuil" class="form-control" placeholder="5"></div></div>
                    <div class="col-4"><div class="form-group"><label>Unité</label><input type="text" id="fUnite" class="form-control" placeholder="pièce" value="pièce"></div></div>
                </div>
                <div class="form-group"><label>Péremption</label><input type="date" id="fPeremption" class="form-control"></div>
                <div class="d-flex flex-wrap gap-2">
                    <button class="btn-modern primary" onclick="sauvegarderProduit()"><i class="fas fa-save"></i> Enregistrer</button>
                    <button class="btn-modern secondary" onclick="closeModal()">Annuler</button>
                </div>
            `;
            break;

        case 'produit_edit':
            const p = getProduit(id);
            if (!p) { closeModal(); return; }
            title.textContent = '✏️ Modifier ' + p.nom;
            body.innerHTML = `
                <div class="form-group"><label>Nom *</label><input type="text" id="fNom" class="form-control" value="${p.nom}"></div>
                <div class="form-group"><label>Description</label><textarea id="fDesc" class="form-control" rows="2">${p.description || ''}</textarea></div>
                <div class="row g-2">
                    <div class="col-6"><div class="form-group"><label>Catégorie</label><select id="fCategorie" class="form-control">${categories.map(c => `<option value="${c.id}" ${c.id === p.categorie_id ? 'selected' : ''}>${c.nom}</option>`).join('')}</select></div></div>
                    <div class="col-6"><div class="form-group"><label>Fournisseur</label><select id="fFournisseur" class="form-control">${fournisseurs.map(f => `<option value="${f.id}" ${f.id === p.fournisseur_id ? 'selected' : ''}>${f.nom}</option>`).join('')}</select></div></div>
                </div>
                <div class="row g-2">
                    <div class="col-6"><div class="form-group"><label>Prix achat</label><input type="number" id="fPrixAchat" class="form-control" value="${p.prix_achat}"></div></div>
                    <div class="col-6"><div class="form-group"><label>Prix vente</label><input type="number" id="fPrixVente" class="form-control" value="${p.prix_vente}"></div></div>
                </div>
                <div class="row g-2">
                    <div class="col-4"><div class="form-group"><label>Stock</label><input type="number" id="fStock" class="form-control" value="${p.quantite_stock}"></div></div>
                    <div class="col-4"><div class="form-group"><label>Seuil</label><input type="number" id="fSeuil" class="form-control" value="${p.seuil_alerte}"></div></div>
                    <div class="col-4"><div class="form-group"><label>Unité</label><input type="text" id="fUnite" class="form-control" value="${p.unite}"></div></div>
                </div>
                <div class="form-group"><label>Péremption</label><input type="date" id="fPeremption" class="form-control" value="${p.date_peremption || ''}"></div>
                <div class="form-group"><label>Statut</label>
                    <select id="fStatut" class="form-control">
                        <option value="actif" ${p.statut === 'actif' ? 'selected' : ''}>Actif</option>
                        <option value="inactif" ${p.statut === 'inactif' ? 'selected' : ''}>Inactif</option>
                        <option value="rupture" ${p.statut === 'rupture' ? 'selected' : ''}>Rupture</option>
                    </select>
                </div>
                <div class="d-flex flex-wrap gap-2">
                    <button class="btn-modern primary" onclick="sauvegarderProduitEdit(${id})"><i class="fas fa-save"></i> Modifier</button>
                    <button class="btn-modern secondary" onclick="closeModal()">Annuler</button>
                </div>
            `;
            break;

        case 'categorie':
            title.textContent = '🏷️ Nouvelle catégorie';
            body.innerHTML = `
                <div class="form-group"><label>Nom *</label><input type="text" id="fCatNom" class="form-control" placeholder="Ex: Alimentaire"></div>
                <div class="form-group"><label>Description</label><textarea id="fCatDesc" class="form-control" rows="2"></textarea></div>
                <div class="d-flex flex-wrap gap-2">
                    <button class="btn-modern primary" onclick="sauvegarderCategorie()"><i class="fas fa-save"></i> Enregistrer</button>
                    <button class="btn-modern secondary" onclick="closeModal()">Annuler</button>
                </div>
            `;
            break;

        case 'fournisseur':
            title.textContent = '🚚 Nouveau fournisseur';
            body.innerHTML = `
                <div class="form-group"><label>Nom *</label><input type="text" id="fFournNom" class="form-control" placeholder="Ex: Fresh Supply"></div>
                <div class="form-group"><label>Contact</label><input type="text" id="fFournContact" class="form-control" placeholder="Nom du contact"></div>
                <div class="form-group"><label>Téléphone</label><input type="text" id="fFournTel" class="form-control" placeholder="+243 812 345 678"></div>
                <div class="form-group"><label>Email</label><input type="email" id="fFournEmail" class="form-control" placeholder="contact@fournisseur.com"></div>
                <div class="d-flex flex-wrap gap-2">
                    <button class="btn-modern primary" onclick="sauvegarderFournisseur()"><i class="fas fa-save"></i> Enregistrer</button>
                    <button class="btn-modern secondary" onclick="closeModal()">Annuler</button>
                </div>
            `;
            break;

        case 'entree':
            title.textContent = '📥 Nouvelle entrée';
            const produitsOpts = produits.map(p => `<option value="${p.id}">${p.nom} (${p.code}) - Stock: ${p.quantite_stock}</option>`).join('');
            const fournisseursOpts = fournisseurs.map(f => `<option value="${f.id}">${f.nom}</option>`).join('');
            body.innerHTML = `
                <div class="form-group"><label>Produit *</label><select id="fEntreeProduit" class="form-control">${produitsOpts}</select></div>
                <div class="form-group"><label>Fournisseur</label><select id="fEntreeFournisseur" class="form-control">${fournisseursOpts}</select></div>
                <div class="row g-2">
                    <div class="col-6"><div class="form-group"><label>Quantité *</label><input type="number" id="fEntreeQte" class="form-control" placeholder="0" min="1"></div></div>
                    <div class="col-6"><div class="form-group"><label>Prix unit. *</label><input type="number" id="fEntreePrix" class="form-control" placeholder="0" min="0"></div></div>
                </div>
                <div class="form-group"><label>Date</label><input type="date" id="fEntreeDate" class="form-control" value="${new Date().toISOString().split('T')[0]}"></div>
                <div class="d-flex flex-wrap gap-2">
                    <button class="btn-modern success" onclick="sauvegarderEntree()"><i class="fas fa-save"></i> Enregistrer</button>
                    <button class="btn-modern secondary" onclick="closeModal()">Annuler</button>
                </div>
            `;
            break;

        case 'sortie':
            title.textContent = '📤 Nouvelle sortie';
            const produitsOpts2 = produits.map(p => `<option value="${p.id}">${p.nom} (${p.code}) - Stock: ${p.quantite_stock}</option>`).join('');
            body.innerHTML = `
                <div class="form-group"><label>Produit *</label><select id="fSortieProduit" class="form-control">${produitsOpts2}</select></div>
                <div class="row g-2">
                    <div class="col-6"><div class="form-group"><label>Quantité *</label><input type="number" id="fSortieQte" class="form-control" placeholder="0" min="1"></div></div>
                    <div class="col-6"><div class="form-group"><label>Type</label>
                        <select id="fSortieType" class="form-control">
                            <option value="vente">Vente</option>
                            <option value="perte">Perte</option>
                            <option value="utilisation">Utilisation</option>
                            <option value="transfert">Transfert</option>
                        </select>
                    </div></div>
                </div>
                <div class="form-group"><label>Motif</label><input type="text" id="fSortieMotif" class="form-control" placeholder="Raison"></div>
                <div class="form-group"><label>Date</label><input type="date" id="fSortieDate" class="form-control" value="${new Date().toISOString().split('T')[0]}"></div>
                <div class="d-flex flex-wrap gap-2">
                    <button class="btn-modern danger" onclick="sauvegarderSortie()"><i class="fas fa-save"></i> Enregistrer</button>
                    <button class="btn-modern secondary" onclick="closeModal()">Annuler</button>
                </div>
            `;
            break;

        default:
            body.innerHTML = `<p>Fonctionnalité en cours...</p>
                <button class="btn-modern secondary" onclick="closeModal()">Fermer</button>`;
    }
}

function closeModal() { 
    document.getElementById('modalSim').classList.remove('active'); 
}

// ================================================================
// SAUVEGARDES DES FORMULAIRES
// ================================================================

async function sauvegarderCategorie() {
    const nom = document.getElementById('fCatNom').value.trim();
    if (!nom) { showToast('Veuillez saisir un nom de catégorie', 'error'); return; }
    const description = document.getElementById('fCatDesc').value.trim();
    
    try {
        await ajouterCategorie({ nom, description });
        await addAuditLog('Catégorie ajoutée', `Catégorie: ${nom}`);
        closeModal();
        renderAll();
        showToast('Catégorie ajoutée !', 'success');
    } catch (error) {
        console.error('Erreur:', error);
        showToast('❌ Erreur lors de l\'ajout', 'error');
    }
}

async function sauvegarderFournisseur() {
    const nom = document.getElementById('fFournNom').value.trim();
    if (!nom) { showToast('Veuillez saisir un nom de fournisseur', 'error'); return; }
    const contact = document.getElementById('fFournContact').value.trim();
    const telephone = document.getElementById('fFournTel').value.trim();
    const email = document.getElementById('fFournEmail').value.trim();
    
    try {
        await ajouterFournisseur({ nom, contact, telephone, email });
        await addAuditLog('Fournisseur ajouté', `Fournisseur: ${nom}`);
        closeModal();
        renderAll();
        showToast('Fournisseur ajouté !', 'success');
    } catch (error) {
        console.error('Erreur:', error);
        showToast('❌ Erreur lors de l\'ajout', 'error');
    }
}

async function sauvegarderEntree() {
    const produit_id = parseInt(document.getElementById('fEntreeProduit').value);
    const fournisseur_id = parseInt(document.getElementById('fEntreeFournisseur').value);
    const quantite = parseInt(document.getElementById('fEntreeQte').value);
    const prix_unitaire = parseFloat(document.getElementById('fEntreePrix').value);
    const date_entree = document.getElementById('fEntreeDate').value || new Date().toISOString();
    
    if (!produit_id || !quantite || quantite <= 0 || !prix_unitaire || prix_unitaire <= 0) {
        showToast('Veuillez remplir tous les champs obligatoires', 'error');
        return;
    }
    
    try {
        const produit = getProduit(produit_id);
        if (!produit) { showToast('Produit non trouvé', 'error'); return; }
        
        const nouveauStock = produit.quantite_stock + quantite;
        await mettreAJourProduit(produit_id, {
            quantite_stock: nouveauStock,
            statut: nouveauStock > produit.seuil_alerte ? 'actif' : produit.statut
        });
        
        await ajouterEntree({ produit_id, fournisseur_id, quantite, prix_unitaire, date_entree });
        
        await addAuditLog('Entrée stock', `Produit: ${produit.nom}, Qté: ${quantite}`);
        
        closeModal();
        renderAll();
        showToast(`Entrée de ${quantite} ${produit.unite} de "${produit.nom}" enregistrée !`, 'success');
    } catch (error) {
        console.error('Erreur:', error);
        showToast('❌ Erreur lors de l\'enregistrement', 'error');
    }
}

async function sauvegarderSortie() {
    const produit_id = parseInt(document.getElementById('fSortieProduit').value);
    const quantite = parseInt(document.getElementById('fSortieQte').value);
    const type_sortie = document.getElementById('fSortieType').value;
    const motif = document.getElementById('fSortieMotif').value.trim() || 'Sortie stock';
    const date_sortie = document.getElementById('fSortieDate').value || new Date().toISOString();
    
    if (!produit_id || !quantite || quantite <= 0) {
        showToast('Veuillez sélectionner un produit et une quantité valide', 'error');
        return;
    }
    
    try {
        const produit = getProduit(produit_id);
        if (!produit) { showToast('Produit non trouvé', 'error'); return; }
        
        if (produit.quantite_stock < quantite) {
            showToast(`Stock insuffisant ! Disponible: ${produit.quantite_stock}`, 'error');
            return;
        }
        
        const nouveauStock = produit.quantite_stock - quantite;
        await mettreAJourProduit(produit_id, {
            quantite_stock: nouveauStock,
            statut: nouveauStock <= 0 ? 'rupture' : produit.statut
        });
        
        await ajouterSortie({ produit_id, quantite, type_sortie, date_sortie, motif });
        
        await addAuditLog('Sortie stock', `Produit: ${produit.nom}, Qté: ${quantite}`);
        
        closeModal();
        renderAll();
        showToast(`Sortie de ${quantite} ${produit.unite} de "${produit.nom}" enregistrée !`, 'success');
    } catch (error) {
        console.error('Erreur:', error);
        showToast('❌ Erreur lors de l\'enregistrement', 'error');
    }
}

async function sauvegarderProduit() {
    const nom = document.getElementById('fNom').value.trim();
    if (!nom) { showToast('Veuillez saisir un nom', 'error'); return; }
    
    try {
        const maxId = produits.reduce((max, p) => p.id > max ? p.id : max, 0);
        const code = 'PRD-' + String(maxId + 1).padStart(3, '0');
        
        const nouveauProduit = {
            code,
            nom,
            description: document.getElementById('fDesc').value.trim(),
            categorie_id: parseInt(document.getElementById('fCategorie').value),
            fournisseur_id: parseInt(document.getElementById('fFournisseur').value),
            prix_achat: parseFloat(document.getElementById('fPrixAchat').value) || 0,
            prix_vente: parseFloat(document.getElementById('fPrixVente').value) || 0,
            quantite_stock: parseInt(document.getElementById('fStock').value) || 0,
            seuil_alerte: parseInt(document.getElementById('fSeuil').value) || 5,
            unite: document.getElementById('fUnite').value.trim() || 'pièce',
            date_peremption: document.getElementById('fPeremption').value || null,
            statut: 'actif'
        };
        
        await ajouterProduit(nouveauProduit);
        
        await addAuditLog('Produit ajouté', `Produit: ${nom}`);
        
        closeModal();
        renderAll();
        showToast('Produit ajouté !', 'success');
    } catch (error) {
        console.error('Erreur:', error);
        showToast('❌ Erreur lors de l\'ajout', 'error');
    }
}

async function sauvegarderProduitEdit(id) {
    const nom = document.getElementById('fNom').value.trim();
    if (!nom) { showToast('Veuillez saisir un nom', 'error'); return; }
    
    try {
        const updates = {
            nom,
            description: document.getElementById('fDesc').value.trim(),
            categorie_id: parseInt(document.getElementById('fCategorie').value),
            fournisseur_id: parseInt(document.getElementById('fFournisseur').value),
            prix_achat: parseFloat(document.getElementById('fPrixAchat').value) || 0,
            prix_vente: parseFloat(document.getElementById('fPrixVente').value) || 0,
            quantite_stock: parseInt(document.getElementById('fStock').value) || 0,
            seuil_alerte: parseInt(document.getElementById('fSeuil').value) || 5,
            unite: document.getElementById('fUnite').value.trim() || 'pièce',
            date_peremption: document.getElementById('fPeremption').value || null,
            statut: document.getElementById('fStatut').value
        };
        
        await mettreAJourProduit(id, updates);
        
        await addAuditLog('Produit modifié', `Produit: ${nom}`);
        
        closeModal();
        renderAll();
        showToast('Produit modifié !', 'success');
    } catch (error) {
        console.error('Erreur:', error);
        showToast('❌ Erreur lors de la modification', 'error');
    }
}

// ================================================================
// SUPPRESSION PRODUIT
// ================================================================
async function supprimerProduit(id) {
    const produit = produits.find(p => p.id === id);
    if (!produit) { showToast('Produit non trouvé', 'error'); return; }
    if (!confirm(`⚠️ Supprimer définitivement "${produit.nom}" ?`)) return;
    
    try {
        const { error } = await supabaseClient
            .from('produits')
            .delete()
            .eq('id', id);
        
        if (error) {
            if (error.code === '23503') {
                console.log('🔄 Suppression des références...');
                
                await supabaseClient.from('entrees').delete().eq('produit_id', id);
                await supabaseClient.from('sorties').delete().eq('produit_id', id);
                await supabaseClient.from('details_ventes').delete().eq('produit_id', id);
                
                const { error: error2 } = await supabaseClient
                    .from('produits')
                    .delete()
                    .eq('id', id);
                
                if (error2) throw error2;
            } else {
                throw error;
            }
        }
        
        produits = produits.filter(p => p.id !== id);
        
        await addAuditLog('Produit supprimé', `Produit ${produit.nom} (${produit.code}) supprimé`);
        renderAll();
        showToast(`🗑️ Produit "${produit.nom}" supprimé !`, 'success');
    } catch (error) {
        console.error('❌ Erreur suppression produit:', error);
        showToast('❌ Erreur lors de la suppression du produit', 'error');
    }
}

// ================================================================
// GESTION DES UTILISATEURS (Admin)
// ================================================================
async function changerRole(id, newRole) {
    const user = utilisateurs.find(u => u.id === id);
    if (!user || user.role === newRole) return;
    if (!confirm(`Changer le rôle de ${user.nom} en "${newRole}" ?`)) return;
    
    try {
        await mettreAJourUtilisateur(id, { role: newRole });
        await addAuditLog('Changement de rôle', `Utilisateur ${user.email} -> ${newRole}`);
        renderUsers();
        showToast(`Rôle de ${user.nom} changé en ${newRole}`, 'success');
    } catch (error) {
        console.error('Erreur:', error);
        showToast('❌ Erreur lors du changement de rôle', 'error');
    }
}

async function changerStatut(id, newStatut) {
    const user = utilisateurs.find(u => u.id === id);
    if (!user || user.statut === newStatut) return;
    const statutLabels = { 'active': '✅ Actif', 'pending': '⏳ En attente', 'inactive': '⛔ Inactif' };
    if (!confirm(`Changer le statut de ${user.nom} en "${statutLabels[newStatut]}" ?`)) return;
    
    try {
        await mettreAJourUtilisateur(id, { statut: newStatut });
        await addAuditLog('Changement de statut', `Utilisateur ${user.email} -> ${newStatut}`);
        renderUsers();
        showToast(`Statut de ${user.nom} changé en ${statutLabels[newStatut]}`, 'success');
    } catch (error) {
        console.error('Erreur:', error);
        showToast('❌ Erreur lors du changement de statut', 'error');
    }
}

async function supprimerUtilisateur(id) {
    const user = utilisateurs.find(u => u.id === id);
    if (!user) return;
    if (user.email === 'admin@freshstock.com') {
        showToast('⛔ L\'admin par défaut ne peut pas être supprimé !', 'error');
        return;
    }
    if (!confirm(`Supprimer définitivement "${user.nom}" (${user.email}) ?`)) return;
    
    try {
        await supprimerUtilisateurDB(id);
        await addAuditLog('Utilisateur supprimé', `Utilisateur ${user.email} supprimé`);
        renderUsers();
        renderAll();
        showToast(`Utilisateur ${user.nom} supprimé !`, 'success');
    } catch (error) {
        console.error('Erreur:', error);
        showToast('❌ Erreur lors de la suppression', 'error');
    }
}

// ================================================================
// CHANGEMENT DE MOT DE PASSE
// ================================================================
function ouvrirChangementMotDePasse(userId) {
    const user = utilisateurs.find(u => u.id === userId);
    if (!user) { showToast('Utilisateur non trouvé', 'error'); return; }
    const isCurrentUser = sessionUser && user.id === sessionUser.id;
    const modal = document.getElementById('modalSim');
    const title = document.getElementById('modalTitle');
    const body = document.getElementById('modalBody');
    title.textContent = `🔑 Changer le mot de passe - ${user.nom}`;
    body.innerHTML = `
        <div class="alert alert-info"><i class="fas fa-info-circle me-2"></i>${isCurrentUser ? 'Vous changez votre propre mot de passe.' : `Vous changez le mot de passe de <strong>${user.nom}</strong>.`}</div>
        ${isCurrentUser ? `<div class="form-group"><label><i class="fas fa-lock me-1"></i> Mot de passe actuel *</label><input type="password" id="oldPassword" class="form-control" placeholder="Mot de passe actuel" required></div>` : `<div class="alert alert-warning"><i class="fas fa-exclamation-triangle me-2"></i> En tant qu'admin, vous pouvez changer ce mot de passe.</div>`}
        <div class="form-group"><label><i class="fas fa-lock me-1"></i> Nouveau mot de passe *</label><input type="password" id="newPassword1" class="form-control" placeholder="Min 6 caractères" required minlength="6"></div>
        <div class="form-group"><label><i class="fas fa-check me-1"></i> Confirmer *</label><input type="password" id="newPassword2" class="form-control" placeholder="Confirmer" required></div>
        <div class="d-flex flex-wrap gap-2 mt-3">
            <button class="btn-modern primary" onclick="validerChangementMotDePasse(${userId})"><i class="fas fa-save"></i> Changer</button>
            <button class="btn-modern secondary" onclick="closeModal()">Annuler</button>
        </div>
    `;
    modal.classList.add('active');
}

async function validerChangementMotDePasse(userId) {
    const user = utilisateurs.find(u => u.id === userId);
    if (!user) { showToast('Utilisateur non trouvé', 'error'); return; }
    const isCurrentUser = sessionUser && user.id === sessionUser.id;
    const newPass1 = document.getElementById('newPassword1').value;
    const newPass2 = document.getElementById('newPassword2').value;
    
    if (!newPass1 || newPass1.length < 6) {
        showToast('Le nouveau mot de passe doit contenir au moins 6 caractères.', 'error');
        return;
    }
    if (newPass1 !== newPass2) {
        showToast('Les mots de passe ne correspondent pas.', 'error');
        return;
    }
    
    if (isCurrentUser) {
        const oldPass = document.getElementById('oldPassword').value;
        if (!oldPass) { showToast('Veuillez entrer votre mot de passe actuel.', 'error'); return; }
        if (user.mot_de_passe !== oldPass) {
            showToast('❌ Mot de passe actuel incorrect.', 'error');
            return;
        }
        if (oldPass === newPass1) {
            showToast('Le nouveau mot de passe doit être différent.', 'warning');
            return;
        }
    }
    
    try {
        await mettreAJourUtilisateur(userId, { mot_de_passe: newPass1 });
        await addAuditLog('Mot de passe changé', `Utilisateur ${user.email} a changé son mot de passe`);
        closeModal();
        renderUsers();
        showToast(`✅ Mot de passe de ${user.nom} modifié !`, 'success');
    } catch (error) {
        console.error('Erreur:', error);
        showToast('❌ Erreur lors du changement', 'error');
    }
}

// ================================================================
// RAPPORTS ET SUGGESTIONS
// ================================================================
function renderRapports() {
    document.getElementById('rapportDateDebut').style.display = document.getElementById('rapportType').value === 'personnalise' ? 'block' : 'none';
    document.getElementById('rapportDateFin').style.display = document.getElementById('rapportType').value === 'personnalise' ? 'block' : 'none';
    if (!document.getElementById('rapportDateStart').value) {
        const d = new Date(); d.setDate(d.getDate() - 30);
        document.getElementById('rapportDateStart').value = d.toISOString().split('T')[0];
        document.getElementById('rapportDateEnd').value = new Date().toISOString().split('T')[0];
    }
    genererRapport();
}

function genererRapport() {
    const type = document.getElementById('rapportType').value;
    let startDate, endDate, now = new Date();
    switch(type) {
        case 'journalier': startDate = new Date(now); endDate = new Date(now); break;
        case 'hebdomadaire': startDate = new Date(now); startDate.setDate(now.getDate() - 7); endDate = new Date(now); break;
        case 'mensuel': startDate = new Date(now); startDate.setMonth(now.getMonth() - 1); endDate = new Date(now); break;
        case 'personnalise': startDate = new Date(document.getElementById('rapportDateStart').value); endDate = new Date(document.getElementById('rapportDateEnd').value); break;
        default: startDate = new Date(now); endDate = new Date(now);
    }
    const ventesFiltrees = ventes.filter(v => { const d = new Date(v.date_vente); return d >= startDate && d <= endDate; });
    const totalVentes = ventesFiltrees.length;
    const totalCA = ventesFiltrees.reduce((sum, v) => sum + v.total_ttc, 0);
    const totalProduitsVendus = details_ventes.filter(d => ventesFiltrees.some(v => v.id === d.vente_id)).reduce((sum, d) => sum + d.quantite, 0);
    const prodVendus = {};
    details_ventes.filter(d => ventesFiltrees.some(v => v.id === d.vente_id)).forEach(d => { 
        if (!prodVendus[d.produit_id]) prodVendus[d.produit_id] = 0; 
        prodVendus[d.produit_id] += d.quantite; 
    });
    const topProd = Object.entries(prodVendus).sort((a, b) => b[1] - a[1]).slice(0, 5);
    let html = `<div class="row g-3">
        <div class="col-6 col-md-3"><div class="stat-card"><div class="number">${totalVentes}</div><div class="label">Total ventes</div></div></div>
        <div class="col-6 col-md-3"><div class="stat-card"><div class="number">${formatNumber(totalCA)} ${appSettings.currency || 'FC'}</div><div class="label">CA</div></div></div>
        <div class="col-6 col-md-3"><div class="stat-card"><div class="number">${totalProduitsVendus}</div><div class="label">Produits vendus</div></div></div>
        <div class="col-6 col-md-3"><div class="stat-card"><div class="number">${formatNumber(totalCA * (appSettings.taxRate || 16) / 100)} ${appSettings.currency || 'FC'}</div><div class="label">Bénéfices estimés</div></div></div>
    </div>
    <div class="card mt-3">
        <div class="card-header bg-light">Top 5 produits vendus</div>
        <div class="card-body p-0">
            <table class="table table-hover mb-0">
                <thead><tr><th>Produit</th><th>Quantité</th><th>CA</th></tr></thead>
                <tbody>`;
    if (topProd.length === 0) html += '<tr><td colspan="3" class="text-center text-muted">Aucune vente</td></tr>';
    else topProd.forEach(([id, qte]) => { 
        const p = getProduit(parseInt(id)); 
        html += `<tr><td>${p ? p.nom : 'Inconnu'}</td><td>${qte}</td><td>${formatNumber(qte * (p ? p.prix_vente : 0))} ${appSettings.currency || 'FC'}</td></tr>`; 
    });
    html += `</tbody></table></div></div>`;
    document.getElementById('rapportResultats').innerHTML = html;
}

function renderSuggestions() {
    const prodVentes = {};
    details_ventes.forEach(d => { 
        if (!prodVentes[d.produit_id]) prodVentes[d.produit_id] = 0; 
        prodVentes[d.produit_id] += d.quantite; 
    });
    const top = Object.entries(prodVentes).sort((a, b) => b[1] - a[1]).slice(0, 5);
    let htmlTop = ''; 
    if (top.length === 0) htmlTop = '<div class="text-center p-3 text-muted">Aucune donnée</div>'; 
    else top.forEach(([id, qte]) => { 
        const p = getProduit(parseInt(id)); 
        htmlTop += `<div class="d-flex flex-wrap justify-content-between p-2 border-bottom">
            <span>${p ? p.nom : 'Inconnu'}</span>
            <span><strong>${qte}</strong> unités</span>
        </div>`; 
    });
    document.getElementById('suggestionsTopVentes').innerHTML = htmlTop;
    
    const produitsVendus = new Set(details_ventes.map(d => d.produit_id));
    const faibleRotation = produits.filter(p => !produitsVendus.has(p.id) && p.quantite_stock > 0);
    let htmlFaible = ''; 
    if (faibleRotation.length === 0) htmlFaible = '<div class="text-center p-3 text-success">✅ Tous les produits se vendent bien</div>'; 
    else faibleRotation.slice(0, 5).forEach(p => { 
        htmlFaible += `<div class="d-flex flex-wrap justify-content-between p-2 border-bottom">
            <span>${p.nom}</span>
            <span class="text-muted">Stock: ${p.quantite_stock}</span>
        </div>`; 
    });
    document.getElementById('suggestionsFaibleRotation').innerHTML = htmlFaible;
    
    const moisVentes = {}; 
    ventes.forEach(v => { 
        const mois = new Date(v.date_vente).toLocaleString('fr-FR', { month: 'long' }); 
        if (!moisVentes[mois]) moisVentes[mois] = 0; 
        moisVentes[mois] += v.total_ttc; 
    });
    const sortedMois = Object.entries(moisVentes).sort((a, b) => b[1] - a[1]);
    let htmlPeriodes = ''; 
    if (sortedMois.length === 0) htmlPeriodes = '<div class="text-center p-3 text-muted">Aucune donnée</div>'; 
    else sortedMois.slice(0, 3).forEach(([mois, ca]) => { 
        htmlPeriodes += `<div class="d-flex flex-wrap justify-content-between p-2 border-bottom">
            <span>${mois}</span>
            <span><strong>${formatNumber(ca)} ${appSettings.currency || 'FC'}</strong></span>
        </div>`; 
    });
    document.getElementById('suggestionsPeriodes').innerHTML = htmlPeriodes;
    
    const alertes = produits.filter(p => p.quantite_stock <= p.seuil_alerte);
    const perimes = produits.filter(p => p.date_peremption && new Date(p.date_peremption) < new Date());
    let htmlRecommandations = ''; 
    if (alertes.length === 0 && perimes.length === 0) htmlRecommandations = '<div class="text-center p-3 text-success">✅ Tout est en ordre</div>';
    else { 
        if (alertes.length > 0) htmlRecommandations += `<div class="p-2 border-bottom"><i class="fas fa-exclamation-triangle text-warning"></i> Réapprovisionner : ${alertes.map(p => p.nom).join(', ')}</div>`; 
        if (perimes.length > 0) htmlRecommandations += `<div class="p-2 border-bottom"><i class="fas fa-calendar-times text-danger"></i> Périmés : ${perimes.map(p => p.nom).join(', ')}</div>`; 
    }
    document.getElementById('suggestionsRecommandations').innerHTML = htmlRecommandations;
}

// ================================================================
// VALIDER VENTE (POS)
// ================================================================
async function validerVente() {
    if (posPanier.length === 0) { 
        showToast('Panier vide !', 'error'); 
        return; 
    }
    
    try {
        for (const item of posPanier) {
            const p = getProduit(item.produit_id);
            if (!p) {
                showToast('Produit non trouvé', 'error');
                return;
            }
            if (p.quantite_stock < item.quantite) {
                showToast(`Stock insuffisant pour ${p.nom}. Disponible: ${p.quantite_stock}`, 'error');
                return;
            }
        }
        
        const totalHt = posPanier.reduce((sum, item) => sum + (item.quantite * item.prix_unitaire), 0);
        const tva = totalHt * (appSettings.taxRate || 16) / 100;
        const totalTtc = totalHt + tva;
        const client = document.getElementById('posClient').value || 'Client ' + (ventes.length + 1);
        
        const now = new Date();
        const dateStr = now.toISOString().slice(0,10).replace(/-/g, '');
        const todayVentes = ventes.filter(v => v.date_vente && v.date_vente.startsWith(now.toISOString().slice(0,10)));
        const numVente = 'FV-' + dateStr + '-' + String(todayVentes.length + 1).padStart(3, '0');
        
        console.log('📝 Création de la vente:', {
            numero_vente: numVente,
            client: client,
            total_ht: totalHt,
            tva: tva,
            total_ttc: totalTtc
        });
        
        const venteData = {
            numero_vente: numVente,
            client: client,
            date_vente: now.toISOString(),
            total_ht: totalHt,
            tva: tva,
            total_ttc: totalTtc,
            statut: 'terminee'
        };
        
        const { data: vente, error: venteError } = await supabaseClient
            .from('ventes')
            .insert([venteData])
            .select();
        
        if (venteError) {
            console.error('❌ Erreur création vente:', venteError);
            showToast('❌ Erreur lors de la création de la vente: ' + venteError.message, 'error');
            return;
        }
        
        if (!vente || vente.length === 0) {
            showToast('❌ Erreur: Vente non créée', 'error');
            return;
        }
        
        const nouvelleVente = vente[0];
        console.log('✅ Vente créée:', nouvelleVente);
        
        for (const item of posPanier) {
            const detailData = {
                vente_id: nouvelleVente.id,
                produit_id: item.produit_id,
                quantite: item.quantite,
                prix_unitaire: item.prix_unitaire
            };
            
            const { error: detailError } = await supabaseClient
                .from('details_ventes')
                .insert([detailData]);
            
            if (detailError) {
                console.error('❌ Erreur détail vente:', detailError);
                showToast('❌ Erreur lors de l\'ajout des détails', 'error');
                return;
            }
            
            const p = getProduit(item.produit_id);
            if (p) {
                const nouveauStock = p.quantite_stock - item.quantite;
                const { error: stockError } = await supabaseClient
                    .from('produits')
                    .update({ 
                        quantite_stock: nouveauStock,
                        statut: nouveauStock <= 0 ? 'rupture' : p.statut
                    })
                    .eq('id', item.produit_id);
                
                if (stockError) {
                    console.error('❌ Erreur mise à jour stock:', stockError);
                }
                
                p.quantite_stock = nouveauStock;
                if (nouveauStock <= 0) p.statut = 'rupture';
            }
            
            const { error: sortieError } = await supabaseClient
                .from('sorties')
                .insert([{
                    produit_id: item.produit_id,
                    quantite: item.quantite,
                    type_sortie: 'vente',
                    date_sortie: now.toISOString(),
                    motif: 'Vente ' + numVente
                }]);
            
            if (sortieError) {
                console.error('❌ Erreur sortie:', sortieError);
            }
        }
        
        ventes.unshift(nouvelleVente);
        
        await ajouterAuditLogSupabase({
            utilisateur: sessionUser ? sessionUser.email : 'système',
            action: 'Vente',
            details: `Vente ${numVente} - Total: ${formatNumber(totalTtc)} ${appSettings.currency || 'FC'}`
        });
        
        posPanier = [];
        document.getElementById('posClient').value = '';
        updatePosPanier();
        
        renderAll();
        showToast('✅ Vente validée ! Facture: ' + numVente, 'success');
        
    } catch (error) {
        console.error('❌ Erreur validation vente:', error);
        showToast('❌ Erreur lors de la validation de la vente: ' + (error.message || 'Erreur inconnue'), 'error');
    }
}

// ================================================================
// POS
// ================================================================
function renderPOS() {
    const select = document.getElementById('posCategorie');
    if (!select) return;
    select.innerHTML = '<option value="">Toutes</option>';
    categories.forEach(c => { select.innerHTML += `<option value="${c.id}">${c.nom}</option>`; });
    searchPosProduits(); 
    updatePosPanier();
}

function searchPosProduits() {
    const container = document.getElementById('posProduitsList');
    if (!container) return;
    const search = document.getElementById('posSearch')?.value?.toLowerCase() || '';
    const categorieId = document.getElementById('posCategorie')?.value || '';
    let list = produits.filter(p => p.quantite_stock > 0 && p.statut === 'actif');
    if (search) list = list.filter(p => p.nom.toLowerCase().includes(search) || p.code.toLowerCase().includes(search));
    if (categorieId) list = list.filter(p => p.categorie_id == categorieId);
    if (list.length === 0) { 
        container.innerHTML = '<div class="col-12 text-center text-muted p-3">Aucun produit disponible</div>'; 
        return; 
    }
    let html = '';
    list.forEach(p => {
        html += `<div class="col-6 col-md-4 col-lg-3">
            <div class="card p-2 text-center pos-produit-card" onclick="ajouterAuPanier(${p.id})" style="cursor:pointer;">
                <div style="font-size:1.8rem;">📦</div>
                <div><strong style="font-size:0.85rem;">${p.nom}</strong></div>
                <div style="font-size:0.8rem;">${formatNumber(p.prix_vente)} ${appSettings.currency || 'FC'}</div>
                <small class="text-muted" style="font-size:0.7rem;">Stock: ${p.quantite_stock}</small>
            </div>
        </div>`;
    });
    container.innerHTML = html;
}

function ajouterAuPanier(produitId) {
    const p = getProduit(produitId);
    if (!p) { showToast('Produit non trouvé', 'error'); return; }
    if (p.quantite_stock <= 0) { showToast('Stock insuffisant !', 'error'); return; }
    const existing = posPanier.find(item => item.produit_id === produitId);
    if (existing) { 
        if (existing.quantite >= p.quantite_stock) { showToast('Stock insuffisant !', 'error'); return; } 
        existing.quantite++; 
    } else {
        posPanier.push({ produit_id: produitId, quantite: 1, prix_unitaire: p.prix_vente });
    }
    updatePosPanier(); 
    showToast(`${p.nom} ajouté au panier`, 'success');
}

function updatePosPanier() {
    const container = document.getElementById('posCart');
    if (!container) return;
    if (posPanier.length === 0) { 
        container.innerHTML = '<div class="text-center text-muted">Panier vide</div>'; 
        document.getElementById('posTotal').textContent = '0 ' + (appSettings.currency || 'FC'); 
        return; 
    }
    let html = '', total = 0;
    posPanier.forEach((item, index) => {
        const p = getProduit(item.produit_id);
        const ligneTotal = item.quantite * item.prix_unitaire; 
        total += ligneTotal;
        html += `<div class="cart-item">
            <div>
                <strong style="font-size:0.85rem;">${p ? p.nom : 'Inconnu'}</strong>
                <div><small>${item.quantite} × ${formatNumber(item.prix_unitaire)} ${appSettings.currency || 'FC'}</small></div>
            </div>
            <div>
                <strong>${formatNumber(ligneTotal)} ${appSettings.currency || 'FC'}</strong>
                <button class="btn-modern danger sm" onclick="posPanier.splice(${index},1);updatePosPanier();"><i class="fas fa-trash"></i></button>
            </div>
        </div>`;
    });
    container.innerHTML = html;
    document.getElementById('posTotal').textContent = formatNumber(total) + ' ' + (appSettings.currency || 'FC');
}

// ================================================================
// VENTES & FACTURES - VERSION CORRIGÉE
// ================================================================

function renderVentes() {
    const tbody = document.getElementById('ventesBody'); 
    let html = '';
    const search = document.getElementById('searchVente')?.value?.toLowerCase() || '';
    let list = ventes;
    if (search) list = ventes.filter(v => v.numero_vente.toLowerCase().includes(search) || v.client.toLowerCase().includes(search));
    
    if (list.length === 0) { 
        tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">Aucune vente</td></tr>'; 
        const selectAll = document.getElementById('selectAllVentes');
        if (selectAll) selectAll.checked = false;
        updateSelectionUI();
        return; 
    }
    
    list.forEach(v => {
        const isChecked = ventesSelectionnees.has(v.id);
        html += `<tr>
            <td><input type="checkbox" class="vente-checkbox select-checkbox" value="${v.id}" ${isChecked ? 'checked' : ''} onchange="toggleVenteSelection(${v.id})"></td>
            <td><strong>${v.numero_vente}</strong></td>
            <td>${v.client}</td>
            <td>${new Date(v.date_vente).toLocaleDateString('fr-FR')}</td>
            <td><strong>${formatNumber(v.total_ttc)} ${appSettings.currency || 'FC'}</strong></td>
            <td>${v.statut === 'terminee' ? '<span class="badge bg-success">Terminée</span>' : '<span class="badge bg-warning">En cours</span>'}</td>
            <td>
                <button class="btn-modern info sm" onclick="showToast('Détail vente','info')"><i class="fas fa-eye"></i></button>
                <button class="btn-modern danger sm btn-export-pdf" onclick="exporterFacturePDF(${v.id})"><i class="fas fa-file-pdf"></i> PDF</button>
                <button class="btn-modern danger sm" onclick="supprimerVente(${v.id})"><i class="fas fa-trash"></i></button>
            </td>
        </tr>`;
    });
    tbody.innerHTML = html;
    
    const allCbs = document.querySelectorAll('.vente-checkbox');
    const selectAll = document.getElementById('selectAllVentes');
    if (selectAll) {
        if (allCbs && allCbs.length > 0) {
            selectAll.checked = Array.from(allCbs).every(c => c.checked);
        } else {
            selectAll.checked = false;
        }
    }
    updateSelectionUI();
}

async function supprimerVente(id) {
    const vente = ventes.find(v => v.id === id);
    if (!vente) { showToast('Vente non trouvée', 'error'); return; }
    if (!confirm(`⚠️ Supprimer "${vente.numero_vente}" ?`)) return;
    try {
        await supprimerVenteDB(id);
        await addAuditLog('Vente supprimée', `Vente ${vente.numero_vente} supprimée`);
        ventesSelectionnees.delete(id);
        renderVentes();
        renderAll();
        showToast(`🗑️ Vente "${vente.numero_vente}" supprimée !`, 'success');
    } catch (error) {
        console.error('Erreur:', error);
        showToast('❌ Erreur lors de la suppression', 'error');
    }
}

// ✅ RENDER FACTURES CORRIGÉ
function renderFactures() {
    const tbody = document.getElementById('facturesBody');
    if (!tbody) return;
    
    let html = '';
    const total = ventes.length;
    const payees = ventes.filter(v => v.statut === 'terminee').length;
    const impayees = ventes.filter(v => v.statut === 'en_cours' || v.statut === 'annulee').length;
    
    document.getElementById('factureTotal').textContent = 'Total: ' + total;
    document.getElementById('facturePayees').textContent = 'Payées: ' + payees;
    document.getElementById('factureImpayees').textContent = 'Impayées: ' + impayees;
    
    if (ventes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">Aucune facture</td></tr>';
        const selectAll = document.getElementById('selectAllFactures');
        if (selectAll) selectAll.checked = false;
        updateFactureUI();
        return;
    }
    
    // 🔍 DEBUG : Vérifier les données
    console.log('🔍 Détails des ventes:', details_ventes);
    console.log('📊 Nombre de détails:', details_ventes.length);
    
    ventes.forEach(v => {
        // 🔥 CORRECTION : Compter correctement les produits
        const details = details_ventes.filter(d => d.vente_id === v.id);
        const nbProduits = details.length;
        
        // 🔍 DEBUG : Afficher le nombre de produits par vente
        console.log(`Facture ${v.numero_vente} (ID: ${v.id}): ${nbProduits} produit(s)`);
        
        const isChecked = facturesSelectionnees.has(v.id);
        
        // 🔥 CORRECTION : Afficher les noms des produits
        let produitsList = '';
        if (details.length > 0) {
            const noms = details.map(d => {
                const p = getProduit(d.produit_id);
                return p ? p.nom : 'Produit inconnu (ID: ' + d.produit_id + ')';
            });
            produitsList = noms.join(', ');
            if (produitsList.length > 30) {
                produitsList = produitsList.substring(0, 30) + '...';
            }
        }
        
        html += `<tr>
            <td><input type="checkbox" class="facture-checkbox select-checkbox" value="${v.id}" ${isChecked ? 'checked' : ''} onchange="toggleFactureSelection(${v.id})"></td>
            <td><strong>${v.numero_vente}</strong></td>
            <td>${v.client || 'Client inconnu'}</td>
            <td>${new Date(v.date_vente).toLocaleDateString('fr-FR')}</td>
            <td><strong>${formatNumber(v.total_ttc)} ${appSettings.currency || 'FC'}</strong></td>
            <td>
                ${v.statut === 'terminee' ? '<span class="badge bg-success">✅ Terminée</span>' : 
                  v.statut === 'en_cours' ? '<span class="badge bg-warning">⏳ En cours</span>' : 
                  '<span class="badge bg-danger">❌ Annulée</span>'}
                <br>
                <small class="text-muted">
                    ${nbProduits} produit${nbProduits > 1 ? 's' : ''}
                    ${nbProduits > 0 ? `<br><span style="font-size:0.7rem; color:#888;">${produitsList}</span>` : ''}
                </small>
            </td>
        </tr>`;
    });
    
    tbody.innerHTML = html;
    
    const allCbs = document.querySelectorAll('.facture-checkbox');
    const selectAll = document.getElementById('selectAllFactures');
    if (selectAll) {
        selectAll.checked = allCbs.length > 0 && Array.from(allCbs).every(c => c.checked);
    }
    updateFactureUI();
}

// ✅ RAFRAÎCHIR FACTURES
async function rafraichirVentes() {
    showToast('🔄 Rafraîchissement des ventes...', 'info');
    
    try {
        await chargerVentes();
        await chargerDetailsVentes();
        renderVentes();
        showToast('✅ Ventes mises à jour !', 'success');
    } catch (error) {
        console.error('❌ Erreur rafraîchissement:', error);
        showToast('❌ Erreur lors du rafraîchissement', 'error');
    }
}

async function rafraichirFactures() {
    showToast('🔄 Rafraîchissement des factures...', 'info');
    
    try {
        await chargerVentes();
        await chargerDetailsVentes();
        renderFactures();
        showToast('✅ Factures mises à jour !', 'success');
    } catch (error) {
        console.error('❌ Erreur rafraîchissement:', error);
        showToast('❌ Erreur lors du rafraîchissement', 'error');
    }
}

function voirDetailFacture(venteId) {
    const vente = ventes.find(v => v.id === venteId);
    if (!vente) { showToast('Facture non trouvée', 'error'); return; }
    const details = details_ventes.filter(d => d.vente_id === venteId);
    const modal = document.getElementById('modalSim'); 
    const title = document.getElementById('modalTitle'); 
    const body = document.getElementById('modalBody');
    title.textContent = `📄 Détail facture - ${vente.numero_vente}`;
    let detailsHtml = ''; 
    let totalLignes = 0;
    details.forEach(d => { 
        const p = getProduit(d.produit_id); 
        const ligneTotal = d.quantite * d.prix_unitaire; 
        totalLignes += ligneTotal; 
        detailsHtml += `<div class="facture-detail-item">
            <span>${p ? p.nom : 'Inconnu'} (${d.quantite} × ${formatNumber(d.prix_unitaire)} ${appSettings.currency || 'FC'})</span>
            <span><strong>${formatNumber(ligneTotal)} ${appSettings.currency || 'FC'}</strong></span>
        </div>`; 
    });
    body.innerHTML = `
        <div style="background:#f8f9fa; padding:15px; border-radius:10px; margin-bottom:15px;">
            <div class="row g-2">
                <div class="col-6">
                    <p><strong>N° :</strong> ${vente.numero_vente}</p>
                    <p><strong>Client :</strong> ${vente.client}</p>
                    <p><strong>Date :</strong> ${new Date(vente.date_vente).toLocaleDateString('fr-FR')}</p>
                </div>
                <div class="col-6 text-end">
                    <p><strong>Statut :</strong> ${vente.statut === 'terminee' ? '✅ Terminée' : '⏳ En cours'}</p>
                    <p><strong>Total HT :</strong> ${formatNumber(vente.total_ht)} ${appSettings.currency || 'FC'}</p>
                    <p><strong>TVA :</strong> ${formatNumber(vente.tva)} ${appSettings.currency || 'FC'}</p>
                    <p><strong style="color:#667eea;">Total TTC :</strong> <strong>${formatNumber(vente.total_ttc)} ${appSettings.currency || 'FC'}</strong></p>
                </div>
            </div>
        </div>
        <div style="margin-bottom:15px;">
            <strong>Produits :</strong>
            <div style="margin-top:8px; border:1px solid #e9ecef; border-radius:8px; padding:10px;">
                ${detailsHtml}
                <div class="facture-detail-item" style="font-weight:bold; border-top:2px solid #667eea; margin-top:5px; padding-top:8px;">
                    <span>TOTAL</span>
                    <span>${formatNumber(totalLignes)} ${appSettings.currency || 'FC'}</span>
                </div>
            </div>
        </div>
        <div class="d-flex flex-wrap gap-2">
            <button class="btn-modern danger sm btn-export-pdf" onclick="exporterFacturePDF(${venteId}); closeModal();"><i class="fas fa-file-pdf"></i> PDF</button>
            <button class="btn-modern secondary" onclick="closeModal()">Fermer</button>
        </div>
    `;
    modal.classList.add('active');
}

function modifierFacture(venteId) {
    const vente = ventes.find(v => v.id === venteId);
    if (!vente) { showToast('Facture non trouvée', 'error'); return; }
    if (vente.statut !== 'terminee') { showToast('Seules les factures terminées peuvent être modifiées', 'warning'); return; }
    const details = details_ventes.filter(d => d.vente_id === venteId);
    const modal = document.getElementById('modalSim'); 
    const title = document.getElementById('modalTitle'); 
    const body = document.getElementById('modalBody');
    title.textContent = `✏️ Modifier facture - ${vente.numero_vente}`;
    let detailsHtml = '';
    details.forEach((d, index) => { 
        const p = getProduit(d.produit_id); 
        detailsHtml += `<div class="facture-detail-item" style="padding:8px 0;">
            <span>${p ? p.nom : 'Inconnu'} - <strong>${d.quantite}</strong> × ${formatNumber(d.prix_unitaire)} ${appSettings.currency || 'FC'} = <strong>${formatNumber(d.quantite * d.prix_unitaire)} ${appSettings.currency || 'FC'}</strong></span>
            <button class="btn-modern danger sm" onclick="enleverProduitFacture(${venteId}, ${index})"><i class="fas fa-times"></i></button>
        </div>`; 
    });
    const produitsOptions = produits.filter(p => p.quantite_stock > 0 && p.statut === 'actif')
        .map(p => `<option value="${p.id}" data-prix="${p.prix_vente}">${p.nom} (${formatNumber(p.prix_vente)} ${appSettings.currency || 'FC'}) - Stock: ${p.quantite_stock}</option>`).join('');
    body.innerHTML = `
        <div style="background:#f8f9fa; padding:15px; border-radius:10px; margin-bottom:15px;">
            <div class="row g-2">
                <div class="col-6"><div class="form-group"><label>Client</label><input type="text" id="editFactureClient" class="form-control" value="${vente.client}"></div></div>
                <div class="col-6"><div class="form-group"><label>Statut</label>
                    <select id="editFactureStatut" class="form-control">
                        <option value="terminee" ${vente.statut === 'terminee' ? 'selected' : ''}>✅ Terminée</option>
                        <option value="en_cours" ${vente.statut === 'en_cours' ? 'selected' : ''}>⏳ En cours</option>
                        <option value="annulee" ${vente.statut === 'annulee' ? 'selected' : ''}>❌ Annulée</option>
                    </select>
                </div></div>
            </div>
        </div>
        <div style="margin-bottom:15px;">
            <strong>Produits actuels :</strong>
            <div style="margin-top:8px; border:1px solid #e9ecef; border-radius:8px; padding:10px;">${detailsHtml || '<span class="text-muted">Aucun produit</span>'}</div>
        </div>
        <div style="margin-bottom:15px;">
            <strong>Ajouter un produit :</strong>
            <div class="row g-2 mt-2">
                <div class="col-7"><select id="editFactureProduit" class="form-control">${produitsOptions}</select></div>
                <div class="col-3"><input type="number" id="editFactureQuantite" class="form-control" placeholder="Qté" value="1" min="1"></div>
                <div class="col-2"><button class="btn-modern primary sm" onclick="ajouterProduitFacture(${venteId})"><i class="fas fa-plus"></i></button></div>
            </div>
        </div>
        <div class="d-flex flex-wrap gap-2">
            <button class="btn-modern success" onclick="sauvegarderModificationFacture(${venteId})"><i class="fas fa-save"></i> Enregistrer</button>
            <button class="btn-modern secondary" onclick="closeModal()">Annuler</button>
        </div>
    `;
    modal.classList.add('active');
}

function ajouterProduitFacture(venteId) {
    const produitId = parseInt(document.getElementById('editFactureProduit').value);
    const quantite = parseInt(document.getElementById('editFactureQuantite').value) || 1;
    if (!produitId || quantite <= 0) { 
        showToast('Sélectionnez un produit et une quantité valide', 'error'); 
        return; 
    }
    const p = getProduit(produitId);
    if (!p) { showToast('Produit non trouvé', 'error'); return; }
    const existant = details_ventes.find(d => d.vente_id === venteId && d.produit_id === produitId);
    if (existant) { showToast('Ce produit est déjà dans la facture.', 'warning'); return; }
    if (p.quantite_stock < quantite) { 
        showToast(`Stock insuffisant ! Disponible: ${p.quantite_stock}`, 'error'); 
        return; 
    }
    details_ventes.push({ 
        id: nextId.detail++, 
        vente_id: venteId, 
        produit_id: produitId, 
        quantite: quantite, 
        prix_unitaire: p.prix_vente 
    });
    p.quantite_stock -= quantite; 
    if (p.quantite_stock <= 0) p.statut = 'rupture';
    recalculerTotauxVente(venteId);
    showToast('Produit ajouté', 'success');
    modifierFacture(venteId); 
    sauvegarderDonnees(); 
    renderAll();
}

function enleverProduitFacture(venteId, index) {
    const details = details_ventes.filter(d => d.vente_id === venteId);
    if (index >= details.length) return;
    const detail = details[index]; 
    const p = getProduit(detail.produit_id);
    if (p) { 
        p.quantite_stock += detail.quantite; 
        if (p.quantite_stock > p.seuil_alerte) p.statut = 'actif'; 
    }
    const detailId = detail.id; 
    details_ventes = details_ventes.filter(d => d.id !== detailId);
    recalculerTotauxVente(venteId);
    showToast('Produit retiré', 'success');
    modifierFacture(venteId); 
    sauvegarderDonnees(); 
    renderAll();
}

function recalculerTotauxVente(venteId) {
    const vente = ventes.find(v => v.id === venteId);
    if (!vente) return;
    const details = details_ventes.filter(d => d.vente_id === venteId);
    const totalHt = details.reduce((sum, d) => sum + (d.quantite * d.prix_unitaire), 0);
    vente.total_ht = totalHt; 
    vente.tva = totalHt * (appSettings.taxRate || 16) / 100; 
    vente.total_ttc = totalHt + vente.tva;
}

function sauvegarderModificationFacture(venteId) {
    const vente = ventes.find(v => v.id === venteId);
    if (!vente) { showToast('Facture non trouvée', 'error'); return; }
    const nouveauClient = document.getElementById('editFactureClient').value.trim();
    const nouveauStatut = document.getElementById('editFactureStatut').value;
    if (nouveauClient) vente.client = nouveauClient;
    vente.statut = nouveauStatut;
    recalculerTotauxVente(venteId);
    sauvegarderDonnees();
    closeModal(); 
    renderAll(); 
    showToast('Facture modifiée !', 'success');
}

// ================================================================
// AUDIT
// ================================================================
function renderAudit() {
    const tbody = document.getElementById('auditBody'); 
    let html = '';
    document.getElementById('auditTotal').textContent = auditLogs.length;
    if (auditLogs.length > 0) { 
        const dernier = auditLogs[auditLogs.length - 1]; 
        document.getElementById('auditDernier').textContent = dernier.date || '-'; 
    } else {
        document.getElementById('auditDernier').textContent = '-';
    }
    if (auditLogs.length === 0) { 
        tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">Aucun log</td></tr>'; 
        return; 
    }
    auditLogs.forEach(log => { 
        html += `<tr>
            <td>${log.date || '-'}</td>
            <td>${log.utilisateur || 'système'}</td>
            <td><span class="badge bg-primary">${log.action || '-'}</span></td>
            <td>${log.details || '-'}</td>
        </tr>`; 
    });
    tbody.innerHTML = html;
}

// ================================================================
// EXPORTS PDF FACTURE
// ================================================================
function exporterFacturePDF(venteId) {
    const vente = ventes.find(v => v.id === venteId);
    if (!vente) { showToast('Vente non trouvée', 'error'); return; }
    const details = details_ventes.filter(d => d.vente_id === venteId);
    const client = vente.client || 'Client inconnu';
    const content = document.createElement('div');
    content.style.padding = '40px';
    content.style.fontFamily = 'Arial, sans-serif';
    content.style.maxWidth = '800px';
    content.style.margin = '0 auto';
    content.style.backgroundColor = 'white';
    content.style.color = '#1a2332';
    content.style.borderRadius = '12px';
    
    content.innerHTML = `
        <div style="text-align:center; border-bottom:3px solid #667eea; padding-bottom:20px; margin-bottom:25px;">
            <h1 style="color:#667eea; font-size:28px; margin:0; font-weight:800;">FreshStock</h1>
            <p style="color:#6b7a8f; margin:5px 0; font-size:14px;">ERP de gestion d'entrepôt</p>
            <p style="color:#6b7a8f; margin:0; font-size:13px;">${appSettings.companyName || 'FreshStock SARL'}</p>
        </div>
        <div style="display:flex; justify-content:space-between; margin-bottom:25px; background:#f8f9fa; padding:15px; border-radius:8px; flex-wrap:wrap; gap:10px;">
            <div><h3 style="margin:0; color:#1a2332; font-size:22px; font-weight:700;">FACTURE</h3><p style="margin:5px 0; color:#6b7a8f; font-size:14px;">N° <strong>${vente.numero_vente}</strong></p></div>
            <div style="text-align:right;"><p style="margin:3px 0; color:#6b7a8f; font-size:13px;"><strong>Date :</strong> ${new Date(vente.date_vente).toLocaleDateString('fr-FR')}</p><p style="margin:3px 0; color:#6b7a8f; font-size:13px;"><strong>Client :</strong> ${client}</p></div>
        </div>
        <table style="width:100%; border-collapse:collapse; margin-bottom:20px; border-radius:8px; overflow:hidden;">
            <thead><tr style="background:#667eea; color:white;">
                <th style="padding:12px 15px; text-align:left;">Produit</th>
                <th style="padding:12px 15px; text-align:center;">Qté</th>
                <th style="padding:12px 15px; text-align:right;">Prix unit.</th>
                <th style="padding:12px 15px; text-align:right;">Total</th>
            </tr></thead>
            <tbody>${details.map(d => { 
                const p = getProduit(d.produit_id); 
                return `<tr style="border-bottom:1px solid #e9ecef;">
                    <td style="padding:12px 15px;">${p ? p.nom : 'Inconnu'}</td>
                    <td style="padding:12px 15px; text-align:center;">${d.quantite}</td>
                    <td style="padding:12px 15px; text-align:right;">${formatNumber(d.prix_unitaire)} ${appSettings.currency || 'FC'}</td>
                    <td style="padding:12px 15px; text-align:right; font-weight:600;">${formatNumber(d.quantite * d.prix_unitaire)} ${appSettings.currency || 'FC'}</td>
                </tr>`;
            }).join('')}</tbody>
            <tfoot>
                <tr style="background:#f8f9fa;"><td colspan="3" style="padding:12px 15px; text-align:right; font-weight:600;">Total HT</td><td style="padding:12px 15px; text-align:right; font-weight:600;">${formatNumber(vente.total_ht)} ${appSettings.currency || 'FC'}</td></tr>
                <tr style="background:#f8f9fa;"><td colspan="3" style="padding:12px 15px; text-align:right; font-weight:600;">TVA (${appSettings.taxRate || 16}%)</td><td style="padding:12px 15px; text-align:right; font-weight:600;">${formatNumber(vente.tva)} ${appSettings.currency || 'FC'}</td></tr>
                <tr style="background:#667eea; color:white;"><td colspan="3" style="padding:15px; text-align:right; font-weight:700; font-size:18px;">TOTAL TTC</td><td style="padding:15px; text-align:right; font-weight:700; font-size:18px;">${formatNumber(vente.total_ttc)} ${appSettings.currency || 'FC'}</td></tr>
            </tfoot>
        </table>
        <div style="margin-top:30px; border-top:2px solid #e9ecef; padding-top:20px; text-align:center;">
            <p style="color:#6b7a8f; font-size:13px;">Merci de votre confiance.</p>
            <p style="color:#aab; font-size:11px;">Version ${APP_VERSION} - Développé par Angi.inc</p>
        </div>
    `;
    
    html2pdf().from(content).set({ 
        margin: 10, 
        filename: `Facture_${vente.numero_vente}.pdf`, 
        html2canvas: { scale: 2, useCORS: true }, 
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } 
    })
    .save().then(() => { 
        showToast(`Facture ${vente.numero_vente} générée !`, 'success'); 
    })
    .catch(err => { 
        showToast('Erreur PDF', 'error'); 
        console.error(err); 
    });
}

function imprimerFacture(venteId) {
    exporterFacturePDF(venteId);
}

// ================================================================
// EXPORTS EXCEL & PDF
// ================================================================
function exporterProduitsExcel() {
    if (produits.length === 0) { showToast('Aucun produit à exporter', 'warning'); return; }
    const data = produits.map(p => ({ 
        'Code': p.code, 
        'Nom': p.nom, 
        'Description': p.description || '', 
        'Catégorie': getCategorieNom(p.categorie_id), 
        'Fournisseur': getFournisseurNom(p.fournisseur_id), 
        'Prix Achat': p.prix_achat + ' ' + (appSettings.currency || 'FC'), 
        'Prix Vente': p.prix_vente + ' ' + (appSettings.currency || 'FC'), 
        'Stock': p.quantite_stock, 
        'Seuil': p.seuil_alerte, 
        'Unité': p.unite, 
        'Péremption': p.date_peremption || '', 
        'Statut': p.statut 
    }));
    const ws = XLSX.utils.json_to_sheet(data); 
    const wb = XLSX.utils.book_new(); 
    XLSX.utils.book_append_sheet(wb, ws, 'Produits');
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' }); 
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    saveAs(blob, `Produits_${new Date().toISOString().slice(0,10)}.xlsx`);
    showToast('Export Excel réussi !', 'success');
}

function exporterVentesExcel() {
    if (ventes.length === 0) { showToast('Aucune vente à exporter', 'warning'); return; }
    const data = ventes.map(v => ({ 
        'N° Facture': v.numero_vente, 
        'Client': v.client, 
        'Date': v.date_vente, 
        'Total HT': v.total_ht + ' ' + (appSettings.currency || 'FC'), 
        'TVA (16%)': v.tva + ' ' + (appSettings.currency || 'FC'), 
        'Total TTC': v.total_ttc + ' ' + (appSettings.currency || 'FC'), 
        'Statut': v.statut === 'terminee' ? 'Terminée' : 'En cours' 
    }));
    const ws = XLSX.utils.json_to_sheet(data); 
    const wb = XLSX.utils.book_new(); 
    XLSX.utils.book_append_sheet(wb, ws, 'Ventes');
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' }); 
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    saveAs(blob, `Ventes_${new Date().toISOString().slice(0,10)}.xlsx`);
    showToast('Export Excel réussi !', 'success');
}

function exporterRapportExcel() {
    const type = document.getElementById('rapportType').value;
    let startDate, endDate, now = new Date();
    switch(type) {
        case 'journalier': startDate = new Date(now); endDate = new Date(now); break;
        case 'hebdomadaire': startDate = new Date(now); startDate.setDate(now.getDate() - 7); endDate = new Date(now); break;
        case 'mensuel': startDate = new Date(now); startDate.setMonth(now.getMonth() - 1); endDate = new Date(now); break;
        case 'personnalise': startDate = new Date(document.getElementById('rapportDateStart').value); endDate = new Date(document.getElementById('rapportDateEnd').value); break;
        default: startDate = new Date(now); endDate = new Date(now);
    }
    const ventesFiltrees = ventes.filter(v => { const d = new Date(v.date_vente); return d >= startDate && d <= endDate; });
    if (ventesFiltrees.length === 0) { showToast('Aucune donnée pour cette période', 'warning'); return; }
    const data = ventesFiltrees.map(v => ({ 
        'N° Facture': v.numero_vente, 
        'Client': v.client, 
        'Date': new Date(v.date_vente).toLocaleDateString('fr-FR'), 
        'Total HT': v.total_ht + ' ' + (appSettings.currency || 'FC'), 
        'TVA': v.tva + ' ' + (appSettings.currency || 'FC'), 
        'Total TTC': v.total_ttc + ' ' + (appSettings.currency || 'FC'), 
        'Statut': v.statut === 'terminee' ? 'Terminée' : 'En cours' 
    }));
    const ws = XLSX.utils.json_to_sheet(data); 
    const wb = XLSX.utils.book_new(); 
    XLSX.utils.book_append_sheet(wb, ws, 'Rapport');
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' }); 
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    saveAs(blob, `Rapport_${type}_${new Date().toISOString().slice(0,10)}.xlsx`);
    showToast('Export Excel réussi !', 'success');
}

function exporterProduitsPDF() {
    if (produits.length === 0) { showToast('Aucun produit à exporter', 'warning'); return; }
    const content = document.createElement('div');
    content.style.padding = '40px'; 
    content.style.fontFamily = 'Arial, sans-serif';
    content.style.maxWidth = '1000px'; 
    content.style.margin = '0 auto'; 
    content.style.backgroundColor = 'white';
    content.innerHTML = `
        <div style="text-align:center; border-bottom:2px solid #667eea; padding-bottom:20px; margin-bottom:20px;">
            <h1 style="color:#667eea; font-size:24px; margin:0;">FreshStock</h1>
            <p style="color:#6b7a8f;">Liste des produits - ${new Date().toLocaleDateString('fr-FR')}</p>
        </div>
        <table style="width:100%; border-collapse:collapse; font-size:12px;">
            <thead><tr style="background:#f0f4f8;">
                <th style="padding:8px; border:1px solid #dee2e6; text-align:left;">Code</th>
                <th style="padding:8px; border:1px solid #dee2e6; text-align:left;">Nom</th>
                <th style="padding:8px; border:1px solid #dee2e6; text-align:left;">Catégorie</th>
                <th style="padding:8px; border:1px solid #dee2e6; text-align:right;">Stock</th>
                <th style="padding:8px; border:1px solid #dee2e6; text-align:right;">Prix Vente</th>
                <th style="padding:8px; border:1px solid #dee2e6; text-align:center;">Statut</th>
            </tr></thead>
            <tbody>${produits.map(p => `<tr>
                <td style="padding:6px; border:1px solid #dee2e6;">${p.code}</td>
                <td style="padding:6px; border:1px solid #dee2e6;">${p.nom}</td>
                <td style="padding:6px; border:1px solid #dee2e6;">${getCategorieNom(p.categorie_id)}</td>
                <td style="padding:6px; border:1px solid #dee2e6; text-align:right;">${p.quantite_stock}</td>
                <td style="padding:6px; border:1px solid #dee2e6; text-align:right;">${formatNumber(p.prix_vente)} ${appSettings.currency || 'FC'}</td>
                <td style="padding:6px; border:1px solid #dee2e6; text-align:center;">${p.statut}</td>
            </tr>`).join('')}</tbody>
        </table>
        <div style="margin-top:20px; text-align:center; color:#6b7a8f; font-size:10px;"><p>Total: ${produits.length} produits</p></div>
    `;
    html2pdf().from(content).set({ 
        margin: 10, 
        filename: `Produits_${new Date().toISOString().slice(0,10)}.pdf`, 
        html2canvas: { scale: 2, useCORS: true }, 
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' } 
    })
    .save().then(() => { showToast('PDF généré !', 'success'); })
    .catch(err => { showToast('Erreur PDF', 'error'); console.error(err); });
}

function exporterVentesPDF() {
    if (ventes.length === 0) { showToast('Aucune vente à exporter', 'warning'); return; }
    const content = document.createElement('div');
    content.style.padding = '40px'; 
    content.style.fontFamily = 'Arial, sans-serif';
    content.style.maxWidth = '1000px'; 
    content.style.margin = '0 auto'; 
    content.style.backgroundColor = 'white';
    content.innerHTML = `
        <div style="text-align:center; border-bottom:2px solid #667eea; padding-bottom:20px; margin-bottom:20px;">
            <h1 style="color:#667eea; font-size:24px; margin:0;">FreshStock</h1>
            <p style="color:#6b7a8f;">Liste des ventes - ${new Date().toLocaleDateString('fr-FR')}</p>
        </div>
        <table style="width:100%; border-collapse:collapse; font-size:12px;">
            <thead><tr style="background:#f0f4f8;">
                <th style="padding:8px; border:1px solid #dee2e6; text-align:left;">N° Facture</th>
                <th style="padding:8px; border:1px solid #dee2e6; text-align:left;">Client</th>
                <th style="padding:8px; border:1px solid #dee2e6; text-align:left;">Date</th>
                <th style="padding:8px; border:1px solid #dee2e6; text-align:right;">Total TTC</th>
                <th style="padding:8px; border:1px solid #dee2e6; text-align:center;">Statut</th>
            </tr></thead>
            <tbody>${ventes.map(v => `<tr>
                <td style="padding:6px; border:1px solid #dee2e6;">${v.numero_vente}</td>
                <td style="padding:6px; border:1px solid #dee2e6;">${v.client}</td>
                <td style="padding:6px; border:1px solid #dee2e6;">${new Date(v.date_vente).toLocaleDateString('fr-FR')}</td>
                <td style="padding:6px; border:1px solid #dee2e6; text-align:right; font-weight:bold;">${formatNumber(v.total_ttc)} ${appSettings.currency || 'FC'}</td>
                <td style="padding:6px; border:1px solid #dee2e6; text-align:center;">${v.statut === 'terminee' ? 'Terminée' : 'En cours'}</td>
            </tr>`).join('')}</tbody>
            <tfoot><tr style="background:#e8f0fe;">
                <td colspan="3" style="padding:8px; border:1px solid #dee2e6; text-align:right; font-weight:bold;">Total</td>
                <td style="padding:8px; border:1px solid #dee2e6; text-align:right; font-weight:bold; color:#667eea;">${formatNumber(ventes.reduce((sum, v) => sum + v.total_ttc, 0))} ${appSettings.currency || 'FC'}</td>
                <td></td>
            </tr></tfoot>
        </table>
        <div style="margin-top:20px; text-align:center; color:#6b7a8f; font-size:10px;"><p>Total: ${ventes.length} ventes</p></div>
    `;
    html2pdf().from(content).set({ 
        margin: 10, 
        filename: `Ventes_${new Date().toISOString().slice(0,10)}.pdf`, 
        html2canvas: { scale: 2, useCORS: true }, 
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' } 
    })
    .save().then(() => { showToast('PDF généré !', 'success'); })
    .catch(err => { showToast('Erreur PDF', 'error'); console.error(err); });
}

function exporterToutesDonnees() {
    try {
        const allData = FileSystem.exportAllData();
        const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `FreshStock_Export_${new Date().toISOString().slice(0,10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('📦 Données exportées !', 'success');
    } catch (error) { 
        showToast('❌ Erreur exportation', 'error'); 
        console.error(error); 
    }
}

function afficherInfoSauvegarde() {
    const box = document.getElementById('saveInfoBox');
    const content = document.getElementById('saveInfoContent');
    content.innerHTML = `
        <div style="color:#4caf50;">☁️ Données Cloud</div>
        <div>📦 ${produits.length} produits</div>
        <div>👤 ${utilisateurs.length} utilisateurs</div>
        <div>💰 ${ventes.length} ventes</div>
        <div>📋 ${auditLogs.length} entrées audit</div>
        <div><small>Données synchronisées avec Supabase</small></div>
    `;
    box.style.display = 'block';
    setTimeout(() => { box.style.display = 'none'; }, 6000);
}

// ================================================================
// PARAMÈTRES
// ================================================================
function chargerParametres() {
    const config = FileSystem.getFile('config.json');
    if (config && config.settings) appSettings = config.settings;
    else appSettings = { 
        language: 'fr', 
        currency: 'FC', 
        taxRate: 16, 
        autoBackup: true, 
        backupInterval: 1, 
        theme: 'light', 
        fontSize: 'medium', 
        dateFormat: 'fr', 
        defaultRole: 'magasinier', 
        sessionTimeout: 30, 
        require2FA: false, 
        forcePasswordChange: false, 
        stockAlerts: true, 
        expiryAlerts: true, 
        dailyReports: false, 
        companyName: 'FreshStock SARL' 
    };
    appliquerParametres();
}

function appliquerParametres() {
    document.getElementById('settingsCompanyName').value = appSettings.companyName || 'FreshStock SARL';
    document.getElementById('settingsCurrency').value = appSettings.currency || 'FC';
    document.getElementById('settingsTaxRate').value = appSettings.taxRate || 16;
    document.getElementById('settingsDateFormat').value = appSettings.dateFormat || 'fr';
    document.getElementById('settingsDefaultRole').value = appSettings.defaultRole || 'magasinier';
    document.getElementById('settingsSessionTimeout').value = appSettings.sessionTimeout || 30;
    document.getElementById('settingsRequire2FA').checked = appSettings.require2FA || false;
    document.getElementById('settingsForcePasswordChange').checked = appSettings.forcePasswordChange || false;
    document.getElementById('settingsStockAlerts').checked = appSettings.stockAlerts !== undefined ? appSettings.stockAlerts : true;
    document.getElementById('settingsExpiryAlerts').checked = appSettings.expiryAlerts !== undefined ? appSettings.expiryAlerts : true;
    document.getElementById('settingsDailyReports').checked = appSettings.dailyReports || false;
    document.getElementById('settingsAutoBackup').checked = appSettings.autoBackup !== undefined ? appSettings.autoBackup : true;
    document.getElementById('settingsBackupInterval').value = appSettings.backupInterval || 1;
    document.getElementById('settingsTheme').value = appSettings.theme || 'light';
    document.getElementById('settingsFontSize').value = appSettings.fontSize || 'medium';
    appliquerThemeInstant(appSettings.theme);
    appliquerTaillePoliceInstant(appSettings.fontSize);
}

function sauvegarderParametres() {
    appSettings.companyName = document.getElementById('settingsCompanyName').value.trim() || 'FreshStock SARL';
    appSettings.currency = document.getElementById('settingsCurrency').value;
    appSettings.taxRate = parseFloat(document.getElementById('settingsTaxRate').value) || 16;
    appSettings.dateFormat = document.getElementById('settingsDateFormat').value;
    appSettings.defaultRole = document.getElementById('settingsDefaultRole').value;
    appSettings.sessionTimeout = parseInt(document.getElementById('settingsSessionTimeout').value) || 30;
    appSettings.require2FA = document.getElementById('settingsRequire2FA').checked;
    appSettings.forcePasswordChange = document.getElementById('settingsForcePasswordChange').checked;
    appSettings.stockAlerts = document.getElementById('settingsStockAlerts').checked;
    appSettings.expiryAlerts = document.getElementById('settingsExpiryAlerts').checked;
    appSettings.dailyReports = document.getElementById('settingsDailyReports').checked;
    appSettings.autoBackup = document.getElementById('settingsAutoBackup').checked;
    appSettings.backupInterval = parseInt(document.getElementById('settingsBackupInterval').value) || 1;
    appSettings.theme = document.getElementById('settingsTheme').value;
    appSettings.fontSize = document.getElementById('settingsFontSize').value;
    const config = FileSystem.getFile('config.json') || {};
    config.settings = appSettings;
    config.updated = new Date().toISOString();
    FileSystem.saveFile('config.json', config);
    appliquerThemeInstant(appSettings.theme);
    appliquerTaillePoliceInstant(appSettings.fontSize);
    showToast('✅ Paramètres sauvegardés !', 'success');
}

function reinitialiserParametres() {
    if (confirm('⚠️ Réinitialiser tous les paramètres ?')) {
        appSettings = { 
            language: 'fr', 
            currency: 'FC', 
            taxRate: 16, 
            autoBackup: true, 
            backupInterval: 1, 
            theme: 'light', 
            fontSize: 'medium', 
            dateFormat: 'fr', 
            defaultRole: 'magasinier', 
            sessionTimeout: 30, 
            require2FA: false, 
            forcePasswordChange: false, 
            stockAlerts: true, 
            expiryAlerts: true, 
            dailyReports: false, 
            companyName: 'FreshStock SARL' 
        };
        appliquerParametres();
        sauvegarderParametres();
        showToast('🔄 Paramètres réinitialisés !', 'info');
    }
}

function exporterParametres() {
    const config = FileSystem.getFile('config.json');
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `settings_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('📤 Paramètres exportés !', 'success');
}

function appliquerThemeInstant(theme) {
    const body = document.body;
    body.classList.remove('dark-theme');
    if (theme === 'dark') body.classList.add('dark-theme');
    else if (theme === 'auto') {
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) body.classList.add('dark-theme');
    }
    appSettings.theme = theme;
    const config = FileSystem.getFile('config.json') || {};
    if (config.settings) config.settings.theme = theme;
    else config.settings = { theme: theme };
    FileSystem.saveFile('config.json', config);
}

function appliquerTaillePoliceInstant(size) {
    const root = document.documentElement;
    let fontSize = '16px';
    if (size === 'small') fontSize = '13px';
    else if (size === 'medium') fontSize = '16px';
    else if (size === 'large') fontSize = '19px';
    root.style.fontSize = fontSize;
    appSettings.fontSize = size;
    const config = FileSystem.getFile('config.json') || {};
    if (config.settings) config.settings.fontSize = size;
    else config.settings = { fontSize: size };
    FileSystem.saveFile('config.json', config);
}

// ================================================================
// UTILISATEURS (rendu)
// ================================================================
function renderUsers() {
    // 🔒 Vérification admin
    if (!sessionUser || sessionUser.role !== 'admin') {
        document.getElementById('page-users').innerHTML = `
            <div class="alert alert-danger">
                <i class="fas fa-lock me-2"></i>
                <strong>Accès refusé</strong> - Cette page est réservée aux administrateurs.
            </div>
        `;
        return;
    }
    
    const tbody = document.getElementById('usersBody'); 
    let html = '';
    const total = utilisateurs.length; 
    const active = utilisateurs.filter(u => u.statut === 'active').length;
    const pending = utilisateurs.filter(u => u.statut === 'pending').length; 
    const inactive = utilisateurs.filter(u => u.statut === 'inactive').length;
    document.getElementById('statsUsers').textContent = 'Total: ' + total;
    document.getElementById('statsActive').textContent = 'Actifs: ' + active;
    document.getElementById('statsPending').textContent = 'En attente: ' + pending;
    document.getElementById('statsInactive').textContent = 'Inactifs: ' + inactive;
    if (utilisateurs.length === 0) { 
        tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">Aucun utilisateur</td></tr>'; 
        return; 
    }
    utilisateurs.forEach(u => {
        const isCurrentUser = sessionUser && u.id === sessionUser.id;
        const isDefaultAdmin = u.email === 'admin@freshstock.com';
        html += `<tr>
            <td>${u.id}</td>
            <td><strong>${u.nom}</strong></td>
            <td>${u.email}</td>
            <td>
                <select class="form-select form-select-sm" onchange="changerRole(${u.id}, this.value)" ${isCurrentUser ? 'disabled' : ''}>
                    <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>👑 Admin</option>
                    <option value="manager" ${u.role === 'manager' ? 'selected' : ''}>📊 Manager</option>
                    <option value="caissier" ${u.role === 'caissier' ? 'selected' : ''}>💰 Caissier</option>
                    <option value="magasinier" ${u.role === 'magasinier' ? 'selected' : ''}>📦 Magasinier</option>
                </select>
            </td>
            <td>
                <select class="form-select form-select-sm" onchange="changerStatut(${u.id}, this.value)" ${isCurrentUser ? 'disabled' : ''}>
                    <option value="active" ${u.statut === 'active' ? 'selected' : ''}>✅ Actif</option>
                    <option value="pending" ${u.statut === 'pending' ? 'selected' : ''}>⏳ En attente</option>
                    <option value="inactive" ${u.statut === 'inactive' ? 'selected' : ''}>⛔ Inactif</option>
                </select>
            </td>
            <td>${u.date_creation ? new Date(u.date_creation).toLocaleDateString('fr-FR') : '-'}</td>
            <td>
                <button class="btn-modern info sm me-1" onclick="ouvrirChangementMotDePasse(${u.id})" title="Changer mot de passe"><i class="fas fa-key"></i></button>
                ${!isCurrentUser && !isDefaultAdmin ? `<button class="btn-modern danger sm" onclick="supprimerUtilisateur(${u.id})"><i class="fas fa-trash"></i></button>` : isDefaultAdmin ? '<span class="text-muted">🔒 Admin</span>' : '<span class="text-muted">(Vous)</span>'}
            </td>
        </tr>`;
    });
    tbody.innerHTML = html;
}

// ================================================================
// SUPPRESSION EN MASSE DES VENTES ET FACTURES
// ================================================================
async function supprimerVentesSelectionnees() {
    const count = ventesSelectionnees.size;
    if (count === 0) { showToast('Aucune vente sélectionnée', 'warning'); return; }
    if (!confirm(`⚠️ Supprimer ${count} vente(s) ?`)) return;
    
    const ids = Array.from(ventesSelectionnees);
    let supprimees = 0;
    
    try {
        for (const id of ids) {
            await supprimerVenteDB(id);
            ventesSelectionnees.delete(id);
            supprimees++;
        }
        await addAuditLog('Ventes supprimées', `${supprimees} vente(s) supprimée(s) en masse`);
        renderVentes();
        renderAll();
        updateSelectionUI();
        showToast(`🗑️ ${supprimees} vente(s) supprimée(s) !`, 'success');
    } catch (error) {
        console.error('Erreur suppression ventes:', error);
        showToast('❌ Erreur lors de la suppression', 'error');
    }
}

async function supprimerFactureSelectionnee() {
    const count = facturesSelectionnees.size;
    if (count === 0) { showToast('Aucune facture sélectionnée', 'warning'); return; }
    if (!sessionUser || sessionUser.role !== 'admin') { 
        showToast('⚠️ Seul l\'admin peut supprimer des factures !', 'error'); 
        return; 
    }
    if (!confirm(`⚠️ Supprimer ${count} facture(s) ?`)) return;
    
    const ids = Array.from(facturesSelectionnees);
    let supprimees = 0;
    
    try {
        for (const id of ids) {
            await supprimerDetailsVente(id);
            await supprimerVenteDB(id);
            facturesSelectionnees.delete(id);
            supprimees++;
        }
        await addAuditLog('Factures supprimées', `${supprimees} facture(s) supprimée(s) en masse`);
        renderFactures();
        renderAll();
        updateFactureUI();
        showToast(`🗑️ ${supprimees} facture(s) supprimée(s) !`, 'success');
    } catch (error) {
        console.error('Erreur suppression factures:', error);
        showToast('❌ Erreur lors de la suppression', 'error');
    }
}

// ================================================================
// SAUVEGARDE LOCALE
// ================================================================
async function sauvegarderDonnees() {
    try {
        const data = { 
            utilisateurs, categories, fournisseurs, produits, 
            entrees, sorties, ventes, details_ventes, auditLogs 
        };
        localStorage.setItem('freshstock_backup', JSON.stringify(data));
        console.log('💾 Données sauvegardées localement');
    } catch (error) {
        console.error('Erreur sauvegarde locale:', error);
    }
}

async function chargerDonnees() {
    try {
        const backup = localStorage.getItem('freshstock_backup');
        if (backup) {
            const data = JSON.parse(backup);
            utilisateurs = data.utilisateurs || [];
            categories = data.categories || [];
            fournisseurs = data.fournisseurs || [];
            produits = data.produits || [];
            entrees = data.entrees || [];
            sorties = data.sorties || [];
            ventes = data.ventes || [];
            details_ventes = data.details_ventes || [];
            auditLogs = data.auditLogs || [];
            renderAll();
            showToast('✅ Données locales chargées', 'success');
            return true;
        }
        showToast('📭 Aucune sauvegarde locale', 'warning');
        return false;
    } catch (error) {
        showToast('❌ Erreur chargement local', 'error');
        return false;
    }
}

// ================================================================
// INITIALISATION
// ================================================================
document.addEventListener('keydown', (e) => { 
    if (e.key === 'Escape') closeModal(); 
});

document.getElementById('modalSim').addEventListener('click', function(e) { 
    if (e.target === this) closeModal(); 
});

async function demarrerApplication() {
    console.log('🚀 Démarrage de FreshStock ERP...');
    console.log('☁️ Utilisation de Supabase comme base de données cloud');
    console.log('📱 Interface responsive pour PC, tablette et smartphone');
    
    await FileSystem.init();
    chargerParametres();
    appliquerVersion();
    
    await chargerToutesLesDonnees();
    
    console.log('📋 Comptes : admin@freshstock.com (mdp: admin123)');
    console.log('📌 Version ' + APP_VERSION + ' - Développé par Angi.inc');
}

function appliquerVersion() {
    const versionEl = document.getElementById('appVersion');
    if (versionEl) versionEl.textContent = APP_VERSION;
}

demarrerApplication();