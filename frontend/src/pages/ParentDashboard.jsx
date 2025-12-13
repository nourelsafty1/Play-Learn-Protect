import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { childrenAPI, monitoringAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaUserAstronaut, 
  FaChartLine, 
  FaShieldAlt, 
  FaSignOutAlt, 
  FaPlus, 
  FaTimes, 
  FaGamepad,
  FaBars
} from 'react-icons/fa';
import toast from 'react-hot-toast';

const ParentDashboard = () => {
  const [stats, setStats] = useState(null);
  const [children, setChildren] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Add Child Form State
  const [newChild, setNewChild] = useState({
    name: '',
    username: '',
    dateOfBirth: '',
    ageGroup: '6-8', 
    gender: 'other'
  });

  const { logout, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const statsRes = await monitoringAPI.getDashboard();
      setStats(statsRes.data.data);
      const childRes = await childrenAPI.getAll();
      setChildren(childRes.data.data);
    } catch (error) {
      console.error("Dashboard Load Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    toast.success('Logged out successfully');
  };

  const handleAddChild = async (e) => {
    e.preventDefault();
    try {
      if (!newChild.name || !newChild.username || !newChild.dateOfBirth) {
        toast.error("Please fill in all fields");
        return;
      }
      await childrenAPI.create(newChild);
      toast.success("Child Account Created!");
      setIsModalOpen(false);
      setNewChild({ name: '', username: '', dateOfBirth: '', ageGroup: '6-8', gender: 'other' });
      loadDashboardData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create child");
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-800 flex">
      
      {/* --- SIDEBAR --- */}
      <aside className="w-64 bg-white border-r border-gray-200 fixed h-full z-20 hidden md:flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-gray-100">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold mr-3">P</div>
          <span className="text-xl font-bold text-gray-800">Protect<span className="text-indigo-600">App</span></span>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 mt-2">Menu</p>
          <SidebarItem icon={<FaChartLine />} label="Overview" active />
          <SidebarItem icon={<FaShieldAlt />} label="Safety Alerts" />
          <SidebarItem icon={<FaGamepad />} label="Games Library" />
        </nav>

        <div className="p-4 border-t border-gray-100">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 text-gray-600 hover:text-red-600 hover:bg-red-50 w-full px-4 py-3 rounded-lg transition-all font-medium"
          >
            <FaSignOutAlt /> Logout
          </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 md:px-8 sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-4">
            <button className="md:hidden text-gray-500"><FaBars/></button>
            <h2 className="text-lg font-semibold text-gray-700">Dashboard Overview</h2>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/select-child')}
              className="hidden md:block text-sm font-semibold text-white bg-indigo-600 px-5 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
            >
              Switch to Kids Mode
            </button>
            <div className="flex items-center gap-2">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-700">{user?.name}</p>
                <p className="text-xs text-gray-500">Parent Account</p>
              </div>
              <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold border border-indigo-200">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="p-4 md:p-8 max-w-7xl mx-auto w-full">
          
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <StatCard 
              title="Total Children" 
              value={children.length} 
              icon={<FaUserAstronaut />} 
              color="bg-blue-500" 
            />
            <StatCard 
              title="Active Alerts" 
              value={stats?.summary?.unresolvedAlerts || 0} 
              icon={<FaShieldAlt />} 
              color="bg-red-500" 
            />
             <StatCard 
              title="Screen Time (Today)" 
              value={`${stats?.summary?.totalScreenTimeToday || 0}m`} 
              icon={<FaChartLine />} 
              color="bg-emerald-500" 
            />
          </div>

          {/* Children Table Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center bg-gray-50/30 gap-4">
              <div>
                <h3 className="text-lg font-bold text-gray-800">Child Accounts</h3>
                <p className="text-sm text-gray-500">Manage profiles and view activity reports</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm text-sm font-medium"
              >
                <FaPlus size={12} /> Add New Child
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-gray-500 font-semibold text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Profile</th>
                    <th className="px-6 py-4">Username</th>
                    <th className="px-6 py-4">Age Group</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {children.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center text-gray-400">
                        No children added yet. Add a child to get started.
                      </td>
                    </tr>
                  ) : (
                    children.map((child) => (
                      <tr key={child._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold shadow-sm">
                              {child.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-medium text-gray-900">{child.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-600">@{child.username}</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                            {child.ageGroup} Years
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-100">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></span>
                            Active
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button className="text-indigo-600 hover:text-indigo-900 text-sm font-medium hover:underline">View Report</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* --- ADD CHILD MODAL --- */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-xl shadow-2xl w-full max-w-lg z-10 overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h3 className="text-lg font-bold text-gray-800">Add New Profile</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <FaTimes />
                </button>
              </div>
              
              <form onSubmit={handleAddChild} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Child's Name</label>
                    <input 
                      type="text" 
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                      placeholder="e.g. Nour"
                      value={newChild.name}
                      onChange={e => setNewChild({...newChild, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                    <input 
                      type="text" 
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                      placeholder="e.g. nour123"
                      value={newChild.username}
                      onChange={e => setNewChild({...newChild, username: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                  <input 
                    type="date" 
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    value={newChild.dateOfBirth}
                    onChange={e => setNewChild({...newChild, dateOfBirth: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Age Group</label>
                    <div className="relative">
                        <select 
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none appearance-none bg-white"
                          value={newChild.ageGroup}
                          onChange={e => setNewChild({...newChild, ageGroup: e.target.value})}
                        >
                          <option value="3-5">3-5 Years</option>
                          <option value="6-8">6-8 Years</option>
                          <option value="9-12">9-12 Years</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                        </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                    <div className="relative">
                        <select 
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none appearance-none bg-white"
                          value={newChild.gender}
                          onChange={e => setNewChild({...newChild, gender: e.target.value})}
                        >
                          <option value="male">Boy</option>
                          <option value="female">Girl</option>
                          <option value="other">Other</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                        </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-all transform active:scale-95"
                  >
                    Create Account
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

// UI Components
const SidebarItem = ({ icon, label, active }) => (
  <div className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-colors ${active ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
    <span className="text-lg">{icon}</span>
    <span className="text-sm">{label}</span>
  </div>
);

const StatCard = ({ title, value, icon, color }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-start justify-between hover:shadow-md transition-shadow">
    <div>
      <p className="text-sm text-gray-500 font-medium mb-1">{title}</p>
      <h4 className="text-2xl font-bold text-gray-800">{value}</h4>
    </div>
    <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center text-white text-xl shadow-lg shadow-opacity-30`}>
      {icon}
    </div>
  </div>
);

export default ParentDashboard;